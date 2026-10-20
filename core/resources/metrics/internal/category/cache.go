package category

import (
	"database/sql"
	"log"
	"strings"
	"sync"
	"time"
)

// Cache maps category.name → id with periodic refresh.
type Cache struct {
	mu           sync.RWMutex
	byName       map[string]int
	refreshEvery time.Duration
	lastRefresh  time.Time
}

// New creates a cache. Call Refresh once before Resolve; Refresh is also
// triggered automatically when a tag is unknown and the TTL has elapsed.
func New(refreshEvery time.Duration) *Cache {
	if refreshEvery <= 0 {
		refreshEvery = 5 * time.Minute
	}
	return &Cache{
		byName:       make(map[string]int),
		refreshEvery: refreshEvery,
	}
}

// Refresh reloads category rows from SQLite.
func (c *Cache) Refresh(db *sql.DB) error {
	rows, err := db.Query(`SELECT id, name FROM category WHERE name IS NOT NULL AND name != ''`)
	if err != nil {
		return err
	}
	defer rows.Close()

	next := make(map[string]int)
	for rows.Next() {
		var id int
		var name string
		if err := rows.Scan(&id, &name); err != nil {
			return err
		}
		next[strings.ToLower(strings.TrimSpace(name))] = id
	}
	if err := rows.Err(); err != nil {
		return err
	}

	c.mu.Lock()
	c.byName = next
	c.lastRefresh = time.Now()
	c.mu.Unlock()
	return nil
}

// Resolve returns the first tag that matches a category name, or nil.
func (c *Cache) Resolve(tags []string, db *sql.DB) *int {
	if len(tags) == 0 {
		return nil
	}

	c.mu.RLock()
	id := c.lookupLocked(tags)
	stale := time.Since(c.lastRefresh) >= c.refreshEvery
	c.mu.RUnlock()
	if id != nil {
		return id
	}
	if !stale || db == nil {
		return nil
	}

	if err := c.Refresh(db); err != nil {
		log.Printf("category cache refresh: %v", err)
		return nil
	}

	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.lookupLocked(tags)
}

func (c *Cache) lookupLocked(tags []string) *int {
	for _, tag := range tags {
		key := strings.ToLower(strings.TrimSpace(tag))
		if key == "" {
			continue
		}
		if id, ok := c.byName[key]; ok {
			v := id
			return &v
		}
	}
	return nil
}
