<script lang="ts">
	import { useQueryClient } from '@tanstack/svelte-query';
	import { authorizationStore } from '$lib/stores/authorization';
	import {
		createCreateAllowedIpDatabaseAllowedIpPost,
		createCreateClientDatabaseClientPost,
		createDeleteAllowedIpDatabaseAllowedIpDelete,
	} from '$lib/api/generated/database/database';
	import {
		createClientIpsMetricsClientIpsGet,
		getClientIpsMetricsClientIpsGetQueryKey,
	} from '$lib/api/generated/metrics/metrics';
	import type { ApiResponse } from '$lib/api/generated/models';
	import type { ClientIpEntry, ClientIpsResponse } from '$lib/models/clientIp';
	import { getErrorMessage } from '$lib/utils/errorHandler';
	import {
		ArrowPath,
		ChevronLeft,
		ChevronRight,
		Plus,
		ShieldCheck,
		XMark,
	} from 'svelte-heros-v2';

	type SortField = 'client_ip' | 'allowed' | 'query_count';

	const queryClient = useQueryClient();
	let user = $derived($authorizationStore);

	let currentPage = $state(1);
	let itemsPerPage = $state(20);
	let actionError = $state<string | null>(null);
	let actionIp = $state<string | null>(null);

	let filterIpInput = $state('');
	let filterIp = $state('');
	let sortField = $state<SortField>('query_count');
	let sortDesc = $state(true);
	let filterTimeout: ReturnType<typeof setTimeout> | null = null;

	let isRegisterModalOpen = $state(false);
	let registerIp = $state('');
	let registerName = $state('');
	let registerDescription = $state('');
	let registerError = $state<string | null>(null);

	let orderBy = $derived(`${sortDesc ? '-' : ''}${sortField}`);

	const clientIpsQuery = createClientIpsMetricsClientIpsGet<{
		clients: ClientIpEntry[];
		totalItems: number;
	}>(
		() => ({
			page_number: currentPage,
			items_per_page: itemsPerPage,
			order_by: orderBy,
			...(filterIp.trim() ? { filter_ip: filterIp.trim() } : {}),
		}),
		() => ({
			request: { headers: { Authorization: `Bearer ${user.token}` } },
			query: {
				select: (res) => {
					const apiResponse = res.data as ApiResponse;
					if (!apiResponse.success || !apiResponse.data) {
						throw new Error(getErrorMessage(apiResponse, 'Failed to fetch client IPs'));
					}
					const data = apiResponse.data as ClientIpsResponse;
					return {
						clients: data.clients ?? [],
						totalItems: data.total_items ?? 0,
					};
				},
			},
		})
	);

	let clients = $derived(clientIpsQuery.data?.clients ?? []);
	let totalItems = $derived(clientIpsQuery.data?.totalItems ?? 0);
	let isLoading = $derived(clientIpsQuery.isPending);
	let error = $derived((clientIpsQuery.error as Error | undefined)?.message ?? null);
	let totalPages = $derived(Math.max(1, Math.ceil(totalItems / itemsPerPage)));

	function invalidateClientIps() {
		queryClient.invalidateQueries({ queryKey: getClientIpsMetricsClientIpsGetQueryKey() });
	}

	const createClientMutation = createCreateClientDatabaseClientPost(() => ({
		request: { headers: { Authorization: `Bearer ${user.token}` } },
		mutation: {
			onSuccess: () => {
				closeRegisterModal();
				invalidateClientIps();
			},
			onError: (err) => {
				registerError = err instanceof Error ? err.message : 'Failed to register client';
			},
		},
	}));
	let isRegistering = $derived(createClientMutation.isPending);

	const allowIpMutation = createCreateAllowedIpDatabaseAllowedIpPost(() => ({
		request: { headers: { Authorization: `Bearer ${user.token}` } },
		mutation: {
			onSuccess: () => {
				actionIp = null;
				invalidateClientIps();
			},
			onError: (err) => {
				actionError = err instanceof Error ? err.message : 'Failed to allow IP';
				actionIp = null;
			},
		},
	}));

	const revokeIpMutation = createDeleteAllowedIpDatabaseAllowedIpDelete(() => ({
		request: { headers: { Authorization: `Bearer ${user.token}` } },
		mutation: {
			onSuccess: () => {
				actionIp = null;
				invalidateClientIps();
			},
			onError: (err) => {
				actionError = err instanceof Error ? err.message : 'Failed to revoke IP';
				actionIp = null;
			},
		},
	}));

	let isUpdatingAllowlist = $derived(allowIpMutation.isPending || revokeIpMutation.isPending);

	function formatTimestamp(value: string | null): string {
		if (!value) return '—';
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return value;
		return date.toLocaleString();
	}

	function handleAllow(entry: ClientIpEntry) {
		actionError = null;
		actionIp = entry.client_ip;
		allowIpMutation.mutate({ data: { ip: entry.client_ip, reason: '' } });
	}

	function handleRevoke(entry: ClientIpEntry) {
		actionError = null;
		actionIp = entry.client_ip;
		revokeIpMutation.mutate({ params: { ip: entry.client_ip } });
	}

	function openRegisterModal(entry: ClientIpEntry) {
		registerIp = entry.client_ip;
		registerName = entry.client_name || '';
		registerDescription = '';
		registerError = null;
		isRegisterModalOpen = true;
	}

	function closeRegisterModal() {
		isRegisterModalOpen = false;
		registerIp = '';
		registerName = '';
		registerDescription = '';
		registerError = null;
	}

	function handleRegister() {
		if (!user.token) {
			registerError = 'Not authenticated';
			return;
		}
		const trimmedIp = registerIp.trim();
		const trimmedName = registerName.trim();
		if (!trimmedIp) {
			registerError = 'IP address is required';
			return;
		}
		if (!trimmedName) {
			registerError = 'Name is required';
			return;
		}
		registerError = null;
		createClientMutation.mutate({
			data: {
				ip: trimmedIp,
				name: trimmedName,
				description: registerDescription.trim(),
			},
		});
	}

	function goToPage(page: number) {
		if (page >= 1 && page <= totalPages) {
			currentPage = page;
		}
	}

	function refreshClientIps() {
		invalidateClientIps();
	}

	function onFilterIpInput() {
		if (filterTimeout) clearTimeout(filterTimeout);
		filterTimeout = setTimeout(() => {
			filterIp = filterIpInput;
			currentPage = 1;
		}, 300);
	}

	function clearIpFilter() {
		if (filterTimeout) clearTimeout(filterTimeout);
		filterIpInput = '';
		filterIp = '';
		currentPage = 1;
	}

	function toggleSort(field: SortField) {
		if (sortField === field) {
			sortDesc = !sortDesc;
		} else {
			sortField = field;
			sortDesc = field === 'query_count' || field === 'allowed';
		}
		currentPage = 1;
	}

	function sortIndicator(field: SortField): string {
		if (sortField !== field) return '';
		return sortDesc ? ' ↓' : ' ↑';
	}
