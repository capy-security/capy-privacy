package metric

import (
	"testing"

	"capy-metrics/pb"

	"google.golang.org/protobuf/proto"
)

func TestFromProtobufBlockedWithTags(t *testing.T) {
	qname := "tracker.example."
	msg := &pb.PBDNSMessage{
		Type:           pb.PBDNSMessage_DNSResponseType.Enum(),
		SocketFamily:   pb.PBDNSMessage_INET.Enum(),
		SocketProtocol: pb.PBDNSMessage_UDP.Enum(),
		From:           []byte{10, 0, 0, 2},
		TimeSec:        proto.Uint32(1700000000),
		Question: &pb.PBDNSMessage_DNSQuestion{
			QName: &qname,
			QType: proto.Uint32(1),
		},
		Response: &pb.PBDNSMessage_DNSResponse{
			Tags: []string{"capy-blocked", "malwares"},
		},
	}

	m := FromProtobuf(msg)
	if !m.Blocked {
		t.Fatal("expected blocked")
	}
	if m.AppliedPolicy == nil || *m.AppliedPolicy != "capy-blocked" {
		t.Fatalf("applied_policy: %v", m.AppliedPolicy)
	}
	if m.Domain != "tracker.example" {
		t.Fatalf("domain: %s", m.Domain)
	}
	if m.ClientIP != "10.0.0.2" {
		t.Fatalf("client_ip: %s", m.ClientIP)
	}
	if len(m.Tags) != 2 || m.Tags[0] != "capy-blocked" || m.Tags[1] != "malwares" {
		t.Fatalf("tags: %v", m.Tags)
	}
	if m.QueryType == nil || *m.QueryType != "A" {
		t.Fatalf("query_type: %v", m.QueryType)
	}
}

func TestFromProtobufDenyTag(t *testing.T) {
	qname := "example.com."
	msg := &pb.PBDNSMessage{
		Type:         pb.PBDNSMessage_DNSResponseType.Enum(),
		SocketFamily: pb.PBDNSMessage_INET.Enum(),
		From:         []byte{10, 0, 0, 4},
		Question:     &pb.PBDNSMessage_DNSQuestion{QName: &qname, QType: proto.Uint32(1)},
		Response:     &pb.PBDNSMessage_DNSResponse{Tags: []string{"capy-deny"}},
	}
	m := FromProtobuf(msg)
	if !m.Blocked {
		t.Fatal("expected blocked")
	}
	if m.AppliedPolicy == nil || *m.AppliedPolicy != "capy-deny" {
		t.Fatalf("applied_policy: %v", m.AppliedPolicy)
	}
}

func TestFromProtobufIgnoresAppliedPolicyField(t *testing.T) {
	// Legacy RPZ field must not mark blocked; only reserved tags do.
	policy := "capy-blocked"
	qname := "legacy.example."
	msg := &pb.PBDNSMessage{
		Type:         pb.PBDNSMessage_DNSResponseType.Enum(),
		SocketFamily: pb.PBDNSMessage_INET.Enum(),
		From:         []byte{10, 0, 0, 5},
		Question:     &pb.PBDNSMessage_DNSQuestion{QName: &qname, QType: proto.Uint32(1)},
		Response: &pb.PBDNSMessage_DNSResponse{
			AppliedPolicy: &policy,
			Tags:          []string{"ads"},
		},
	}
	m := FromProtobuf(msg)
	if m.Blocked {
		t.Fatal("expected not blocked when only AppliedPolicy is set")
	}
	if m.AppliedPolicy != nil {
		t.Fatalf("expected nil policy, got %v", m.AppliedPolicy)
	}
}

func TestFromProtobufAllowed(t *testing.T) {
	qname := "ok.example."
	msg := &pb.PBDNSMessage{
		Type:         pb.PBDNSMessage_DNSResponseType.Enum(),
		SocketFamily: pb.PBDNSMessage_INET.Enum(),
		From:         []byte{10, 0, 0, 3},
		Question:     &pb.PBDNSMessage_DNSQuestion{QName: &qname, QType: proto.Uint32(1)},
		Response:     &pb.PBDNSMessage_DNSResponse{},
	}
	m := FromProtobuf(msg)
	if m.Blocked {
		t.Fatal("expected not blocked")
	}
	if m.AppliedPolicy != nil {
		t.Fatalf("expected nil policy, got %v", m.AppliedPolicy)
	}
}
