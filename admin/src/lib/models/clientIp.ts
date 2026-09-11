export interface ClientIpEntry {
	client_ip: string;
	query_count: number;
	last_seen: string | null;
	first_seen: string | null;
	registered: boolean;
	client_id: number | null;
	client_name: string | null;
	blocked: boolean;
	block_reason?: string;
}

export interface ClientIpsResponse {
	clients: ClientIpEntry[];
	total_items: number;
	page_number: number;
	items_per_page: number;
}
