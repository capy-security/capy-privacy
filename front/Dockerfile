# syntax=docker/dockerfile:1
# Multi-stage: build admin frontend, then serve with Caddy
# Build context must be repo root so both admin/ and front/ are available.
# sudo docker compose build capy-front  (from repo root)

# -----------------------------------------------------------------------------
# Stage 1: build admin SvelteKit app
# -----------------------------------------------------------------------------
FROM node:26-alpine3.24 AS builder

WORKDIR /app

# Copy admin app (package.json, lockfile, config, source)
COPY admin/package.json admin/pnpm-lock.yaml admin/pnpm-workspace.yaml ./
COPY admin/ ./

RUN npm install -g corepack \
    && corepack enable \
    && corepack prepare pnpm@12.14.0 --activate \
    && pnpm install --frozen-lockfile

# Build-time API URL (Vite embeds this)
ARG VITE_API_URL=http://api.localhost/
ENV VITE_API_URL=${VITE_API_URL}

RUN pnpm build

# -----------------------------------------------------------------------------
# Stage 2: runtime with Caddy (alpine:3.24, same as core)
# -----------------------------------------------------------------------------
FROM alpine:3.24

RUN apk add --no-cache caddy

RUN mkdir -p /var/capy/admin/
RUN mkdir -p /etc/caddy/conf.d/
RUN mkdir -p /etc/letsencrypt/live/

# Copy Caddy config and static resources from front/system
COPY front/system/ /

# Copy built admin app
COPY --from=builder /app/build/ /var/capy/admin/

RUN chown -R caddy:www-data /var/capy/admin/ /var/capy/blocked/

EXPOSE 80/tcp
EXPOSE 443/tcp

CMD ["/usr/sbin/caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
