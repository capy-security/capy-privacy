package cleanup

import (
	"database/sql"
	"fmt"
	"time"

	_ "modernc.org/sqlite"
)

// Result of a cleanup run.
type Result struct {
	Cutoff  time.Time
	Count   int64
	Deleted int64
}

// Run deletes metric rows older than days. If dryRun, only counts.
func Run(dbPath string, days int, dryRun bool) (Result, error) {
	if days < 1 {
		return Result{}, fmt.Errorf("days must be >= 1")
	}
	cutoff := time.Now().UTC().AddDate(0, 0, -days)
	cutoffStr := cutoff.Format(time.RFC3339Nano)

	db, err := sql.Open("sqlite", dbPath+"?_journal_mode=WAL")
	if err != nil {
		return Result{}, err
	}
	defer db.Close()

	var count int64
	if err := db.QueryRow(
		`SELECT COUNT(*) FROM metric WHERE timestamp < ?`, cutoffStr,
	).Scan(&count); err != nil {
		return Result{}, fmt.Errorf("count old metrics: %w", err)
	}

	res := Result{Cutoff: cutoff, Count: count}
	if dryRun || count == 0 {
		return res, nil
	}

	r, err := db.Exec(`DELETE FROM metric WHERE timestamp < ?`, cutoffStr)
	if err != nil {
		return res, fmt.Errorf("delete old metrics: %w", err)
	}
	res.Deleted, _ = r.RowsAffected()
	return res, nil
}
