package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"capy-metrics/internal/cleanup"
	"capy-metrics/internal/listen"
	"capy-metrics/internal/metric"
	"capy-metrics/internal/sink"
	"capy-metrics/pb"

	"google.golang.org/protobuf/proto"
)

const version = "0.1.0"

func main() {
	log.SetFlags(log.LstdFlags | log.Lmsgprefix)
	log.SetPrefix("collector: ")

	if len(os.Args) < 2 {
		printRootHelp()
		os.Exit(2)
	}

	switch os.Args[1] {
	case "listen":
		os.Exit(cmdListen(os.Args[2:]))
	case "cleanup":
		os.Exit(cmdCleanup(os.Args[2:]))
	case "selftest":
		os.Exit(cmdSelftest(os.Args[2:]))
	case "version", "--version", "-V":
		fmt.Println(version)
	case "help", "--help", "-h":
		printRootHelp()
	default:
		fmt.Fprintf(os.Stderr, "unknown command %q\n\n", os.Args[1])
		printRootHelp()
		os.Exit(2)
	}
}

func printRootHelp() {
	fmt.Fprintf(os.Stderr, `DNS metrics collector for PowerDNS protobuf logs.

Usage:
  collector <command> [flags]

Commands:
  listen     Run the TCP protobuf collector
  cleanup    Delete metric rows older than N days
  selftest   Decode a synthetic protobuf message (no network)
  version    Print version
  help       Show this help

Run "collector <command> --help" for command flags.
`)
}

func cmdListen(args []string) int {
	fs := flag.NewFlagSet("listen", flag.ExitOnError)
	listenAddr := fs.String("listen", "0.0.0.0:6000", "TCP listen address")
	dbPath := fs.String("db-path", "/var/capy/database/database.db", "SQLite database path")
	sinks := fs.String("sink", "sqlite", "Comma-separated sinks: sqlite,json,text")
	dryRun := fs.Bool("dry-run", false, "Decode and count; skip SQLite writes")
	filterLocalhost := fs.Bool("filter-localhost", true, "Drop messages from 127.0.0.1")
	debug := fs.Bool("debug", false, "Verbose logging")
	bufferSize := fs.Int("buffer-size", 10000, "Per-sink channel buffer size")
	batchSize := fs.Int("batch-size", 500, "SQLite insert batch size")
	flushInterval := fs.Duration("flush-interval", 5*time.Second, "SQLite flush interval")
	statsInterval := fs.Duration("stats-interval", time.Minute, "Log counters periodically (0 disables)")
	categoryRefresh := fs.Duration("category-refresh", 5*time.Minute, "Category name→id cache TTL")
	_ = fs.Bool("daemon", false, "Reserved: prefer supervisord; process stays in foreground")

	fs.Usage = func() {
		fmt.Fprintf(os.Stderr, `Usage: collector listen [flags]

Run the PowerDNS protobuf TCP collector. Prefer DNSResponse messages so
policy tags from capy.lua (capy-blocked / capy-deny / category) are available.

`)
		fs.PrintDefaults()
	}
	_ = fs.Parse(args)

	cfg := sink.Config{
		DBPath:        *dbPath,
		BufferSize:    *bufferSize,
		BatchSize:     *batchSize,
		FlushInterval: *flushInterval,
		DryRun:        *dryRun,
	}
	for _, s := range strings.Split(*sinks, ",") {
		switch strings.ToLower(strings.TrimSpace(s)) {
		case "sqlite":
			cfg.SQLite = true
		case "json":
			cfg.JSON = true
		case "text":
			cfg.Text = true
		case "":
		default:
			fmt.Fprintf(os.Stderr, "unknown sink %q (want sqlite,json,text)\n", s)
			return 2
		}
	}
	if !cfg.Text && !cfg.JSON && !cfg.SQLite {
		fmt.Fprintln(os.Stderr, "no sinks enabled; use --sink sqlite,json,text")
		return 2
	}
	// Dry-run disables SQLite workers; ensure something observes traffic.
	if cfg.DryRun && !cfg.Text && !cfg.JSON {
		cfg.Text = true
		log.Printf("dry-run: enabling text sink so decoded metrics are visible")
	}

	err := listen.Run(listen.Options{
		Addr:            *listenAddr,
		FilterLocalhost: *filterLocalhost,
		Debug:           *debug,
		StatsInterval:   *statsInterval,
		CategoryRefresh: *categoryRefresh,
		Sink:            cfg,
	})
	if err != nil {
		log.Printf("%v", err)
		return 1
	}
	return 0
}

