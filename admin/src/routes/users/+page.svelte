<script lang="ts">
	import { useQueryClient } from '@tanstack/svelte-query';

	import { authorizationStore } from '$lib/stores/authorization';
	import {
		createCreateUserAuthUserPost,
		createUpdateUserAuthUserPut,
		createDeleteUserAuthUserDelete
	} from '$lib/api/generated/authentication/authentication';
	import {
		createListUsersDatabaseUserGet,
		getListUsersDatabaseUserGetQueryKey
	} from '$lib/api/generated/database/database';
	import type {
		ApiResponse,
		UserRequest,
		UserRole,
		User as GeneratedUser
	} from '$lib/api/generated/models';
	import { ChevronLeft, ChevronRight, Plus, XMark, PencilSquare, Trash } from 'svelte-heros-v2';
	import { parseTableResponse } from '$lib/api/fetchTableData';
	import type { User, UserFormData } from '$lib/models/user';
	const queryClient = useQueryClient();
	let user = $derived($authorizationStore);
	let currentPage = $state(1);
	let itemsPerPage = $state(12);

	const usersQuery = createListUsersDatabaseUserGet<{ items: User[]; totalItems: number }>(
		() => ({ page_number: currentPage, items_per_page: itemsPerPage }),
		() => ({
			request: { headers: { Authorization: `Bearer ${user.token}` } },
			query: {
				select: (res) =>
					parseTableResponse<User>(
						{ status: res.status, data: res.data as ApiResponse | undefined },
						{ itemsPerPage, currentPage }
					)
			}
		})
	);

	let users = $derived(usersQuery.data?.items ?? []);
	let totalItems = $derived(usersQuery.data?.totalItems ?? 0);
	let isLoading = $derived(usersQuery.isPending);
	let error = $derived((usersQuery.error as Error | undefined)?.message ?? null);
	let totalPages = $derived(
		Math.max(1, Math.ceil(totalItems / itemsPerPage) || (users.length > 0 ? 1 : 0))
	);

	// Create Modal state
	let isModalOpen = $state(false);
	let createError = $state<string | null>(null);
	let formData = $state<UserFormData>({
		display_name: '',
		email: '',
		password: '',
		role: 2 // 0=SUPERADMIN, 1=ADMIN, 2=USER
	});

	// Edit Modal state
	let isEditModalOpen = $state(false);
	let updateError = $state<string | null>(null);
	let editingUser = $state<User | null>(null);
	let editFormData = $state<UserFormData>({
		display_name: '',
		email: '',
		password: '',
		role: 2
	});

	// Delete Modal state
	let isDeleteModalOpen = $state(false);
	let deleteError = $state<string | null>(null);
	let userToDelete = $state<User | null>(null);

	function invalidateUsersList() {
		queryClient.invalidateQueries({ queryKey: getListUsersDatabaseUserGetQueryKey() });
	}

	const createUserMutation = createCreateUserAuthUserPost(() => ({
		request: { headers: { Authorization: `Bearer ${user.token}` } },
		mutation: {
			onSuccess: () => {
				closeModal();
				invalidateUsersList();
			}
		}
	}));
	let isCreating = $derived(createUserMutation.isPending);

	const updateUserMutation = createUpdateUserAuthUserPut(() => ({
		request: { headers: { Authorization: `Bearer ${user.token}` } },
		mutation: {
			onSuccess: () => {
				closeEditModal();
				invalidateUsersList();
			}
		}
	}));
	let isUpdating = $derived(updateUserMutation.isPending);

	const deleteUserMutation = createDeleteUserAuthUserDelete(() => ({
		request: { headers: { Authorization: `Bearer ${user.token}` } },
		mutation: {
			onSuccess: () => {
				closeDeleteModal();
				invalidateUsersList();
			}
		}
	}));
	let isDeleting = $derived(deleteUserMutation.isPending);

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

	function getRoleName(role: number): string {
		switch (role) {
			case 0:
				return 'Superadmin';
			case 1:
				return 'Admin';
			case 2:
				return 'User';
			default:
				return `Role ${role}`;
		}
	}

	function openModal() {
		isModalOpen = true;
		createError = null;
		formData = {
			display_name: '',
			email: '',
			password: '',
			role: 2
		};
	}

	function closeModal() {
		isModalOpen = false;
		createError = null;
		formData = {
			display_name: '',
			email: '',
			password: '',
			role: 2
		};
	}

	function openEditModal(userItem: User) {
		editingUser = userItem;
		isEditModalOpen = true;
		updateError = null;
		editFormData = {
			display_name: userItem.display_name || '',
			email: userItem.email || '',
			password: '', // Don't pre-fill password
			role: userItem.role ?? 2
		};
	}

	function closeEditModal() {
		isEditModalOpen = false;
		updateError = null;
		editingUser = null;
		editFormData = {
			display_name: '',
			email: '',
			password: '',
			role: 2
		};
	}

	function openDeleteModal(userItem: User) {
		userToDelete = userItem;
		isDeleteModalOpen = true;
		deleteError = null;
	}

	function closeDeleteModal() {
		isDeleteModalOpen = false;
		deleteError = null;
		userToDelete = null;
	}

	async function handleCreateUser() {
		if (!user.token) {
			createError = 'Not authenticated';
			return;
		}

		// Validation
		const trimmedDisplayName = formData.display_name?.trim() || '';
		const trimmedEmail = formData.email?.trim() || '';
		const trimmedPassword = formData.password?.trim() || '';

		if (!trimmedDisplayName) {
			createError = 'Display name is required';
			return;
		}

		if (!trimmedEmail) {
			createError = 'Email is required';
			return;
		}

		if (!trimmedPassword) {
			createError = 'Password is required';
			return;
		}

		createError = null;

		try {
			const payload: UserRequest = {
				display_name: trimmedDisplayName,
				email: trimmedEmail,
				password: trimmedPassword,
				role: formData.role as UserRole
			};

			await createUserMutation.mutateAsync({ data: payload as GeneratedUser });
		} catch (err) {
			console.error('Error creating user:', err);
			createError = err instanceof Error ? err.message : 'An error occurred';
		}
	}

	async function handleUpdateUser() {
		if (!user.token || !editingUser || !editingUser.id) {
			updateError = 'Not authenticated or invalid user';
			return;
		}

		// Validation
		const trimmedDisplayName = editFormData.display_name?.trim() || '';
		const trimmedEmail = editFormData.email?.trim() || '';

		if (!trimmedDisplayName) {
			updateError = 'Display name is required';
			return;
		}

		if (!trimmedEmail) {
			updateError = 'Email is required';
			return;
		}

		updateError = null;

		try {
			const payload: UserRequest = {
				id: editingUser.id,
				display_name: trimmedDisplayName,
				email: trimmedEmail,
				role: editFormData.role as UserRole
			};

			const trimmedPassword = editFormData.password?.trim() || '';
			if (trimmedPassword) {
				payload.password = trimmedPassword;
			}

			await updateUserMutation.mutateAsync({ data: payload as GeneratedUser });
		} catch (err) {
			console.error('Error updating user:', err);
			updateError = err instanceof Error ? err.message : 'An error occurred';
		}
	}

	async function handleDeleteUser() {
		if (!user.token || !userToDelete || !userToDelete.id) {
			deleteError = 'Not authenticated or invalid user';
			return;
		}

		deleteError = null;

		try {
			await deleteUserMutation.mutateAsync({ data: { id: userToDelete.id } });
		} catch (err) {
			console.error('Error deleting user:', err);
			deleteError = err instanceof Error ? err.message : 'An error occurred';
		}
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
		<h1 class="text-3xl font-bold text-white">Users</h1>
		<div class="flex items-center gap-4">
			{#if isLoading}
				<div class="text-gray-300">Loading...</div>
			{/if}
			<button
				onclick={openModal}
				class="flex items-center justify-center p-2 md:px-4 md:py-2 md:gap-2 rounded-md bg-gradient-to-r from-violet-600 to-purple-600 font-medium text-white shadow-lg transition-all hover:from-violet-700 hover:to-purple-700"
			>
				<Plus class="h-5 w-5" />
				<span class="hidden md:inline">Create User</span>
			</button>
		</div>
	</div>

	{#if error}
		<div class="mb-6 rounded-lg border border-red-500/30 bg-red-500/20 p-4 backdrop-blur-sm">
			<p class="text-red-200">{error}</p>
		</div>
	{/if}

	{#if isLoading && users.length === 0}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each Array(6) as _}
				<div class="h-32 animate-pulse rounded-lg border border-white/20 bg-white/5"></div>
			{/each}
		</div>
	{:else if users.length === 0 && !isLoading}
		<div class="rounded-lg border border-white/20 bg-white/10 p-8 text-center backdrop-blur-sm">
			<p class="text-gray-300">No users found</p>
		</div>
	{:else}
		<!-- Users Grid -->
		<div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each users as userItem}
				<div
					class="relative rounded-lg border border-white/20 bg-white/10 p-6 shadow-lg backdrop-blur-sm transition-all hover:bg-white/15"
				>
					<!-- Action Buttons -->
					<div class="absolute top-2 right-2 flex gap-1">
						<button
							onclick={() => openEditModal(userItem)}
							class="rounded-md p-1.5 text-gray-300 transition-colors hover:bg-white/20 hover:text-white"
							aria-label="Edit user"
						>
							<PencilSquare class="h-5 w-5" />
						</button>
						<button
							onclick={() => openDeleteModal(userItem)}
							class="rounded-md p-1.5 text-gray-300 transition-colors hover:bg-red-500/20 hover:text-red-300"
							aria-label="Delete user"
						>
							<Trash class="h-5 w-5" />
						</button>
					</div>
					<div class="space-y-2 pr-12">
						{#if userItem.display_name !== undefined}
							<h3 class="text-xl font-semibold text-white">{userItem.display_name}</h3>
						{/if}
						{#if userItem.email !== undefined}
							<p class="text-gray-300">
								<span class="font-medium text-white">Email:</span>
								{userItem.email}
							</p>
						{/if}
						{#if userItem.role !== undefined}
							<p class="text-gray-300">
								<span class="font-medium text-white">Role:</span>
								<span
									class="ml-2 rounded-full px-2 py-1 text-xs font-medium {userItem.role === 0
										? 'bg-red-500/20 text-red-300'
										: userItem.role === 1
											? 'bg-purple-500/20 text-purple-300'
											: 'bg-blue-500/20 text-blue-300'}"
								>
									{getRoleName(userItem.role)}
								</span>
							</p>
						{/if}
					</div>
				</div>
			{/each}
		</div>

		<!-- Pagination (Unified for all screen sizes) -->
		{#if totalPages > 0 || users.length > 0}
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

<!-- Create User Modal -->
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
			<h2 id="modal-title" class="text-2xl font-bold text-white">Create New User</h2>
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
				handleCreateUser();
			}}
			class="space-y-4"
		>
			{#if createError}
				<div class="rounded-lg border border-red-500/30 bg-red-500/20 p-3 backdrop-blur-sm">
					<p class="text-sm text-red-200">{createError}</p>
				</div>
			{/if}

			<!-- Display Name Field -->
			<div>
				<label for="user-display-name" class="block text-sm font-medium text-gray-200">
					Display Name <span class="text-red-400">*</span>
				</label>
				<input
					id="user-display-name"
					type="text"
					required
					bind:value={formData.display_name}
					placeholder="John Doe"
					class="mt-1 block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-gray-400 backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
					disabled={isCreating}
				/>
			</div>

			<!-- Email Field -->
			<div>
				<label for="user-email" class="block text-sm font-medium text-gray-200">
					Email <span class="text-red-400">*</span>
				</label>
				<input
					id="user-email"
					type="email"
					required
					bind:value={formData.email}
					placeholder="user@example.com"
					class="mt-1 block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-gray-400 backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
					disabled={isCreating}
				/>
			</div>

			<!-- Password Field -->
			<div>
				<label for="user-password" class="block text-sm font-medium text-gray-200">
					Password <span class="text-red-400">*</span>
				</label>
				<input
					id="user-password"
					type="password"
					required
					bind:value={formData.password}
					placeholder="Enter password"
					class="mt-1 block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-gray-400 backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
					disabled={isCreating}
				/>
			</div>

			<!-- Role Field -->
			<div>
				<label for="user-role" class="block text-sm font-medium text-gray-200">
					Role <span class="text-red-400">*</span>
				</label>
				<select
					id="user-role"
					required
					bind:value={formData.role}
					class="mt-1 block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
					disabled={isCreating}
				>
					<option value={0}>Superadmin</option>
					<option value={1}>Admin</option>
					<option value={2}>User</option>
				</select>
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
					<span class="hidden md:inline">{isCreating ? 'Creating...' : 'Create User'}</span>
				</button>
			</div>
		</form>
	</div>
{/if}

<!-- Edit User Modal -->
{#if isEditModalOpen && editingUser}
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
			<h2 id="edit-modal-title" class="text-2xl font-bold text-white">Edit User</h2>
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
				handleUpdateUser();
			}}
			class="space-y-4"
		>
			{#if updateError}
				<div class="rounded-lg border border-red-500/30 bg-red-500/20 p-3 backdrop-blur-sm">
					<p class="text-sm text-red-200">{updateError}</p>
				</div>
			{/if}

			<!-- Display Name Field -->
			<div>
				<label for="edit-user-display-name" class="block text-sm font-medium text-gray-200">
					Display Name <span class="text-red-400">*</span>
				</label>
				<input
					id="edit-user-display-name"
					type="text"
					required
					bind:value={editFormData.display_name}
					placeholder="John Doe"
					class="mt-1 block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-gray-400 backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
					disabled={isUpdating}
				/>
			</div>

			<!-- Email Field -->
			<div>
				<label for="edit-user-email" class="block text-sm font-medium text-gray-200">
					Email <span class="text-red-400">*</span>
				</label>
				<input
					id="edit-user-email"
					type="email"
					required
					bind:value={editFormData.email}
					placeholder="user@example.com"
					class="mt-1 block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-gray-400 backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
					disabled={isUpdating}
				/>
			</div>

			<!-- Password Field (Optional for update) -->
			<div>
				<label for="edit-user-password" class="block text-sm font-medium text-gray-200">
					Password (leave blank to keep current)
				</label>
				<input
					id="edit-user-password"
					type="password"
					bind:value={editFormData.password}
					placeholder="Enter new password (optional)"
					class="mt-1 block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-gray-400 backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
					disabled={isUpdating}
				/>
			</div>

			<!-- Role Field -->
			<div>
				<label for="edit-user-role" class="block text-sm font-medium text-gray-200">
					Role <span class="text-red-400">*</span>
				</label>
				<select
					id="edit-user-role"
					required
					bind:value={editFormData.role}
					class="mt-1 block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
					disabled={isUpdating}
				>
					<option value={0}>Superadmin</option>
					<option value={1}>Admin</option>
					<option value={2}>User</option>
				</select>
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
					<span class="hidden md:inline">{isUpdating ? 'Updating...' : 'Update User'}</span>
				</button>
			</div>
		</form>
	</div>
{/if}

<!-- Delete User Confirmation Modal -->
{#if isDeleteModalOpen && userToDelete}
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
			<h2 id="delete-modal-title" class="text-2xl font-bold text-white">Delete User</h2>
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
				Are you sure you want to delete the user
				<span class="font-semibold text-white">
					{userToDelete.display_name || userToDelete.email || `ID: ${userToDelete.id}`}
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
					onclick={handleDeleteUser}
					disabled={isDeleting}
					class="flex items-center justify-center p-2 md:px-4 md:py-2 md:gap-2 rounded-md bg-gradient-to-r from-red-600 to-red-700 font-medium text-white shadow-lg transition-all hover:from-red-700 hover:to-red-800 disabled:cursor-not-allowed disabled:opacity-50"
				>
					<Trash class="h-5 w-5" />
					<span class="hidden md:inline">{isDeleting ? 'Deleting...' : 'Delete User'}</span>
				</button>
			</div>
		</div>
	</div>
{/if}
