<script lang="ts">
	import { onMount } from 'svelte';
	import { authorizationStore } from '$lib/stores/authorization';
	import config from '$lib/config';
	import {
		Cog6Tooth,
		Trash,
		ArrowPath,
		CircleStack,
		CpuChip,
		DocumentText,
		Server,
		WrenchScrewdriver
	} from 'svelte-heros-v2';
	import { cleanMetricsMetricsCleanDelete } from '$lib/api/generated/metrics/metrics';
	import {
		getDatabaseSizeSystemDatabaseSizeGet,
		systemHealthSystemHealthGet,
		systemInfoSystemInfoGet,
		systemNetworkSystemNetworkGet
	} from '$lib/api/generated/system/system';
	import { setupSetupGet } from '$lib/api/generated/setup/setup';
	import { getErrorMessage } from '$lib/utils/errorHandler';
	import type { ApiResponse } from '$lib/api/generated/models';

	let user = $derived($authorizationStore);
	let beforeDate = $state('');
	let isCleaning = $state(false);
	let error = $state<string | null>(null);
	let success = $state<string | null>(null);

	// Health state
	let health = $state<Record<string, string> | null>(null);
	let isLoadingHealth = $state(false);
	let healthError = $state<string | null>(null);

	const serviceLabels: Record<string, string> = {
		'53/udp': 'DNS (UDP)',
		'853/tcp': 'DNS over TLS',
		'5300/tcp': 'PowerDNS'
	};

	// System info state
	let sysInfo = $state<any>(null);
	let isLoadingSysInfo = $state(false);
	let sysInfoError = $state<string | null>(null);

	// Network state
	let networkInterfaces = $state<any[] | null>(null);
	let isLoadingNetwork = $state(false);
	let networkError = $state<string | null>(null);

	// Setup state
	let isSettingUp = $state(false);
	let setupError = $state<string | null>(null);
	let setupSuccess = $state<string | null>(null);

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

	async function handleSetupDatabase() {
		isSettingUp = true;
		setupError = null;
		setupSuccess = null;

		try {
			const response = await setupSetupGet();

			if (response.status === 200 && response.data) {
				const data = response.data as { status?: string; message?: string };
				if (data.status === 'ok') {
					setupSuccess = data.message || 'Database setup completed successfully';
				} else {
					setupError = data.message || 'Setup failed';
				}
			} else {
				setupError = 'Failed to setup database';
			}
		} catch (err) {
			console.error('Error setting up database:', err);
			setupError = err instanceof Error ? err.message : 'An error occurred during setup';
		} finally {
			isSettingUp = false;
		}
	}

	async function fetchSystemInfo() {
		isLoadingSysInfo = true;
		sysInfoError = null;

		try {
			const response = await systemInfoSystemInfoGet();

			if (response.status === 200 && response.data) {
				const apiResponse = response.data as ApiResponse;
				if (apiResponse.success) {
					sysInfo = apiResponse.data;
				} else {
					sysInfoError = 'Failed to fetch system info';
				}
			} else {
				sysInfoError = 'Failed to fetch system info';
			}
		} catch (err) {
			console.error('Error fetching system info:', err);
			sysInfoError = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			isLoadingSysInfo = false;
		}
	}

	async function fetchNetwork() {
		isLoadingNetwork = true;
		networkError = null;

		try {
			const response = await systemNetworkSystemNetworkGet();

			if (response.status === 200 && response.data) {
				const apiResponse = response.data as ApiResponse;
				if (apiResponse.success) {
					networkInterfaces = (apiResponse.data as any)?.interfaces ?? [];
				} else {
					networkError = 'Failed to fetch network info';
				}
			} else {
				networkError = 'Failed to fetch network info';
			}
		} catch (err) {
			console.error('Error fetching network info:', err);
			networkError = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			isLoadingNetwork = false;
		}
	}

	async function fetchHealth() {
		isLoadingHealth = true;
		healthError = null;

		try {
			const response = await systemHealthSystemHealthGet();

			if (response.status === 200 && response.data) {
				const apiResponse = response.data as ApiResponse;
				health = apiResponse.data as Record<string, string>;
				healthError = null;
			} else {
				healthError = 'Failed to fetch health status';
				health = null;
			}
		} catch (err) {
			console.error('Error fetching health:', err);
			healthError = err instanceof Error ? err.message : 'An error occurred';
			health = null;
		} finally {
			isLoadingHealth = false;
		}
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
		fetchHealth();
		fetchSystemInfo();
		fetchNetwork();
		fetchDatabaseSize();
	});
