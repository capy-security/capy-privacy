package listen

import (
	"database/sql"
	"encoding/binary"
	"encoding/hex"
	"fmt"
	"io"
	"log"
	"net"
	"os"
	"os/signal"
	"sync/atomic"
	"syscall"
	"time"

	"capy-metrics/internal/category"
	"capy-metrics/internal/metric"
	"capy-metrics/internal/sink"
	"capy-metrics/pb"

	"google.golang.org/protobuf/proto"
	_ "modernc.org/sqlite"
)

// Options for the TCP collector.
type Options struct {
	Addr             string
	FilterLocalhost  bool
	Debug            bool
	StatsInterval    time.Duration
	CategoryRefresh  time.Duration
	Sink             sink.Config
}

// Run listens for PowerDNS protobuf streams until SIGINT/SIGTERM.
func Run(opts Options) error {
	fan := sink.NewFanout(opts.Sink)
	defer fan.Close()

	var catCache *category.Cache
	var catDB *sql.DB
	if opts.Sink.SQLite && !opts.Sink.DryRun {
		var err error
		catDB, err = sql.Open("sqlite", opts.Sink.DBPath+"?_journal_mode=WAL&mode=ro")
		if err != nil {
			log.Printf("category db open (non-fatal): %v", err)
		} else {
			catCache = category.New(opts.CategoryRefresh)
			if err := catCache.Refresh(catDB); err != nil {
				log.Printf("category cache initial refresh (non-fatal): %v", err)
			}
		}
	}
	if catDB != nil {
		defer catDB.Close()
	}

	ln, err := net.Listen("tcp", opts.Addr)
	if err != nil {
		return fmt.Errorf("listen %s: %w", opts.Addr, err)
	}
	defer ln.Close()

	log.Printf("collector listening on %s", opts.Addr)
	if opts.Sink.DryRun {
		log.Printf("dry-run: sqlite writes disabled")
	}

	var accepted atomic.Uint64
	stop := make(chan struct{})

	go func() {
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
		<-sigCh
		log.Printf("shutdown signal received")
		close(stop)
		_ = ln.Close()
	}()

	if opts.StatsInterval > 0 {
		go func() {
			t := time.NewTicker(opts.StatsInterval)
			defer t.Stop()
			for {
				select {
				case <-stop:
					return
				case <-t.C:
					log.Printf("stats accepted=%d queued=%d written=%d dropped=%d",
						accepted.Load(), fan.Queued.Load(), fan.Written.Load(), fan.Dropped.Load())
				}
			}
		}()
	}

	for {
		conn, err := ln.Accept()
		if err != nil {
			select {
			case <-stop:
				log.Printf("final stats accepted=%d queued=%d written=%d dropped=%d",
					accepted.Load(), fan.Queued.Load(), fan.Written.Load(), fan.Dropped.Load())
				return nil
			default:
				log.Printf("accept: %v", err)
				continue
			}
		}
		accepted.Add(1)
		go handleConn(conn, opts, fan, catCache, catDB)
	}
}

func handleConn(conn net.Conn, opts Options, fan *sink.Fanout, cat *category.Cache, catDB *sql.DB) {
	defer conn.Close()
	addr := conn.RemoteAddr().String()
	if opts.Debug {
		log.Printf("connection from %s", addr)
	}

	for {
		raw, err := readMessage(conn, opts.Debug)
		if err != nil {
			if err != io.EOF {
				if netErr, ok := err.(net.Error); ok && netErr.Timeout() {
					if opts.Debug {
						log.Printf("idle timeout %s", addr)
					}
					return
				}
				if opts.Debug {
					log.Printf("read from %s: %v", addr, err)
				}
			}
			return
		}

		var msg pb.PBDNSMessage
		if err := proto.Unmarshal(raw, &msg); err != nil {
			log.Printf("protobuf from %s: %v", addr, err)
			continue
		}

		// Prefer responses so policy tags (set by Lua) are present.
		// Skip queries to avoid double-counting when both are logged.
		if msg.GetType() != pb.PBDNSMessage_DNSResponseType {
			continue
		}

		if opts.FilterLocalhost && metric.IsLocalhostFrom(&msg) {
			continue
		}

		m := metric.FromProtobuf(&msg)
		if cat != nil && len(m.Tags) > 0 {
			m.CategoryID = cat.Resolve(m.Tags, catDB)
		}
		fan.Publish(m)
	}
}

func readMessage(conn net.Conn, debug bool) ([]byte, error) {
	conn.SetReadDeadline(time.Now().Add(5 * time.Minute))

	var lengthBytes [2]byte
	if _, err := io.ReadFull(conn, lengthBytes[:]); err != nil {
		return nil, err
	}
	messageLength := binary.BigEndian.Uint16(lengthBytes[:])
	if messageLength == 0 {
		return nil, fmt.Errorf("invalid message length 0")
	}
	if debug {
		log.Printf("length prefix %d (hex %s)", messageLength, hex.EncodeToString(lengthBytes[:]))
	}

	conn.SetReadDeadline(time.Now().Add(5 * time.Second))
	buf := make([]byte, messageLength)
	if _, err := io.ReadFull(conn, buf); err != nil {
		return nil, err
	}
	conn.SetReadDeadline(time.Time{})
	return buf, nil
}
