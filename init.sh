#!/usr/bin/env bash
# Capy Privacy — first-time setup: TLS, Caddyfile, .env
# Usage: ./init.sh   (from repo root; stores cert material in ./ssl)

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"
CADDY_TEMPLATE="${ROOT}/Caddyfile.template"
ENV_FILE="${ROOT}/.env"
SSL_ROOT="${ROOT}/ssl"
SSL_WORK_DIR="${SSL_ROOT}/work"
SSL_LOGS_DIR="${SSL_ROOT}/logs"
REUSE_EXISTING_SETUP=0
EXISTING_DOMAIN=""
EXISTING_IP_ADDRESS=""
EXISTING_API_SECRET=""

# Install real cert + key files under ./ssl/live/<name>/ for compose bind mounts.
install_cert() {
	local name="$1" cert="$2" key="$3"
	mkdir -p "${SSL_ROOT}/live/${name}"
	cp "$cert" "${SSL_ROOT}/live/${name}/fullchain.pem"
	cp "$key" "${SSL_ROOT}/live/${name}/privkey.pem"
	chmod 644 "${SSL_ROOT}/live/${name}/fullchain.pem"
	chmod 600 "${SSL_ROOT}/live/${name}/privkey.pem"
}

# Self-signed TLS for bare IP (block page HTTPS). Installs under ./ssl/live/<ip>/
gen_self_signed_ip() {
	local ip="$1"
	local d c k
	d="$(mktemp -d)"
	c="${d}/cert.pem"
	k="${d}/key.pem"
	if openssl req -x509 -nodes -newkey rsa:2048 -days 825 \
		-keyout "$k" -out "$c" \
		-subj "/CN=${ip}" \
		-addext "subjectAltName=IP:${ip}" 2>/dev/null; then
		:
	else
		cat >"${d}/openssl.cnf" <<OPENSSL_CONF
[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_req
prompt = no
[req_distinguished_name]
CN = ${ip}
[v3_req]
subjectAltName = IP:${ip}
OPENSSL_CONF
		openssl req -x509 -nodes -newkey rsa:2048 -days 825 \
			-keyout "$k" -out "$c" \
			-config "${d}/openssl.cnf" -extensions v3_req
	fi
	install_cert "$ip" "$c" "$k"
	rm -rf "$d"
}

guess_public_ip() {
	local ip=""
	ip="$(curl -fsS --max-time 3 https://api.ipify.org 2>/dev/null || true)"
	if [[ -z "$ip" ]] && command -v hostname >/dev/null 2>&1; then
		ip="$(hostname -I 2>/dev/null | awk '{print $1}' || true)"
	fi
	echo "${ip:-}"
}

write_caddyfile() {
	local api_domain="$1" admin_domain="$2" dns_domain="$3" domain="$4" ip="$5"
	local out="${ROOT}/Caddyfile"
	if [[ ! -f "$CADDY_TEMPLATE" ]]; then
		echo "Missing Caddy template: ${CADDY_TEMPLATE}" >&2
		exit 1
	fi

	if ! command -v envsubst >/dev/null 2>&1; then
		echo "envsubst is required to render ${CADDY_TEMPLATE}. Install gettext (e.g. brew install gettext)." >&2
		exit 1
	fi

	API_DOMAIN="$api_domain" \
	ADMIN_DOMAIN="$admin_domain" \
	DNS_DOMAIN="$dns_domain" \
	DOMAIN="$domain" \
	IP_ADDRESS="$ip" \
		envsubst '${API_DOMAIN} ${ADMIN_DOMAIN} ${DNS_DOMAIN} ${DOMAIN} ${IP_ADDRESS}' \
			<"$CADDY_TEMPLATE" >"$out"
}

read_existing_env() {
	[[ -f "$ENV_FILE" ]] || return 0
	while IFS= read -r line; do
		case "$line" in
		DOMAIN=*) EXISTING_DOMAIN="${line#DOMAIN=}" ;;
		IP_ADDRESS=*) EXISTING_IP_ADDRESS="${line#IP_ADDRESS=}" ;;
		API_SECRET=*) EXISTING_API_SECRET="${line#API_SECRET=}" ;;
		esac
	done < "$ENV_FILE"
}

# --- prompts -----------------------------------------------------------------
read_existing_env

if [[ -n "$EXISTING_DOMAIN" && -n "$EXISTING_IP_ADDRESS" ]]; then
	REUSE_EXISTING_SETUP=1
	DOMAIN="$EXISTING_DOMAIN"
	IP_ADDRESS="$EXISTING_IP_ADDRESS"
	echo "Detected existing setup in .env (DOMAIN=${DOMAIN}, IP_ADDRESS=${IP_ADDRESS})."
	echo "Running in renewal mode."
