package main

import (
	"database/sql"
	"encoding/binary"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net"
	"os"
	"strings"
	"sync"
	"time"

	"capy-metrics/pb"
	"google.golang.org/protobuf/proto"
	_ "modernc.org/sqlite"
)

var debugMode = false
var filterLocalhost = true // Filter out messages from/to 127.0.0.1

// Output configuration
type OutputConfig struct {
	Text    bool
	JSON    bool
	SQLite  bool
	DBPath  string
}

var outputConfig = OutputConfig{
	Text:   false, // Disabled by default, must be explicitly enabled
	JSON:   false, // Disabled by default, must be explicitly enabled
	SQLite: false, // Disabled by default, must be explicitly enabled
	DBPath: "/var/capy/database/database.db",
}

// Metric struct matching the database schema
type Metric struct {
	Timestamp  time.Time
	ClientIP   string
	Domain     string
	QueryType  *string
	Protocol   *string
	Blocked    bool
	CategoryID *int
}

// jsonMetric is the JSON-serializable shape for one metric line (one object per line, no indent).
type jsonMetric struct {
	Timestamp  string  `json:"timestamp"`
	ClientIP   string  `json:"client_ip"`
	Domain     string  `json:"domain"`
	QueryType  *string `json:"query_type,omitempty"`
	Protocol   *string `json:"protocol,omitempty"`
	Blocked    bool    `json:"blocked"`
	CategoryID *int    `json:"category_id,omitempty"`
}

// Queues for each output type (fan-out pattern)
var textQueue = make(chan Metric, 1000)   // Buffer up to 1000 metrics
var jsonQueue = make(chan Metric, 1000)   // Buffer up to 1000 metrics
var sqliteQueue = make(chan Metric, 1000) // Buffer up to 1000 metrics

var protocolNames = map[pb.PBDNSMessage_SocketProtocol]string{
	pb.PBDNSMessage_UDP:         "UDP",
	pb.PBDNSMessage_TCP:         "TCP",
	pb.PBDNSMessage_DOT:         "DoT",
	pb.PBDNSMessage_DOH:         "DoH",
	pb.PBDNSMessage_DNSCryptUDP: "DNSCrypt-UDP",
	pb.PBDNSMessage_DNSCryptTCP: "DNSCrypt-TCP",
	pb.PBDNSMessage_DOQ:         "DoQ",
}

var dnsTypeNames = map[uint32]string{
	1: "A", 2: "NS", 5: "CNAME", 6: "SOA",
	15: "MX", 16: "TXT", 28: "AAAA", 33: "SRV",
}

func shouldFilterMessage(msg *pb.PBDNSMessage) bool {
	// Only filter if "from" address is 127.0.0.1 (recursor talking to root servers)
	fromBytes := msg.GetFrom()
	if len(fromBytes) == 4 {
		fromIP := net.IP(fromBytes)
		if fromIP.Equal(net.IPv4(127, 0, 0, 1)) {
			return true
		}
	}

	return false
}

func formatIP(ipBytes []byte, family pb.PBDNSMessage_SocketFamily) string {
	if len(ipBytes) == 0 {
		return "N/A"
	}

	if family == pb.PBDNSMessage_INET && len(ipBytes) == 4 {
		return net.IP(ipBytes).String()
	}
	if family == pb.PBDNSMessage_INET6 && len(ipBytes) == 16 {
		return net.IP(ipBytes).String()
	}
	return fmt.Sprintf("<%x>", ipBytes)
}

func formatProtocol(protocol pb.PBDNSMessage_SocketProtocol) string {
	if name, ok := protocolNames[protocol]; ok {
		return name
	}
	return fmt.Sprintf("Unknown(%d)", protocol)
}

func formatDNSType(qtype uint32) string {
	if name, ok := dnsTypeNames[qtype]; ok {
		return name
	}
	return fmt.Sprintf("TYPE%d", qtype)
}

