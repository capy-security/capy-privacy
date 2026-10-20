package sink

import (
	"database/sql"
	"fmt"
	"log"
	"strings"
	"time"

	"capy-metrics/internal/metric"

	_ "modernc.org/sqlite"
)

func (f *Fanout) sqliteWorker() {
	defer f.wg.Done()

	db, err := sql.Open("sqlite", f.cfg.DBPath+"?_journal_mode=WAL")
	if err != nil {
		log.Printf("sqlite open: %v", err)
		return
	}
	defer db.Close()

	if err := ensureMetricSchema(db); err != nil {
		log.Printf("sqlite schema: %v", err)
		return
	}

	batch := make([]metric.Metric, 0, f.cfg.BatchSize)
	ticker := time.NewTicker(f.cfg.FlushInterval)
	defer ticker.Stop()

	flush := func() {
		if len(batch) == 0 {
			return
		}
		if err := insertBatch(db, batch); err != nil {
			log.Printf("sqlite insert: %v", err)
		} else {
			f.Written.Add(uint64(len(batch)))
		}
		batch = batch[:0]
	}

	for {
		select {
		case m, ok := <-f.sqliteCh:
			if !ok {
				flush()
				return
			}
			batch = append(batch, m)
			if len(batch) >= f.cfg.BatchSize {
				flush()
			}
		case <-ticker.C:
			flush()
		}
	}
}

func ensureMetricSchema(db *sql.DB) error {
	var name string
	err := db.QueryRow(
		`SELECT name FROM sqlite_master WHERE type='table' AND name='metric'`,
	).Scan(&name)
	if err == sql.ErrNoRows {
		return fmt.Errorf("metric table missing; start the API once to create the schema")
	}
	if err != nil {
		return err
	}

	var n int
	if err := db.QueryRow(
		`SELECT COUNT(*) FROM pragma_table_info('metric') WHERE name='applied_policy'`,
	).Scan(&n); err != nil {
		return err
	}
	if n == 0 {
		if _, err := db.Exec(`ALTER TABLE metric ADD COLUMN applied_policy TEXT`); err != nil {
			return fmt.Errorf("add applied_policy column: %w", err)
		}
		log.Printf("added applied_policy column to metric table")
	}
	return nil
}

func insertBatch(db *sql.DB, batch []metric.Metric) error {
	if len(batch) == 0 {
		return nil
	}
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	const row = "(?,?,?,?,?,?,?,?)"
	var b strings.Builder
	b.WriteString(`INSERT INTO metric (timestamp, client_ip, domain, query_type, protocol, blocked, category_id, applied_policy) VALUES `)
	for i := range batch {
		if i > 0 {
			b.WriteString(",")
		}
		b.WriteString(row)
	}

	args := make([]any, 0, 8*len(batch))
	for _, m := range batch {
		var catID any
		if m.CategoryID != nil {
			catID = *m.CategoryID
		}
		var policy any
		if m.AppliedPolicy != nil {
			policy = *m.AppliedPolicy
		}
		args = append(args,
			m.Timestamp.UTC().Format(time.RFC3339Nano),
			m.ClientIP,
			m.Domain,
			m.QueryType,
			m.Protocol,
			m.Blocked,
			catID,
			policy,
		)
	}
	if _, err := tx.Exec(b.String(), args...); err != nil {
		return err
	}
	return tx.Commit()
}
