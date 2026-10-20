package metric

import (
	"fmt"
	"net"
	"strings"
	"time"

	"capy-metrics/pb"
)

// Metric is one DNS event ready for sinks (matches the metric DB table).
type Metric struct {
	Timestamp     time.Time
	ClientIP      string
	Domain        string
	QueryType     *string
	Protocol      *string
	Blocked       bool
	CategoryID    *int
	AppliedPolicy *string
	Tags          []string // raw policy tags (category names from Lua)
}

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

// FromProtobuf maps a PowerDNS PBDNSMessage into a Metric.
// CategoryID is left nil; resolve tags via category cache after this call.
func FromProtobuf(msg *pb.PBDNSMessage) Metric {
	var timestamp time.Time
	if timeSec := msg.GetTimeSec(); timeSec > 0 {
		timestamp = time.Unix(int64(timeSec), int64(msg.GetTimeUsec())*1000)
	} else {
		timestamp = time.Now()
	}

	clientIP := "N/A"
	if fromBytes := msg.GetFrom(); len(fromBytes) > 0 {
		family := msg.GetSocketFamily()
		if family == 0 {
			family = pb.PBDNSMessage_INET
		}
		clientIP = formatIP(fromBytes, family)
	}

	domain := "N/A"
	if question := msg.GetQuestion(); question != nil {
		domain = strings.TrimSuffix(question.GetQName(), ".")
		if domain == "" {
			domain = "N/A"
		}
	}

	var queryType *string
	if question := msg.GetQuestion(); question != nil && question.GetQType() > 0 {
		qtype := formatDNSType(question.GetQType())
		queryType = &qtype
	}

	var protocol *string
	if p := msg.GetSocketProtocol(); p != 0 {
		s := formatProtocol(p)
		protocol = &s
	}

	blocked := false
	var appliedPolicy *string
	var tags []string
	if response := msg.GetResponse(); response != nil {
		if name := response.GetAppliedPolicy(); name != "" {
			blocked = true
			appliedPolicy = &name
		}
		tags = append(tags, response.GetTags()...)
	}

	return Metric{
		Timestamp:     timestamp,
		ClientIP:      clientIP,
		Domain:        domain,
		QueryType:     queryType,
		Protocol:      protocol,
		Blocked:       blocked,
		AppliedPolicy: appliedPolicy,
		Tags:          tags,
	}
}

// IsLocalhostFrom reports whether the message From address is 127.0.0.1.
func IsLocalhostFrom(msg *pb.PBDNSMessage) bool {
	fromBytes := msg.GetFrom()
	if len(fromBytes) == 4 {
		return net.IP(fromBytes).Equal(net.IPv4(127, 0, 0, 1))
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
	return net.IP(ipBytes).String()
}

func formatProtocol(protocol pb.PBDNSMessage_SocketProtocol) string {
	if name, ok := protocolNames[protocol]; ok {
		return name
	}
	return "Unknown"
}

func formatDNSType(qtype uint32) string {
	if name, ok := dnsTypeNames[qtype]; ok {
		return name
	}
	return fmt.Sprintf("TYPE%d", qtype)
}
