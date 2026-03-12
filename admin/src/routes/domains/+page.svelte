<script lang="ts">
	import { useQueryClient } from '@tanstack/svelte-query';
	import { authorizationStore } from '$lib/stores/authorization';
	import {
		createReadObjectDnsTableGet,
		createCreateObjectDnsTablePost,
		createUpdateObjectDnsTablePut,
		createDeleteObjectDnsTableDelete,
		getReadObjectDnsTableGetQueryKey,
		updateAdsDnsAdsGet
	} from '$lib/api/generated/dns/dns';
	import { Tables } from '$lib/api/generated/models';
	import type {
		ApiResponse,
		CreateObjectDnsTablePostBody,
		UpdateObjectDnsTablePutBody
	} from '$lib/api/generated/models';
	import {
		ChevronLeft,
		ChevronRight,
		Plus,
		XMark,
		PencilSquare,
		Trash,
		ArrowPath,
		ArrowDownTray
	} from 'svelte-heros-v2';
	import type { Domain, DomainFormData } from '$lib/models/domain';
	import type { Category } from '$lib/models/category';
	import { parseTableResponse } from '$lib/api/fetchTableData';
	import { getErrorMessage } from '$lib/utils/errorHandler';

	const queryClient = useQueryClient();
	let user = $derived($authorizationStore);
	let currentPage = $state(1);
	let itemsPerPage = $state(12);

	// Filter state
	let searchName = $state('');
	let filterCategory = $state<number | null>(null);
	let filterStatus = $state<boolean | null>(null);
	let filterStatusString = $state<string>('all');

	// Categories for dropdown (all, one page)
	const categoriesQuery = createReadObjectDnsTableGet<{ items: Category[]; totalItems: number }>(
		() => Tables.category,
		() => ({ page_number: 1, items_per_page: 1000 }),
		() => ({
			request: { headers: { Authorization: `Bearer ${user.token}` } },
			query: {
				select: (res) =>
					parseTableResponse<Category>(
						{ status: res.status, data: res.data as ApiResponse | undefined },
						{ itemsPerPage: 1000, currentPage: 1 }
					),
			},
		})
	);
	let allCategories = $derived(categoriesQuery.data?.items ?? []);
	let isLoadingCategories = $derived(categoriesQuery.isPending);

	// Domain list params: one filter at a time (name > category > status)
	function getDomainParams() {
		let filter_field: string | undefined;
		let filter_value: string | undefined;
		let filter_operator: 'eq' | 'like' | undefined;
		if (searchName.trim()) {
			filter_field = 'name';
			filter_value = searchName.trim();
			filter_operator = 'like';
		} else if (filterCategory !== null) {
			filter_field = 'category_id';
			filter_value = String(filterCategory);
			filter_operator = 'eq';
		} else if (filterStatus !== null) {
			filter_field = 'isactive';
			filter_value = filterStatus ? 'true' : 'false';
			filter_operator = 'eq';
		}
		return {
			page_number: currentPage,
			items_per_page: itemsPerPage,
			...(filter_field && filter_value && filter_operator
				? { filter_field, filter_value, filter_operator }
				: {}),
		};
	}

	const domainsQuery = createReadObjectDnsTableGet<{ items: Domain[]; totalItems: number }>(
		() => Tables.domain,
		() => getDomainParams(),
		() => ({
			request: { headers: { Authorization: `Bearer ${user.token}` } },
			query: {
				select: (res) =>
					parseTableResponse<Domain>(
						{ status: res.status, data: res.data as ApiResponse | undefined },
						{ itemsPerPage, currentPage }
					),
			},
		})
	);

	let domains = $derived(domainsQuery.data?.items ?? []);
	let totalItems = $derived(domainsQuery.data?.totalItems ?? 0);
	let isLoading = $derived(domainsQuery.isPending);
	let error = $derived((domainsQuery.error as Error | undefined)?.message ?? null);
	let totalPages = $derived(
		Math.max(1, Math.ceil(totalItems / itemsPerPage) || (domains.length > 0 ? 1 : 0))
	);

	// Create Modal state
	let isModalOpen = $state(false);
	let createError = $state<string | null>(null);
	let formData = $state<DomainFormData>({
		name: '',
		category_id: 0,
		isactive: true,
		ip: '127.0.0.1'
	});

	const createDomainMutation = createCreateObjectDnsTablePost(() => ({
		request: { headers: { Authorization: `Bearer ${user.token}` } },
		mutation: {
			onSuccess: (_, variables) => {
				closeModal();
				queryClient.invalidateQueries({ queryKey: getReadObjectDnsTableGetQueryKey(variables.table) });
			},
		},
	}));
	let isCreating = $derived(createDomainMutation.isPending);
	$effect(() => {
		createError = (createDomainMutation.error as Error | undefined)?.message ?? null;
	});

	// Edit Modal state
	let isEditModalOpen = $state(false);
	let updateError = $state<string | null>(null);
	let editingDomain = $state<Domain | null>(null);
	let editFormData = $state<DomainFormData>({
		name: '',
		category_id: 0,
		isactive: true,
		ip: '127.0.0.1'
	});

	const updateDomainMutation = createUpdateObjectDnsTablePut(() => ({
		request: { headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'application/json' } },
		mutation: {
			onSuccess: (_, variables) => {
				closeEditModal();
				queryClient.invalidateQueries({ queryKey: getReadObjectDnsTableGetQueryKey(variables.table) });
			},
		},
	}));
	let isUpdating = $derived(updateDomainMutation.isPending);
	$effect(() => {
		updateError = (updateDomainMutation.error as Error | undefined)?.message ?? null;
	});

	// Delete Modal state
	let isDeleteModalOpen = $state(false);
	let deleteError = $state<string | null>(null);
	let domainToDelete = $state<Domain | null>(null);

	const deleteDomainMutation = createDeleteObjectDnsTableDelete(() => ({
		request: { headers: { Authorization: `Bearer ${user.token}` } },
		mutation: {
			onSuccess: (_, variables) => {
				closeDeleteModal();
				queryClient.invalidateQueries({ queryKey: getReadObjectDnsTableGetQueryKey(variables.table) });
			},
		},
	}));
	let isDeleting = $derived(deleteDomainMutation.isPending);
	$effect(() => {
		deleteError = (deleteDomainMutation.error as Error | undefined)?.message ?? null;
	});

	function clearFilters() {
		searchName = '';
		filterCategory = null;
		filterStatus = null;
		filterStatusString = 'all';
		currentPage = 1;
	}

	function applyFilters() {
		currentPage = 1;
	}

	// Clear other filters when one is selected (only one filter active at a time)
	function handleSearchChange() {
		// If search has content, clear other filters
		if (searchName.trim()) {
			filterCategory = null;
			filterStatus = null;
			filterStatusString = 'all';
		}
		handleSearchInput();
	}

	function handleCategoryChange() {
		// If category is selected, clear other filters
		if (filterCategory !== null) {
			searchName = '';
			filterStatus = null;
			filterStatusString = 'all';
		}
		applyFilters();
	}

	function handleStatusChange() {
		// Convert string to boolean
		if (filterStatusString === 'all') {
			filterStatus = null;
		} else {
			filterStatus = filterStatusString === 'active';
		}
		// If status is selected, clear other filters
		if (filterStatus !== null) {
			searchName = '';
			filterCategory = null;
		}
		applyFilters();
	}

	function goToPage(page: number) {
		if (page >= 1 && page <= totalPages) {
			currentPage = page;
		}
	}

	// Debounce search input
	let searchTimeout: ReturnType<typeof setTimeout> | null = null;
	function handleSearchInput() {
		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}
		searchTimeout = setTimeout(() => {
			currentPage = 1;
		}, 500);
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

	function getCategoryName(categoryId: number): string {
		const category = allCategories.find((c) => c.id === categoryId);
		return category?.name || `Category #${categoryId}`;
	}

	function truncateDomainName(name: string, maxLength: number = 32): string {
		if (!name || name.length <= maxLength) {
			return name;
		}
		return name.substring(0, maxLength) + '...';
	}

	// Update Ads state
	let isUpdatingAds = $state(false);
	let updateAdsError = $state<string | null>(null);
	let updateAdsSuccess = $state(false);

	async function handleUpdateAds() {
		if (!user.token) {
			updateAdsError = 'Not authenticated';
			return;
		}

		isUpdatingAds = true;
		updateAdsError = null;
		updateAdsSuccess = false;

		try {
			const response = await updateAdsDnsAdsGet({
				headers: {
					Authorization: `Bearer ${user.token}`
				}
			});

			if (response.status === 200 && response.data) {
				const apiResponse = response.data as ApiResponse;
				if (apiResponse.success) {
					updateAdsSuccess = true;
					queryClient.invalidateQueries({ queryKey: getReadObjectDnsTableGetQueryKey(Tables.domain) });
					setTimeout(() => {
						updateAdsSuccess = false;
					}, 3000);
				} else {
					updateAdsError = getErrorMessage(apiResponse, 'Failed to update ads domains');
				}
			} else {
				const errorResponse = response.data as ApiResponse | undefined;
				updateAdsError = getErrorMessage(errorResponse, 'Failed to update ads domains');
			}
		} catch (err) {
			console.error('Error updating ads domains:', err);
			updateAdsError = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			isUpdatingAds = false;
		}
	}

	function openModal() {
		isModalOpen = true;
		createError = null;
		formData = {
			name: '',
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

	function openEditModal(domain: Domain) {
		editingDomain = domain;
		isEditModalOpen = true;
		updateError = null;
		editFormData = {
			name: domain.name || '',
			category_id: domain.category_id || 0,
			isactive: domain.isactive ?? true,
			ip: domain.ip || '127.0.0.1'
		};
	}

	function closeEditModal() {
		isEditModalOpen = false;
		updateError = null;
		editingDomain = null;
		editFormData = {
			name: '',
			category_id: 0,
			isactive: true,
			ip: '127.0.0.1'
		};
	}

	function openDeleteModal(domain: Domain) {
		domainToDelete = domain;
		isDeleteModalOpen = true;
		deleteError = null;
	}

	function closeDeleteModal() {
		isDeleteModalOpen = false;
		deleteError = null;
		domainToDelete = null;
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
			table: Tables.domain,
			data: {
				name: trimmedName,
				category_id: formData.category_id,
				isactive: formData.isactive,
				ip: formData.ip || '127.0.0.1'
			}
		});
	}

	function handleUpdateDomain() {
		if (!user.token || !editingDomain?.id) {
			updateError = 'Not authenticated or invalid domain';
			return;
		}
		const trimmedName = editFormData.name?.trim() || '';
		if (!trimmedName) {
			updateError = 'Domain name is required';
			return;
		}
		if (!editFormData.category_id || editFormData.category_id === 0) {
			updateError = 'Category is required';
			return;
		}
		updateError = null;
		updateDomainMutation.mutate({
			table: Tables.domain,
			data: {
				id: editingDomain.id,
				name: trimmedName,
				category_id: editFormData.category_id,
				isactive: editFormData.isactive,
				ip: editFormData.ip || '127.0.0.1'
			},
			params: { key_field: 'id' }
		});
	}

	function handleDeleteDomain() {
		if (!user.token || !domainToDelete?.id) {
			deleteError = 'Not authenticated or invalid domain';
			return;
		}
		deleteError = null;
		deleteDomainMutation.mutate({
			table: Tables.domain,
			params: { key_field: 'id', key_value: domainToDelete.id.toString() }
		});
	}

	// Close modals on Escape key
	$effect(() => {
		function handleEscape(e: KeyboardEvent) {
			if (e.key === 'Escape') {
				if (isModalOpen) closeModal();
				if (isEditModalOpen) closeEditModal();
				if (isDeleteModalOpen) closeDeleteModal();
			}
		}

		if (isModalOpen || isEditModalOpen || isDeleteModalOpen) {
			document.addEventListener('keydown', handleEscape);
			return () => {
				document.removeEventListener('keydown', handleEscape);
			};
		}
	});
