import type { ApiResponse } from '../api/generated/models';

function formatFastApiDetail(detail: unknown): string | null {
    if (typeof detail === 'string') {
        return detail;
    }
    if (Array.isArray(detail)) {
        return detail
            .map((entry) => {
                if (typeof entry === 'object' && entry !== null && 'msg' in entry) {
                    return String((entry as { msg: unknown }).msg);
                }
                return String(entry);
            })
            .join(', ');
    }
    if (detail !== undefined && detail !== null) {
        return String(detail);
    }
    return null;
}

/**
 * Extract error message from an API error response body.
 * Supports FastAPI HTTP errors ({ detail }) and ApiResponse envelopes ({ success, message, data }).
 */
export function getErrorMessage(
    errorBody: unknown,
    defaultMessage: string = 'An error occurred'
): string {
    if (!errorBody || typeof errorBody !== 'object') {
        return defaultMessage;
    }

    const body = errorBody as Record<string, unknown>;

    if ('detail' in body) {
        return formatFastApiDetail(body.detail) ?? defaultMessage;
    }

    if ('success' in body && body.success === false) {
        const apiResponse = body as ApiResponse;
        const message = apiResponse.message || defaultMessage;
        const nestedDetail = (apiResponse.data as { detail?: string } | undefined)?.detail;
        if (nestedDetail) {
            return `${message}: ${nestedDetail}`;
        }
        return message;
    }

    if (typeof body.message === 'string') {
        return body.message;
    }

    return defaultMessage;
}

/**
 * Extract error message and detail separately.
 */
export function getErrorDetails(
    errorBody: unknown,
    defaultMessage: string = 'An error occurred'
): { message: string; detail: string | null } {
    if (!errorBody || typeof errorBody !== 'object') {
        return { message: defaultMessage, detail: null };
    }

    const body = errorBody as Record<string, unknown>;

    if ('detail' in body) {
        const detail = formatFastApiDetail(body.detail);
        return { message: detail ?? defaultMessage, detail };
    }

    if ('success' in body && body.success === false) {
        const apiResponse = body as ApiResponse;
        const message = apiResponse.message || defaultMessage;
        const detail = (apiResponse.data as { detail?: string } | undefined)?.detail ?? null;
        return { message, detail };
    }

    if (typeof body.message === 'string') {
        return { message: body.message, detail: null };
    }

    return { message: defaultMessage, detail: null };
}
