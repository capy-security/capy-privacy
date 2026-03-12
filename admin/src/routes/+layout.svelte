<script lang="ts">
	import '../app.css';
	import { browser } from '$app/environment';
	import { authorizationStore } from '$lib/stores/authorization';
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
	import Navbar from '$lib/components/Navbar.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';

	let { children } = $props();
	let user = $derived($authorizationStore);
	const showNavigation = true;

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				enabled: browser
			}
		}
	});
</script>

<svelte:head>
	<link rel="icon" href="/favicon.ico" type="image/x-icon" />
</svelte:head>

<QueryClientProvider client={queryClient}>
	<div
		class="fixed inset-0 -z-10 bg-gradient-to-br from-violet-500 via-purple-500 to-blue-600"
	></div>

	{#if showNavigation}
		<Navbar />
		<Sidebar />
	{/if}

	<div
		class="mt-[58px] ml-[60px] min-h-[calc(100vh-58px)] px-4 pt-4 pb-8 overflow-x-hidden max-w-[calc(100vw-60px)]"
	>
		<div class="mx-auto max-w-7xl w-full">
			{@render children()}
		</div>
	</div>
</QueryClientProvider>
