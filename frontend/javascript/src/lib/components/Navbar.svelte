<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { authorizationStore } from '$lib/stores/authorization';

	// Get user state reactively from auth store
	let user = $derived($authorizationStore);

	// Map routes to page titles - reactive to page changes
	const pageTitle = $derived.by(() => {
		const path = page.url.pathname;
		const titleMap: Record<string, string> = {
			'/': 'Capy Privacy DNS',
			'/login': 'Login',
			'/profile': 'Profile',
			'/domains': 'Domains',
			'/clients': 'Clients',
			'/categories': 'Categories',
			'/groups': 'Groups'
		};
		return titleMap[path] || 'Capy Privacy DNS';
	});

	// Display user info in auth status
	const authStatus = $derived.by(() => {
		if (user.authenticated && user.profile) {
			return user.profile.display_name || user.profile.email || 'Authenticated';
		}
		return 'Not authenticated';
	});

	function handleLogout() {
		// Clear auth state via store
		authorizationStore.logout();
		// Redirect to login page
		goto('/login');
	}
</script>

<nav
	class="fixed top-0 right-0 left-[60px] md:left-[60px] z-[1001] h-[58px] bg-black/20 backdrop-blur-sm"
>
	<div class="flex h-[58px] items-center justify-between px-4 py-1">
		<div class="flex-1">
			<h2 class="font-bold text-white">{pageTitle}</h2>
		</div>
		<div class="flex items-center gap-3">
			<div class="hidden md:block"><span class="text-gray-300">{authStatus}</span></div>
			{#if user.authenticated}
				<button
					class="rounded-md bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 font-medium text-white shadow-lg transition-all hover:from-violet-700 hover:to-purple-700 focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:outline-none"
					onclick={handleLogout}
					type="button"
				>
					Logout
				</button>
			{:else}
				<a
					href="/login"
					class="rounded-md bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 font-medium text-white shadow-lg transition-all hover:from-violet-700 hover:to-purple-700"
				>
					Login
				</a>
			{/if}
		</div>
	</div>
</nav>
