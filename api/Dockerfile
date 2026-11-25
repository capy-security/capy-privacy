# syntax=docker/dockerfile:1
# Multi-stage: sync with uv into a venv, then copy venv only
# Build context: ./api (sudo docker compose build capy-api)
# Keep WORKDIR identical across stages so venv shebangs stay valid.

# -----------------------------------------------------------------------------
# Stage 1: build / sync
# -----------------------------------------------------------------------------
FROM python:3.15-alpine3.24 AS builder

COPY --from=ghcr.io/astral-sh/uv:0.13 /uv /uvx /bin/

ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy UV_PYTHON_DOWNLOADS=0

WORKDIR /capy

# Build deps for C extensions (e.g. argon2-cffi)
RUN apk add --no-cache gcc musl-dev

COPY pyproject.toml uv.lock README.md ./
RUN uv sync --frozen --no-install-project --no-dev --no-editable

COPY src ./src
RUN uv sync --locked --no-dev --no-editable

# -----------------------------------------------------------------------------
# Stage 2: runtime
# -----------------------------------------------------------------------------
FROM python:3.15-alpine3.24

WORKDIR /capy

COPY --from=builder /capy/.venv /capy/.venv
ENV PATH="/capy/.venv/bin:$PATH"

RUN mkdir -p /var/capy/database/

EXPOSE 8080/tcp

CMD ["uvicorn", "api:api", "--host", "0.0.0.0", "--port", "8080"]
