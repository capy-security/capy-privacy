# syntax=docker/dockerfile:1
FROM debian:trixie-slim

USER root

ARG application="capy_frontend"
# ARG ip_address="91.134.137.25"
# ARG domain="dns.capysecurity.com"

WORKDIR /${application}

# ENV domain=${domain}
# ENV ip_address=${ip_address}

RUN apt-get update \
    && apt-get -y upgrade

RUN apt-get -y install nano \
    && apt-get -y install sudo \
    && apt-get -y install procps
# && apt-get -y install apt-utils

RUN apt-get -y install supervisor
# Add Caddy repo and install (after apt-get update)
RUN apt-get update \
    && apt-get install -y debian-keyring debian-archive-keyring apt-transport-https ca-certificates curl \
    && curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg \
    && curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list \
    && apt-get update \
    && apt-get install -y caddy \
    && apt-get autoremove -y \
    && apt-get clean

RUN apt-get autoremove \
    && apt-get clean

RUN mkdir -p /var/capy/www/

COPY system/ /
RUN mkdir -p /etc/caddy/custom
# COPY templates/api.domain.conf.tpl .
# COPY templates/dns.domain.conf.tpl .
# COPY templates/deny.domain.conf.tpl .
# RUN cat api.domain.conf.tpl | envsubst '${domain}' > /etc/nginx/sites-available/api.domain.conf && rm api.domain.conf.tpl
# RUN cat dns.domain.conf.tpl | envsubst '${domain}' > /etc/nginx/sites-available/dns.domain.conf && rm dns.domain.conf.tpl
# RUN cat deny.domain.conf.tpl | envsubst '${ip_address}' > /etc/nginx/sites-available/deny.domain.conf && rm deny.domain.conf.tpl
# RUN ln -s /etc/nginx/sites-available/api.domain.conf /etc/nginx/sites-enabled/api.domain.conf
# RUN ln -s /etc/nginx/sites-available/dns.domain.conf /etc/nginx/sites-enabled/dns.domain.conf
# RUN ln -s /etc/nginx/sites-available/deny.domain.conf /etc/nginx/sites-enabled/deny.domain.conf
# RUN rm /etc/nginx/sites-enabled/default


# Nginx files permissions
RUN chown -R www-data:www-data /var/capy/www/

EXPOSE 80/tcp
EXPOSE 443/tcp

CMD ["/usr/bin/supervisord"]

### docker build --no-cache --tag dns .
