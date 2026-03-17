# Public hosting (VPS / production)

Run `./prerequisites.sh` and choose **2) Internet**. The generated `.env` will have `TLS_MODE=on` and **empty** `API_SCHEME` and `ADMIN_SCHEME` so Caddy serves API/Admin over HTTPS. Do not set `API_SCHEME=http://` or `ADMIN_SCHEME=http://` in production or Caddy will fail with: *"server listening on [:80] is HTTP, but attempts to configure TLS connection policies"*.

---

# ./prerequisites.sh

# Capy Privacy - First time setup

How will Capy Privacy be used?

1. Local only (LAN) - HTTP for UI/API, self-signed cert for DNS core only
2. Internet - server with public IP (80, 443, 853, 5300 TCP; 53 UDP) - Let's Encrypt
   Choice [1/2] (default 1): 2

Domain name (e.g. test.com): capysecurity.com
→ DOMAIN: capysecurity.com | API: api.capysecurity.com | DNS: dns.capysecurity.com | Admin: admin.capysecurity.com

Public IP of this server: 91.134.137.25
Email for Let's Encrypt: capy.security@protonmail.com
Force new certificate generation (e.g. after key rotation / leak)?
[y/N]: y

Using Let's Encrypt. Ensure ports 80 and 443 are free.
Certificate for api.capysecurity.com ...
Saving debug log to /var/log/letsencrypt/letsencrypt.log
Renewing an existing certificate for api.capysecurity.com

Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/api.capysecurity.com/fullchain.pem
Key is saved at: /etc/letsencrypt/live/api.capysecurity.com/privkey.pem
This certificate expires on 2026-06-15.
These files will be updated when the certificate renews.
Certbot has set up a scheduled task to automatically renew this certificate in the background.

---

If you like Certbot, please consider supporting our work by:

- Donating to ISRG / Let's Encrypt: https://letsencrypt.org/donate
- Donating to EFF: https://eff.org/donate-le

---

Certificate for dns.capysecurity.com ...
Saving debug log to /var/log/letsencrypt/letsencrypt.log
Renewing an existing certificate for dns.capysecurity.com

Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/dns.capysecurity.com/fullchain.pem
Key is saved at: /etc/letsencrypt/live/dns.capysecurity.com/privkey.pem
This certificate expires on 2026-06-15.
These files will be updated when the certificate renews.
Certbot has set up a scheduled task to automatically renew this certificate in the background.

---

If you like Certbot, please consider supporting our work by:

- Donating to ISRG / Let's Encrypt: https://letsencrypt.org/donate
- Donating to EFF: https://eff.org/donate-le

---

Certificate for admin.capysecurity.com ...
Saving debug log to /var/log/letsencrypt/letsencrypt.log
Renewing an existing certificate for admin.capysecurity.com

Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/admin.capysecurity.com/fullchain.pem
Key is saved at: /etc/letsencrypt/live/admin.capysecurity.com/privkey.pem
This certificate expires on 2026-06-15.
These files will be updated when the certificate renews.
Certbot has set up a scheduled task to automatically renew this certificate in the background.

---

If you like Certbot, please consider supporting our work by:

- Donating to ISRG / Let's Encrypt: https://letsencrypt.org/donate
- Donating to EFF: https://eff.org/donate-le

---

Self-signed for IP (block page): 91.134.137.25 ...

Wrote /home/superjcvd/capy-privacy/.env
