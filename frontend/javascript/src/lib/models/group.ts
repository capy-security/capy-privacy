/**
 * Group model interface
 * Based on the DNS Group database model
 * Groups are used to match client hosts with DNS filtered categories
 */
export interface Group {
    id?: number;
    name?: string | null; // Optional - Group name
    categories_ids?: number[] | null; // Array of category IDs
    clients_ids?: number[] | null; // Array of client IDs
    // [key: string]: unknown; // Allow for additional fields
}

/**
 * Group form data for creation/update
 */
export interface GroupFormData {
    name?: string;
    categories_ids?: number[];
    clients_ids?: number[];
}

