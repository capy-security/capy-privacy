<script lang="ts">
	import { authorizationStore } from '$lib/stores/authorization';
	let user = $derived($authorizationStore);
</script>

<div class="">
	<div class="mx-auto max-w-7xl">
		<h1 class="mb-4 text-3xl font-bold text-white">Welcome to Capy Privacy DNS</h1>

		{#if user.authenticated && user.profile}
			<div
				class="mb-4 rounded-lg border border-white/20 bg-white/10 p-6 shadow-lg backdrop-blur-sm"
			>
				<h2 class="text-white">Welcome, {user.profile?.display_name}!</h2>
			</div>
		{:else}
			<p class="text-gray-300">
				Please
				<a
					href="/login"
					class="font-medium text-violet-300 transition-colors hover:text-violet-200 hover:underline"
				>
					sign in
				</a>
				to continue.
			</p>
		{/if}
	</div>
</div>
