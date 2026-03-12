# syntax=docker/dockerfile:1
# Multi-stage: build Python package with Poetry, then minimal runtime
# Build context: ./api (docker compose build capy_api)

# -----------------------------------------------------------------------------
# Stage 1: build the package
# -----------------------------------------------------------------------------
FROM python:3.14-alpine AS builder

WORKDIR /build

# Build deps for C extensions (e.g. argon2-cffi)
RUN apk add --no-cache gcc musl-dev

RUN pip install --no-cache-dir poetry

COPY . .

RUN poetry build

# -----------------------------------------------------------------------------
# Stage 2: runtime
# -----------------------------------------------------------------------------
FROM python:3.14-alpine

WORKDIR /capy

COPY --from=builder /build/dist/ ./dist/

# Build deps needed for C extensions (e.g. argon2-cffi); remove after pip install to keep image small
RUN apk add --no-cache --virtual .build-deps gcc musl-dev \
    && pip install --no-cache-dir ./dist/*.tar.gz \
    && apk del .build-deps \
    && rm -rf ./dist

RUN mkdir -p /var/capy/database/

EXPOSE 8080/tcp

CMD ["uvicorn", "api:api", "--host", "0.0.0.0", "--port", "8080"]
