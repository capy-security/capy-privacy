#!/usr/bin/env bash
# Cross-compile collector binaries for the core Docker image.
set -euo pipefail
cd "$(dirname "$0")"

GOOS=linux GOARCH=amd64 go build -o collector-linux-amd64 ./cmd/collector/
GOOS=linux GOARCH=arm64 go build -o collector-linux-arm64 ./cmd/collector/
echo "built collector-linux-amd64 collector-linux-arm64"
