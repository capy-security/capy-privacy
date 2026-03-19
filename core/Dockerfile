# syntax=docker/dockerfile:1
# DNS core: PowerDNS Recursor + dnsdist + metrics listener (Alpine)
# Build context: ./core (e.g. docker compose build capy_core)

# -----------------------------------------------------------------------------
# Stage: runtime (alpine:latest for newer pdns-recursor; edge has broken dnsdist deps)
# -----------------------------------------------------------------------------
FROM alpine:latest

ARG application="capy-core"
ARG domain="dns.example.com"
ARG TARGETARCH

WORKDIR /${application}
ENV domain=${domain}

# Base + DNS stack (community repo has pdns-recursor, dnsdist)
RUN apk add --no-cache \
    nano \
    sudo \
    procps \
    pdns-recursor \
    dnsdist \
    sqlite \
    lua5.4-sql-sqlite3 \
    supervisor

# Copy config and static resources
COPY system/ /
COPY resources/metrics/ /tmp/metrics/

# Architecture-specific metrics listener binary
RUN if [ "$TARGETARCH" = "amd64" ]; then \
    cp /tmp/metrics/listener-linux-amd64 /usr/bin/listener; \
    elif [ "$TARGETARCH" = "arm64" ]; then \
    cp /tmp/metrics/listener-linux-arm64 /usr/bin/listener; \
    else \
    echo "Unsupported architecture: $TARGETARCH" && exit 1; \
    fi && \
    chmod +x /usr/bin/listener && \
    rm -rf /tmp/metrics

# Alpine pdns-recursor expects /etc/pdns; we keep config in /etc/powerdns and symlink
RUN rm -rf /etc/pdns && ln -s /etc/powerdns /etc/pdns

# Directories (Alpine pdns-recursor uses user recursor; supervisor runs as root)
RUN mkdir -p /var/capy/database/ \
    && mkdir -p /var/run/pdns-recursor \
    && mkdir -p /etc/ssl/ \
    && mkdir -p /var/log/supervisor

EXPOSE 53/udp
EXPOSE 853/tcp
EXPOSE 5300/tcp

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
