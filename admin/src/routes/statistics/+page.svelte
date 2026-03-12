<script lang="ts">
	import { onMount } from 'svelte';
	import { authorizationStore } from '$lib/stores/authorization';
	import type { ApiResponse } from '$lib/api/generated/models';
	import { ArrowPath } from 'svelte-heros-v2';
	import BarChart from '$lib/components/BarChart.svelte';
	import { domainsStatisticsMetricsDomainsStatisticsGet } from '$lib/api/generated/metrics/metrics';
	import { getErrorMessage } from '$lib/utils/errorHandler';

	let user = $derived($authorizationStore);
	let chartData = $state<{ label: string; value: number }[]>([]);
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let topN = $state(10);

	interface DomainStatistics {
		domain: string;
		request_count: number;
	}

	interface StatisticsResponse {
		domains: DomainStatistics[];
		total_returned: number;
	}

	async function fetchStatistics() {
		// Layout ensures user is valid, but check token as safety net
		if (!user.token) {
			error = 'Not authenticated';
			return;
		}

		isLoading = true;
		error = null;

		try {
			const response = await domainsStatisticsMetricsDomainsStatisticsGet(
				{ top_n: topN },
				{
					headers: {
						Authorization: `Bearer ${user.token}`
					}
				}
			);

			if (response.status === 200 && response.data) {
				const apiResponse = response.data as ApiResponse;
				if (apiResponse.success && apiResponse.data) {
					const data = apiResponse.data as unknown as StatisticsResponse;
					// Transform API response to chart format
					chartData = data.domains.map((item) => ({
						label: item.domain,
						value: item.request_count
					}));
				} else {
					error = getErrorMessage(apiResponse, 'Failed to fetch statistics');
					chartData = [];
				}
			} else {
				// Handle non-200 responses
				const errorResponse = response.data as ApiResponse | undefined;
				error = getErrorMessage(errorResponse, 'Failed to fetch statistics');
				chartData = [];
			}
		} catch (err) {
			console.error('Error fetching statistics:', err);
			error = err instanceof Error ? err.message : 'An error occurred';
			chartData = [];
		} finally {
			isLoading = false;
		}
	}

	function handleTopNChange() {
		if (topN < 1) topN = 1;
		if (topN > 100) topN = 100;
		fetchStatistics();
	}

	onMount(() => {
		// Layout ensures user is valid, safe to fetch
		fetchStatistics();
	});
</script>

<div>
	<!-- Header -->
	<div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
		<h1 class="text-3xl font-bold text-white">Top Queried Domains</h1>

		<!-- Controls -->
		<div class="flex items-center gap-4">
			{#if isLoading}
				<div class="text-gray-300">Loading...</div>
			{/if}
			<div class="flex items-center gap-2">
				<label for="top-n" class="text-sm font-medium text-gray-200">Top N:</label>
				<input
					id="top-n"
					type="number"
					bind:value={topN}
					min="1"
					max="100"
					oninput={handleTopNChange}
					onchange={handleTopNChange}
					class="w-20 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
					disabled={isLoading}
				/>
			</div>
			<button
				onclick={fetchStatistics}
				disabled={isLoading}
				class="flex items-center justify-center gap-2 rounded-md border border-white/20 bg-white/10 p-2 text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
				aria-label="Refresh statistics"
			>
				<ArrowPath class="h-5 w-5 {isLoading ? 'animate-spin' : ''}" />
			</button>
		</div>
	</div>

	{#if error}
		<div class="mb-6 rounded-lg border border-red-500/30 bg-red-500/20 p-4 backdrop-blur-sm">
			<p class="text-red-200">{error}</p>
		</div>
	{/if}

	{#if isLoading && chartData.length === 0}
		<div class="rounded-lg border border-white/20 bg-white/10 p-8 backdrop-blur-sm">
			<div class="h-96 animate-pulse rounded-lg bg-white/5"></div>
		</div>
	{:else if chartData.length === 0 && !isLoading}
		<div class="rounded-lg border border-white/20 bg-white/10 p-8 text-center backdrop-blur-sm">
			<p class="text-gray-300">No statistics available</p>
		</div>
	{:else}
		<!-- Chart Container -->
		<div class="rounded-lg border border-white/20 bg-white/10 p-6 shadow-lg backdrop-blur-sm">
			{#key chartData}
				<BarChart data={chartData} showLegend={true} maxHeight={600} />
			{/key}
		</div>

		<!-- Summary Table (Optional) -->
		<div class="mt-6 rounded-lg border border-white/20 bg-white/10 p-6 shadow-lg backdrop-blur-sm">
			<h2 class="mb-4 text-xl font-semibold text-white">Summary</h2>
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead>
						<tr class="border-b border-white/20">
							<th class="px-4 py-3 text-left text-sm font-medium text-gray-200">Rank</th>
							<th class="px-4 py-3 text-left text-sm font-medium text-gray-200">Domain</th>
							<th class="px-4 py-3 text-right text-sm font-medium text-gray-200">
								Request Count
							</th>
						</tr>
					</thead>
					<tbody>
						{#each chartData as item, index}
							<tr class="border-b border-white/10 transition-colors hover:bg-white/5">
								<td class="px-4 py-3 text-sm text-gray-300">{index + 1}</td>
								<td class="px-4 py-3 text-sm font-medium text-white">{item.label}</td>
								<td class="px-4 py-3 text-right text-sm text-gray-300">
									{item.value.toLocaleString()}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>
