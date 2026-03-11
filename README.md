# Capy-Privacy DNS

DNS filtering platform with DNS-over-HTTPS (DoH), a web UI, and an API to manage domains, clients, and blocklists.

## Architecture

```
                    Internet (clients)
                              │
                              ▼
    ┌─────────────────────────────────────────────────────────────┐
    │         Reverse proxy (Nginx · capy_frontend)               │
    │              :80 / :443 · TLS · LetsEncrypt                 │
    └────────────────────┬────────────────────┬───────────────────┘
                         │                    │
           api.<domain>  │                    │  dns.<domain>
                         │                    │  · SPA
                         ▼ SPA calls API      │  · DoH + DNS
                ┌───────────────┐             │
                │ capy_api      │             │
                │ FastAPI :8080 │             ▼
                │               │     ┌─────────────────┐
                └───────┬───────┘     │ capy_core       │
                        │             │ dnsdist         │
                        │             │ PowerDNS        │
                        ▼             └────────┬────────┘
                ┌────────────────┐             │
                │ database (vol) │             ▼
                └────────────────┘     ┌────────────────┐
                                       │ upstream       │
                                       │ resolvers      │
                                       └────────────────┘
```

**Components**

| Component                                    | Role                                                                                                   |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Reverse proxy** (Nginx in `capy_frontend`) | Publishes the API, the DoH server, and the frontend SPA. TLS termination, routing by host/path.        |
| **Frontend SPA**                             | Web UI served at `dns.<domain>`; talks to the API to manage domains, clients, blocklists.              |
| **api**                                      | REST API (domains, clients, categories, stats). Feeds blocklist/config to the core.                    |
| **capy_core**                                | DoH (`/dns-query` on :5300) and DoT (:853). dnsdist + PowerDNS Recursor; applies policy and recursion. |

## Requirements

- Docker and Docker Compose
- LetsEncrypt certificates for `api.<domain>`, `dns.<domain>`, and optional custom domain (e.g. `capysecurity.com`)
- Host ports 80, 443 (frontend), and optionally 53, 853 (if exposing core directly)

## Quick start

1. **Build images**

   ```bash
   docker compose build
   ```

2. **Run**

   ```bash
   docker compose up -d
   ```

3. **Configure**  
   Edit `docker-compose.yaml` and the frontend Dockerfile build args: `domain`, `ip_address`, `custom_domain` so Nginx and cert paths match your setup.

4. **Certificates**  
   Mount your LetsEncrypt dir (e.g. `/etc/letsencrypt`) into `capy_frontend` and `capy_core` as in the compose file. Obtain certs with certbot (standalone or DNS challenge) for the hostnames you use.

## Project layout

```
capy_dns/
├── docker-compose.yaml   # API, core, frontend
├── api/                  # FastAPI app, SQLite, domain/client/blocklist logic
├── capy_core/            # dnsdist + PowerDNS Recursor config
└── capy_frontend/        # Nginx configs (templates), static SPA, custom site volume
```

## Contact

Gaël Soudé — superjcvd@hotmail.com
