<script lang="ts">
	import { useQueryClient } from '@tanstack/svelte-query';
	import { authorizationStore } from '$lib/stores/authorization';
	import {
		createListMetricsDatabaseMetricGet,
		createListCategoriesDatabaseCategoryGet,
		createCreateDomainDatabaseDomainPost,
		getListMetricsDatabaseMetricGetQueryKey
	} from '$lib/api/generated/database/database';
	import type { ApiResponse } from '$lib/api/generated/models';
	import { parseTableResponse } from '$lib/api/fetchTableData';
	import { ChevronLeft, ChevronRight, ArrowPath, Plus, XMark } from 'svelte-heros-v2';
	import type { Metric } from '$lib/models/metric';
	import type { Category } from '$lib/models/category';
	import type { DomainFormData } from '$lib/models/domain';
	import { getErrorMessage } from '$lib/utils/errorHandler';

	const queryClient = useQueryClient();
	let user = $derived($authorizationStore);
	let currentPage = $state(1);
	let itemsPerPage = $state(12);

	// Search state - two separate search fields
	let searchDomain = $state('');
	let searchClientIp = $state('');

	// Filter state
	let filterCategory = $state<number | null>(null);
	let filterBlocked = $state<boolean | null>(null);
	let filterBlockedString = $state<string>('all');

	const categoriesQuery = createListCategoriesDatabaseCategoryGet<{
		items: Category[];
		totalItems: number;
	}>(
		() => ({ page_number: 1, items_per_page: 1000 }),
		() => ({
			request: { headers: { Authorization: `Bearer ${user.token}` } },
			query: {
				select: (res) =>
					parseTableResponse<Category>(
						{ status: res.status, data: res.data as ApiResponse | undefined },
						{ itemsPerPage: 1000, currentPage: 1 }
					)
			}
		})
	);
	let allCategories = $derived(categoriesQuery.data?.items ?? []);
	let isLoadingCategories = $derived(categoriesQuery.isPending);

	function getMetricParams() {
		const base: { page_number: number; items_per_page: number; order_by: string } = {
			page_number: currentPage,
			items_per_page: itemsPerPage,
			order_by: '-timestamp'
		};
		if (searchDomain.trim()) {
			return {
				...base,
				filter_field: 'domain',
				filter_value: searchDomain.trim(),
				filter_operator: 'like'
			};
		}
		if (searchClientIp.trim()) {
			return {
				...base,
				filter_field: 'client_ip',
				filter_value: searchClientIp.trim(),
				filter_operator: 'like'
			};
		}
		if (filterCategory !== null) {
			return {
				...base,
				filter_field: 'category_id',
				filter_value: String(filterCategory),
				filter_operator: 'eq'
			};
		}
		if (filterBlocked !== null) {
			return {
				...base,
				filter_field: 'blocked',
				filter_value: filterBlocked ? 'true' : 'false',
				filter_operator: 'eq'
			};
		}
		return base;
	}

	function applyClientSideFilters(items: Metric[]): Metric[] {
		if (searchDomain.trim() && searchClientIp.trim()) {
			return items.filter((m) =>
				m.client_ip?.toLowerCase().includes(searchClientIp.trim().toLowerCase())
			);
		}
		if (searchDomain.trim() && filterCategory !== null) {
			return items.filter((m) => m.category_id === filterCategory);
		}
		if (searchDomain.trim() && filterBlocked !== null) {
			return items.filter((m) => m.blocked === filterBlocked);
		}
		if (searchClientIp.trim() && filterCategory !== null) {
			return items.filter((m) => m.category_id === filterCategory);
		}
		if (searchClientIp.trim() && filterBlocked !== null) {
			return items.filter((m) => m.blocked === filterBlocked);
		}
		if (filterCategory !== null && filterBlocked !== null) {
			return items.filter((m) => m.blocked === filterBlocked);
		}
		return items;
	}

	const metricsQuery = createListMetricsDatabaseMetricGet<{ items: Metric[]; totalItems: number }>(
		() => getMetricParams(),
		() => ({
			request: { headers: { Authorization: `Bearer ${user.token}` } },
			query: {
				select: (res) => {
					const parsed = parseTableResponse<Metric>(
						{ status: res.status, data: res.data as ApiResponse | undefined },
						{ itemsPerPage, currentPage }
					);
					return {
						...parsed,
						items: applyClientSideFilters(parsed.items)
					};
				}
			}
		})
	);

	let metrics = $derived(metricsQuery.data?.items ?? []);
	let totalItems = $derived(metricsQuery.data?.totalItems ?? 0);
	let isLoading = $derived(metricsQuery.isPending);
	let error = $derived((metricsQuery.error as Error | undefined)?.message ?? null);
	let totalPages = $derived(
		Math.max(1, Math.ceil(totalItems / itemsPerPage) || (metrics.length > 0 ? 1 : 0))
	);

	// Create Domain Modal state
	let isModalOpen = $state(false);
	let createError = $state<string | null>(null);
	let formData = $state<DomainFormData>({
		name: '',
		category_id: 0,
		isactive: true,
		ip: '127.0.0.1'
	});

	const createDomainMutation = createCreateDomainDatabaseDomainPost(() => ({
		request: { headers: { Authorization: `Bearer ${user.token}` } },
		mutation: {
			onSuccess: () => {
				closeModal();
				queryClient.invalidateQueries({ queryKey: getListMetricsDatabaseMetricGetQueryKey() });
			}
		}
	}));
	let isCreating = $derived(createDomainMutation.isPending);
	$effect(() => {
		createError = (createDomainMutation.error as Error | undefined)?.message ?? null;
	});

	function clearFilters() {
		searchDomain = '';
		searchClientIp = '';
		filterCategory = null;
		filterBlocked = null;
		filterBlockedString = 'all';
		currentPage = 1;
	}

	function applyFilters() {
		currentPage = 1;
	}

	// Debounce search inputs
	let searchDomainTimeout: ReturnType<typeof setTimeout> | null = null;
	function handleDomainSearchInput() {
		if (searchDomainTimeout) clearTimeout(searchDomainTimeout);
		searchDomainTimeout = setTimeout(() => {
			currentPage = 1;
		}, 500);
	}

	let searchClientIpTimeout: ReturnType<typeof setTimeout> | null = null;
	function handleClientIpSearchInput() {
		if (searchClientIpTimeout) clearTimeout(searchClientIpTimeout);
		searchClientIpTimeout = setTimeout(() => {
			currentPage = 1;
		}, 500);
	}

	function handleCategoryChange() {
		applyFilters();
	}

	function handleBlockedChange() {
		// Convert string to boolean
		if (filterBlockedString === 'all') {
			filterBlocked = null;
		} else {
			filterBlocked = filterBlockedString === 'blocked';
		}
		applyFilters();
	}

	function goToPage(page: number) {
		if (page >= 1 && page <= totalPages) {
			currentPage = page;
		}
	}

	function previousPage() {
		if (currentPage > 1) {
			goToPage(currentPage - 1);
		}
	}

	function nextPage() {
		if (currentPage < totalPages) {
			goToPage(currentPage + 1);
		}
	}

	// Jump to page state and handler
	let jumpToPageInput = $state('');
	let jumpToPageError = $state<string | null>(null);
	let isJumpInputFocused = $state(false);
	let lastSyncedPage = $state(0);

	// Sync input with current page when page changes (only when page actually changes, not on blur)
	$effect(() => {
		// Only sync if the page actually changed (via navigation) and input is not focused
		if (!isJumpInputFocused && currentPage !== lastSyncedPage) {
			jumpToPageInput = currentPage.toString();
			lastSyncedPage = currentPage;
		}
	});

	function handleJumpToPage() {
		jumpToPageError = null;
		// Convert to string first, then parse (handles both string and number inputs)
		const inputValue = String(jumpToPageInput || '').trim();
		const pageNum = parseInt(inputValue, 10);

		if (!inputValue || isNaN(pageNum) || pageNum < 1 || pageNum > totalPages) {
			jumpToPageError = `Please enter a number between 1 and ${totalPages}`;
			return;
		}

		// Update lastSyncedPage before navigation so effect doesn't override
		lastSyncedPage = currentPage;
		goToPage(pageNum);
		// Input will be synced with new currentPage via effect after navigation
	}

	function handleJumpInputKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleJumpToPage();
		}
	}

	function getCategoryName(categoryId: number | null | undefined): string {
		if (!categoryId) return 'N/A';
		const category = allCategories.find((c) => c.id === categoryId);
		return category?.name || `Category #${categoryId}`;
	}

	function formatTimestamp(timestamp: string): string {
		try {
			const date = new Date(timestamp);
			return date.toLocaleString();
		} catch {
			return timestamp;
		}
	}

	function openCreateDomainModal(domainName: string) {
		isModalOpen = true;
		createError = null;
		formData = {
			name: domainName,
			category_id: 0,
			isactive: true,
			ip: '127.0.0.1'
		};
	}

	function closeModal() {
		isModalOpen = false;
		createError = null;
		formData = {
			name: '',
			category_id: 0,
			isactive: true,
			ip: '127.0.0.1'
		};
	}

	function handleCreateDomain() {
		if (!user.token) {
			createError = 'Not authenticated';
			return;
		}
		const trimmedName = formData.name?.trim() || '';
		if (!trimmedName) {
			createError = 'Domain name is required';
			return;
		}
		if (!formData.category_id || formData.category_id === 0) {
			createError = 'Category is required';
			return;
		}
		createError = null;
		createDomainMutation.mutate({
			data: {
				name: trimmedName,
				category_id: formData.category_id,
				isactive: formData.isactive,
				ip: formData.ip || '127.0.0.1'
			}
		});
	}

	// Close modal on Escape key
	$effect(() => {
		function handleEscape(e: KeyboardEvent) {
			if (e.key === 'Escape' && isModalOpen) {
				closeModal();
			}
		}

		if (isModalOpen) {
			document.addEventListener('keydown', handleEscape);
			return () => {
				document.removeEventListener('keydown', handleEscape);
			};
		}
	});
