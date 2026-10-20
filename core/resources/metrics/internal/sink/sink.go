package sink

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"capy-metrics/internal/metric"
)

// Config selects which sinks are active.
type Config struct {
	Text   bool
	JSON   bool
	SQLite bool
	DBPath string

	BufferSize    int
	BatchSize     int
	FlushInterval time.Duration
	DryRun        bool
}

// Fanout buffers metrics and fans them out to enabled sinks.
type Fanout struct {
	cfg Config

	textCh   chan metric.Metric
	jsonCh   chan metric.Metric
	sqliteCh chan metric.Metric
	wg       sync.WaitGroup

	Dropped atomic.Uint64
	Queued  atomic.Uint64
	Written atomic.Uint64
}

// NewFanout starts worker goroutines for enabled sinks.
func NewFanout(cfg Config) *Fanout {
	if cfg.BufferSize <= 0 {
		cfg.BufferSize = 10000
	}
	if cfg.BatchSize <= 0 {
		cfg.BatchSize = 500
	}
	if cfg.FlushInterval <= 0 {
		cfg.FlushInterval = 5 * time.Second
	}
	if cfg.DBPath == "" {
		cfg.DBPath = "/var/capy/database/database.db"
	}

	f := &Fanout{cfg: cfg}
	if cfg.Text {
		f.textCh = make(chan metric.Metric, cfg.BufferSize)
		f.wg.Add(1)
		go f.textWorker()
	}
	if cfg.JSON {
		f.jsonCh = make(chan metric.Metric, cfg.BufferSize)
		f.wg.Add(1)
		go f.jsonWorker()
	}
	if cfg.SQLite && !cfg.DryRun {
		f.sqliteCh = make(chan metric.Metric, cfg.BufferSize)
		f.wg.Add(1)
		go f.sqliteWorker()
	}
	return f
}

// Publish tries to enqueue m to every enabled sink. Never blocks long.
func (f *Fanout) Publish(m metric.Metric) {
	f.Queued.Add(1)
	if f.textCh != nil {
		f.trySend(f.textCh, m)
	}
	if f.jsonCh != nil {
		f.trySend(f.jsonCh, m)
	}
	if f.sqliteCh != nil {
		f.trySend(f.sqliteCh, m)
	}
}

func (f *Fanout) trySend(ch chan metric.Metric, m metric.Metric) {
	select {
	case ch <- m:
	default:
		f.Dropped.Add(1)
	}
}

// Close drains workers.
func (f *Fanout) Close() {
	if f.textCh != nil {
		close(f.textCh)
	}
	if f.jsonCh != nil {
		close(f.jsonCh)
	}
	if f.sqliteCh != nil {
		close(f.sqliteCh)
	}
	f.wg.Wait()
}

func (f *Fanout) textWorker() {
	defer f.wg.Done()
	for m := range f.textCh {
		fmt.Println(strings.Repeat("=", 72))
		fmt.Printf("Timestamp: %s\n", m.Timestamp.Format("2006-01-02 15:04:05.000000"))
		fmt.Printf("Client IP: %s\n", m.ClientIP)
		fmt.Printf("Domain: %s\n", m.Domain)
		if m.QueryType != nil {
			fmt.Printf("Query Type: %s\n", *m.QueryType)
		}
		if m.Protocol != nil {
			fmt.Printf("Protocol: %s\n", *m.Protocol)
		}
		fmt.Printf("Blocked: %v\n", m.Blocked)
		if m.AppliedPolicy != nil {
			fmt.Printf("Applied Policy: %s\n", *m.AppliedPolicy)
		}
		if m.CategoryID != nil {
			fmt.Printf("Category ID: %d\n", *m.CategoryID)
		}
		if len(m.Tags) > 0 {
			fmt.Printf("Tags: %s\n", strings.Join(m.Tags, ", "))
		}
		fmt.Println(strings.Repeat("=", 72))
		f.Written.Add(1)
	}
}

type jsonMetric struct {
	Timestamp     string  `json:"timestamp"`
	ClientIP      string  `json:"client_ip"`
	Domain        string  `json:"domain"`
	QueryType     *string `json:"query_type,omitempty"`
	Protocol      *string `json:"protocol,omitempty"`
	Blocked       bool    `json:"blocked"`
	AppliedPolicy *string `json:"applied_policy,omitempty"`
	CategoryID    *int    `json:"category_id,omitempty"`
}

func (f *Fanout) jsonWorker() {
	defer f.wg.Done()
	enc := json.NewEncoder(os.Stdout)
	for m := range f.jsonCh {
		j := jsonMetric{
			Timestamp:     m.Timestamp.Format(time.RFC3339Nano),
			ClientIP:      m.ClientIP,
			Domain:        m.Domain,
			QueryType:     m.QueryType,
			Protocol:      m.Protocol,
			Blocked:       m.Blocked,
			AppliedPolicy: m.AppliedPolicy,
			CategoryID:    m.CategoryID,
		}
		if err := enc.Encode(j); err != nil {
			log.Printf("json encode: %v", err)
			continue
		}
		f.Written.Add(1)
	}
}
