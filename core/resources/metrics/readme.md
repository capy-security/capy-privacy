# DNS Metrics Listener

Simple TCP listener for PowerDNS/dnsdist protobuf DNS messages.

## Setup

1. Install protobuf compiler:
   ```bash
   # macOS
   brew install protobuf
   
   # Debian/Ubuntu
   apt-get install protobuf-compiler
   ```

2. Install the Go protobuf plugin (required for code generation):
   ```bash
   go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
   ```
   Ensure `$GOPATH/bin` or `$HOME/go/bin` is in your `PATH` so `protoc` can find `protoc-gen-go`.

3. Generate Go protobuf code:
   ```bash
   ./generate.sh
   ```

4. Install Go dependencies:
   ```bash
   go mod tidy
   ```

5. Build:
   ```bash
   go build -o listener listener.go
   ```

## Cross-compilation

To build for different architectures (useful for Docker containers):

### Build for Linux AMD64:
```bash
GOOS=linux GOARCH=amd64 go build -o listener-linux-amd64 listener.go
```

### Build for Linux ARM64:
```bash
GOOS=linux GOARCH=arm64 go build -o listener-linux-arm64 listener.go
```

### Build for both:
```bash
GOOS=linux GOARCH=amd64 go build -o listener-linux-amd64 listener.go
GOOS=linux GOARCH=arm64 go build -o listener-linux-arm64 listener.go
```

## Usage

```bash
# Default: listen on 0.0.0.0:6000 with text output only
./listener

# Custom port
./listener 6000

# Custom host and port
./listener 0.0.0.0 6000

# Enable debug mode (verbose logging, shows raw data)
./listener --debug

# Output options (can combine multiple):
./listener --output-text              # Text output to stdout
./listener --output-json              # JSON output to stdout
./listener --output-sqlite            # SQLite database output
./listener --output-text --output-json --output-sqlite  # All outputs

# Note: If no output is specified, nothing will be displayed (useful for SQLite-only mode)

# SQLite database path:
./listener --output-sqlite --db-path=/path/to/database.db

# Other options:
./listener --no-filter-localhost      # Include localhost messages
./listener --debug --output-json      # Debug mode with JSON output
```

## Output Formats

All outputs use the same data structure matching the database schema:

- `timestamp`: Query timestamp (RFC3339Nano for JSON, formatted string for text)
- `client_ip`: Client IP address
- `domain`: Domain name (without trailing dot)
- `query_type`: DNS query type (A, AAAA, MX, etc.) - optional
- `protocol`: Transport protocol (UDP, TCP, DoT, DoH, etc.) - optional
- `blocked`: Whether query was blocked by blacklist
- `category_id`: Category ID if blocked - optional

### Text Output
Human-readable format printed to stdout (default).

### JSON Output
One JSON object per line, printed to stdout. Suitable for log aggregation tools.

### SQLite Output
Writes to SQLite database with:
- Batch inserts (100 metrics or every 5 seconds)
- Automatic table creation
- Indexes for common query patterns
- WAL mode enabled for better concurrency