</script>

<div>
	<!-- Header with Filter Bar -->
	<div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
		<!-- Filter Bar -->
		<div class="flex-1">
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
				<!-- Search by Domain -->
				<div class="lg:col-span-2">
					<input
						id="search-domain"
						type="text"
						bind:value={searchDomain}
						oninput={handleDomainSearchInput}
						placeholder="Search domain..."
						class="block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-gray-200 backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
					/>
				</div>

				<!-- Search by Client IP -->
				<div class="lg:col-span-2">
					<input
						id="search-client-ip"
						type="text"
						bind:value={searchClientIp}
						oninput={handleClientIpSearchInput}
						placeholder="Search client IP..."
						class="block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-gray-200 backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
					/>
				</div>

				<!-- Filter by Category -->
				<div>
					<select
						id="filter-category"
						bind:value={filterCategory}
						onchange={handleCategoryChange}
						class="block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
					>
						<option value={null}>All Categories</option>
						{#each allCategories as category}
							{#if category.id !== undefined}
								<option value={category.id}>{category.name || `Category #${category.id}`}</option>
							{/if}
						{/each}
					</select>
				</div>

				<!-- Filter by Blocked Status -->
				<div>
					<select
						id="filter-blocked"
						bind:value={filterBlockedString}
						onchange={handleBlockedChange}
						class="block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
					>
						<option value="all">All</option>
						<option value="blocked">Blocked</option>
						<option value="allowed">Allowed</option>
					</select>
				</div>
			</div>
		</div>

		<!-- Clear Filters Button -->
		<div class="flex items-center gap-4">
			{#if isLoading}
				<div class="text-gray-300">Loading...</div>
			{/if}
			<button
				onclick={clearFilters}
				class="flex items-center justify-center gap-2 rounded-md border border-white/20 bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
				aria-label="Clear filters"
			>
				<ArrowPath class="h-5 w-5" />
				<span class="hidden sm:inline">Clear Filters</span>
			</button>
		</div>
	</div>

	{#if error}
		<div class="mb-6 rounded-lg border border-red-500/30 bg-red-500/20 p-4 backdrop-blur-sm">
			<p class="text-red-200">{error}</p>
		</div>
	{/if}

	{#if isLoading && metrics.length === 0}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each Array(6) as _}
				<div class="h-32 animate-pulse rounded-lg border border-white/20 bg-white/5"></div>
			{/each}
		</div>
	{:else if metrics.length === 0 && !isLoading}
		<div class="rounded-lg border border-white/20 bg-white/10 p-8 text-center backdrop-blur-sm">
			<p class="text-gray-300">No metrics found</p>
		</div>
	{:else}
		<!-- Metrics Grid -->
		<div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each metrics as metric}
				<div
					class="relative rounded-lg border border-white/20 bg-white/10 p-6 shadow-lg backdrop-blur-sm transition-all hover:bg-white/15"
				>
					<!-- Create Domain Button -->
					{#if metric.domain}
						<button
							onclick={() => openCreateDomainModal(metric.domain)}
							class="absolute top-2 right-2 rounded-md p-1.5 text-violet-300 transition-colors hover:bg-violet-500/20 hover:text-violet-200"
							aria-label="Create domain filter"
							title="Create domain filter"
						>
							<Plus class="h-5 w-5" />
						</button>
					{/if}
					<div class="space-y-2 pr-8">
						{#if metric.domain !== undefined}
							<h3 class="text-xl font-semibold text-white">{metric.domain}</h3>
						{/if}
						{#if metric.client_ip !== undefined}
							<p class="text-gray-300">
								<span class="font-medium text-white">Client IP:</span>
								{metric.client_ip}
							</p>
						{/if}
						{#if metric.timestamp !== undefined}
							<p class="text-gray-300">
								<span class="font-medium text-white">Timestamp:</span>
								{formatTimestamp(metric.timestamp)}
							</p>
						{/if}
						{#if metric.query_type !== undefined && metric.query_type !== null}
							<p class="text-gray-300">
								<span class="font-medium text-white">Query Type:</span>
								{metric.query_type}
							</p>
						{/if}
						{#if metric.protocol !== undefined && metric.protocol !== null}
							<p class="text-gray-300">
								<span class="font-medium text-white">Protocol:</span>
								{metric.protocol}
							</p>
						{/if}
						{#if metric.category_id !== undefined && metric.category_id !== null}
							<p class="text-gray-300">
								<span class="font-medium text-white">Category:</span>
								{getCategoryName(metric.category_id)}
							</p>
						{/if}
						<div class="flex items-center gap-2">
							<span class="font-medium text-white">Status:</span>
							<span
								class="rounded-full px-2 py-1 text-xs font-medium {metric.blocked
									? 'bg-red-500/20 text-red-300'
									: 'bg-green-500/20 text-green-300'}"
							>
								{metric.blocked ? 'Blocked' : 'Allowed'}
							</span>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Pagination (Unified for all screen sizes) -->
		{#if totalPages > 0 || metrics.length > 0}
			<div
				class="mb-4 flex flex-col gap-4 rounded-lg border border-white/20 bg-white/10 p-4 backdrop-blur-sm md:flex-row md:items-center md:justify-between"
			>
				<!-- Page Info -->
				<div class="text-center text-gray-300 md:text-left">
					<div class="text-sm font-medium md:text-base">Page {currentPage} of {totalPages}</div>
				</div>

				<!-- Navigation Controls -->
				<div class="flex flex-col gap-4 md:flex-row md:items-center md:gap-3">
					<!-- Previous/Next Buttons -->
					<div class="flex gap-3">
						<button
							onclick={previousPage}
							disabled={currentPage === 1 || isLoading}
							class="flex flex-1 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-violet-600 to-purple-600 p-3 text-sm font-medium text-white shadow-lg transition-all hover:from-violet-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50 md:flex-initial md:px-4"
							aria-label="Previous page"
						>
							<ChevronLeft class="h-5 w-5" />
							<span>Previous</span>
						</button>
						<button
							onclick={nextPage}
							disabled={currentPage === totalPages || isLoading}
							class="flex flex-1 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-violet-600 to-purple-600 p-3 text-sm font-medium text-white shadow-lg transition-all hover:from-violet-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50 md:flex-initial md:px-4"
							aria-label="Next page"
						>
							<span>Next</span>
							<ChevronRight class="h-5 w-5" />
						</button>
					</div>

					<!-- Jump to Page -->
					<div class="flex flex-col gap-2">
						<div class="flex flex-col gap-2 md:flex-row md:items-center md:gap-2">
							<div class="flex gap-2">
								<input
									id="jump-to-page"
									type="number"
									min="1"
									max={totalPages}
									bind:value={jumpToPageInput}
									onkeydown={handleJumpInputKeydown}
									onfocus={() => {
										isJumpInputFocused = true;
									}}
									onblur={() => {
										isJumpInputFocused = false;
										// Only reset to current page if input is empty or invalid
										// Don't override valid values - let user keep what they typed
										const inputValue = String(jumpToPageInput || '').trim();
										if (!inputValue || isNaN(parseInt(inputValue, 10))) {
											jumpToPageInput = currentPage.toString();
											lastSyncedPage = currentPage;
										}
									}}
									placeholder="Page"
									class="flex-1 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-gray-200 backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none md:w-32"
								/>
								<button
									onclick={handleJumpToPage}
									disabled={isLoading || !jumpToPageInput || String(jumpToPageInput).trim() === ''}
									class="rounded-md bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all hover:from-violet-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
								>
									Go
								</button>
							</div>
						</div>
						{#if jumpToPageError}
							<p class="text-xs text-red-300">{jumpToPageError}</p>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	{/if}
</div>

<!-- Create Domain Modal -->
{#if isModalOpen}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm"
		onclick={closeModal}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				closeModal();
			}
		}}
		role="button"
		tabindex="0"
		aria-label="Close modal"
	></div>

	<!-- Modal -->
	<div
		class="fixed top-1/2 left-1/2 z-[2001] w-full max-w-md -translate-x-1/2 -translate-y-1/2 transform rounded-lg border border-white/20 bg-gradient-to-br from-violet-900/90 to-purple-900/90 p-6 shadow-2xl backdrop-blur-md"
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-title"
		tabindex="-1"
		onclick={(e) => e.stopPropagation()}
		onkeydown={(e) => {
			if (e.key === 'Escape') {
				closeModal();
			}
		}}
	>
		<!-- Header -->
		<div class="mb-4 flex items-center justify-between">
			<h2 id="modal-title" class="text-2xl font-bold text-white">Block new Domain</h2>
			<button
				onclick={closeModal}
				class="rounded-md p-1 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
				aria-label="Close modal"
			>
				<XMark class="h-6 w-6" />
			</button>
		</div>

		<!-- Form -->
		<form
			onsubmit={(e) => {
				e.preventDefault();
				handleCreateDomain();
			}}
			class="space-y-4"
		>
			{#if createError}
				<div class="rounded-lg border border-red-500/30 bg-red-500/20 p-3 backdrop-blur-sm">
					<p class="text-sm text-red-200">{createError}</p>
				</div>
			{/if}

			<!-- Name Field -->
			<div>
				<label for="domain-name" class="block text-sm font-medium text-gray-200">
					Domain Name <span class="text-red-400">*</span>
				</label>
				<input
					id="domain-name"
					type="text"
					required
					bind:value={formData.name}
					placeholder="www.example.com"
					pattern="^[a-zA-Z0-9][a-zA-Z0-9.-]+[a-zA-Z0-9]$"
					class="mt-1 block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-gray-400 backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
					disabled={isCreating}
				/>
				<p class="mt-1 text-xs text-gray-400">Must be a valid DNS domain</p>
			</div>

			<!-- Category Field -->
			<div>
				<label for="domain-category" class="block text-sm font-medium text-gray-200">
					Category <span class="text-red-400">*</span>
				</label>
				{#if isLoadingCategories}
					<div class="mt-1 text-sm text-gray-400">Loading categories...</div>
				{:else if allCategories.length === 0}
					<div class="mt-1 text-sm text-red-400">No categories available</div>
				{:else}
					<select
						id="domain-category"
						required
						bind:value={formData.category_id}
						class="mt-1 block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
						disabled={isCreating}
					>
						<option value="0">Select a category</option>
						{#each allCategories as category}
							{#if category.id !== undefined}
								<option value={category.id}>{category.name || `Category #${category.id}`}</option>
							{/if}
						{/each}
					</select>
				{/if}
			</div>

			<!-- IP Field -->
			<div>
				<label for="domain-ip" class="block text-sm font-medium text-gray-200">IP Address</label>
				<input
					id="domain-ip"
					type="text"
					bind:value={formData.ip}
					placeholder="127.0.0.1"
					class="mt-1 block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-gray-400 backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
					disabled={isCreating}
				/>
				<p class="mt-1 text-xs text-gray-400">IP where the domain will be redirected</p>
			</div>

			<!-- Is Active Field -->
			<div class="flex items-center gap-2">
				<input
					id="domain-isactive"
					type="checkbox"
					bind:checked={formData.isactive}
					class="rounded border-white/20 bg-white/10 text-violet-600 focus:ring-violet-500"
					disabled={isCreating}
				/>
				<label for="domain-isactive" class="block text-sm font-medium text-gray-200">
					Domain is active
				</label>
			</div>

			<!-- Actions -->
			<div class="flex justify-end gap-3 pt-4">
				<button
					type="button"
					onclick={closeModal}
					disabled={isCreating}
					class="rounded-md border border-white/20 bg-white/10 px-4 py-2 font-medium text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
				>
					Cancel
				</button>
				<button
					type="submit"
					disabled={isCreating}
					class="rounded-md bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 font-medium text-white shadow-lg transition-all hover:from-violet-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{isCreating ? 'Creating...' : 'Create Domain'}
				</button>
			</div>
		</form>
	</div>
{/if}
