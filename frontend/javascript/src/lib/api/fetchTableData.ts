import type { ApiResponse } from './generated/models';

export interface FetchTableDataResult<T> {
    items: T[];
    totalItems: number;
    message?: string;
}

/**
 * Parses the raw readObjectDnsTableGet response into { items, totalItems }.
 * Use in generated query's select option: createReadObjectDnsTableGet(..., () => ({ query: { select: (res) => parseTableResponse(res, ...) } })).
 */
export function parseTableResponse<T = unknown>(
    response: { status: number; data?: ApiResponse },
    options?: { itemsPerPage?: number; currentPage?: number }
): FetchTableDataResult<T> {
    const apiResponse = response.data;
    if (!apiResponse?.success || apiResponse.data === undefined) {
        return { items: [], totalItems: 0 };
    }
    let extractedTotal = 0;
    if (apiResponse.message) {
        const match = apiResponse.message.match(/\d+/);
        if (match) extractedTotal = parseInt(match[0], 10);
    }
    const responseData = apiResponse.data as any;
    let items: T[] = [];
    if (Array.isArray(responseData)) {
        items = responseData;
    } else if (responseData?.items && Array.isArray(responseData.items)) {
        items = responseData.items;
    } else if (responseData?.data && Array.isArray(responseData.data)) {
        items = responseData.data;
    } else if (responseData && typeof responseData === 'object') {
        const keys = Object.keys(responseData);
        const arrayKey = keys.find((k) => Array.isArray(responseData[k]));
        if (arrayKey) items = responseData[arrayKey];
    }
    const { itemsPerPage = 12, currentPage = 1 } = options ?? {};
    const totalItems =
        extractedTotal ||
        responseData?.total ||
        responseData?.total_count ||
        responseData?.count ||
        (items.length >= itemsPerPage ? (currentPage + 1) * itemsPerPage : currentPage * itemsPerPage);
    return { items, totalItems, message: apiResponse.message };
}
