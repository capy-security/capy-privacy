<script lang="ts">
	import { authorizationStore } from '$lib/stores/authorization';
	import { goto } from '$app/navigation';
	import {
		createFirstRunAuthFirstRunGet,
		createGetUserTokenAuthTokenPost,
		createCreateAdminAuthAdminPost
	} from '$lib/api/generated/authentication/authentication';
	import type { ApiResponse } from '$lib/api/generated/models';
	import { UserRole } from '$lib/api/generated/models/userRole';
	import {
		Envelope,
		LockClosed,
		ExclamationCircle,
		ArrowRightOnRectangle,
		ArrowPath,
		User as UserIcon
	} from 'svelte-heros-v2';

	let email = $state('');
	let password = $state('');
	let localError = $state<string | null>(null);

	const firstRunQuery = createFirstRunAuthFirstRunGet(() => ({
		query: {
			retry: false,
			staleTime: 60_000
		}
	}));

	let needsSetup = $derived.by(() => {
		if (firstRunQuery.isPending) return null as boolean | null;
		if (firstRunQuery.isError) return false;
		const d = firstRunQuery.data;
		if (d?.status === 200 && d.data && typeof d.data === 'object' && 'needs_setup' in d.data) {
			return (d.data as { needs_setup: boolean }).needs_setup;
		}
		return false;
	});

	function firstRunErrorMessage(err: unknown): string {
		if (err instanceof Error) return err.message;
		return 'Could not reach the API. Check your connection and try again.';
	}

	let firstRunError = $derived(
		firstRunQuery.isError ? firstRunErrorMessage(firstRunQuery.error) : null
	);

	const loginMutation = createGetUserTokenAuthTokenPost();
	const createAdminMutation = createCreateAdminAuthAdminPost();

	let isLoading = $derived(loginMutation.isPending);

	// Wizard (first run)
	let wizardDisplayName = $state('Admin');
	let wizardEmail = $state('');
	let wizardPassword = $state('');
	let wizardError = $state<string | null>(null);
	let wizardLoading = $derived(
		createAdminMutation.isPending || loginMutation.isPending
	);

	const error = $derived(localError);

	async function handleSubmit() {
		localError = null;

		if (!email || !password) {
			localError = 'Please fill in all fields';
			return;
		}

		if (!/^\S+@\S+$/.test(email)) {
			localError = 'Invalid email format';
			return;
		}

		try {
			const res = await loginMutation.mutateAsync({ data: { email, password } });
			if (res.status !== 200) {
				localError = 'Login failed. Please try again.';
				return;
			}
			const apiResponse = res.data as ApiResponse;
			const token = (apiResponse?.data as { token?: string })?.token;
			if (!token) {
				localError = 'No token received from server';
				return;
			}
			authorizationStore.applyToken(token);
			goto('/');
		} catch (err) {
			localError =
				err instanceof Error ? err.message : 'Login failed. Please try again.';
		}
	}

	async function handleWizardSubmit() {
		wizardError = null;

		if (!wizardDisplayName?.trim() || !wizardEmail?.trim() || !wizardPassword) {
			wizardError = 'Please fill in all fields';
			return;
		}
		if (!/^\S+@\S+$/.test(wizardEmail)) {
			wizardError = 'Invalid email format';
			return;
		}
		if (wizardDisplayName.trim().length > 64) {
			wizardError = 'Display name must be at most 64 characters';
			return;
		}

		const trimmedEmail = wizardEmail.trim();
		try {
			await createAdminMutation.mutateAsync({
				data: {
					display_name: wizardDisplayName.trim(),
					email: trimmedEmail,
					password: wizardPassword,
					role: UserRole.NUMBER_1
				}
			});
			const tokenRes = await loginMutation.mutateAsync({
				data: { email: trimmedEmail, password: wizardPassword }
			});
			const apiResponse = tokenRes.data as ApiResponse;
			const token = (apiResponse?.data as { token?: string })?.token;
			if (!token) {
				wizardError = 'Account created but sign-in failed. Try signing in manually.';
				return;
			}
			authorizationStore.applyToken(token);
			goto('/');
		} catch (err) {
			wizardError =
				err instanceof Error ? err.message : 'Failed to complete setup.';
		}
	}
</script>

