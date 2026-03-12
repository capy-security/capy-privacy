<script lang="ts">
	import { authorizationStore } from '$lib/stores/authorization';
	import { goto } from '$app/navigation';
	import { UserCircle } from 'svelte-heros-v2';

	let user = $derived($authorizationStore);

	function handleLogout() {
		authorizationStore.logout();
		// goto('/login');
	}

	function formatDate(date: Date | string | null | undefined): string {
		if (!date) return 'N/A';

		let dateObj: Date;
		if (typeof date === 'string') {
			dateObj = new Date(date);
		} else if (date instanceof Date) {
			dateObj = date;
		} else {
			return 'N/A';
		}

		// Check if date is valid
		if (isNaN(dateObj.getTime())) {
			return 'Invalid date';
		}

		return new Intl.DateTimeFormat('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(dateObj);
	}

	function getRoleName(role: number): string {
		const roleMap: Record<number, string> = {
			0: 'User',
			1: 'Admin',
			2: 'Super Admin'
		};
		return roleMap[role] || `Role ${role}`;
	}
</script>

<div>
	<h1 class="mb-4 text-2xl font-bold text-white md:mb-6 md:text-3xl">Profile</h1>

	{#if user.authenticated && user.profile}
		<!-- Profile Card -->
		<div
			class="mb-6 rounded-lg border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-sm md:p-8"
		>
			<div class="mb-4 flex flex-col items-center gap-4 md:mb-6 md:flex-row md:items-center">
				<div
					class="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 md:h-20 md:w-20"
				>
					<UserCircle class="h-10 w-10 text-white md:h-12 md:w-12" />
				</div>
				<div class="text-center md:text-left">
					<h2 class="text-xl font-bold text-white md:text-2xl">
						{user.profile.display_name}
					</h2>
					<p class="mt-1 break-all text-sm text-gray-300 md:text-base">
						{user.profile.email || 'No email'}
					</p>
				</div>
			</div>

			<div class="space-y-3 md:space-y-4">
				<div class="rounded-md border border-white/10 bg-white/5 p-3 md:p-4">
					<div class="block text-xs font-medium text-gray-300 md:text-sm">Email Address</div>
					<p class="mt-1 break-all text-base text-white md:text-lg">
						{user.profile.email || 'N/A'}
					</p>
				</div>

				<div class="rounded-md border border-white/10 bg-white/5 p-3 md:p-4">
					<div class="block text-xs font-medium text-gray-300 md:text-sm">Display Name</div>
					<p class="mt-1 break-words text-base text-white md:text-lg">
						{user.profile.display_name || 'N/A'}
					</p>
				</div>

				<div class="rounded-md border border-white/10 bg-white/5 p-3 md:p-4">
					<div class="block text-xs font-medium text-gray-300 md:text-sm">Role</div>
					<p class="mt-1 text-base text-white md:text-lg">
						{getRoleName(user.profile.role)}
						<span class="ml-2 text-xs text-gray-400 md:text-sm">({user.profile.role})</span>
					</p>
				</div>

				<div class="rounded-md border border-white/10 bg-white/5 p-3 md:p-4">
					<div class="block text-xs font-medium text-gray-300 md:text-sm">Token Expires</div>
					<p class="mt-1 break-words text-base text-white md:text-lg">
						{formatDate(user.profile.expires_at)}
					</p>
				</div>
			</div>
		</div>

		<!-- Actions -->
		<div class="flex gap-4">
			<button
				onclick={handleLogout}
				class="w-full rounded-md bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3 font-medium text-white shadow-lg transition-all hover:from-violet-700 hover:to-purple-700 focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:outline-none md:w-auto"
			>
				Logout
			</button>
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
