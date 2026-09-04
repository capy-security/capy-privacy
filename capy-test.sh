#!/usr/bin/env bash
# Client-side script: test DNS (recursor on 53, dnsdist DoH on 443 and DoT on 853).
# DoH uses RFC 8484 POST (application/dns-message), not curl --doh-url + HTTPS fetch
# (filtered names like test.<domain> -> 127.0.0.1 would otherwise yield HTTP 000).
# Uses .env for DOMAIN and IP_ADDRESS, overridable with --domain / --ip.

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR" && pwd)"
ENV_FILE="${ENV_FILE:-$REPO_ROOT/.env}"

PERF_SAMPLES=5
PERF_DOMAIN=example.com
RUN_PERF=1

# Load DOMAIN and IP_ADDRESS from .env if present
if [[ -f "$ENV_FILE" ]]; then
  while IFS= read -r line; do
    [[ "$line" =~ ^#.*$ ]] && continue
    [[ "$line" =~ ^[[:space:]]*$ ]] && continue
    if [[ "$line" =~ ^(DOMAIN|IP_ADDRESS)= ]]; then
      export "$line"
    fi
  done < "$ENV_FILE"
fi

usage() {
  echo "Usage: $0 [-d|--domain DOMAIN] [-i|--ip|--address IP] [--perf [N]] [--no-perf]"
  echo "  DOMAIN and IP_ADDRESS are read from .env; options override them."
  echo "  --perf [N]   Run latency benchmarks (default: 5 samples per protocol)."
  echo "  --no-perf    Skip latency benchmarks."
  exit 0
}

# Override from command line: --domain / -d, --ip / -i
while [[ $# -gt 0 ]]; do
  case "$1" in
    -d|--domain) DOMAIN="$2"; shift 2 ;;
    -i|--ip|--address) IP_ADDRESS="$2"; shift 2 ;;
    --perf)
      RUN_PERF=1
      if [[ -n "${2:-}" && "$2" =~ ^[0-9]+$ ]]; then
        PERF_SAMPLES="$2"
        shift 2
      else
        shift
      fi
      ;;
    --no-perf) RUN_PERF=0; shift ;;
    -h|--help) usage ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

DOMAIN="${DOMAIN:-localhost}"
IP_ADDRESS="${IP_ADDRESS:-127.0.0.1}"

# Domains to resolve (used for recursor and dnsdist)
TEST_DOMAINS=(example.com google.com cloudflare.com test.capysecurity.com)
# Filtering check: this domain must resolve to 127.0.0.1 (in DB by default)
FILTER_DOMAIN="test.capysecurity.com"
FILTER_EXPECTED_IP="127.0.0.1"

DOH_URL="https://dns.${DOMAIN}/dns-query"
DOH_RESOLVE="dns.${DOMAIN}:443:${IP_ADDRESS}"
DOH_BODY=""

calc_stats() {
  awk '
    NF == 0 { next }
    {
      sum += $1
      if (NR == 1 || $1 < min) min = $1
      if (NR == 1 || $1 > max) max = $1
      last = $1
    }
    END {
      if (NR == 0) {
        print "n=0 min=- avg=- max=- last=-"
        exit
      }
      printf "n=%d min=%.1f avg=%.1f max=%.1f last=%.1f\n", NR, min, sum / NR, max, last
    }
  '
}

dig_query_ms() {
  local domain=$1
  local line ms
  line=$(dig +stats +time=3 +tries=1 "@${IP_ADDRESS}" -p 53 "$domain" A 2>/dev/null | grep -m1 'Query time:' || true)
  ms=$(sed -n 's/.*Query time: \([0-9]*\) msec.*/\1/p' <<<"$line")
  if [[ -z "$ms" ]]; then
    echo ""
    return 1
  fi
  echo "$ms"
}

