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
	import type {
		ApiResponse,
		CreateObjectDnsTablePostBody,
		UpdateObjectDnsTablePutBody
	} from '$lib/api/generated/models';
	import { parseTableResponse } from '$lib/api/fetchTableData';
	import { ChevronLeft, ChevronRight, Plus, XMark, PencilSquare, Trash } from 'svelte-heros-v2';
	import type { Client, ClientFormData } from '$lib/models/client';

	const queryClient = useQueryClient();
	let user = $derived($authorizationStore);
	let currentPage = $state(1);
	let itemsPerPage = $state(12);

	const validClient = (c: Client) => !!(c.ip && typeof c.ip === 'string' && c.ip.trim().length > 0);
	const tableQuery = createReadObjectDnsTableGet<{ items: Client[]; totalItems: number }>(
		() => Tables.client,
		() => ({ page_number: currentPage, items_per_page: itemsPerPage }),
		() => ({
			request: { headers: { Authorization: `Bearer ${user.token}` } },
			query: {
				select: (res) => {
					const parsed = parseTableResponse<Client>(
						{ status: res.status, data: res.data as ApiResponse | undefined },
						{ itemsPerPage, currentPage }
					);
					return {
						...parsed,
						items: parsed.items.filter(validClient),
					};
				},
			},
		})
	);

	let clients = $derived(tableQuery.data?.items ?? []);
	let totalItems = $derived(tableQuery.data?.totalItems ?? 0);
	let isLoading = $derived(tableQuery.isPending);
	let error = $derived((tableQuery.error as Error | undefined)?.message ?? null);
	let totalPages = $derived(
		Math.max(1, Math.ceil(totalItems / itemsPerPage) || (clients.length > 0 ? 1 : 0))
	);

	// Create Modal state
	let isModalOpen = $state(false);
	let createError = $state<string | null>(null);
	let formData = $state<ClientFormData>({
		ip: '',
		name: '',
		description: ''
	});

	const createClientMutation = createCreateObjectDnsTablePost(() => ({
		request: { headers: { Authorization: `Bearer ${user.token}` } },
		mutation: {
			onSuccess: (_, variables) => {
				closeModal();
				queryClient.invalidateQueries({ queryKey: getReadObjectDnsTableGetQueryKey(variables.table) });
			},
		},
	}));
	let isCreating = $derived(createClientMutation.isPending);
	$effect(() => {
		createError = (createClientMutation.error as Error | undefined)?.message ?? null;
	});

	// Edit Modal state
	let isEditModalOpen = $state(false);
	let updateError = $state<string | null>(null);
	let editingClient = $state<Client | null>(null);
	let editFormData = $state<ClientFormData>({
		ip: '',
		name: '',
		description: ''
	});

	const updateClientMutation = createUpdateObjectDnsTablePut(() => ({
		request: { headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'application/json' } },
		mutation: {
			onSuccess: (_, variables) => {
				closeEditModal();
				queryClient.invalidateQueries({ queryKey: getReadObjectDnsTableGetQueryKey(variables.table) });
			},
		},
	}));
	let isUpdating = $derived(updateClientMutation.isPending);
	$effect(() => {
		updateError = (updateClientMutation.error as Error | undefined)?.message ?? null;
	});

	// Delete Modal state
	let isDeleteModalOpen = $state(false);
	let deleteError = $state<string | null>(null);
	let clientToDelete = $state<Client | null>(null);

	const deleteClientMutation = createDeleteObjectDnsTableDelete(() => ({
		request: { headers: { Authorization: `Bearer ${user.token}` } },
		mutation: {
			onSuccess: (_, variables) => {
				closeDeleteModal();
				queryClient.invalidateQueries({ queryKey: getReadObjectDnsTableGetQueryKey(variables.table) });
			},
		},
	}));
	let isDeleting = $derived(deleteClientMutation.isPending);
	$effect(() => {
		deleteError = (deleteClientMutation.error as Error | undefined)?.message ?? null;
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
		formData = { ip: '', name: '', description: '' };
	}

	function closeModal() {
		isModalOpen = false;
		createError = null;
		formData = { ip: '', name: '', description: '' };
	}

	function openEditModal(client: Client) {
		editingClient = client;
		isEditModalOpen = true;
		updateError = null;
		editFormData = {
			ip: client.ip || '',
			name: client.name || '',
			description: client.description || ''
		};
	}

	function closeEditModal() {
		isEditModalOpen = false;
		updateError = null;
		editingClient = null;
		editFormData = { ip: '', name: '', description: '' };
	}

	function openDeleteModal(client: Client) {
		clientToDelete = client;
		isDeleteModalOpen = true;
		deleteError = null;
	}

	function closeDeleteModal() {
		isDeleteModalOpen = false;
		deleteError = null;
		clientToDelete = null;
	}

	function handleCreateClient() {
		if (!user.token) {
			createError = 'Not authenticated';
			return;
		}
		const trimmedIp = formData.ip?.trim() || '';
		if (!trimmedIp) {
			createError = 'IP address is required';
			return;
		}
		const payload: CreateObjectDnsTablePostBody = { ip: trimmedIp };
		const trimmedName = formData.name?.trim();
		if (trimmedName?.length) payload.name = trimmedName;
		const trimmedDescription = formData.description?.trim();
		if (trimmedDescription?.length) payload.description = trimmedDescription;
		if (!payload.ip || typeof payload.ip !== 'string' || payload.ip.length === 0) {
			createError = 'IP address must be a non-empty string';
			return;
		}
		createError = null;
		createClientMutation.mutate({ table: Tables.client, data: payload });
	}

	function handleUpdateClient() {
		if (!user.token || !editingClient?.id) {
			updateError = 'Not authenticated or invalid client';
			return;
		}
		const trimmedIp = editFormData.ip?.trim() || '';
		if (!trimmedIp) {
			updateError = 'IP address is required';
			return;
		}
		const payload: UpdateObjectDnsTablePutBody = {
			id: editingClient.id,
			ip: trimmedIp,
			name: editFormData.name?.trim() || null,
			description: editFormData.description?.trim() || null,
		};
		if (!payload.ip || typeof payload.ip !== 'string' || payload.ip.length === 0) {
			updateError = 'IP address must be a non-empty string';
			return;
		}
		updateError = null;
		updateClientMutation.mutate({
			table: Tables.client,
			data: payload,
			params: { key_field: 'id' },
		});
	}

	function handleDeleteClient() {
		if (!user.token || !clientToDelete?.id) {
			deleteError = 'Not authenticated or invalid client';
			return;
		}
		deleteError = null;
		deleteClientMutation.mutate({
			table: Tables.client,
			params: { key_field: 'id', key_value: clientToDelete.id.toString() },
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
				<span class="hidden md:inline">Create Client</span>
			</button>
		</div>
	</div>

	{#if error}
		<div class="mb-6 rounded-lg border border-red-500/30 bg-red-500/20 p-4 backdrop-blur-sm">
			<p class="text-red-200">{error}</p>
		</div>
	{/if}

	{#if isLoading && clients.length === 0}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each Array(6) as _}
				<div class="h-32 animate-pulse rounded-lg border border-white/20 bg-white/5"></div>
			{/each}
		</div>
	{:else if clients.length === 0 && !isLoading}
		<div class="rounded-lg border border-white/20 bg-white/10 p-8 text-center backdrop-blur-sm">
			<p class="text-gray-300">No clients found</p>
		</div>
	{:else}
		<!-- Clients Grid -->
		<div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each clients as client}
				<div
					class="relative rounded-lg border border-white/20 bg-white/10 p-6 shadow-lg backdrop-blur-sm transition-all hover:bg-white/15"
				>
					<!-- Action Buttons -->
					<div class="absolute top-2 right-2 flex gap-1">
						<button
							onclick={() => openEditModal(client)}
							class="rounded-md p-1.5 text-gray-300 transition-colors hover:bg-white/20 hover:text-white"
							aria-label="Edit client"
						>
							<PencilSquare class="h-5 w-5" />
						</button>
						<button
							onclick={() => openDeleteModal(client)}
							class="rounded-md p-1.5 text-gray-300 transition-colors hover:bg-red-500/20 hover:text-red-300"
							aria-label="Delete client"
						>
							<Trash class="h-5 w-5" />
						</button>
					</div>
					<div class="space-y-2">
						{#if client.id !== undefined}
							<div class="text-xs text-gray-400">ID: {client.id}</div>
						{/if}
						{#if client.name !== undefined}
							<h3 class="text-xl font-semibold text-white">{client.name}</h3>
						{:else if client.ip !== undefined}
							<h3 class="text-xl font-semibold text-white">{client.ip}</h3>
						{/if}
						{#if client.ip !== undefined}
							<p class="text-gray-300">
								<span class="font-medium text-white">IP Address:</span>
								{client.ip}
							</p>
						{/if}
						{#if client.name !== undefined}
							<p class="text-gray-300">
								<span class="font-medium text-white">Name:</span>
								{client.name}
							</p>
						{/if}
						{#if client.description !== undefined && client.description !== null}
							<p class="text-sm text-gray-400">{client.description}</p>
						{/if}
						<!-- Display any other fields -->
						{#each Object.entries(client) as [key, value]}
							{#if !['id', 'ip', 'name', 'description'].includes(key) && value !== null && value !== undefined}
								<div class="text-sm">
									<span class="font-medium text-gray-300">{key}:</span>
									<span class="ml-2 text-gray-400">{String(value)}</span>
								</div>
							{/if}
						{/each}
					</div>
				</div>
			{/each}
		</div>

		<!-- Pagination (Unified for all screen sizes) -->
		{#if totalPages > 0 || clients.length > 0}
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

<!-- Create Client Modal -->
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
			<h2 id="modal-title" class="text-2xl font-bold text-white">Create New Client</h2>
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
				handleCreateClient();
			}}
			class="space-y-4"
		>
			{#if createError}
				<div class="rounded-lg border border-red-500/30 bg-red-500/20 p-3 backdrop-blur-sm">
					<p class="text-sm text-red-200">{createError}</p>
				</div>
			{/if}

			<!-- IP Address Field -->
			<div>
				<label for="client-ip" class="block text-sm font-medium text-gray-200">
					IP Address <span class="text-red-400">*</span>
				</label>
				<input
					id="client-ip"
					type="text"
					required
					bind:value={formData.ip}
					placeholder="192.168.1.1 or 2001:db8::1"
					class="mt-1 block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-gray-400 backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
					disabled={isCreating}
				/>
			</div>

			<!-- Name Field -->
			<div>
				<label for="client-name" class="block text-sm font-medium text-gray-200">Name</label>
				<input
					id="client-name"
					type="text"
					bind:value={formData.name}
					placeholder="Client name"
					class="mt-1 block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-gray-400 backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
					disabled={isCreating}
				/>
			</div>

			<!-- Description Field -->
			<div>
				<label for="client-description" class="block text-sm font-medium text-gray-200"
					>Description</label
				>
				<textarea
					id="client-description"
					bind:value={formData.description}
					placeholder="Client description (optional)"
					rows="3"
					class="mt-1 block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-gray-400 backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
					disabled={isCreating}
				></textarea>
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
					<span class="hidden md:inline">{isCreating ? 'Creating...' : 'Create Client'}</span>
				</button>
			</div>
		</form>
	</div>
{/if}

<!-- Edit Client Modal -->
{#if isEditModalOpen && editingClient}
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
			<h2 id="edit-modal-title" class="text-2xl font-bold text-white">Edit Client</h2>
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
				handleUpdateClient();
			}}
			class="space-y-4"
		>
			{#if updateError}
				<div class="rounded-lg border border-red-500/30 bg-red-500/20 p-3 backdrop-blur-sm">
					<p class="text-sm text-red-200">{updateError}</p>
				</div>
			{/if}

			<!-- IP Address Field -->
			<div>
				<label for="edit-client-ip" class="block text-sm font-medium text-gray-200">
					IP Address <span class="text-red-400">*</span>
				</label>
				<input
					id="edit-client-ip"
					type="text"
					required
					bind:value={editFormData.ip}
					placeholder="192.168.1.1 or 2001:db8::1"
					class="mt-1 block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-gray-400 backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
					disabled={isUpdating}
				/>
			</div>

			<!-- Name Field -->
			<div>
				<label for="edit-client-name" class="block text-sm font-medium text-gray-200">Name</label>
				<input
					id="edit-client-name"
					type="text"
					bind:value={editFormData.name}
					placeholder="Client name"
					class="mt-1 block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-gray-400 backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
					disabled={isUpdating}
				/>
			</div>

			<!-- Description Field -->
			<div>
				<label for="edit-client-description" class="block text-sm font-medium text-gray-200"
					>Description</label
				>
				<textarea
					id="edit-client-description"
					bind:value={editFormData.description}
					placeholder="Client description (optional)"
					rows="3"
					class="mt-1 block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-gray-400 backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
					disabled={isUpdating}
				></textarea>
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
					<span class="hidden md:inline">{isUpdating ? 'Updating...' : 'Update Client'}</span>
				</button>
			</div>
		</form>
	</div>
{/if}

<!-- Delete Client Confirmation Modal -->
{#if isDeleteModalOpen && clientToDelete}
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
			<h2 id="delete-modal-title" class="text-2xl font-bold text-white">Delete Client</h2>
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
				Are you sure you want to delete the client
				<span class="font-semibold text-white">
					{clientToDelete.name || clientToDelete.ip || `ID: ${clientToDelete.id}`}
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
					onclick={handleDeleteClient}
					disabled={isDeleting}
					class="flex items-center justify-center p-2 md:px-4 md:py-2 md:gap-2 rounded-md bg-gradient-to-r from-red-600 to-red-700 font-medium text-white shadow-lg transition-all hover:from-red-700 hover:to-red-800 disabled:cursor-not-allowed disabled:opacity-50"
				>
					<Trash class="h-5 w-5" />
					<span class="hidden md:inline">{isDeleting ? 'Deleting...' : 'Delete Client'}</span>
				</button>
			</div>
		</div>
	</div>
{/if}