// Convert protobuf message to Metric struct
func protobufToMetric(msg *pb.PBDNSMessage) Metric {
	// Get timestamp
	var timestamp time.Time
	if timeSec := msg.GetTimeSec(); timeSec > 0 {
		timeUsec := msg.GetTimeUsec()
		timestamp = time.Unix(int64(timeSec), int64(timeUsec)*1000)
	} else {
		timestamp = time.Now()
	}

	// Get client IP
	clientIP := "N/A"
	if fromBytes := msg.GetFrom(); len(fromBytes) > 0 {
		family := msg.GetSocketFamily()
		if family == 0 {
			family = pb.PBDNSMessage_INET
		}
		clientIP = formatIP(fromBytes, family)
	}

	// Get domain (remove trailing dot)
	domain := "N/A"
	if question := msg.GetQuestion(); question != nil {
		domain = question.GetQName()
		// Remove trailing dot
		domain = strings.TrimSuffix(domain, ".")
	}

	// Get query type
	var queryType *string
	if question := msg.GetQuestion(); question != nil && question.GetQType() > 0 {
		qtype := formatDNSType(question.GetQType())
		queryType = &qtype
	}

	// Get protocol
	var protocol *string
	if proto := msg.GetSocketProtocol(); proto != 0 {
		protoStr := formatProtocol(proto)
		protocol = &protoStr
	}

	// Blocked status - check if response has applied policy
	blocked := false
	var categoryID *int
	if response := msg.GetResponse(); response != nil {
		if response.GetAppliedPolicy() != "" {
			blocked = true
			// Note: category_id would need to be looked up from the policy name
			// For now, we'll leave it as nil
		}
	}

	return Metric{
		Timestamp:  timestamp,
		ClientIP:   clientIP,
		Domain:     domain,
		QueryType:  queryType,
		Protocol:   protocol,
		Blocked:    blocked,
		CategoryID: categoryID,
	}
}

// Text output worker
func textOutputWorker(wg *sync.WaitGroup) {
	defer wg.Done()
	
	for metric := range textQueue {

		fmt.Println(strings.Repeat("=", 80))
		fmt.Printf("Timestamp: %s\n", metric.Timestamp.Format("2006-01-02 15:04:05.000000"))
		fmt.Printf("Client IP: %s\n", metric.ClientIP)
		fmt.Printf("Domain: %s\n", metric.Domain)
		if metric.QueryType != nil {
			fmt.Printf("Query Type: %s\n", *metric.QueryType)
		}
		if metric.Protocol != nil {
			fmt.Printf("Protocol: %s\n", *metric.Protocol)
		}
		fmt.Printf("Blocked: %v\n", metric.Blocked)
		if metric.CategoryID != nil {
			fmt.Printf("Category ID: %d\n", *metric.CategoryID)
		}
		fmt.Println(strings.Repeat("=", 80))
		fmt.Println()
	}
}

// JSON output worker (one JSON object per line, no indent)
func jsonOutputWorker(wg *sync.WaitGroup) {
	defer wg.Done()

	encoder := json.NewEncoder(os.Stdout)
	for metric := range jsonQueue {
		j := jsonMetric{
			Timestamp:  metric.Timestamp.Format(time.RFC3339Nano),
			ClientIP:   metric.ClientIP,
			Domain:     metric.Domain,
			QueryType:  metric.QueryType,
			Protocol:   metric.Protocol,
			Blocked:    metric.Blocked,
			CategoryID: metric.CategoryID,
		}
		if err := encoder.Encode(j); err != nil {
			log.Printf("Error encoding JSON: %v", err)
		}
	}
}

// SQLite output worker with batch inserts (multi-row INSERT per batch)
func sqliteOutputWorker(wg *sync.WaitGroup) {
	defer wg.Done()

	db, err := sql.Open("sqlite", outputConfig.DBPath+"?_journal_mode=WAL")
	if err != nil {
		log.Printf("Error opening database: %v", err)
		return
	}
	defer db.Close()

	var tableName string
	err = db.QueryRow("SELECT name FROM sqlite_master WHERE type='table' AND name='metric'").Scan(&tableName)
	if err != nil {
		if err == sql.ErrNoRows {
			log.Fatalf("Error: 'metric' table does not exist in database. Please ensure the Python API has created the database schema.")
		}
		log.Fatalf("Error checking for metric table: %v", err)
		return
	}

	batchSize := 500
	batch := make([]Metric, 0, batchSize)
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case metric, ok := <-sqliteQueue:
			if !ok {
				if len(batch) > 0 {
					insertBatch(db, batch)
				}
				return
			}
			batch = append(batch, metric)
			if len(batch) >= batchSize {
				if err := insertBatch(db, batch); err != nil {
					log.Printf("Error inserting batch: %v", err)
				}
				batch = batch[:0]
			}
		case <-ticker.C:
			if len(batch) > 0 {
				if err := insertBatch(db, batch); err != nil {
					log.Printf("Error inserting batch: %v", err)
				}
				batch = batch[:0]
			}
		}
	}
}

