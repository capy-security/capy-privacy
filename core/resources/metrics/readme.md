# DNS metrics collector

Lightweight Go TCP collector for PowerDNS protobuf DNS messages. Writes into
the shared SQLite `metric` table (same DB as the API / Lua filter).

## Contract with `capy.lua`

Lua signals decisions with **protobuf policy tags** only (`dq:addPolicyTag`).
It does **not** set `appliedPolicy` (RPZ object) — that breaks self-built
sinkhole answers in the Recursor.

| Tag | Meaning |
| --- | --- |
| `capy-blocked` | Domain sinkhole |
| `capy-deny` | Client IP not allowlisted |
| `<category.name>` | Optional category (e.g. `ads`) |

The collector sets `blocked=true` when tags include a reserved `capy-*` tag,
stores that name in `applied_policy`, and maps the first remaining tag that
matches a `category` row to `category_id`.

Recursor must log **responses** (`logResponses: true`); the collector persists
only `DNSResponseType` messages so query+response pairs are not double-counted.

## Setup

```bash
# protobuf codegen (optional; pb/ is committed)
./generate.sh

go mod tidy
go build -o collector ./cmd/collector/
```

### Cross-compile for Docker

```bash
GOOS=linux GOARCH=amd64 go build -o collector-linux-amd64 ./cmd/collector/
GOOS=linux GOARCH=arm64 go build -o collector-linux-arm64 ./cmd/collector/
```

## CLI

```bash
collector help
collector version
collector selftest

# Production (supervisord)
collector listen --sink sqlite

# Debug / dry-run
collector listen --sink text,json --dry-run --debug
collector listen --listen 0.0.0.0:6000 --db-path=/var/capy/database/database.db

# Retention (CLI only)
collector cleanup --days 30
collector cleanup --days 7 --dry-run
```

### `listen` flags

| Flag | Default | Description |
| --- | --- | --- |
| `--listen` | `0.0.0.0:6000` | TCP bind address |
| `--db-path` | `/var/capy/database/database.db` | SQLite path |
| `--sink` | `sqlite` | Comma list: `sqlite`, `json`, `text` |
| `--dry-run` | false | Skip SQLite writes |
| `--buffer-size` | 10000 | Per-sink channel buffer |
| `--batch-size` | 500 | SQLite multi-row INSERT size |
| `--flush-interval` | 5s | Max time before flush |
| `--filter-localhost` | true | Drop From=127.0.0.1 |
| `--stats-interval` | 1m | Counter log line (`0` disables) |
| `--debug` | false | Verbose I/O logging |

## Design notes

- Bounded buffers; drops + counters when full (never blocks PDNS forever).
- Single SQLite writer goroutine, WAL, batched inserts.
- Category name→id cache refreshed on TTL / miss.
- Adds `applied_policy` column on first SQLite open if the API has not migrated yet.
