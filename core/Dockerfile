# syntax=docker/dockerfile:1
FROM debian:trixie-slim

USER root
ARG application="capy-core"
ARG domain="dns.capysecurity.com"
WORKDIR /${application}
ENV domain=${domain}

RUN apt-get update \
    && apt-get -y upgrade

RUN apt-get -y install nano \
    && apt-get -y install sudo \
    && apt-get -y install procps \
    && apt-get -y install apt-utils

RUN apt-get -y install pdns-recursor \
    && apt-get -y install gettext-base \
    && apt-get -y install dnsdist \
    && apt-get -y install sqlite3 \
    && apt-get -y install lua-sql-sqlite3 \
    && apt-get -y install supervisor

RUN apt-get autoremove \
    && apt-get clean

COPY system/ /
# COPY resources/dnsdist.conf.tpl .
COPY resources/metrics/ /tmp/metrics/

# Copy the appropriate listener binary based on architecture
ARG TARGETARCH
RUN if [ "$TARGETARCH" = "amd64" ]; then \
    cp /tmp/metrics/listener-linux-amd64 /usr/bin/listener; \
    elif [ "$TARGETARCH" = "arm64" ]; then \
    cp /tmp/metrics/listener-linux-arm64 /usr/bin/listener; \
    else \
    echo "Unsupported architecture: $TARGETARCH" && exit 1; \
    fi && \
    chmod +x /usr/bin/listener && \
    rm -rf /tmp/metrics

# RUN cat dnsdist.conf.tpl | envsubst '${domain}' > /etc/dnsdist/dnsdist.conf && rm dnsdist.conf.tpl


# Database setup
RUN mkdir -p /var/capy/database/
RUN chown -R pdns:pdns /var/capy/database/
# powerdns / dnsdist setup
RUN mkdir -p /var/run/pdns-recursor
RUN mkdir -p /etc/ssl/
RUN mkdir -p /var/log/supervisor
RUN chown -R _dnsdist:_dnsdist /etc/dnsdist/
RUN chown -R pdns:pdns /etc/ssl/
RUN chown -R pdns:pdns /var/log/supervisor



EXPOSE 53/udp
EXPOSE 853/tcp
EXPOSE 5300/tcp

CMD ["/usr/bin/supervisord"]

### docker build --no-cache --tag dns .
