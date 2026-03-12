import apiConfig from '../config';
import { getErrorMessage } from '../utils/errorHandler';
import type { ApiResponse } from './generated/models';

/**
 * Custom fetch instance with base URL and error handling.
 * Returns { status, data, headers } on success.
 * Throws Error on HTTP errors or when API returns success: false (so TanStack Query mutations get isError/error).
 */
export const fetchApi = async <T>(
    url: string,
    options: RequestInit = {}
): Promise<T> => {
    const baseUrl = apiConfig.apiUrl.replace(/\/+$/, '');
    const path = url.startsWith('/') ? url : `/${url}`;
    const fullUrl = `${baseUrl}${path}`;

    const response = await fetch(fullUrl, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    let data: unknown;
    try {
        data = await response.json();
    } catch {
        data = { message: `HTTP error: ${response.status}`, status: response.status };
    }

    if (!response.ok) {
        const message = getErrorMessage(data as ApiResponse, `Request failed (${response.status})`);
        throw new Error(message);
    }

    if (data && typeof data === 'object' && 'success' in data && (data as { success?: boolean }).success === false) {
        const message = getErrorMessage(data as ApiResponse, 'Request failed');
        throw new Error(message);
    }

    return {
        status: response.status,
        data,
        headers: response.headers,
    } as T;
};

export default fetchApi;