</script>

<div>
	<h1 class="mb-4 text-2xl font-bold text-white md:mb-6 md:text-3xl">Configuration</h1>

	{#if user.authenticated && user.profile}
		<!-- Health Card -->
		<div
			class="mb-6 rounded-lg border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-sm md:p-8"
		>
			<div class="mb-4 flex flex-col items-center gap-4 md:flex-row md:items-center">
				<div
					class="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 md:h-16 md:w-16"
				>
					<Server class="h-8 w-8 text-white md:h-9 md:w-9" />
				</div>
				<div class="flex-1 text-center md:text-left">
					<h2 class="text-lg font-bold text-white md:text-xl">Service Health</h2>
					<p class="mt-1 text-sm text-gray-300">Core DNS service status</p>
				</div>
				<button
					onclick={fetchHealth}
					disabled={isLoadingHealth}
					class="rounded-md p-1.5 text-violet-300 transition-colors hover:bg-violet-500/20 hover:text-violet-200 disabled:cursor-not-allowed disabled:opacity-50"
					aria-label="Refresh health"
					title="Refresh health"
				>
					<ArrowPath class="h-5 w-5 {isLoadingHealth ? 'animate-spin' : ''}" />
				</button>
			</div>

			{#if isLoadingHealth && !health}
				<div class="text-sm text-gray-400">Checking services...</div>
			{:else if healthError}
				<div class="rounded-lg border border-red-500/30 bg-red-500/20 p-3 backdrop-blur-sm">
					<p class="text-sm text-red-200">{healthError}</p>
				</div>
			{:else if health}
				<div class="grid grid-cols-3 gap-3">
					{#each Object.entries(serviceLabels) as [key, label]}
						{@const status = health[key]}
						{@const isUp = status === 'up'}
						<div
							class="flex flex-col items-center gap-2 rounded-md border border-white/10 bg-white/5 py-4"
						>
							<span
								class="h-3 w-3 rounded-full {isUp
									? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]'
									: 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.5)]'}"
							></span>
							<span class="text-sm font-medium text-white">{key}</span>
							<span class="text-xs text-gray-400">{label}</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- System Info Card -->
		<div
			class="mb-6 rounded-lg border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-sm md:p-8"
		>
			<div class="mb-4 flex flex-col items-center gap-4 md:flex-row md:items-center">
				<div
					class="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 md:h-16 md:w-16"
				>
					<CpuChip class="h-8 w-8 text-white md:h-9 md:w-9" />
				</div>
				<div class="flex-1 text-center md:text-left">
					<h2 class="text-lg font-bold text-white md:text-xl">System Information</h2>
					<p class="mt-1 text-sm text-gray-300">CPU, memory, disk and architecture</p>
				</div>
				<button
					onclick={fetchSystemInfo}
					disabled={isLoadingSysInfo}
					class="rounded-md p-1.5 text-violet-300 transition-colors hover:bg-violet-500/20 hover:text-violet-200 disabled:cursor-not-allowed disabled:opacity-50"
					aria-label="Refresh system info"
					title="Refresh system info"
				>
					<ArrowPath class="h-5 w-5 {isLoadingSysInfo ? 'animate-spin' : ''}" />
				</button>
			</div>

			{#if isLoadingSysInfo && !sysInfo}
				<div class="text-sm text-gray-400">Loading system info...</div>
			{:else if sysInfoError}
				<div class="rounded-lg border border-red-500/30 bg-red-500/20 p-3 backdrop-blur-sm">
					<p class="text-sm text-red-200">{sysInfoError}</p>
				</div>
			{:else if sysInfo}
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
					<!-- CPU -->
					<div class="rounded-md border border-white/10 bg-white/5 p-4">
						<div class="mb-2 text-xs font-medium text-gray-400">CPU</div>
						<div class="text-lg font-semibold text-white">
							{sysInfo.cpu?.usage_percent ?? '–'}%
						</div>
						<div class="mt-1 text-xs text-gray-400">
							{sysInfo.cpu?.cores_physical ?? '–'} cores / {sysInfo.cpu?.cores_logical ?? '–'} threads
						</div>
					</div>

					<!-- Memory -->
					<div class="rounded-md border border-white/10 bg-white/5 p-4">
						<div class="mb-2 text-xs font-medium text-gray-400">Memory</div>
						<div class="text-lg font-semibold text-white">
							{sysInfo.memory?.usage_percent ?? '–'}%
						</div>
						<div class="mt-1 text-xs text-gray-400">
							{sysInfo.memory?.used ?? '–'} / {sysInfo.memory?.total ?? '–'}
						</div>
					</div>

					<!-- Disk -->
					<div class="rounded-md border border-white/10 bg-white/5 p-4">
						<div class="mb-2 text-xs font-medium text-gray-400">Disk</div>
						<div class="text-lg font-semibold text-white">
							{sysInfo.disk?.usage_percent ?? '–'}%
						</div>
						<div class="mt-1 text-xs text-gray-400">
							{sysInfo.disk?.used ?? '–'} / {sysInfo.disk?.total ?? '–'}
						</div>
					</div>

					<!-- Architecture -->
					<div class="rounded-md border border-white/10 bg-white/5 p-4">
						<div class="mb-2 text-xs font-medium text-gray-400">Architecture</div>
						<div class="text-lg font-semibold text-white">
							{sysInfo.architecture?.machine ?? '–'}
						</div>
						<div class="mt-1 text-xs text-gray-400">
							{sysInfo.architecture?.system ?? '–'} · Python {sysInfo.architecture?.python ?? '–'}
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Network Card -->
		<div
			class="mb-6 rounded-lg border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-sm md:p-8"
		>
			<div class="mb-4 flex flex-col items-center gap-4 md:flex-row md:items-center">
				<div
					class="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 md:h-16 md:w-16"
				>
					<Server class="h-8 w-8 text-white md:h-9 md:w-9" />
				</div>
				<div class="flex-1 text-center md:text-left">
					<h2 class="text-lg font-bold text-white md:text-xl">Network</h2>
					<p class="mt-1 text-sm text-gray-300">Interfaces, IPs and CIDR ranges</p>
				</div>
				<button
					onclick={fetchNetwork}
					disabled={isLoadingNetwork}
					class="rounded-md p-1.5 text-violet-300 transition-colors hover:bg-violet-500/20 hover:text-violet-200 disabled:cursor-not-allowed disabled:opacity-50"
					aria-label="Refresh network info"
					title="Refresh network info"
				>
					<ArrowPath class="h-5 w-5 {isLoadingNetwork ? 'animate-spin' : ''}" />
				</button>
			</div>

			{#if isLoadingNetwork && !networkInterfaces}
				<div class="text-sm text-gray-400">Loading network info...</div>
			{:else if networkError}
				<div class="rounded-lg border border-red-500/30 bg-red-500/20 p-3 backdrop-blur-sm">
					<p class="text-sm text-red-200">{networkError}</p>
				</div>
			{:else if networkInterfaces && networkInterfaces.length > 0}
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{#each networkInterfaces as iface}
						<div class="rounded-md border border-white/10 bg-white/5 p-4">
							<div class="mb-2 text-xs font-medium text-gray-400">{iface.interface}</div>
							<div class="text-base font-semibold text-white">{iface.ip}</div>
							<div class="mt-1 text-xs text-gray-400">{iface.cidr}</div>
						</div>
					{/each}
				</div>
			{:else if networkInterfaces}
				<div class="text-sm text-gray-400">No network interfaces found</div>
			{/if}
		</div>

		<!-- API documentation Card -->
		<div
			class="mb-6 rounded-lg border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-sm md:p-8"
		>
			<div class="flex flex-col items-center gap-4 md:flex-row md:items-center">
				<div
					class="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 md:h-16 md:w-16"
				>
					<DocumentText class="h-8 w-8 text-white md:h-9 md:w-9" />
				</div>
				<div class="flex-1 text-center md:text-left">
					<h2 class="text-lg font-bold text-white md:text-xl">API documentation</h2>
					<p class="mt-1 text-sm text-gray-300">Open the interactive ReDoc API reference</p>
				</div>
				<a
					href="{config.apiUrl.replace(/\/$/, '')}/docs"
					target="_blank"
					rel="noopener noreferrer"
					class="rounded-md bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500"
				>
					Open docs
				</a>
			</div>
		</div>

		<!-- Configuration Card -->
		<div
			class="mb-6 rounded-lg border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-sm md:p-8"
		>
			<div class="mb-4 flex flex-col items-center gap-4 md:mb-6 md:flex-row md:items-center">
				<div
					class="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 md:h-16 md:w-16"
				>
					<Cog6Tooth class="h-8 w-8 text-white md:h-9 md:w-9" />
				</div>
				<div class="text-center md:text-left">
					<h2 class="text-xl font-bold text-white md:text-2xl">Database Management</h2>
					<p class="mt-1 break-all text-sm text-gray-300 md:text-base">
						Clean up old metrics from the database
					</p>
				</div>
			</div>

			<div class="space-y-3 md:space-y-4">
				<!-- Setup Database Section -->
				<div class="rounded-md border border-white/10 bg-white/5 p-3 md:p-4">
					<div class="flex items-center gap-2 mb-2">
						<WrenchScrewdriver class="h-5 w-5 text-violet-400" />
						<div class="block text-xs font-medium text-gray-300 md:text-sm">Setup Database</div>
					</div>
					<p class="text-sm text-gray-400 mb-4">
						Populate the database with default data (tables, categories, etc.).
					</p>

					{#if setupError}
						<div
							class="mb-4 rounded-lg border border-red-500/30 bg-red-500/20 p-3 backdrop-blur-sm"
						>
							<p class="text-sm text-red-200">{setupError}</p>
						</div>
					{/if}

					{#if setupSuccess}
						<div
							class="mb-4 rounded-lg border border-green-500/30 bg-green-500/20 p-3 backdrop-blur-sm"
						>
							<p class="text-sm text-green-200">{setupSuccess}</p>
						</div>
					{/if}

					<button
						onclick={handleSetupDatabase}
						disabled={isSettingUp}
						class="flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3 font-medium text-white shadow-lg transition-all hover:from-violet-700 hover:to-purple-700 focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
					>
						<WrenchScrewdriver class="h-5 w-5" />
						<span>{isSettingUp ? 'Setting up...' : 'Setup Database'}</span>
					</button>
				</div>

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
								<div class="space-y-2 rounded-md border border-white/5 bg-white/5 p-3">
									<div class="mb-2 text-xs font-medium text-gray-400">Size Breakdown</div>
									<div class="mb-3 flex flex-wrap gap-4 border-b border-white/10 pb-3">
										<div>
											<div class="text-xs text-gray-400">Logical Size</div>
											<div class="text-base font-semibold text-white">
												{dbSize.logical_size?.formatted || 'N/A'}
											</div>
											<div class="text-xs text-gray-400">
												{dbSize.logical_size?.bytes?.toLocaleString() || '0'} bytes
											</div>
										</div>
										<div>
											<div class="text-xs text-gray-400">Total File Size</div>
											<div class="text-base font-semibold text-white">
												{dbSize.total_file_size?.formatted || 'N/A'}
											</div>
											<div class="text-xs text-gray-400">
												{dbSize.total_file_size?.bytes?.toLocaleString() || '0'} bytes
											</div>
										</div>
									</div>
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
