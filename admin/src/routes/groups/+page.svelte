<script lang="ts">
	import { useQueryClient } from '@tanstack/svelte-query';
	import { authorizationStore } from '$lib/stores/authorization';
	import {
		createReadObjectDnsTableGet,
		createCreateObjectDnsTablePost,
		createUpdateObjectDnsTablePut,
		createDeleteObjectDnsTableDelete,
		getReadObjectDnsTableGetQueryKey,
	} from '$lib/api/generated/dns/dns';
	import { Tables } from '$lib/api/generated/models';
	import type { ApiResponse } from '$lib/api/generated/models';
	import { parseTableResponse } from '$lib/api/fetchTableData';
	import { ChevronLeft, ChevronRight, Plus, XMark, PencilSquare, Trash } from 'svelte-heros-v2';
	import type { Group, GroupFormData } from '$lib/models/group';
	import type { Category } from '$lib/models/category';
	import type { Client } from '$lib/models/client';

	const queryClient = useQueryClient();
	let user = $derived($authorizationStore);
	let currentPage = $state(1);
	let itemsPerPage = $state(12);

	const validClient = (c: Client) => !!(c.ip && typeof c.ip === 'string' && c.ip.trim().length > 0);

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

	const clientsQuery = createReadObjectDnsTableGet<{ items: Client[]; totalItems: number }>(
		() => Tables.client,
		() => ({ page_number: 1, items_per_page: 1000 }),
		() => ({
			request: { headers: { Authorization: `Bearer ${user.token}` } },
			query: {
				select: (res) => {
					const parsed = parseTableResponse<Client>(
						{ status: res.status, data: res.data as ApiResponse | undefined },
						{ itemsPerPage: 1000, currentPage: 1 }
					);
					return { ...parsed, items: parsed.items.filter(validClient) };
				},
			},
		})
	);
	let allClients = $derived(clientsQuery.data?.items ?? []);
	let isLoadingOptions = $derived(categoriesQuery.isPending || clientsQuery.isPending);

	function parseIds(value: unknown): number[] {
		if (Array.isArray(value)) {
			return value
				.map((v) => (typeof v === 'number' ? v : parseInt(String(v), 10)))
				.filter((v) => !isNaN(v));
		}
		if (typeof value === 'string') {
			try {
				const parsed = JSON.parse(value);
				if (Array.isArray(parsed)) {
					return parsed.map((v) => parseInt(String(v), 10)).filter((v) => !isNaN(v));
				}
			} catch {
				return value
					.split(',')
					.map((v) => parseInt(v.trim(), 10))
					.filter((v) => !isNaN(v));
			}
		}
		return [];
	}

	const groupsQuery = createReadObjectDnsTableGet<{ items: Group[]; totalItems: number }>(
		() => Tables.group,
		() => ({ page_number: currentPage, items_per_page: itemsPerPage }),
		() => ({
			request: { headers: { Authorization: `Bearer ${user.token}` } },
			query: {
				select: (res) => {
					const parsed = parseTableResponse<Group & { categories_ids?: unknown; clients_ids?: unknown }>(
						{ status: res.status, data: res.data as ApiResponse | undefined },
						{ itemsPerPage, currentPage }
					);
					return {
						...parsed,
						items: parsed.items.map((group) => ({
							id: group.id,
							name: group.name,
							categories_ids: parseIds(group.categories_ids),
							clients_ids: parseIds(group.clients_ids)
						}))
					};
				},
			},
		})
	);

	let groups = $derived(groupsQuery.data?.items ?? []);
	let totalItems = $derived(groupsQuery.data?.totalItems ?? 0);
	let isLoading = $derived(groupsQuery.isPending);
	let error = $derived((groupsQuery.error as Error | undefined)?.message ?? null);
	let totalPages = $derived(
		Math.max(1, Math.ceil(totalItems / itemsPerPage) || (groups.length > 0 ? 1 : 0))
	);

	// Create Modal state
	let isModalOpen = $state(false);
	let createError = $state<string | null>(null);
	let formData = $state<GroupFormData>({
		name: '',
		categories_ids: [],
		clients_ids: []
	});

	const createGroupMutation = createCreateObjectDnsTablePost(() => ({
		request: { headers: { Authorization: `Bearer ${user.token}` } },
		mutation: {
			onSuccess: (_, variables) => {
				closeModal();
				queryClient.invalidateQueries({ queryKey: getReadObjectDnsTableGetQueryKey(variables.table) });
			},
		},
	}));
	let isCreating = $derived(createGroupMutation.isPending);
	$effect(() => {
		createError = (createGroupMutation.error as Error | undefined)?.message ?? null;
	});

	// Edit Modal state
	let isEditModalOpen = $state(false);
	let updateError = $state<string | null>(null);
	let editingGroup = $state<Group | null>(null);
	let editFormData = $state<GroupFormData>({
		name: '',
		categories_ids: [],
		clients_ids: []
	});

	const updateGroupMutation = createUpdateObjectDnsTablePut(() => ({
		request: { headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'application/json' } },
		mutation: {
			onSuccess: (_, variables) => {
				closeEditModal();
				queryClient.invalidateQueries({ queryKey: getReadObjectDnsTableGetQueryKey(variables.table) });
			},
		},
	}));
	let isUpdating = $derived(updateGroupMutation.isPending);
	$effect(() => {
		updateError = (updateGroupMutation.error as Error | undefined)?.message ?? null;
	});

	// Delete Modal state
	let isDeleteModalOpen = $state(false);
	let deleteError = $state<string | null>(null);
	let groupToDelete = $state<Group | null>(null);

	const deleteGroupMutation = createDeleteObjectDnsTableDelete(() => ({
		request: { headers: { Authorization: `Bearer ${user.token}` } },
		mutation: {
			onSuccess: (_, variables) => {
				closeDeleteModal();
				queryClient.invalidateQueries({ queryKey: getReadObjectDnsTableGetQueryKey(variables.table) });
			},
		},
	}));
	let isDeleting = $derived(deleteGroupMutation.isPending);
	$effect(() => {
		deleteError = (deleteGroupMutation.error as Error | undefined)?.message ?? null;
	});

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

	function openModal() {
		isModalOpen = true;
		createError = null;
		formData = {
			name: '',
			categories_ids: [],
			clients_ids: []
		};
	}

	function closeModal() {
		isModalOpen = false;
		createError = null;
		formData = {
			name: '',
			categories_ids: [],
			clients_ids: []
		};
	}

	function openEditModal(group: Group) {
		editingGroup = group;
		isEditModalOpen = true;
		updateError = null;

		editFormData = {
			name: group.name || '',
			categories_ids: parseIds(group.categories_ids),
			clients_ids: parseIds(group.clients_ids)
		};
	}

	function closeEditModal() {
		isEditModalOpen = false;
		updateError = null;
		editingGroup = null;
		editFormData = {
			name: '',
			categories_ids: [],
			clients_ids: []
		};
	}

	function openDeleteModal(group: Group) {
		groupToDelete = group;
		isDeleteModalOpen = true;
		deleteError = null;
	}

	function closeDeleteModal() {
		isDeleteModalOpen = false;
		deleteError = null;
		groupToDelete = null;
	}

	function toggleCategorySelection(categoryId: number, mode: 'create' | 'edit') {
		const form = mode === 'create' ? formData : editFormData;
		const currentIds = form.categories_ids || [];

		if (currentIds.includes(categoryId)) {
			form.categories_ids = currentIds.filter((id) => id !== categoryId);
		} else {
			form.categories_ids = [...currentIds, categoryId];
		}
	}

	function toggleClientSelection(clientId: number, mode: 'create' | 'edit') {
		const form = mode === 'create' ? formData : editFormData;
		const currentIds = form.clients_ids || [];

		if (currentIds.includes(clientId)) {
			form.clients_ids = currentIds.filter((id) => id !== clientId);
		} else {
			form.clients_ids = [...currentIds, clientId];
		}
	}

	function getCategoryName(id: number): string {
		const category = allCategories.find((c) => c.id === id);
		return category?.name || `Category #${id}`;
	}

	function getClientName(id: number): string {
		const client = allClients.find((c) => c.id === id);
		return client?.name || client?.ip || `Client #${id}`;
	}

	function handleCreateGroup() {
		if (!user.token) {
			createError = 'Not authenticated';
			return;
		}
		createError = null;
		const payload = {
			...(formData.name?.trim() && { name: formData.name.trim() }),
			categories_ids: formData.categories_ids || [],
			clients_ids: formData.clients_ids || []
		};
		createGroupMutation.mutate({ table: Tables.group, data: payload });
	}

	function handleUpdateGroup() {
		if (!user.token || !editingGroup?.id) {
			updateError = 'Not authenticated or invalid group';
			return;
		}
		updateError = null;
		updateGroupMutation.mutate({
			table: Tables.group,
			data: {
				id: editingGroup.id,
				name: editFormData.name?.trim() || null,
				categories_ids: editFormData.categories_ids || [],
				clients_ids: editFormData.clients_ids || []
			},
			params: { key_field: 'id' }
		});
	}

	function handleDeleteGroup() {
		if (!user.token || !groupToDelete?.id) {
			deleteError = 'Not authenticated or invalid group';
			return;
		}
		deleteError = null;
		deleteGroupMutation.mutate({
			table: Tables.group,
			params: { key_field: 'id', key_value: groupToDelete.id.toString() }
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
	<div class="mb-6 flex items-center justify-between">
		<div class="flex items-center gap-4">
			{#if isLoading}
				<div class="text-gray-300">Loading...</div>
			{/if}
			<button
				onclick={openModal}
				class="flex items-center justify-center p-2 md:px-4 md:py-2 md:gap-2 rounded-md bg-gradient-to-r from-violet-600 to-purple-600 font-medium text-white shadow-lg transition-all hover:from-violet-700 hover:to-purple-700"
			>
				<Plus class="h-5 w-5" />
				<span class="hidden md:inline">Create Group</span>
			</button>
		</div>
	</div>

	{#if error}
		<div class="mb-6 rounded-lg border border-red-500/30 bg-red-500/20 p-4 backdrop-blur-sm">
			<p class="text-red-200">{error}</p>
		</div>
	{/if}

	{#if isLoading && groups.length === 0}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each Array(6) as _}
				<div class="h-32 animate-pulse rounded-lg border border-white/20 bg-white/5"></div>
			{/each}
		</div>
	{:else if groups.length === 0 && !isLoading}
		<div class="rounded-lg border border-white/20 bg-white/10 p-8 text-center backdrop-blur-sm">
			<p class="text-gray-300">No groups found</p>
		</div>
	{:else}
		<!-- Groups Grid -->
		<div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each groups as group}
				{@const categoryIds = parseIds(group.categories_ids)}
				{@const clientIds = parseIds(group.clients_ids)}
				<div
					class="relative rounded-lg border border-white/20 bg-white/10 p-6 shadow-lg backdrop-blur-sm transition-all hover:bg-white/15"
				>
					<!-- Action Buttons -->
					<div class="absolute top-2 right-2 flex gap-1">
						<button
							onclick={() => openEditModal(group)}
							class="rounded-md p-1.5 text-gray-300 transition-colors hover:bg-white/20 hover:text-white"
							aria-label="Edit group"
						>
							<PencilSquare class="h-5 w-5" />
						</button>
						<button
							onclick={() => openDeleteModal(group)}
							class="rounded-md p-1.5 text-gray-300 transition-colors hover:bg-red-500/20 hover:text-red-300"
							aria-label="Delete group"
						>
							<Trash class="h-5 w-5" />
						</button>
					</div>
					<div class="space-y-2 pr-12">
						{#if group.id !== undefined}
							<div class="text-xs text-gray-400">ID: {group.id}</div>
						{/if}
						{#if group.name !== undefined}
							<h3 class="text-xl font-semibold text-white">{group.name}</h3>
						{/if}

						<!-- Relationships -->
						{#if categoryIds.length > 0 || clientIds.length > 0}
							<div class="mt-3 rounded-md border border-violet-500/30 bg-violet-500/10 p-2">
								{#if categoryIds.length > 0}
									<div class="mt-1 text-xs text-gray-300">
										<span class="font-medium text-violet-300">Categories:</span>
										{' '}
										{categoryIds.map((id) => getCategoryName(id)).join(', ')}
									</div>
								{/if}
								{#if clientIds.length > 0}
									<div class="mt-1 text-xs text-gray-300">
										<span class="font-medium text-violet-300">Clients:</span>
										{' '}
										{clientIds.map((id) => getClientName(id)).join(', ')}
									</div>
								{/if}
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>

		<!-- Pagination (Unified for all screen sizes) -->
		{#if totalPages > 0 || groups.length > 0}
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

<!-- Create Group Modal -->
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
		class="fixed top-1/2 left-1/2 z-[2001] max-h-[90vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 transform overflow-y-auto rounded-lg border border-white/20 bg-gradient-to-br from-violet-900/90 to-purple-900/90 p-6 shadow-2xl backdrop-blur-md"
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
			<h2 id="modal-title" class="text-2xl font-bold text-white">Create New Group</h2>
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
				handleCreateGroup();
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
				<label for="group-name" class="block text-sm font-medium text-gray-200">Name</label>
				<input
					id="group-name"
					type="text"
					bind:value={formData.name}
					placeholder="Group name"
					class="mt-1 block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-gray-400 backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
					disabled={isCreating}
				/>
			</div>

			<!-- Categories -->
			<div>
				<div class="mb-2 block text-sm font-medium text-gray-200">Categories</div>
				{#if isLoadingOptions}
					<div class="text-sm text-gray-400">Loading categories...</div>
				{:else if allCategories.length === 0}
					<div class="text-sm text-gray-400">No categories available</div>
				{:else}
					<div class="max-h-32 overflow-y-auto rounded-md border border-white/20 bg-white/5 p-2">
						{#each allCategories as category}
							{#if category.id !== undefined}
								<label
									class="flex cursor-pointer items-center gap-2 p-1 text-sm text-white hover:bg-white/10"
								>
									<input
										type="checkbox"
										checked={formData.categories_ids?.includes(category.id)}
										onchange={() => toggleCategorySelection(category.id!, 'create')}
										disabled={isCreating}
										class="rounded border-white/20 bg-white/10 text-violet-600 focus:ring-violet-500"
									/>
									<span>{category.name || `Category #${category.id}`}</span>
								</label>
							{/if}
						{/each}
					</div>
				{/if}
			</div>

			<!-- Clients -->
			<div>
				<div class="mb-2 block text-sm font-medium text-gray-200">Clients</div>
				{#if isLoadingOptions}
					<div class="text-sm text-gray-400">Loading clients...</div>
				{:else if allClients.length === 0}
					<div class="text-sm text-gray-400">No clients available</div>
				{:else}
					<div class="max-h-32 overflow-y-auto rounded-md border border-white/20 bg-white/5 p-2">
						{#each allClients as client}
							{#if client.id !== undefined}
								<label
									class="flex cursor-pointer items-center gap-2 p-1 text-sm text-white hover:bg-white/10"
								>
									<input
										type="checkbox"
										checked={formData.clients_ids?.includes(client.id)}
										onchange={() => toggleClientSelection(client.id!, 'create')}
										disabled={isCreating}
										class="rounded border-white/20 bg-white/10 text-violet-600 focus:ring-violet-500"
									/>
									<span>{client.name || client.ip || `Client #${client.id}`}</span>
								</label>
							{/if}
						{/each}
					</div>
				{/if}
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
					<span class="hidden md:inline">{isCreating ? 'Creating...' : 'Create Group'}</span>
				</button>
			</div>
		</form>
	</div>
{/if}

<!-- Edit Group Modal -->
{#if isEditModalOpen && editingGroup}
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
		class="fixed top-1/2 left-1/2 z-[2001] max-h-[90vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 transform overflow-y-auto rounded-lg border border-white/20 bg-gradient-to-br from-violet-900/90 to-purple-900/90 p-6 shadow-2xl backdrop-blur-md"
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
			<h2 id="edit-modal-title" class="text-2xl font-bold text-white">Edit Group</h2>
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
				handleUpdateGroup();
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
				<label for="edit-group-name" class="block text-sm font-medium text-gray-200">Name</label>
				<input
					id="edit-group-name"
					type="text"
					bind:value={editFormData.name}
					placeholder="Group name"
					class="mt-1 block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-gray-400 backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
					disabled={isUpdating}
				/>
			</div>

			<!-- Categories -->
			<div>
				<div class="mb-2 block text-sm font-medium text-gray-200">Categories</div>
				{#if isLoadingOptions}
					<div class="text-sm text-gray-400">Loading categories...</div>
				{:else if allCategories.length === 0}
					<div class="text-sm text-gray-400">No categories available</div>
				{:else}
					<div class="max-h-32 overflow-y-auto rounded-md border border-white/20 bg-white/5 p-2">
						{#each allCategories as category}
							{#if category.id !== undefined}
								<label
									class="flex cursor-pointer items-center gap-2 p-1 text-sm text-white hover:bg-white/10"
								>
									<input
										type="checkbox"
										checked={editFormData.categories_ids?.includes(category.id)}
										onchange={() => toggleCategorySelection(category.id!, 'edit')}
										disabled={isUpdating}
										class="rounded border-white/20 bg-white/10 text-violet-600 focus:ring-violet-500"
									/>
									<span>{category.name || `Category #${category.id}`}</span>
								</label>
							{/if}
						{/each}
					</div>
				{/if}
			</div>

			<!-- Clients -->
			<div>
				<div class="mb-2 block text-sm font-medium text-gray-200">Clients</div>
				{#if isLoadingOptions}
					<div class="text-sm text-gray-400">Loading clients...</div>
				{:else if allClients.length === 0}
					<div class="text-sm text-gray-400">No clients available</div>
				{:else}
					<div class="max-h-32 overflow-y-auto rounded-md border border-white/20 bg-white/5 p-2">
						{#each allClients as client}
							{#if client.id !== undefined}
								<label
									class="flex cursor-pointer items-center gap-2 p-1 text-sm text-white hover:bg-white/10"
								>
									<input
										type="checkbox"
										checked={editFormData.clients_ids?.includes(client.id)}
										onchange={() => toggleClientSelection(client.id!, 'edit')}
										disabled={isUpdating}
										class="rounded border-white/20 bg-white/10 text-violet-600 focus:ring-violet-500"
									/>
									<span>{client.name || client.ip || `Client #${client.id}`}</span>
								</label>
							{/if}
						{/each}
					</div>
				{/if}
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
					<span class="hidden md:inline">{isUpdating ? 'Updating...' : 'Update Group'}</span>
				</button>
			</div>
		</form>
	</div>
{/if}

<!-- Delete Group Confirmation Modal -->
{#if isDeleteModalOpen && groupToDelete}
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
			<h2 id="delete-modal-title" class="text-2xl font-bold text-white">Delete Group</h2>
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
				Are you sure you want to delete the group
				<span class="font-semibold text-white">
					{groupToDelete.name || `ID: ${groupToDelete.id}`}
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
					onclick={handleDeleteGroup}
					disabled={isDeleting}
					class="flex items-center justify-center p-2 md:px-4 md:py-2 md:gap-2 rounded-md bg-gradient-to-r from-red-600 to-red-700 font-medium text-white shadow-lg transition-all hover:from-red-700 hover:to-red-800 disabled:cursor-not-allowed disabled:opacity-50"
				>
					<Trash class="h-5 w-5" />
					<span class="hidden md:inline">{isDeleting ? 'Deleting...' : 'Delete Group'}</span>
				</button>
			</div>
		</div>
	</div>
{/if}
