/**
 * Category model interface
 * Based on the DNS Category database model
 */
export interface Category {
    id?: number;
    name?: string | null; // Optional - Category name
    description?: string | null; // Optional - Category description
    [key: string]: unknown; // Allow for additional fields
}

/**
 * Category form data for creation/update
 */
export interface CategoryFormData {
    name?: string;
    description?: string;
}