func insertBatch(db *sql.DB, batch []Metric) error {
	if len(batch) == 0 {
		return nil
	}
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Multi-row INSERT: VALUES (?,?,?,?,?,?,?), (?,?,?,?,?,?,?), ...
	const rowPlaceholders = "(?,?,?,?,?,?,?)"
	var b strings.Builder
	b.WriteString("INSERT INTO metric (timestamp, client_ip, domain, query_type, protocol, blocked, category_id) VALUES ")
	for i := 0; i < len(batch); i++ {
		if i > 0 {
			b.WriteString(",")
		}
		b.WriteString(rowPlaceholders)
	}
	args := make([]interface{}, 0, 7*len(batch))
	for _, m := range batch {
		var catID interface{}
		if m.CategoryID != nil {
			catID = *m.CategoryID
		}
		args = append(args,
			m.Timestamp.UTC().Format(time.RFC3339Nano),
			m.ClientIP,
			m.Domain,
			m.QueryType,
			m.Protocol,
			m.Blocked,
			catID,
		)
	}
	_, err = tx.Exec(b.String(), args...)
	if err != nil {
		return err
	}
	return tx.Commit()
}

func readMessage(conn net.Conn) ([]byte, error) {
	// PowerDNS uses a 2-byte big-endian length prefix (uint16) followed by the protobuf message
	// Format: [2-byte length][protobuf message data]
	// Reference: https://github.com/dmachard/pdns-protobuf-receiver/blob/master/pdns_protobuf_receiver/protobuf.py

	// Use a long timeout for initial read - PowerDNS opens connections that may be idle
	conn.SetReadDeadline(time.Now().Add(5 * time.Minute))

	// Read 2-byte length prefix (big-endian uint16)
	var lengthBytes [2]byte
	n, err := io.ReadFull(conn, lengthBytes[:])
	if err != nil {
		if debugMode {
			log.Printf("[DEBUG] Failed to read length prefix: read %d bytes, error: %v", n, err)
		}
		return nil, err
	}

	messageLength := binary.BigEndian.Uint16(lengthBytes[:])
	if debugMode {
		log.Printf("[DEBUG] Read length prefix: %d bytes, hex: %s", n, hex.EncodeToString(lengthBytes[:]))
		log.Printf("[DEBUG] Decoded message length: %d bytes", messageLength)
	}

	if messageLength == 0 {
		return nil, fmt.Errorf("invalid message length: 0")
	}

	// Now read the actual protobuf message
	conn.SetReadDeadline(time.Now().Add(5 * time.Second))
	messageData := make([]byte, messageLength)
	n, err = io.ReadFull(conn, messageData)
	if err != nil {
		if debugMode {
			log.Printf("[DEBUG] Failed to read message data: read %d/%d bytes, error: %v", n, messageLength, err)
		}
		return nil, err
	}

	if debugMode {
		log.Printf("[DEBUG] Read message data: %d bytes", n)
		if n <= 256 {
			log.Printf("[DEBUG] Message data (hex): %s", hex.EncodeToString(messageData))
		} else {
			log.Printf("[DEBUG] Message data (hex, first 256 bytes): %s...", hex.EncodeToString(messageData[:256]))
		}
	}

	// Reset deadline after successful read
	conn.SetReadDeadline(time.Time{})
	return messageData, nil
}

func handleConnection(conn net.Conn) {
	defer conn.Close()
	clientAddr := conn.RemoteAddr()
	log.Printf("[%s] New connection from %s", time.Now().Format("2006-01-02 15:04:05"), clientAddr)

	for {
		messageData, err := readMessage(conn)
		if err != nil {
			// EOF and timeout are normal for idle connections that PowerDNS opens but doesn't use
			// Only log unexpected errors
			if err != io.EOF {
				// Check if it's a timeout error (expected for idle connections)
				if netErr, ok := err.(net.Error); ok && netErr.Timeout() {
					if debugMode {
						log.Printf("[DEBUG] Connection timeout (idle connection) from %s", clientAddr)
					}
					// Timeout is expected for idle connections, don't log it
					break
				}
				log.Printf("Error reading message from %s: %v", clientAddr, err)
			} else if debugMode {
				log.Printf("[DEBUG] EOF from %s (connection closed)", clientAddr)
			}
			break
		}

		if debugMode {
			log.Printf("[DEBUG] Attempting to parse protobuf message (%d bytes)", len(messageData))
		}

		var msg pb.PBDNSMessage
		err = proto.Unmarshal(messageData, &msg)
		if err != nil {
			log.Printf("Error parsing protobuf message from %s: %v", clientAddr, err)
			if debugMode {
				log.Printf("[DEBUG] Message data length: %d bytes", len(messageData))
				log.Printf("[DEBUG] Raw message data (hex, first 200 bytes): %s", hex.EncodeToString(messageData[:min(200, len(messageData))]))
			}
			continue
		}

		if debugMode {
			log.Printf("[DEBUG] Successfully parsed protobuf message, type: %v", msg.GetType())
		}

		// Only emit client-facing metrics (skip recursor outgoing/incoming)
		switch msg.GetType() {
		case pb.PBDNSMessage_DNSQueryType, pb.PBDNSMessage_DNSResponseType:
			// continue to process
		default:
			continue
		}

		// Filter out localhost messages if enabled
		if filterLocalhost && shouldFilterMessage(&msg) {
			if debugMode {
				log.Printf("[DEBUG] Filtered out localhost message")
			}
			continue
		}

		// Convert to Metric and send to all enabled output queues (fan-out)
		metric := protobufToMetric(&msg)
		
		// Send to text queue if enabled
		if outputConfig.Text {
			select {
			case textQueue <- metric:
				// Successfully queued
			default:
				log.Printf("Warning: text queue is full, dropping metric")
			}
		}
		
		// Send to JSON queue if enabled
		if outputConfig.JSON {
			select {
			case jsonQueue <- metric:
				// Successfully queued
			default:
				log.Printf("Warning: JSON queue is full, dropping metric")
			}
		}
		
		// Send to SQLite queue if enabled
		if outputConfig.SQLite {
			select {
			case sqliteQueue <- metric:
				// Successfully queued
			default:
				log.Printf("Warning: SQLite queue is full, dropping metric")
			}
		}
	}

	log.Printf("[%s] Connection from %s closed", time.Now().Format("2006-01-02 15:04:05"), clientAddr)
}

