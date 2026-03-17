<script lang="ts">
	import { page } from '$app/state';
	import { sidebarToggleStore } from '$lib/stores/sidebar';
	import capyLogoSvg from '$lib/assets/capy.svg?raw';
	import {
		Home,
		GlobeAlt,
		ComputerDesktop,
		Tag,
		UserGroup,
		Users,
		ChartBar,
		UserCircle,
		DocumentMagnifyingGlass,
		Cog6Tooth
	} from 'svelte-heros-v2';

	let isExpanded = $state(false);
	let sidebarElement: HTMLElement | null = $state(null);

	function isActive(href: string): boolean {
		if (href.startsWith('http')) return false; // External links
		return page.url.pathname === href || page.url.pathname.startsWith(href + '/');
	}

	function toggleSidebar() {
		// Only allow toggle on desktop (md and above)
		if (typeof window !== 'undefined' && window.innerWidth >= 768) {
			isExpanded = !isExpanded;
		}
	}

	// Provide toggle function to store for Navbar to use (desktop only)
	$effect(() => {
		sidebarToggleStore.set(toggleSidebar);
		return () => {
			sidebarToggleStore.set(null);
		};
	});

	// Handle click outside to collapse sidebar (desktop only)
	$effect(() => {
		if (!isExpanded || !sidebarElement) return;
		// Only handle click outside on desktop
		if (typeof window !== 'undefined' && window.innerWidth < 768) return;

		function handleClickOutside(event: MouseEvent) {
			const target = event.target as HTMLElement;
			if (sidebarElement && !sidebarElement.contains(target)) {
				isExpanded = false;
			}
		}

		// Add event listener with a small delay to avoid immediate trigger
		const timeoutId = setTimeout(() => {
			document.addEventListener('click', handleClickOutside);
		}, 100);

		return () => {
			clearTimeout(timeoutId);
			document.removeEventListener('click', handleClickOutside);
		};
	});

	// Reactive statements to ensure reactivity
	const isHomeActive = $derived(isActive('/'));
	const isDomainsActive = $derived(isActive('/domains'));
	const isClientsActive = $derived(isActive('/clients'));
	const isCategoriesActive = $derived(isActive('/categories'));
	const isGroupsActive = $derived(isActive('/groups'));
	const isUsersActive = $derived(isActive('/users'));
	const isMetricsActive = $derived(isActive('/metrics'));
	const isStatisticsActive = $derived(isActive('/statistics'));
	const isProfileActive = $derived(isActive('/profile'));
	const isConfigurationActive = $derived(isActive('/configuration'));

	// Capy logo SVG with size class; fill is currentColor so parent text-white applies
	const capyLogo = capyLogoSvg.replace('<svg ', '<svg class="h-6 w-6 flex-shrink-0" aria-hidden="true" ');
</script>

<aside
	bind:this={sidebarElement}
	class="fixed top-0 left-0 z-[1002] flex h-screen flex-col bg-black/20 backdrop-blur-sm transition-all duration-500 ease-in-out {isExpanded
		? 'md:w-[200px]'
		: ''} w-[60px]"