</script>

<div>
	<div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
		<div>
			<h1 class="text-3xl font-bold text-white">DNS Client IPs</h1>
			<p class="mt-1 text-sm text-gray-300">
				IPs seen in DNS metrics. Default deny — allow trusted sources, register devices for filtering.
			</p>
		</div>
		<button
			onclick={refreshClientIps}
			disabled={isLoading}
			class="flex items-center gap-2 self-start rounded-md bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
		>
			<ArrowPath class="h-5 w-5 {isLoading ? 'animate-spin' : ''}" />
			Refresh
		</button>
	</div>

	<div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end">
		<div class="min-w-0 flex-1">
			<label for="filter-ip" class="mb-1 block text-sm font-medium text-gray-200">Filter by IP</label>
			<div class="relative">
				<input
					id="filter-ip"
					type="text"
					bind:value={filterIpInput}
					oninput={onFilterIpInput}
					placeholder="e.g. 82.65 or 2001:41d0"
					class="w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 pr-10 text-white placeholder-gray-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
				/>
				{#if filterIpInput}
					<button
						type="button"
						onclick={clearIpFilter}
						class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:bg-white/10 hover:text-white"
						aria-label="Clear IP filter"
					>
						<XMark class="h-4 w-4" />
					</button>
				{/if}
			</div>
		</div>
	</div>

	{#if error}
		<div class="mb-6 rounded-lg border border-red-500/30 bg-red-500/20 p-4 backdrop-blur-sm">
			<p class="text-red-200">{error}</p>
		</div>
	{/if}

	{#if actionError}
		<div class="mb-6 rounded-lg border border-red-500/30 bg-red-500/20 p-4 backdrop-blur-sm">
			<p class="text-red-200">{actionError}</p>
		</div>
	{/if}

	{#if isLoading && clients.length === 0}
		<div class="rounded-lg border border-white/20 bg-white/10 p-8 text-center backdrop-blur-sm">
			<p class="text-gray-300">Loading client IPs...</p>
		</div>
	{:else if clients.length === 0}
		<div class="rounded-lg border border-white/20 bg-white/10 p-8 text-center backdrop-blur-sm">
			<p class="text-gray-300">
				{filterIp.trim() ? 'No client IPs match this filter.' : 'No client IPs found in metrics yet.'}
			</p>
		</div>
	{:else}
		<div class="overflow-hidden rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm">
			<div class="overflow-x-auto">
				<table class="min-w-full divide-y divide-white/10">
					<thead class="bg-white/5">
						<tr>
							<th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-300">
								<button
									type="button"
									onclick={() => toggleSort('client_ip')}
									class="inline-flex items-center gap-1 hover:text-white"
								>
									IP{sortIndicator('client_ip')}
								</button>
							</th>
							<th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-300">
								<button
									type="button"
									onclick={() => toggleSort('allowed')}
									class="inline-flex items-center gap-1 hover:text-white"
								>
									Status{sortIndicator('allowed')}
								</button>
							</th>
							<th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-300">
								<button
									type="button"
									onclick={() => toggleSort('query_count')}
									class="inline-flex items-center gap-1 hover:text-white"
								>
									Queries{sortIndicator('query_count')}
								</button>
							</th>
							<th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-300">
								Last seen
							</th>
							<th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-300">
								First seen
							</th>
							<th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-300">
								Actions
							</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-white/10">
						{#each clients as entry (entry.client_ip)}
							<tr class="hover:bg-white/5">
								<td class="px-4 py-3 text-sm font-medium text-white">
									<div>{entry.client_ip}</div>
									{#if entry.client_name}
										<div class="text-xs text-gray-400">{entry.client_name}</div>
									{/if}
								</td>
								<td class="px-4 py-3 text-sm">
									{#if entry.allowed}
										<span
											class="inline-flex rounded-full bg-green-500/20 px-2.5 py-0.5 text-xs font-medium text-green-200"
										>
											Allowed
										</span>
									{:else}
										<span
											class="inline-flex rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-medium text-red-200"
										>
											Denied
										</span>
									{/if}
									{#if entry.registered}
										<span
											class="ml-1 inline-flex rounded-full bg-violet-500/20 px-2.5 py-0.5 text-xs font-medium text-violet-200"
										>
											Registered
										</span>
									{/if}
								</td>
								<td class="px-4 py-3 text-sm text-gray-200">{entry.query_count}</td>
								<td class="px-4 py-3 text-sm text-gray-300">{formatTimestamp(entry.last_seen)}</td>
								<td class="px-4 py-3 text-sm text-gray-300">{formatTimestamp(entry.first_seen)}</td>
								<td class="px-4 py-3 text-right">
									<div class="flex items-center justify-end gap-2">
										{#if !entry.registered}
											<button
												onclick={() => openRegisterModal(entry)}
												disabled={actionIp === entry.client_ip || isUpdatingAllowlist}
												class="inline-flex items-center gap-1 rounded-md bg-violet-600/80 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-violet-600 disabled:opacity-50"
												title="Register as client"
											>
												<Plus class="h-4 w-4" />
												Register
											</button>
										{:else}
											<span
												class="inline-flex items-center gap-1 px-2 py-1.5 text-xs text-green-300"
												title="Already registered"
											>
												<ShieldCheck class="h-4 w-4" />
											</span>
										{/if}

										{#if entry.allowed}
											<button
												onclick={() => handleRevoke(entry)}
												disabled={actionIp === entry.client_ip || isUpdatingAllowlist}
												class="inline-flex items-center gap-1 rounded-md bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20 disabled:opacity-50"
												title="Remove from allowlist"
											>
												Revoke
											</button>
										{:else}
											<button
												onclick={() => handleAllow(entry)}
												disabled={actionIp === entry.client_ip || isUpdatingAllowlist}
												class="inline-flex items-center gap-1 rounded-md bg-green-600/80 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-600 disabled:opacity-50"
												title="Allow IP"
											>
												<ShieldCheck class="h-4 w-4" />
												Allow
											</button>
										{/if}
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

		{#if totalPages > 1}
			<div class="mt-6 flex items-center justify-center gap-4">
				<button
					onclick={() => goToPage(currentPage - 1)}
					disabled={currentPage <= 1 || isLoading}
					class="rounded-md p-2 text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
					aria-label="Previous page"
				>
					<ChevronLeft class="h-5 w-5" />
				</button>
				<span class="text-sm text-gray-300">Page {currentPage} of {totalPages}</span>
				<button
					onclick={() => goToPage(currentPage + 1)}
					disabled={currentPage >= totalPages || isLoading}
					class="rounded-md p-2 text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
					aria-label="Next page"
				>
					<ChevronRight class="h-5 w-5" />
				</button>
			</div>
		{/if}
	{/if}
</div>

{#if isRegisterModalOpen}
	<div
		class="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
		role="dialog"
		aria-modal="true"
		aria-labelledby="register-client-title"
	>
		<div class="w-full max-w-md rounded-lg border border-white/20 bg-gray-900 p-6 shadow-xl">
			<div class="mb-4 flex items-center justify-between">
				<h2 id="register-client-title" class="text-xl font-bold text-white">Register Client</h2>
				<button
					onclick={closeRegisterModal}
					class="rounded-md p-1 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
					aria-label="Close"
				>
					<XMark class="h-5 w-5" />
				</button>
			</div>

			{#if registerError}
				<div class="mb-4 rounded-lg border border-red-500/30 bg-red-500/20 p-3">
					<p class="text-sm text-red-200">{registerError}</p>
				</div>
			{/if}

			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleRegister();
				}}
				class="space-y-4"
			>
				<div>
					<label for="register-ip" class="mb-1 block text-sm font-medium text-gray-200">IP</label>
					<input
						id="register-ip"
						type="text"
						bind:value={registerIp}
						readonly
						class="w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-white"
					/>
				</div>
				<div>
					<label for="register-name" class="mb-1 block text-sm font-medium text-gray-200"
						>Name</label
					>
					<input
						id="register-name"
						type="text"
						bind:value={registerName}
						required
						placeholder="e.g. Pixel LTE"
						class="w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-gray-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
					/>
				</div>
				<div>
					<label for="register-description" class="mb-1 block text-sm font-medium text-gray-200"
						>Description</label
					>
					<input
						id="register-description"
						type="text"
						bind:value={registerDescription}
						placeholder="Optional"
						class="w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-gray-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
					/>
				</div>
				<div class="flex justify-end gap-3 pt-2">
					<button
						type="button"
						onclick={closeRegisterModal}
						class="rounded-md px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/10"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={isRegistering}
						class="rounded-md bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 text-sm font-medium text-white transition-all hover:from-violet-700 hover:to-purple-700 disabled:opacity-50"
					>
						{isRegistering ? 'Registering...' : 'Register'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
