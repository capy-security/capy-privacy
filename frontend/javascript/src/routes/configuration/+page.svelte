<script lang="ts">
	import { onMount } from 'svelte';
	import { authorizationStore } from '$lib/stores/authorization';
	import { Cog6Tooth, Trash, ArrowPath, CircleStack } from 'svelte-heros-v2';
	import { cleanMetricsMetricsCleanDelete } from '$lib/api/generated/metrics/metrics';
	import { getDatabaseSizeSystemDatabaseSizeGet } from '$lib/api/generated/system/system';
	import { getErrorMessage } from '$lib/utils/errorHandler';
	import type { ApiResponse } from '$lib/api/generated/models';

	let user = $derived($authorizationStore);
	let beforeDate = $state('');
	let isCleaning = $state(false);
	let error = $state<string | null>(null);
	let success = $state<string | null>(null);

	// Database size state
	let dbSize = $state<any>(null);
	let isLoadingDbSize = $state(false);
	let dbSizeError = $state<string | null>(null);

	// Set default date to 30 days ago
	$effect(() => {
		if (!beforeDate) {
			const date = new Date();
			date.setDate(date.getDate() - 30);
			beforeDate = date.toISOString().split('T')[0];
		}
	});

	async function handleCleanMetrics() {
		if (!user.token) {
			error = 'Not authenticated';
			return;
		}

		if (!beforeDate) {
			error = 'Please select a date';
			return;
		}

		// Validate date
		const selectedDate = new Date(beforeDate + 'T00:00:00Z');
		if (isNaN(selectedDate.getTime())) {
			error = 'Invalid date selected';
			return;
		}

		// Format date as ISO 8601 string for the API (YYYY-MM-DDTHH:mm:ssZ format)
		const dateString = selectedDate.toISOString();

		isCleaning = true;
		error = null;
		success = null;

		try {
			const response = await cleanMetricsMetricsCleanDelete(
				{ before_date: dateString },
				{
					headers: {
						Authorization: `Bearer ${user.token}`
					}
				}
			);

			if (response.status === 200 && response.data) {
				const apiResponse = response.data as ApiResponse;
				if (apiResponse.success) {
					const deletedCount = (apiResponse.data as any)?.deleted_count || 0;
					success = `Successfully deleted ${deletedCount} metric(s) before ${beforeDate}`;
					error = null;
				} else {
					error = getErrorMessage(apiResponse, 'Failed to clean metrics');
					success = null;
				}
			} else {
				const errorResponse = response.data as ApiResponse | undefined;
				error = getErrorMessage(errorResponse, 'Failed to clean metrics');
				success = null;
			}
		} catch (err) {
			console.error('Error cleaning metrics:', err);
			error = err instanceof Error ? err.message : 'An error occurred while cleaning metrics';
			success = null;
		} finally {
			isCleaning = false;
		}
	}

	function formatDate(dateString: string): string {
		if (!dateString) return 'N/A';
		const date = new Date(dateString);
		if (isNaN(date.getTime())) return dateString;
		return new Intl.DateTimeFormat('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		}).format(date);
	}

	async function fetchDatabaseSize() {
		if (!user.token) {
			dbSizeError = 'Not authenticated';
			return;
		}

		isLoadingDbSize = true;
		dbSizeError = null;

		try {
			const response = await getDatabaseSizeSystemDatabaseSizeGet({
				headers: {
					Authorization: `Bearer ${user.token}`
				}
			});

			if (response.status === 200 && response.data) {
				const apiResponse = response.data as ApiResponse;
				if (apiResponse.success) {
					dbSize = apiResponse.data;
					dbSizeError = null;
				} else {
					dbSizeError = getErrorMessage(apiResponse, 'Failed to fetch database size');
					dbSize = null;
				}
			} else {
				const errorResponse = response.data as ApiResponse | undefined;
				dbSizeError = getErrorMessage(errorResponse, 'Failed to fetch database size');
				dbSize = null;
			}
		} catch (err) {
			console.error('Error fetching database size:', err);
			dbSizeError =
				err instanceof Error ? err.message : 'An error occurred while fetching database size';
			dbSize = null;
		} finally {
			isLoadingDbSize = false;
		}
	}

	onMount(() => {
		fetchDatabaseSize();
	});
</script>

<div>
	<h1 class="mb-4 text-2xl font-bold text-white md:mb-6 md:text-3xl">Configuration</h1>

	{#if user.authenticated && user.profile}
		<!-- Configuration Card -->
		<div
			class="mb-6 rounded-lg border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-sm md:p-8"
		>
			<div class="mb-4 flex flex-col items-center gap-4 md:mb-6 md:flex-row md:items-center">
				<div
					class="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 md:h-20 md:w-20"
				>
					<Cog6Tooth class="h-10 w-10 text-white md:h-12 md:w-12" />
				</div>
				<div class="text-center md:text-left">
					<h2 class="text-xl font-bold text-white md:text-2xl">Database Management</h2>
					<p class="mt-1 break-all text-sm text-gray-300 md:text-base">
						Clean up old metrics from the database
					</p>
				</div>
			</div>

			<div class="space-y-3 md:space-y-4">
				<!-- Database Size Section -->
				<div class="rounded-md border border-white/10 bg-white/5 p-3 md:p-4">
					<div class="mb-4">
						<div class="mb-2 flex items-center justify-between">
							<div class="flex items-center gap-2">
								<CircleStack class="h-5 w-5 text-violet-400" />
								<div class="block text-xs font-medium text-gray-300 md:text-sm">Database Size</div>
							</div>
							<button
								onclick={fetchDatabaseSize}
								disabled={isLoadingDbSize}
								class="rounded-md p-1.5 text-violet-300 transition-colors hover:bg-violet-500/20 hover:text-violet-200 disabled:cursor-not-allowed disabled:opacity-50"
								aria-label="Refresh database size"
								title="Refresh database size"
							>
								<ArrowPath class="h-5 w-5 {isLoadingDbSize ? 'animate-spin' : ''}" />
							</button>
						</div>

						{#if isLoadingDbSize && !dbSize}
							<div class="text-sm text-gray-400">Loading database size...</div>
						{:else if dbSizeError}
							<div class="rounded-lg border border-red-500/30 bg-red-500/20 p-3 backdrop-blur-sm">
								<p class="text-sm text-red-200">{dbSizeError}</p>
							</div>
						{:else if dbSize}
							<div class="space-y-3">
								<!-- Logical Size -->
								<div class="rounded-md border border-white/5 bg-white/5 p-3">
									<div class="mb-1 text-xs font-medium text-gray-400">Logical Size</div>
									<div class="text-lg font-semibold text-white">
										{dbSize.logical_size?.formatted || 'N/A'}
									</div>
									<div class="mt-1 text-xs text-gray-400">
										{dbSize.logical_size?.bytes?.toLocaleString() || '0'} bytes
									</div>
								</div>

								<!-- Total File Size -->
								<div class="rounded-md border border-white/5 bg-white/5 p-3">
									<div class="mb-1 text-xs font-medium text-gray-400">Total File Size</div>
									<div class="text-lg font-semibold text-white">
										{dbSize.total_file_size?.formatted || 'N/A'}
									</div>
									<div class="mt-1 text-xs text-gray-400">
										{dbSize.total_file_size?.bytes?.toLocaleString() || '0'} bytes
									</div>
								</div>

								<!-- Breakdown -->
								<div class="space-y-2 rounded-md border border-white/5 bg-white/5 p-3">
									<div class="mb-2 text-xs font-medium text-gray-400">Size Breakdown</div>
									<div class="space-y-1.5 text-xs">
										<div class="flex justify-between text-gray-300">
											<span>Main Database:</span>
											<span class="font-medium text-white">
												{dbSize.file_size?.formatted || 'N/A'}
											</span>
										</div>
										{#if dbSize.wal_size?.bytes > 0}
											<div class="flex justify-between text-gray-300">
												<span>WAL File:</span>
												<span class="font-medium text-white">
													{dbSize.wal_size?.formatted || 'N/A'}
												</span>
											</div>
										{/if}
										{#if dbSize.shm_size?.bytes > 0}
											<div class="flex justify-between text-gray-300">
												<span>SHM File:</span>
												<span class="font-medium text-white">
													{dbSize.shm_size?.formatted || 'N/A'}
												</span>
											</div>
										{/if}
									</div>
								</div>

								<!-- Database Info -->
								<div class="rounded-md border border-white/5 bg-white/5 p-3">
									<div class="mb-2 text-xs font-medium text-gray-400">Database Info</div>
									<div class="space-y-1 text-xs text-gray-300">
										<div>
											<span class="font-medium text-white">Path:</span>
											<span class="ml-2 break-all">{dbSize.database_path || 'N/A'}</span>
										</div>
										<div class="flex gap-4">
											<div>
												<span class="font-medium text-white">Pages:</span>
												<span class="ml-2">{dbSize.page_count?.toLocaleString() || 'N/A'}</span>
											</div>
											<div>
												<span class="font-medium text-white">Page Size:</span>
												<span class="ml-2">{dbSize.page_size?.toLocaleString() || 'N/A'} bytes</span
												>
											</div>
										</div>
									</div>
								</div>
							</div>
						{/if}
					</div>
				</div>

				<!-- Clean Metrics Section -->
				<div class="rounded-md border border-white/10 bg-white/5 p-3 md:p-4">
					<div class="mb-4">
						<div class="block text-xs font-medium text-gray-300 md:text-sm mb-2">Clean Metrics</div>
						<p class="text-sm text-gray-400 mb-4">
							Delete all metrics with timestamp before the selected date. This action cannot be
							undone.
						</p>

						<!-- Date Input -->
						<div class="mb-4">
							<label for="before-date" class="block text-sm font-medium text-gray-200 mb-2">
								Delete metrics before:
							</label>
							<input
								id="before-date"
								type="date"
								bind:value={beforeDate}
								class="block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
								disabled={isCleaning}
							/>
							{#if beforeDate}
								<p class="mt-1 text-xs text-gray-400">
									Selected date: {formatDate(beforeDate)}
								</p>
							{/if}
						</div>

						<!-- Error Message -->
						{#if error}
							<div
								class="mb-4 rounded-lg border border-red-500/30 bg-red-500/20 p-3 backdrop-blur-sm"
							>
								<p class="text-sm text-red-200">{error}</p>
							</div>
						{/if}

						<!-- Success Message -->
						{#if success}
							<div
								class="mb-4 rounded-lg border border-green-500/30 bg-green-500/20 p-3 backdrop-blur-sm"
							>
								<p class="text-sm text-green-200">{success}</p>
							</div>
						{/if}

						<!-- Clean Button -->
						<button
							onclick={handleCleanMetrics}
							disabled={isCleaning || !beforeDate}
							class="flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-red-600 to-red-700 px-6 py-3 font-medium text-white shadow-lg transition-all hover:from-red-700 hover:to-red-800 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
						>
							<Trash class="h-5 w-5" />
							<span>{isCleaning ? 'Cleaning...' : 'Clean Metrics'}</span>
						</button>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<div
			class="rounded-lg border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-sm md:p-8"
		>
			<p class="mb-4 text-sm text-gray-300 md:text-base">You are not authenticated.</p>
			<a
				href="/login"
				class="inline-block w-full rounded-md bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3 text-center font-medium text-white shadow-lg transition-all hover:from-violet-700 hover:to-purple-700 md:w-auto"
			>
				Sign In
			</a>
		</div>
	{/if}
</div>
