/**
 * User model interface
 * Based on the User database model
 */
export interface User {
    id?: number;
    display_name: string; // Required - User display name
    email: string; // Required - User email
    password?: string; // Optional - Password (only for create/update)
    role: number; // Required - User role (0=SUPERADMIN, 1=ADMIN, 2=USER)
    [key: string]: unknown; // Allow for additional fields
}

/**
 * User form data for creation/update
 */
export interface UserFormData {
    display_name: string;
    email: string;
    password?: string;
    role: number;
}

