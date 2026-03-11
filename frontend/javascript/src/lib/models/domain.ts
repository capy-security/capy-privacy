/**
 * Domain model interface
 * Based on the DNS Domain database model
 */
export interface Domain {
    id?: number;
    name: string; // Required - DNS domain name
    category_id: number; // Required - Reference to category table
    isactive: boolean; // Domain is active (default: true)
    ip: string; // IP where the domain will be redirected (default: "127.0.0.1")
}

/**
 * Domain form data for creation/update
 */
export interface DomainFormData {
    name: string;
    category_id: number;
    isactive: boolean;
    ip: string;
}