build_doh_query() {
  local domain=$1
  python3 -c "
import struct, random, sys
name = sys.argv[1]
labels = name.split('.')
qname = b''.join(bytes([len(x)]) + x.encode('ascii') for x in labels) + b'\x00'
qid = random.randint(1, 65535)
pkt = struct.pack('!HHHHHH', qid, 0x0100, 1, 0, 0, 0) + qname + struct.pack('!HH', 1, 1)
sys.stdout.buffer.write(pkt)
" "$domain" 2>/dev/null
}

doh_query_ms() {
  local domain=$1
  local seconds ms code

  if ! command -v python3 &>/dev/null; then
    echo ""
    return 1
  fi

  code=$(build_doh_query "$domain" | curl -sk -X POST "$DOH_URL" \
    -H 'Content-Type: application/dns-message' \
    -H 'Accept: application/dns-message' \
    --resolve "$DOH_RESOLVE" \
    --data-binary @- \
    --max-time 10 \
    -o "$DOH_BODY" \
    -w '%{http_code} %{time_total}' 2>/dev/null) || {
    echo ""
    return 1
  }

  if [[ "${code%% *}" != "200" ]]; then
    echo ""
    return 1
  fi

  seconds="${code##* }"
  ms=$(awk -v s="$seconds" 'BEGIN { printf "%.1f", s * 1000 }')
  echo "$ms"
}

dot_query_ms() {
  local domain=$1
  local line ms
  line=$(kdig +stats +time=3 "@${IP_ADDRESS}" +tls -p 853 "$domain" A 2>/dev/null | grep -m1 'Query time:' || true)
  ms=$(sed -n 's/.*Query time: \([0-9]*\) msec.*/\1/p' <<<"$line")
  if [[ -z "$ms" ]]; then
    echo ""
    return 1
  fi
  echo "$ms"
}

