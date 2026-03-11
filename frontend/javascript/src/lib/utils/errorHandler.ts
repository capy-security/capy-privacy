import type { ApiResponse } from '../api/generated/models';

/**
 * Extract error message from API response
 * Handles both message and detail fields from the API error response
 * Format: { success: false, message: "HTTP Exception", data: { detail: "Invalid or expired token" } }
 */
export function getErrorMessage(
    apiResponse: ApiResponse | null | undefined,
    defaultMessage: string = 'An error occurred'
): string {
    if (!apiResponse) {
        return defaultMessage;
    }

    const message = apiResponse.message || defaultMessage;
    const detail = (apiResponse.data as any)?.detail;

    if (detail) {
        return `${message}: ${detail}`;
    }

    return message;
}

/**
 * Extract error message and detail separately
 * Returns an object with both message and detail (if available)
 */
export function getErrorDetails(
    apiResponse: ApiResponse | null | undefined,
    defaultMessage: string = 'An error occurred'
): { message: string; detail: string | null } {
    if (!apiResponse) {
        return { message: defaultMessage, detail: null };
    }

    const message = apiResponse.message || defaultMessage;
    const detail = (apiResponse.data as any)?.detail || null;

    return { message, detail };
}

