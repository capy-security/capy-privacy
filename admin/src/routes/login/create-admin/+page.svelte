<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		createFirstRunAuthFirstRunGet,
		createCreateAdminAuthAdminPost
	} from '$lib/api/generated/authentication/authentication';
	import { UserRole } from '$lib/api/generated/models/userRole';
	import {
		Envelope,
		LockClosed,
		User as UserIcon,
		ExclamationCircle,
		ArrowPath,
		ArrowLeft
	} from 'svelte-heros-v2';

	let displayName = $state('Admin');
	let email = $state('');
	let password = $state('');
	let localError = $state<string | null>(null);
	let successMessage = $state<string | null>(null);
	let didRedirect = $state(false);

	const firstRunQuery = createFirstRunAuthFirstRunGet(() => ({
		query: { retry: false, staleTime: 30_000 }
	}));

	$effect(() => {
		if (didRedirect) return;
		if (!firstRunQuery.isSuccess || !firstRunQuery.data?.data) return;
		const d = firstRunQuery.data.data as { needs_setup?: boolean };
		if (d.needs_setup === false) {
			didRedirect = true;
			goto('/login');
		}
	});

	const createAdminMutation = createCreateAdminAuthAdminPost();

	let isLoading = $derived(createAdminMutation.isPending);

	const error = $derived(localError);

	async function handleSubmit() {
		localError = null;
		successMessage = null;

		if (!displayName?.trim() || !email?.trim() || !password) {
			localError = 'Please fill in all fields';
			return;
		}

		if (!/^\S+@\S+$/.test(email)) {
			localError = 'Invalid email format';
			return;
		}

		if (displayName.trim().length > 64) {
			localError = 'Display name must be at most 64 characters';
			return;
		}

		try {
			await createAdminMutation.mutateAsync({
				data: {
					display_name: displayName.trim(),
					email: email.trim(),
					password,
					role: UserRole.NUMBER_1
				}
			});
			successMessage = 'Admin account created. You can now sign in.';
			setTimeout(() => goto('/login'), 1500);
		} catch (err) {
			console.error('[CreateAdmin] Failed:', err);
			localError =
				err instanceof Error ? err.message : 'Failed to create admin account.';
		}
	}
</script>

<div>
	<div class="w-full max-w-md">
		<div>
			<h2
				class="mt-6 text-center text-3xl font-bold leading-snug tracking-tight text-white"
			>
				Welcome to Capy Privacy.<br />
				Please Setup your admin account
			</h2>
			<p class="mt-2 text-center text-sm text-gray-300">
				First time only — use this when no admin exists yet.
			</p>
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
			{#if successMessage}
				<div class="rounded-md border border-emerald-500/30 bg-emerald-500/20 p-4 backdrop-blur-sm">
					<p class="text-sm font-medium text-emerald-200">{successMessage}</p>
				</div>
			{/if}

			<div class="space-y-4 rounded-md">
				<div>
					<label for="display_name" class="block text-sm font-medium text-gray-200">
						Display name
					</label>
					<div class="relative mt-1">
						<div
							class="pointer-events-none absolute inset-y-0 left-0 isolate z-10 flex items-center pl-3"
						>
							<UserIcon class="h-5 w-5 text-gray-100" />
						</div>
						<input
							id="display_name"
							name="display_name"
							type="text"
							autocomplete="name"
							required
							maxlength="64"
							class="block w-full rounded-md border border-white/20 bg-white/10 py-2 pr-3 pl-10 text-white placeholder-gray-300 backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 sm:text-sm"
							placeholder="Admin"
							bind:value={displayName}
							disabled={isLoading}
						/>
					</div>
				</div>
				<div>
					<label for="email" class="block text-sm font-medium text-gray-200">Email address</label>
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
					<label for="password" class="block text-sm font-medium text-gray-200">Password</label>
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
							autocomplete="new-password"
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
						Creating...
					{:else}
						Create admin account
					{/if}
				</button>
				<p class="mt-4 text-center">
					<a
						href="/login"
						class="inline-flex items-center text-sm text-violet-300 underline decoration-violet-400/50 underline-offset-2 transition hover:text-violet-200 hover:decoration-violet-300"
					>
						<ArrowLeft class="mr-1 h-4 w-4" />
						Back to sign in
					</a>
				</p>
			</div>
		</form>
	</div>
</div>
