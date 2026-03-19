# Public hosting (VPS / production)

Run `./prerequisites.sh` and choose **2) Internet**.
The generated `.env` will have `TLS_MODE=on` and **empty** `API_SCHEME` and `ADMIN_SCHEME` so Caddy serves API/Admin over HTTPS.

---

# ./prerequisites.sh

# Capy Privacy - First time setup

How will Capy Privacy be used?

1. Local only (LAN) - HTTP for UI/API, self-signed cert for DNS core only
2. Internet - server with public IP (80, 443, 853, 5300 TCP; 53 UDP) - Let's Encrypt
   Choice [1/2] (default 1): 2

Domain name (e.g. test.com): example.com
→ DOMAIN: example.com | API: api.example.com | DNS: dns.example.com | Admin: admin.example.com

Public IP of this server: 203.0.113.10
Email for Let's Encrypt: admin@example.com
Force new certificate generation (e.g. after key rotation / leak)?
[y/N]: y

Using Let's Encrypt. Ensure ports 80 and 443 are free.
Certificate for api.example.com ...
Saving debug log to /var/log/letsencrypt/letsencrypt.log
Renewing an existing certificate for api.example.com

Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/api.example.com/fullchain.pem
Key is saved at: /etc/letsencrypt/live/api.example.com/privkey.pem
This certificate expires on 2026-06-15.
These files will be updated when the certificate renews.
Certbot has set up a scheduled task to automatically renew this certificate in the background.

---

If you like Certbot, please consider supporting our work by:

- Donating to ISRG / Let's Encrypt: https://letsencrypt.org/donate
- Donating to EFF: https://eff.org/donate-le

---

Certificate for dns.example.com ...
Saving debug log to /var/log/letsencrypt/letsencrypt.log
Renewing an existing certificate for dns.example.com

Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/dns.example.com/fullchain.pem
Key is saved at: /etc/letsencrypt/live/dns.example.com/privkey.pem
This certificate expires on 2026-06-15.
These files will be updated when the certificate renews.
Certbot has set up a scheduled task to automatically renew this certificate in the background.

---

If you like Certbot, please consider supporting our work by:

- Donating to ISRG / Let's Encrypt: https://letsencrypt.org/donate
- Donating to EFF: https://eff.org/donate-le

---

Certificate for admin.example.com ...
Saving debug log to /var/log/letsencrypt/letsencrypt.log
Renewing an existing certificate for admin.example.com

Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/admin.example.com/fullchain.pem
Key is saved at: /etc/letsencrypt/live/admin.example.com/privkey.pem
This certificate expires on 2026-06-15.
These files will be updated when the certificate renews.
Certbot has set up a scheduled task to automatically renew this certificate in the background.

---

If you like Certbot, please consider supporting our work by:

- Donating to ISRG / Let's Encrypt: https://letsencrypt.org/donate
- Donating to EFF: https://eff.org/donate-le

---

Self-signed for IP (block page): 203.0.113.10 ...

Wrote /path/to/capy-privacy/.env