</script>

<div>
	<!-- Header with Filter Bar and Create Button -->
	<div class="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
		<!-- Create Domain Button -->
		<button
			onclick={openModal}
			class="flex items-center justify-center p-2 md:px-4 md:py-2 md:gap-2 rounded-md bg-gradient-to-r from-violet-600 to-purple-600 font-medium text-white shadow-lg transition-all hover:from-violet-700 hover:to-purple-700"
		>
			<Plus class="h-5 w-5" />
			<span class="hidden md:inline">Create Domain</span>
		</button>

		<!-- Update Ads Button -->
		<button
			type="button"
			onclick={handleUpdateAds}
			disabled={isUpdatingAds}
			class="flex items-center justify-center p-2 md:px-4 md:py-2 md:gap-2 rounded-md border border-white/30 bg-white/10 font-medium text-white shadow transition-all hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
		>
			{#if isUpdatingAds}
				<ArrowPath class="h-5 w-5 animate-spin" />
				<span class="hidden md:inline">Updating…</span>
			{:else}
				<ArrowPath class="h-5 w-5" />
				<span class="hidden md:inline">Update Ads</span>
			{/if}
		</button>

		<!-- Separator -->
		<div class="hidden md:block h-8 w-px bg-white/20"></div>

		<!-- Search, Filters, and Refresh -->
		<div class="flex flex-1 flex-col gap-4 md:flex-row md:items-center">
			<!-- Search by Name -->
			<input
				id="search-name"
				type="text"
				bind:value={searchName}
				oninput={handleSearchChange}
				placeholder="Search domain name..."
				class="flex-1 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-gray-200 backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
			/>

			<!-- Filter by Category -->
			<select
				id="filter-category"
				bind:value={filterCategory}
				onchange={handleCategoryChange}
				class="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
			>
				<option value={null}>All Categories</option>
				{#each allCategories as category}
					{#if category.id !== undefined}
						<option value={category.id}>{category.name || `Category #${category.id}`}</option>
					{/if}
				{/each}
			</select>

			<!-- Filter by Status -->
			<select
				id="filter-status"
				bind:value={filterStatusString}
				onchange={handleStatusChange}
				class="rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
			>
				<option value="all">All</option>
				<option value="active">Active</option>
				<option value="inactive">Inactive</option>
			</select>

			<!-- Refresh/Clear Filters Button -->
			<button
				onclick={clearFilters}
				class="flex items-center justify-center rounded-md border border-white/20 bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
				aria-label="Clear filters"
			>
				<ArrowPath class="h-5 w-5" />
			</button>
		</div>
	</div>

	{#if error}
		<div class="mb-6 rounded-lg border border-red-500/30 bg-red-500/20 p-4 backdrop-blur-sm">
			<p class="text-red-200">{error}</p>
		</div>
	{/if}

	{#if updateAdsError}
		<div class="mb-6 rounded-lg border border-red-500/30 bg-red-500/20 p-4 backdrop-blur-sm">
			<p class="text-red-200">{updateAdsError}</p>
		</div>
	{/if}

	{#if updateAdsSuccess}
		<div class="mb-6 rounded-lg border border-green-500/30 bg-green-500/20 p-4 backdrop-blur-sm">
			<p class="text-green-200">Ads domains updated successfully!</p>
		</div>
	{/if}

	{#if isLoading && domains.length === 0}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each Array(6) as _}
				<div class="h-32 animate-pulse rounded-lg border border-white/20 bg-white/5"></div>
			{/each}
		</div>
	{:else if domains.length === 0 && !isLoading}
		<div class="rounded-lg border border-white/20 bg-white/10 p-8 text-center backdrop-blur-sm">
			<p class="text-gray-300">No domains found</p>
		</div>
	{:else}
		<!-- Domains Grid -->
		<div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each domains as domain}
				<div
					class="relative rounded-lg border border-white/20 bg-white/10 p-6 shadow-lg backdrop-blur-sm transition-all hover:bg-white/15"
				>
					<!-- Action Buttons -->
					<div class="absolute top-2 right-2 flex gap-1">
						<button
							onclick={() => openEditModal(domain)}
							class="rounded-md p-1.5 text-gray-300 transition-colors hover:bg-white/20 hover:text-white"
							aria-label="Edit domain"
						>
							<PencilSquare class="h-5 w-5" />
						</button>
						<button
							onclick={() => openDeleteModal(domain)}
							class="rounded-md p-1.5 text-gray-300 transition-colors hover:bg-red-500/20 hover:text-red-300"
							aria-label="Delete domain"
						>
							<Trash class="h-5 w-5" />
						</button>
					</div>
					<div class="space-y-2 pr-12">
						{#if domain.name !== undefined}
							<h3 class="text-xl font-semibold text-purple-300" title={domain.name}>
								{truncateDomainName(domain.name)}
							</h3>
						{/if}
						{#if domain.category_id !== undefined}
							<p class="text-gray-300">
								<span class="font-medium text-white">Category:</span>
								{getCategoryName(domain.category_id)}
							</p>
						{/if}
						{#if domain.ip !== undefined}
							<p class="text-gray-300">
								<span class="font-medium text-white">IP:</span>
								{domain.ip}
							</p>
						{/if}
						<div class="flex items-center gap-2">
							<span class="font-medium text-white">Status:</span>
							<span
								class="rounded-full px-2 py-1 text-xs font-medium {domain.isactive
									? 'bg-green-500/20 text-green-300'
									: 'bg-red-500/20 text-red-300'}"
							>
								{domain.isactive ? 'Active' : 'Inactive'}
							</span>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Pagination (Unified for all screen sizes) -->
		{#if totalPages > 0 || domains.length > 0}
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
			<h2 id="modal-title" class="text-2xl font-bold text-white">Create New Domain</h2>
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
					class="flex items-center justify-center p-2 md:px-4 md:py-2 rounded-md border border-white/20 bg-white/10 font-medium text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
				>
					<span class="hidden md:inline">Cancel</span>
					<span class="md:hidden">✕</span>
				</button>
				<button
					type="submit"
					disabled={isCreating}
					class="flex items-center justify-center p-2 md:px-4 md:py-2 md:gap-2 rounded-md bg-gradient-to-r from-violet-600 to-purple-600 font-medium text-white shadow-lg transition-all hover:from-violet-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
				>
					<Plus class="h-5 w-5" />
					<span class="hidden md:inline">{isCreating ? 'Creating...' : 'Create Domain'}</span>
				</button>
			</div>
		</form>
	</div>
{/if}

<!-- Edit Domain Modal -->
{#if isEditModalOpen && editingDomain}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm"
		onclick={closeEditModal}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				closeEditModal();
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
		aria-labelledby="edit-modal-title"
		tabindex="-1"
		onclick={(e) => e.stopPropagation()}
		onkeydown={(e) => {
			if (e.key === 'Escape') {
				closeEditModal();
			}
		}}
	>
		<!-- Header -->
		<div class="mb-4 flex items-center justify-between">
			<h2 id="edit-modal-title" class="text-2xl font-bold text-white">Edit Domain</h2>
			<button
				onclick={closeEditModal}
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
				handleUpdateDomain();
			}}
			class="space-y-4"
		>
			{#if updateError}
				<div class="rounded-lg border border-red-500/30 bg-red-500/20 p-3 backdrop-blur-sm">
					<p class="text-sm text-red-200">{updateError}</p>
				</div>
			{/if}

			<!-- Name Field -->
			<div>
				<label for="edit-domain-name" class="block text-sm font-medium text-gray-200">
					Domain Name <span class="text-red-400">*</span>
				</label>
				<input
					id="edit-domain-name"
					type="text"
					required
					bind:value={editFormData.name}
					placeholder="www.example.com"
					pattern="^[a-zA-Z0-9][a-zA-Z0-9.-]+[a-zA-Z0-9]$"
					class="mt-1 block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-gray-400 backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
					disabled={isUpdating}
				/>
				<p class="mt-1 text-xs text-gray-400">Must be a valid DNS domain</p>
			</div>

			<!-- Category Field -->
			<div>
				<label for="edit-domain-category" class="block text-sm font-medium text-gray-200">
					Category <span class="text-red-400">*</span>
				</label>
				{#if isLoadingCategories}
					<div class="mt-1 text-sm text-gray-400">Loading categories...</div>
				{:else if allCategories.length === 0}
					<div class="mt-1 text-sm text-red-400">No categories available</div>
				{:else}
					<select
						id="edit-domain-category"
						required
						bind:value={editFormData.category_id}
						class="mt-1 block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
						disabled={isUpdating}
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
				<label for="edit-domain-ip" class="block text-sm font-medium text-gray-200"
					>IP Address</label
				>
				<input
					id="edit-domain-ip"
					type="text"
					bind:value={editFormData.ip}
					placeholder="127.0.0.1"
					class="mt-1 block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-gray-400 backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
					disabled={isUpdating}
				/>
				<p class="mt-1 text-xs text-gray-400">IP where the domain will be redirected</p>
			</div>

			<!-- Is Active Field -->
			<div class="flex items-center gap-2">
				<input
					id="edit-domain-isactive"
					type="checkbox"
					bind:checked={editFormData.isactive}
					class="rounded border-white/20 bg-white/10 text-violet-600 focus:ring-violet-500"
					disabled={isUpdating}
				/>
				<label for="edit-domain-isactive" class="block text-sm font-medium text-gray-200">
					Domain is active
				</label>
			</div>

			<!-- Actions -->
			<div class="flex justify-end gap-3 pt-4">
				<button
					type="button"
					onclick={closeEditModal}
					disabled={isUpdating}
					class="flex items-center justify-center p-2 md:px-4 md:py-2 rounded-md border border-white/20 bg-white/10 font-medium text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
				>
					<span class="hidden md:inline">Cancel</span>
					<span class="md:hidden">✕</span>
				</button>
				<button
					type="submit"
					disabled={isUpdating}
					class="flex items-center justify-center p-2 md:px-4 md:py-2 md:gap-2 rounded-md bg-gradient-to-r from-violet-600 to-purple-600 font-medium text-white shadow-lg transition-all hover:from-violet-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
				>
					<PencilSquare class="h-5 w-5" />
					<span class="hidden md:inline">{isUpdating ? 'Updating...' : 'Update Domain'}</span>
				</button>
			</div>
		</form>
	</div>
{/if}

<!-- Delete Domain Confirmation Modal -->
{#if isDeleteModalOpen && domainToDelete}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm"
		onclick={closeDeleteModal}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				closeDeleteModal();
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
		aria-labelledby="delete-modal-title"
		tabindex="-1"
		onclick={(e) => e.stopPropagation()}
		onkeydown={(e) => {
			if (e.key === 'Escape') {
				closeDeleteModal();
			}
		}}
	>
		<!-- Header -->
		<div class="mb-4 flex items-center justify-between">
			<h2 id="delete-modal-title" class="text-2xl font-bold text-white">Delete Domain</h2>
			<button
				onclick={closeDeleteModal}
				class="rounded-md p-1 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
				aria-label="Close modal"
			>
				<XMark class="h-6 w-6" />
			</button>
		</div>

		<!-- Content -->
		<div class="space-y-4">
			{#if deleteError}
				<div class="rounded-lg border border-red-500/30 bg-red-500/20 p-3 backdrop-blur-sm">
					<p class="text-sm text-red-200">{deleteError}</p>
				</div>
			{/if}

			<p class="text-gray-200">
				Are you sure you want to delete the domain
				<span class="font-semibold text-white">
					{domainToDelete.name || `ID: ${domainToDelete.id}`}
				</span>
				? This action cannot be undone.
			</p>

			<!-- Actions -->
			<div class="flex justify-end gap-3 pt-4">
				<button
					type="button"
					onclick={closeDeleteModal}
					disabled={isDeleting}
					class="flex items-center justify-center p-2 md:px-4 md:py-2 rounded-md border border-white/20 bg-white/10 font-medium text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
				>
					<span class="hidden md:inline">Cancel</span>
					<span class="md:hidden">✕</span>
				</button>
				<button
					type="button"
					onclick={handleDeleteDomain}
					disabled={isDeleting}
					class="flex items-center justify-center p-2 md:px-4 md:py-2 md:gap-2 rounded-md bg-gradient-to-r from-red-600 to-red-700 font-medium text-white shadow-lg transition-all hover:from-red-700 hover:to-red-800 disabled:cursor-not-allowed disabled:opacity-50"
				>
					<Trash class="h-5 w-5" />
					<span class="hidden md:inline">{isDeleting ? 'Deleting...' : 'Delete Domain'}</span>
				</button>
			</div>
		</div>
	</div>
{/if}