<div>
	<div class="w-full max-w-md">
		{#if needsSetup === null}
			<div class="mt-12 flex flex-col items-center justify-center gap-4">
				<ArrowPath class="h-10 w-10 animate-spin text-violet-400" />
				<p class="text-center text-sm text-gray-300">Checking setup…</p>
			</div>
		{:else if needsSetup === true}
			<div>
				<h2
					class="mt-6 text-center text-3xl font-bold leading-snug tracking-tight text-white"
				>
					Welcome to Capy Privacy.<br />
					Please Setup your admin account
				</h2>
				<p class="mt-2 text-center text-sm text-gray-300">
					Create the first admin account. Default categories and DNS client will be configured
					automatically.
				</p>
			</div>
			<form
				class="mt-8 space-y-6"
				onsubmit={(e) => {
					e.preventDefault();
					handleWizardSubmit();
				}}
			>
				{#if wizardError}
					<div class="rounded-md border border-red-500/30 bg-red-500/20 p-4 backdrop-blur-sm">
						<div class="flex">
							<ExclamationCircle class="h-5 w-5 shrink-0 text-red-300" />
							<h3 class="ml-3 text-sm font-medium text-red-200">{wizardError}</h3>
						</div>
					</div>
				{/if}

				<div class="space-y-4 rounded-md">
					<div>
						<label for="wiz_display_name" class="block text-sm font-medium text-gray-200">
							Display name
						</label>
						<div class="relative mt-1">
							<div
								class="pointer-events-none absolute inset-y-0 left-0 isolate z-10 flex items-center pl-3"
							>
								<UserIcon class="h-5 w-5 text-gray-100" />
							</div>
							<input
								id="wiz_display_name"
								type="text"
								autocomplete="name"
								required
								maxlength="64"
								class="block w-full rounded-md border border-white/20 bg-white/10 py-2 pr-3 pl-10 text-white placeholder-gray-300 backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 sm:text-sm"
								placeholder="Admin"
								bind:value={wizardDisplayName}
								disabled={wizardLoading}
							/>
						</div>
					</div>
					<div>
						<label for="wiz_email" class="block text-sm font-medium text-gray-200">Email</label>
						<div class="relative mt-1">
							<div
								class="pointer-events-none absolute inset-y-0 left-0 isolate z-10 flex items-center pl-3"
							>
								<Envelope class="h-5 w-5 text-gray-100" />
							</div>
							<input
								id="wiz_email"
								type="email"
								autocomplete="email"
								required
								class="block w-full rounded-md border border-white/20 bg-white/10 py-2 pr-3 pl-10 text-white placeholder-gray-300 backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 sm:text-sm"
								placeholder="your.email@example.com"
								bind:value={wizardEmail}
								disabled={wizardLoading}
							/>
						</div>
					</div>
					<div>
						<label for="wiz_password" class="block text-sm font-medium text-gray-200"
							>Password</label
						>
						<div class="relative mt-1">
							<div
								class="pointer-events-none absolute inset-y-0 left-0 isolate z-10 flex items-center pl-3"
							>
								<LockClosed class="h-5 w-5 text-gray-100" />
							</div>
							<input
								id="wiz_password"
								type="password"
								autocomplete="new-password"
								required
								class="block w-full rounded-md border border-white/20 bg-white/10 py-2 pr-3 pl-10 text-white placeholder-gray-300 backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 sm:text-sm"
								placeholder="Your password"
								bind:value={wizardPassword}
								disabled={wizardLoading}
							/>
						</div>
					</div>
				</div>

				<button
					type="submit"
					disabled={wizardLoading}
					class="group relative flex w-full items-center justify-center rounded-md border border-transparent bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all hover:from-violet-700 hover:to-purple-700 focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if wizardLoading}
						<ArrowPath class="mr-3 -ml-1 h-5 w-5 animate-spin text-white" />
						Setting up…
					{:else}
						Complete setup and sign in
					{/if}
				</button>
			</form>
		{:else}
			<div>
				<h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-white">
					Sign in to your account
				</h2>
				<p class="mt-2 text-center text-sm text-gray-300">Please sign in to continue</p>
			</div>
			{#if firstRunError}
				<div
					class="mt-4 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-center text-sm text-amber-100"
				>
					{firstRunError}
					<button
						type="button"
						class="mt-2 text-violet-300 underline hover:text-violet-200"
						onclick={() => firstRunQuery.refetch()}
					>
						Retry
					</button>
				</div>
			{/if}
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
		{/if}
	</div>
</div>