func cmdCleanup(args []string) int {
	fs := flag.NewFlagSet("cleanup", flag.ExitOnError)
	days := fs.Int("days", 30, "Keep metrics newer than this many days")
	dbPath := fs.String("db-path", "/var/capy/database/database.db", "SQLite database path")
	dryRun := fs.Bool("dry-run", false, "Only report how many rows would be deleted")
	fs.Usage = func() {
		fmt.Fprintf(os.Stderr, "Usage: collector cleanup [flags]\n\n")
		fs.PrintDefaults()
	}
	_ = fs.Parse(args)

	res, err := cleanup.Run(*dbPath, *days, *dryRun)
	if err != nil {
		log.Printf("%v", err)
		return 1
	}
	if *dryRun {
		fmt.Printf("dry-run: %d metric(s) older than %s would be deleted\n",
			res.Count, res.Cutoff.Format(time.RFC3339))
	} else {
		fmt.Printf("deleted %d metric(s) older than %s (matched %d)\n",
			res.Deleted, res.Cutoff.Format(time.RFC3339), res.Count)
	}
	return 0
}

func cmdSelftest(args []string) int {
	fs := flag.NewFlagSet("selftest", flag.ExitOnError)
	fs.Usage = func() {
		fmt.Fprintf(os.Stderr, "Usage: collector selftest\n\nBuilds a synthetic PBDNSMessage and checks mapping.\n")
		fs.PrintDefaults()
	}
	_ = fs.Parse(args)

	qname := "ads.example.com."
	msg := &pb.PBDNSMessage{
		Type:           pb.PBDNSMessage_DNSResponseType.Enum(),
		SocketFamily:   pb.PBDNSMessage_INET.Enum(),
		SocketProtocol: pb.PBDNSMessage_UDP.Enum(),
		From:           []byte{192, 168, 1, 10},
		TimeSec:        proto.Uint32(uint32(time.Now().Unix())),
		Question: &pb.PBDNSMessage_DNSQuestion{
			QName: &qname,
			QType: proto.Uint32(1),
		},
		Response: &pb.PBDNSMessage_DNSResponse{
			Tags: []string{"capy-blocked", "ads"},
		},
	}

	raw, err := proto.Marshal(msg)
	if err != nil {
		log.Printf("marshal: %v", err)
		return 1
	}
	var round pb.PBDNSMessage
	if err := proto.Unmarshal(raw, &round); err != nil {
		log.Printf("unmarshal: %v", err)
		return 1
	}

	m := metric.FromProtobuf(&round)
	if !m.Blocked {
		log.Printf("expected blocked=true")
		return 1
	}
	if m.AppliedPolicy == nil || *m.AppliedPolicy != "capy-blocked" {
		log.Printf("unexpected applied_policy: %v", m.AppliedPolicy)
		return 1
	}
	if m.Domain != "ads.example.com" {
		log.Printf("unexpected domain: %s", m.Domain)
		return 1
	}
	if m.ClientIP != "192.168.1.10" {
		log.Printf("unexpected client_ip: %s", m.ClientIP)
		return 1
	}
	if len(m.Tags) != 2 || m.Tags[0] != "capy-blocked" || m.Tags[1] != "ads" {
		log.Printf("unexpected tags: %v", m.Tags)
		return 1
	}
	fmt.Println("selftest ok")
	return 0
}
