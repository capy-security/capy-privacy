/**
 * Client model interface
 * Based on the DNS Client database model
 */
export interface Client {
    id?: number;
    ip: string; // Required - IP address (IPv4 or IPv6)
    name?: string | null; // Optional - Client name/identifier
    description?: string | null; // Optional - Client description
    [key: string]: unknown; // Allow for additional fields
}

/**
 * Client form data for creation/update
 */
export interface ClientFormData {
    ip: string;
    name?: string;
    description?: string;
}

