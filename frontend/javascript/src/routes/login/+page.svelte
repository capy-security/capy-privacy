<script lang="ts">
	import { authorizationStore } from '$lib/stores/authorization';
	import { goto } from '$app/navigation';
	import {
		Envelope,
		LockClosed,
		ExclamationCircle,
		ArrowRightOnRectangle,
		ArrowPath
	} from 'svelte-heros-v2';

	let email = $state('');
	let password = $state('');
	let isLoading = $state(false);
	let localError = $state<string | null>(null);
	let user = $derived($authorizationStore);

	// Get error from local validation
	const error = $derived(localError);

	async function handleSubmit() {
		// Clear any previous errors before validation
		localError = null;

		// Local validation - these are client-side checks
		if (!email || !password) {
			localError = 'Please fill in all fields';
			return;
		}

		if (!/^\S+@\S+$/.test(email)) {
			localError = 'Invalid email format';
			return;
		}

		// Clear local errors before API call - API errors will replace them
		isLoading = true;
		localError = null;

		try {
			console.log(`[Login.handleLogin] Starting login for ${email}`);
			await authorizationStore.login(email, password);
			console.log(`[Login.handleLogin] Login successful`);
			// Redirect to home page after successful login
			goto('/');
		} catch (err) {
			console.error('[Login.handleLogin] Login failed:', err);
			// Preserve the API error message - it should already be extracted in the store
			if (err instanceof Error) {
				localError = err.message;
			} else {
				// Fallback only if error is not an Error instance (shouldn't happen)
				localError = 'Login failed. Please try again.';
			}
		} finally {
			isLoading = false;
		}
	}
</script>

<div>
	<div class="w-full max-w-md">
		<div>
			<h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-white">
				Sign in to your account
			</h2>
			<p class="mt-2 text-center text-sm text-gray-300">Please sign in to continue</p>
		</div>
		<form
			class="mt-8 space-y-6"
			onsubmit={(e) => {
				e.preventDefault();
				handleSubmit();
			}}
		>
			{#if error}
				<div class="rounded-md border border-red-500/30 bg-red-500/20 p-4 backdrop-blur-sm">
					<div class="flex">
						<div class="flex-shrink-0">
							<ExclamationCircle class="h-5 w-5 text-red-300" />
						</div>
						<div class="ml-3">
							<h3 class="text-sm font-medium text-red-200">Error: {error}</h3>
						</div>
					</div>
				</div>
			{/if}

			<div class="space-y-4 rounded-md">
				<div>
					<label for="email" class="block text-sm font-medium text-gray-200"> Email address </label>
					<div class="relative mt-1">
						<div
							class="pointer-events-none absolute inset-y-0 left-0 isolate z-10 flex items-center pl-3"
						>
							<Envelope class="h-5 w-5 text-gray-100" />
						</div>
						<input
							id="email"
							name="email"
							type="email"
							autocomplete="email"
							required
							class="block w-full rounded-md border border-white/20 bg-white/10 py-2 pr-3 pl-10 text-white placeholder-gray-300 backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 sm:text-sm"
							placeholder="your.email@example.com"
							bind:value={email}
							disabled={isLoading}
						/>
					</div>
				</div>
				<div>
					<label for="password" class="block text-sm font-medium text-gray-200"> Password </label>
					<div class="relative mt-1">
						<div
							class="pointer-events-none absolute inset-y-0 left-0 isolate z-10 flex items-center pl-3"
						>
							<LockClosed class="h-5 w-5 text-gray-100" />
						</div>
						<input
							id="password"
							name="password"
							type="password"
							autocomplete="current-password"
							required
							class="block w-full rounded-md border border-white/20 bg-white/10 py-2 pr-3 pl-10 text-white placeholder-gray-300 backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 sm:text-sm"
							placeholder="Your password"
							bind:value={password}
							disabled={isLoading}
						/>
					</div>
				</div>
			</div>

			<div>
				<button
					type="submit"
					disabled={isLoading}
					class="group relative flex w-full items-center justify-center rounded-md border border-transparent bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all hover:from-violet-700 hover:to-purple-700 focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if isLoading}
						<ArrowPath class="mr-3 -ml-1 h-5 w-5 animate-spin text-white" />
						Signing in...
					{:else}
						<ArrowRightOnRectangle class="mr-2 -ml-1 h-5 w-5 text-white" />
						Sign in
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>
