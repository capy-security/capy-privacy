# syntax=docker/dockerfile:1
# Multi-stage: build admin frontend, then serve with Caddy
# Build context must be repo root so both admin/ and front/ are available.
# docker compose -f docker-compose.yaml build capy_front  (from repo root)

# -----------------------------------------------------------------------------
# Stage 1: build admin SvelteKit app
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy admin app (package.json, lockfile, config, source)
COPY admin/package.json admin/yarn.lock* admin/package-lock.json* ./
COPY admin/ ./

RUN corepack enable yarn \
    && yarn install --frozen-lockfile

# Build-time API URL (Vite embeds this)
ARG VITE_API_URL=http://api.localhost/
ENV VITE_API_URL=${VITE_API_URL}

RUN yarn build

# -----------------------------------------------------------------------------
# Stage 2: runtime with Caddy + supervisor (alpine:latest, same as core)
# -----------------------------------------------------------------------------
FROM alpine:latest

RUN apk add --no-cache caddy

RUN mkdir -p /var/capy/admin/
RUN mkdir -p /etc/caddy/custom/

# Copy Caddy config and static resources from front/system
COPY front/system/ /

# Copy built admin app
COPY --from=builder /app/build/ /var/capy/admin/

RUN chown -R caddy:www-data /var/capy/admin/ /var/capy/blocked/

EXPOSE 80/tcp
EXPOSE 443/tcp

CMD ["/usr/sbin/caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