else
	read -rp "Server domain [localhost]: " DOMAIN
	DOMAIN="${DOMAIN:-localhost}"

	if [[ "$DOMAIN" == "localhost" ]]; then
		IP_ADDRESS="127.0.0.1"
		echo "Using IP_ADDRESS=${IP_ADDRESS} (localhost mode)."
	else
		GUESSED="$(guess_public_ip)"
		read -rp "Server IP [${GUESSED:-?}]: " IP_ADDRESS
		IP_ADDRESS="${IP_ADDRESS:-$GUESSED}"
		if [[ -z "$IP_ADDRESS" ]]; then
			echo "Could not determine IP; please run again and enter the server public IP." >&2
			exit 1
		fi
	fi
fi

API_DOMAIN="api.${DOMAIN}"
ADMIN_DOMAIN="admin.${DOMAIN}"
DNS_DOMAIN="dns.${DOMAIN}"

# --- certificates ------------------------------------------------------------
mkdir -p "${SSL_ROOT}" "${SSL_WORK_DIR}" "${SSL_LOGS_DIR}"

if [[ "$DOMAIN" == "localhost" ]]; then
	if ! command -v mkcert >/dev/null 2>&1; then
		echo "mkcert is required for localhost TLS. Install e.g.:  brew install mkcert && mkcert -install" >&2
		exit 1
	fi
	mkcert -install >/dev/null 2>&1 || true
	for name in "${API_DOMAIN}" "${DNS_DOMAIN}" "${ADMIN_DOMAIN}" "localhost" "127.0.0.1"; do
		tmpd="$(mktemp -d)"
		mkcert -cert-file "${tmpd}/fullchain.pem" -key-file "${tmpd}/privkey.pem" "${name}"
		install_cert "${name}" "${tmpd}/fullchain.pem" "${tmpd}/privkey.pem"
		rm -rf "${tmpd}"
	done
else
	if ! command -v certbot >/dev/null 2>&1; then
		echo "certbot is required for Let's Encrypt. Install certbot on this host." >&2
		exit 1
	fi
	echo "Ensure ports 80 and 443 are free (e.g. podman compose down) before certbot runs."
	read -rp "Press Enter to continue..."
	if [[ "$REUSE_EXISTING_SETUP" -eq 1 && -d "${SSL_ROOT}/renewal" ]] && compgen -G "${SSL_ROOT}/renewal/*.conf" >/dev/null; then
		certbot renew --standalone --non-interactive \
			--config-dir "${SSL_ROOT}" \
			--work-dir "${SSL_WORK_DIR}" \
			--logs-dir "${SSL_LOGS_DIR}"
	else
		read -rp "Let's Encrypt email: " EMAIL
		if [[ -z "${EMAIL:-}" ]]; then
			echo "Email is required for certbot -agree-tos." >&2
			exit 1
		fi
		for name in "${API_DOMAIN}" "${DNS_DOMAIN}" "${ADMIN_DOMAIN}" "${DOMAIN}"; do
			certbot certonly --standalone --non-interactive --agree-tos \
				--config-dir "${SSL_ROOT}" \
				--work-dir "${SSL_WORK_DIR}" \
				--logs-dir "${SSL_LOGS_DIR}" \
				-m "${EMAIL}" -d "${name}"
		done
	fi
	gen_self_signed_ip "${IP_ADDRESS}"
fi

write_caddyfile "${API_DOMAIN}" "${ADMIN_DOMAIN}" "${DNS_DOMAIN}" "${DOMAIN}" "${IP_ADDRESS}"

API_SECRET="${EXISTING_API_SECRET:-}"
if [[ -z "$API_SECRET" ]]; then
	API_SECRET="$(openssl rand -base64 32)"
fi
cat >"${ROOT}/.env" <<ENV
# Generated by init.sh
DOMAIN=${DOMAIN}
IP_ADDRESS=${IP_ADDRESS}
API_SECRET=${API_SECRET}
ENV

echo ""
echo "Done."
echo "  DOMAIN=${DOMAIN}  IP_ADDRESS=${IP_ADDRESS}"
echo "  TLS material: ${SSL_ROOT}/live/<hostname>/ (mounted into capy_front and capy_core)"
echo "  Wrote ${ROOT}/.env and ${ROOT}/Caddyfile"
echo ""
echo "Next:  podman compose up -d --build"
echo "Note: Rebuild capy_front after DOMAIN changes — VITE_API_URL is http://api.<DOMAIN>/ from compose (set https in compose if you need TLS for the API in the browser)."