>
	<!-- Burger Menu Button (hidden on mobile, shown on desktop) -->
	<div class="hidden md:flex h-14 items-center justify-center">
		<button
			class="flex h-10 w-10 items-center justify-center rounded-md text-white transition-colors hover:bg-white/10"
			onclick={toggleSidebar}
			type="button"
			title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
		>
			<span class="inline-block h-6 w-6 text-white" aria-hidden="true">{@html capyLogo}</span>
		</button>
	</div>

	<!-- Navigation Menu -->
	<nav class="flex flex-1 flex-col overflow-y-auto py-2">
		<ul class="flex flex-col space-y-1 px-2">
			<!-- Home -->
			<li>
				<a
					href="/"
					class="flex items-center rounded-md py-2 text-white transition-colors {isExpanded
						? 'md:justify-start md:px-3'
						: ''} justify-center px-0 {isHomeActive ? 'bg-white/10' : 'hover:bg-white/10'}"
					title="Home"
				>
					<Home class="h-6 w-6 flex-shrink-0" />
					<span class="hidden {isExpanded ? 'md:inline' : ''} ml-3 whitespace-nowrap">Home</span>
				</a>
			</li>

			<!-- Divider (only when expanded on desktop) -->
			{#if isExpanded}
				<li class="hidden md:block my-2 border-t border-white/20"></li>
			{/if}

			<!-- Domains -->
			<li>
				<a
					href="/domains"
					class="flex items-center rounded-md py-2 text-white transition-colors {isExpanded
						? 'md:justify-start md:px-3'
						: ''} justify-center px-0 {isDomainsActive ? 'bg-white/10' : 'hover:bg-white/10'}"
					title="Domains"
				>
					<GlobeAlt class="h-6 w-6 flex-shrink-0" />
					<span class="hidden {isExpanded ? 'md:inline' : ''} ml-3 whitespace-nowrap">Domains</span>
				</a>
			</li>

			<!-- Clients -->
			<li>
				<a
					href="/clients"
					class="flex items-center rounded-md py-2 text-white transition-colors {isExpanded
						? 'md:justify-start md:px-3'
						: ''} justify-center px-0 {isClientsActive ? 'bg-white/10' : 'hover:bg-white/10'}"
					title="Clients"
				>
					<ComputerDesktop class="h-6 w-6 flex-shrink-0" />
					<span class="hidden {isExpanded ? 'md:inline' : ''} ml-3 whitespace-nowrap">Clients</span>
				</a>
			</li>

			<!-- Categories -->
			<li>
				<a
					href="/categories"
					class="flex items-center rounded-md py-2 text-white transition-colors {isExpanded
						? 'md:justify-start md:px-3'
						: ''} justify-center px-0 {isCategoriesActive ? 'bg-white/10' : 'hover:bg-white/10'}"
					title="Categories"
				>
					<Tag class="h-6 w-6 flex-shrink-0" />
					<span class="hidden {isExpanded ? 'md:inline' : ''} ml-3 whitespace-nowrap"
						>Categories</span
					>
				</a>
			</li>

			<!-- Groups -->
			<li>
				<a
					href="/groups"
					class="flex items-center rounded-md py-2 text-white transition-colors {isExpanded
						? 'md:justify-start md:px-3'
						: ''} justify-center px-0 {isGroupsActive ? 'bg-white/10' : 'hover:bg-white/10'}"
					title="Groups"
				>
					<UserGroup class="h-6 w-6 flex-shrink-0" />
					<span class="hidden {isExpanded ? 'md:inline' : ''} ml-3 whitespace-nowrap">Groups</span>
				</a>
			</li>

				<!-- Metrics -->
			<li>
				<a
					href="/metrics"
					class="flex items-center rounded-md py-2 text-white transition-colors {isExpanded
						? 'md:justify-start md:px-3'
						: ''} justify-center px-0 {isMetricsActive ? 'bg-white/10' : 'hover:bg-white/10'}"
					title="Metrics"
				>
					<DocumentMagnifyingGlass class="h-6 w-6 flex-shrink-0" />
					<span class="hidden {isExpanded ? 'md:inline' : ''} ml-3 whitespace-nowrap">Metrics</span>
				</a>
			</li>

			<!-- Statistics -->
			<li>
				<a
					href="/statistics"
					class="flex items-center rounded-md py-2 text-white transition-colors {isExpanded
						? 'md:justify-start md:px-3'
						: ''} justify-center px-0 {isStatisticsActive ? 'bg-white/10' : 'hover:bg-white/10'}"
					title="Statistics"
				>
					<ChartBar class="h-6 w-6 flex-shrink-0" />
					<span class="hidden {isExpanded ? 'md:inline' : ''} ml-3 whitespace-nowrap"
						>Statistics</span
					>
				</a>
			</li>
		</ul>

		<!-- Bottom Section -->
		<ul class="mt-auto flex flex-col space-y-1 border-t border-white/20 px-2 pt-2">
			<!-- Users -->
			<li>
				<a
					href="/users"
					class="flex items-center rounded-md py-2 text-white transition-colors {isExpanded
						? 'md:justify-start md:px-3'
						: ''} justify-center px-0 {isUsersActive ? 'bg-white/10' : 'hover:bg-white/10'}"
					title="Users"
				>
					<Users class="h-6 w-6 flex-shrink-0" />
					<span class="hidden {isExpanded ? 'md:inline' : ''} ml-3 whitespace-nowrap">Users</span>
				</a>
			</li>

			<!-- Configuration -->
			<li>
				<a
					href="/configuration"
					class="flex items-center rounded-md py-2 text-white transition-colors {isExpanded
						? 'md:justify-start md:px-3'
						: ''} justify-center px-0 {isConfigurationActive ? 'bg-white/10' : 'hover:bg-white/10'}"
					title="Configuration"
				>
					<Cog6Tooth class="h-6 w-6 flex-shrink-0" />
					<span class="hidden {isExpanded ? 'md:inline' : ''} ml-3 whitespace-nowrap"
						>Configuration</span
					>
				</a>
			</li>

			<!-- Profile -->
			<li>
				<a
					href="/profile"
					class="flex items-center rounded-md py-2 text-white transition-colors {isExpanded
						? 'md:justify-start md:px-3'
						: ''} justify-center px-0 {isProfileActive ? 'bg-white/10' : 'hover:bg-white/10'}"
					title="Profile"
				>
					<UserCircle class="h-6 w-6 flex-shrink-0" />
					<span class="hidden {isExpanded ? 'md:inline' : ''} ml-3 whitespace-nowrap">Profile</span>
				</a>
			</li>
		</ul>
	</nav>
</aside>