func main() {
	host := "0.0.0.0"
	port := "6000"

	// Check for flags
	args := os.Args[1:]
	for i := 0; i < len(args); i++ {
		arg := args[i]
		if arg == "--debug" || arg == "-d" {
			debugMode = true
			args = append(args[:i], args[i+1:]...)
			i-- // Adjust index after removal
		} else if arg == "--no-filter-localhost" || arg == "--include-localhost" {
			filterLocalhost = false
			args = append(args[:i], args[i+1:]...)
			i-- // Adjust index after removal
		} else if arg == "--output-text" {
			outputConfig.Text = true
			args = append(args[:i], args[i+1:]...)
			i--
		} else if arg == "--output-json" {
			outputConfig.JSON = true
			args = append(args[:i], args[i+1:]...)
			i--
		} else if arg == "--output-sqlite" {
			outputConfig.SQLite = true
			args = append(args[:i], args[i+1:]...)
			i--
		} else if strings.HasPrefix(arg, "--db-path=") {
			outputConfig.DBPath = strings.TrimPrefix(arg, "--db-path=")
			args = append(args[:i], args[i+1:]...)
			i--
		}
	}

	if len(args) > 0 {
		port = args[0]
	}
	if len(args) > 1 {
		host = args[0]
		port = args[1]
	}

	if debugMode {
		log.Println("[DEBUG] Debug mode enabled - verbose logging active")
	}

	// Start output workers
	var wg sync.WaitGroup

	// Start text output worker
	if outputConfig.Text {
		wg.Add(1)
		go textOutputWorker(&wg)
		log.Println("Text output enabled")
	}

	// Start JSON output worker
	if outputConfig.JSON {
		wg.Add(1)
		go jsonOutputWorker(&wg)
		log.Println("JSON output enabled")
	}

	// Start SQLite output worker
	if outputConfig.SQLite {
		wg.Add(1)
		go sqliteOutputWorker(&wg)
		log.Printf("SQLite output enabled (database: %s)", outputConfig.DBPath)
	}

	// If no outputs are enabled, warn user
	if !outputConfig.Text && !outputConfig.JSON && !outputConfig.SQLite {
		log.Println("Warning: No outputs enabled! Use --output-text, --output-json, or --output-sqlite")
	}

	addr := net.JoinHostPort(host, port)
	listener, err := net.Listen("tcp", addr)
	if err != nil {
		log.Fatalf("Failed to listen on %s: %v", addr, err)
	}

	log.Printf("Starting TCP listener on %s", addr)
	log.Println("Waiting for connections...")
	fmt.Println()

	// Close queues when main exits (after all connections are closed)
	defer func() {
		if outputConfig.Text {
			close(textQueue)
		}
		if outputConfig.JSON {
			close(jsonQueue)
		}
		if outputConfig.SQLite {
			close(sqliteQueue)
		}
		wg.Wait()
	}()

	for {
		conn, err := listener.Accept()
		if err != nil {
			log.Printf("Error accepting connection: %v", err)
			continue
		}

		go handleConnection(conn)
	}
}
