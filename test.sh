#!/usr/bin/env bash
# Client-side script: test DNS (recursor on 53, dnsdist DoH on 443 and DoT on 853).
# Uses .env for DOMAIN and IP_ADDRESS, overridable with --domain / --ip.

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR" && pwd)"
ENV_FILE="${ENV_FILE:-$REPO_ROOT/.env}"

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

# Override from command line: --domain / -d, --ip / -i
while [[ $# -gt 0 ]]; do
  case "$1" in
    -d|--domain) DOMAIN="$2"; shift 2 ;;
    -i|--ip|--address) IP_ADDRESS="$2"; shift 2 ;;
    -h|--help)
      echo "Usage: $0 [-d|--domain DOMAIN] [-i|--ip|--address IP]"
      echo "  DOMAIN and IP_ADDRESS are read from .env; options override them."
      exit 0
      ;;
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

echo "Using DOMAIN=$DOMAIN IP_ADDRESS=$IP_ADDRESS"
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

# --- dnsdist DoH (via front :443) ---
echo ""
echo "dnsdist DoH (https://dns.${DOMAIN}/dns-query)"
DOH_OK=0
DOH_FAIL=0
DOH_URL="https://dns.${DOMAIN}/dns-query"
DOH_RESOLVE="dns.${DOMAIN}:443:${IP_ADDRESS}"
for d in "${TEST_DOMAINS[@]}"; do
  # Use curl's DoH to resolve $d; -k for self-signed
  if code=$(curl -k -s -o /dev/null -w "%{http_code}" \
    --doh-url "$DOH_URL" \
    --resolve "$DOH_RESOLVE" \
    "https://$d" 2>/dev/null) && [[ "$code" =~ ^[23][0-9][0-9]$ ]]; then
    echo "  OK   $d (HTTP $code)"
    ((DOH_OK++)) || true
  else
    echo "  FAIL $d (HTTP ${code:-error})"
    ((DOH_FAIL++)) || true
  fi
done
echo "  DoH: $DOH_OK passed, $DOH_FAIL failed"

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

# --- Summary ---
echo ""
TOTAL_FAIL=$((RECURSOR_FAIL + DOH_FAIL + DOT_FAIL))
if [[ $TOTAL_FAIL -eq 0 ]]; then
  echo "All DNS checks passed."
  exit 0
else
  echo "Some checks failed (recursor: $RECURSOR_FAIL, DoH: $DOH_FAIL, DoT: ${DOT_FAIL:-N/A})."
  exit 1
fi
