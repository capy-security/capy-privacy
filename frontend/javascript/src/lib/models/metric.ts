/**
 * Metric model interface
 * Based on the DNS Metric database model
 */
export interface Metric {
    id?: number;
    timestamp: string; // ISO datetime string
    client_ip: string; // IP address of the client making the query
    domain: string; // The queried domain name
    query_type?: string | null; // DNS query type (A, AAAA, MX, etc.)
    protocol?: string | null; // Transport protocol (UDP, TCP, DoT, DoH, etc.)
    blocked: boolean; // Whether this query was blocked by the blacklist
    category_id?: number | null; // Reference to category table if domain was blocked
}

