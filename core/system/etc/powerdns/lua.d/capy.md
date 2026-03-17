# capy.lua — DNS filtering hook

## How it works

This script is a DNS filter running inside PowerDNS. Every time a device on the network makes a DNS request (e.g. "what is the IP of `ads.google.com`?"), PowerDNS calls the `preresolve` function **before** resolving it normally. The script decides: should this request be **blocked** (redirected to a fake IP) or **allowed** (pass through)?

The filtering is based on two things:
- **Who is asking** — matched by the client's IP address (supports exact IPs and CIDR subnets)
- **What they are asking for** — matched by domain name, linked through groups and categories

### Data model

```
client (IP or CIDR)
  └── group (via association_clients)
        └── category (via association_categories)
              └── domain (blocked domains in this category)
```

A client belongs to a group. A group has categories. Each category contains blocked domains. If the queried domain is found in any category linked to the client's group, it gets redirected.

### CIDR matching — most specific wins

Clients can be stored as exact IPs or CIDR networks. When multiple entries match, the **longest prefix** (most specific) wins.

Example client table:

| id | ip | name |
|---|---|---|
| 1 | `192.168.1.0/24` | family network |
| 2 | `192.168.1.10` | admin PC |

- Client 1 (family) is in a group that blocks the "ads" category
- Client 2 (admin) is in a group that blocks nothing

The "ads" category contains `ads.google.com` with redirect IP `127.0.0.1`.

**Scenario A** — `192.168.1.3` (a kid's tablet) asks for `ads.google.com`:

1. `find_best_client("192.168.1.3")` checks all cached clients:
   - `192.168.1.3` in `192.168.1.0/24`? Yes (prefix 24)
   - `192.168.1.3` == `192.168.1.10`? No
   - Best match: client id=1 (family), prefix 24
2. SQL: is `ads.google.com` blocked for client id=1? Yes
3. Returns `127.0.0.1` instead of the real IP — **blocked**

**Scenario B** — `192.168.1.10` (admin PC) asks for `ads.google.com`:

1. `find_best_client("192.168.1.10")` checks all cached clients:
   - `192.168.1.10` in `192.168.1.0/24`? Yes (prefix 24)
   - `192.168.1.10` == `192.168.1.10`? Yes (prefix 32)
   - Both match, but prefix 32 > 24, so the most specific wins
   - Best match: client id=2 (admin), prefix 32
2. SQL: is `ads.google.com` blocked for client id=2? No
3. Returns `false` — **allowed**, normal DNS resolution

**Scenario C** — `10.0.0.5` (unknown device) asks for anything:

1. `find_best_client("10.0.0.5")` — no match
2. Returns `false` immediately — **unfiltered**

---

## Function reference

### `ip_to_int(ip_str)`

Converts a dotted IPv4 string to a 32-bit integer for math comparison.

```
"192.168.1.10" → 192 * 16777216 + 168 * 65536 + 1 * 256 + 10 = 3232235786
```

The multipliers are powers of 256 (256^3, 256^2, 256^1, 256^0). Each octet is one byte of a 32-bit number.

### `parse_cidr(cidr_str)`

Parses `"192.168.1.0/24"` or a plain IP `"192.168.1.10"` into a table with:

- `network` — base address of the network (host bits zeroed)
- `prefix` — number of fixed network bits (24 = first 24 bits are the network part)
- `mask` — bitmask with `prefix` leading 1s

Plain IPs are treated as `/32` (single host, exact match).

### `ip_matches_cidr(ip_int, cidr)`

Checks if an IP belongs to a network by zeroing out host bits and comparing to the network address.

```
192.168.1.10 in 192.168.1.0/24?
  zero host bits → 192.168.1.0
  network = 192.168.1.0 → match

192.168.2.5 in 192.168.1.0/24?
  zero host bits → 192.168.2.0
  network = 192.168.1.0 → no match
```

### `reload_client_cache()`

Loads all rows from the `client` table into a Lua array, but only once every 60 seconds (`CACHE_TTL`). Each row is parsed with `parse_cidr` so the integer math is precomputed. This avoids hitting the database on every DNS query.

### `find_best_client(client_ip_str)`

Iterates all cached clients and checks each one with `ip_matches_cidr`. If multiple entries match (e.g. both `/24` and `/32`), keeps the one with the highest prefix — the most specific match. A `/32` (exact IP) always beats a `/24` (subnet), which beats a `/16`, etc.

### `connect_database()`

Opens a connection to the SQLite database. Called once at startup and retried if the connection drops.

### `exec_sql(request)`

Runs a SQL query and returns results as a Lua array of row tables. Handles both SELECT (returns rows) and INSERT/UPDATE/DELETE (returns affected count).

### `preresolve(dq)`

The main hook called by PowerDNS for every DNS query:

1. Ensure database is connected
2. Refresh the client cache if older than 60 seconds
3. Extract domain and client IP from the DNS question
4. `find_best_client` — find which client entry matches this IP
5. No match → `return false` (unfiltered, normal DNS)
6. Match found → SQL query to check if the domain is blocked for this client's group
7. Domain found → respond with the redirect IP (`return true`)
8. Domain not found → `return false` (allowed)