run_perf_benchmark() {
  local label=$1
  local domain=$2
  local query_fn=$3
  local -a samples=()
  local -a failures=()
  local i ms stats_line cached_ms=""

  echo ""
  echo "Performance: $label ($PERF_SAMPLES samples on $domain)"
  for ((i = 1; i <= PERF_SAMPLES; i++)); do
    if ms=$("$query_fn" "$domain"); then
      samples+=("$ms")
      printf "  sample %2d: %.1f ms\n" "$i" "$ms"
    else
      failures+=("$i")
      echo "  sample $i: FAIL"
    fi
  done

  if [[ ${#samples[@]} -gt 0 ]]; then
    stats_line=$(printf '%s\n' "${samples[@]}" | calc_stats)
    if cached_ms=$("$query_fn" "$domain"); then
      :
    else
      cached_ms=""
    fi
  else
    stats_line="n=0 min=- avg=- max=- last=-"
  fi

  PERF_REPORT+=("$label|$domain|${#samples[@]}|${#failures[@]}|$stats_line|${cached_ms:--}")
}

echo "Using DOMAIN=$DOMAIN IP_ADDRESS=$IP_ADDRESS"
if [[ "$RUN_PERF" -eq 1 ]]; then
  echo "Perf: $PERF_SAMPLES samples on $PERF_DOMAIN per protocol"
fi
echo "---"

# --- Recursor (plain DNS, port 53) ---
echo "Recursor (plain DNS :53)"
RECURSOR_OK=0
RECURSOR_FAIL=0
for d in "${TEST_DOMAINS[@]}"; do
  if result=$(dig +short +time=2 +tries=1 "@${IP_ADDRESS}" -p 53 "$d" A 2>/dev/null) && [[ -n "$result" ]]; then
    if [[ "$d" == "$FILTER_DOMAIN" ]]; then
      if [[ "$result" == *"$FILTER_EXPECTED_IP"* ]]; then
        echo "  OK   $d -> $result (filtering)"
        ((RECURSOR_OK++)) || true
      else
        echo "  FAIL $d -> $result (expected $FILTER_EXPECTED_IP for filtering)"
        ((RECURSOR_FAIL++)) || true
      fi
    else
      echo "  OK   $d -> $result"
      ((RECURSOR_OK++)) || true
    fi
  else
    echo "  FAIL $d (no answer or timeout)"
    ((RECURSOR_FAIL++)) || true
  fi
done
echo "  Recursor: $RECURSOR_OK passed, $RECURSOR_FAIL failed"

# --- dnsdist DoH (RFC 8484 POST via front :443) ---
echo ""
echo "dnsdist DoH (POST https://dns.${DOMAIN}/dns-query, RFC 8484)"
DOH_OK=0
DOH_FAIL=0
DOH_BODY=$(mktemp)
trap 'rm -f "$DOH_BODY"' EXIT

if ! command -v python3 &>/dev/null; then
  echo "  Skip  (python3 required for DoH wire-format query/parse)"
else
  for d in "${TEST_DOMAINS[@]}"; do
    code=$(build_doh_query "$d" | curl -sk -X POST "$DOH_URL" \
      -H 'Content-Type: application/dns-message' \
      -H 'Accept: application/dns-message' \
      --resolve "$DOH_RESOLVE" \
      --data-binary @- \
      --max-time 10 \
      -o "$DOH_BODY" -w '%{http_code}' 2>/dev/null) || code="000"

    if [[ "$code" == "000" ]] && [[ ! -s "$DOH_BODY" ]]; then
      echo "  FAIL $d (curl error or empty response)"
      ((DOH_FAIL++)) || true
      continue
    fi

    if [[ "$code" != "200" ]]; then
      echo "  FAIL $d (HTTP $code)"
      ((DOH_FAIL++)) || true
      continue
    fi

    ips=$(python3 -c "
import struct, sys
data = sys.stdin.buffer.read()
if len(data) < 12:
    sys.exit(1)
qdcount = struct.unpack_from('!H', data, 4)[0]
ancount = struct.unpack_from('!H', data, 6)[0]
pos = 12
for _ in range(qdcount):
    while pos < len(data) and data[pos]:
        pos += 1 + data[pos]
    pos += 5
out = []
for _ in range(ancount):
    if pos >= len(data):
        break
    while pos < len(data):
        if data[pos] & 0xC0 == 0xC0:
            pos += 2
            break
        if data[pos] == 0:
            pos += 1
            break
        pos += 1 + data[pos]
    if pos + 10 > len(data):
        break
    rtype, _, _, rdlen = struct.unpack_from('!HHIH', data, pos)
    pos += 10
    if rtype == 1 and rdlen == 4:
        out.append('.'.join(str(b) for b in data[pos : pos + 4]))
    pos += rdlen
print(' '.join(out))
" <"$DOH_BODY" 2>/dev/null) || ips=""

    if [[ -z "$ips" ]]; then
      echo "  FAIL $d (HTTP 200 but no A record in answer)"
      ((DOH_FAIL++)) || true
      continue
    fi

    if [[ "$d" == "$FILTER_DOMAIN" ]]; then
      if [[ "$ips" == *"$FILTER_EXPECTED_IP"* ]]; then
        echo "  OK   $d -> $ips (filtering)"
        ((DOH_OK++)) || true
      else
        echo "  FAIL $d -> $ips (expected $FILTER_EXPECTED_IP for filtering)"
        ((DOH_FAIL++)) || true
      fi
    else
      echo "  OK   $d -> $ips"
      ((DOH_OK++)) || true
    fi
  done
  echo "  DoH: $DOH_OK passed, $DOH_FAIL failed"
fi

# --- dnsdist DoT (port 853) ---
echo ""
echo "dnsdist DoT (:853)"
DOT_OK=0
DOT_FAIL=0
if ! command -v kdig &>/dev/null; then
  echo "  Skip  (kdig not installed; install ldns for DoT tests)"
else
  for d in "${TEST_DOMAINS[@]}"; do
    if result=$(kdig +short +time=2 "@${IP_ADDRESS}" +tls -p 853 "$d" A 2>/dev/null) && [[ -n "$result" ]]; then
      if [[ "$d" == "$FILTER_DOMAIN" ]]; then
        if [[ "$result" == *"$FILTER_EXPECTED_IP"* ]]; then
          echo "  OK   $d -> $result (filtering)"
          ((DOT_OK++)) || true
        else
          echo "  FAIL $d -> $result (expected $FILTER_EXPECTED_IP for filtering)"
          ((DOT_FAIL++)) || true
        fi
      else
        echo "  OK   $d -> $result"
        ((DOT_OK++)) || true
      fi
    else
      echo "  FAIL $d (no answer or timeout)"
      ((DOT_FAIL++)) || true
    fi
  done
  echo "  DoT: $DOT_OK passed, $DOT_FAIL failed"
fi

# --- Performance benchmarks ---
declare -a PERF_REPORT=()

if [[ "$RUN_PERF" -eq 1 ]]; then
  run_perf_benchmark "UDP :53" "$PERF_DOMAIN" dig_query_ms

  if command -v python3 &>/dev/null; then
    run_perf_benchmark "DoH :443" "$PERF_DOMAIN" doh_query_ms
  else
    PERF_REPORT+=("DoH :443|$PERF_DOMAIN|0|skipped|n=0 min=- avg=- max=- last=-|-")
  fi

  if command -v kdig &>/dev/null; then
    run_perf_benchmark "DoT :853" "$PERF_DOMAIN" dot_query_ms
  else
    PERF_REPORT+=("DoT :853|$PERF_DOMAIN|0|skipped|n=0 min=- avg=- max=- last=-|-")
  fi
fi

# --- Summary ---
echo ""
echo "=== Summary ==="
echo "Functional checks:"
echo "  Recursor :53  $RECURSOR_OK passed, $RECURSOR_FAIL failed"
echo "  DoH      :443 ${DOH_OK:-0} passed, ${DOH_FAIL:-0} failed"
echo "  DoT      :853 ${DOT_OK:-0} passed, ${DOT_FAIL:-0} failed"

if [[ "$RUN_PERF" -eq 1 ]]; then
  echo ""
  echo "Performance (${PERF_SAMPLES} samples on ${PERF_DOMAIN}, server ${IP_ADDRESS}):"
  printf "  %-10s  %-14s  %-7s  %-8s  %-8s  %-8s  %-8s  %-8s\n" \
    "Protocol" "Domain" "OK/Fail" "min(ms)" "avg(ms)" "max(ms)" "last(ms)" "repeat(ms)"
  for row in "${PERF_REPORT[@]}"; do
    IFS='|' read -r label domain ok_count fail_field stats_line cached_ms <<<"$row"
    if [[ "$fail_field" == "skipped" ]]; then
      printf "  %-10s  %-14s  skipped (missing tool)\n" "$label" "$domain"
      continue
    fi
    read -r _ n min avg max last <<<"$stats_line"
    printf "  %-10s  %-14s  %s/%s     %-8s  %-8s  %-8s  %-8s  %-8s\n" \
      "$label" "$domain" "$ok_count" "$fail_field" "$min" "$avg" "$max" "$last" "$cached_ms"
  done
  echo ""
  echo "Tip: save output before/after tuning, e.g.: ./capy-test.sh | tee dns-bench-\$(date +%F-%H%M).log"
fi

TOTAL_FAIL=$((RECURSOR_FAIL + DOH_FAIL + DOT_FAIL))
if [[ $TOTAL_FAIL -eq 0 ]]; then
  echo ""
  echo "All DNS checks passed."
  exit 0
else
  echo ""
  echo "Some checks failed (recursor: $RECURSOR_FAIL, DoH: $DOH_FAIL, DoT: ${DOT_FAIL:-N/A})."
  exit 1
fi
