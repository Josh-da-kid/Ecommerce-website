<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button, Input } from '$lib/components/ui';
	import { login } from '$lib/stores/auth';
	import { toasts } from '$lib/stores/toast';

	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let isLoading = $state(false);
	let error = $state('');

	async function handleSubmit(e: Event) {
		e.preventDefault();
		isLoading = true;
		error = '';

		const result = await login(email, password);

		if (result.success) {
			toasts.show('success', 'Welcome back!');
			goto('/');
		} else {
			error = result.error || 'Login failed';
		}

		isLoading = false;
	}
</script>

<svelte:head>
	<title>Login - Urazbox</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-bg-primary pt-24 pb-16">
	<div class="w-full max-w-md">
		<div class="rounded-2xl bg-white p-8 shadow-lg">
			<h1 class="mb-8 text-center text-3xl font-[var(--font-playfair)] font-bold text-text-primary">
				Welcome Back
			</h1>

			<form onsubmit={handleSubmit} class="space-y-6">
				{#if error}
					<div class="rounded-xl bg-red-50 p-4 text-sm text-red-600">
						{error}
					</div>
				{/if}

				<Input
					type="email"
					label="Email"
					bind:value={email}
					placeholder="your@email.com"
					required
				/>

				<div class="relative">
					<Input
						type={showPassword ? 'text' : 'password'}
						label="Password"
						bind:value={password}
						placeholder="••••••••"
						required
					/>
					<button
						type="button"
						class="absolute top-[42px] right-4 text-text-muted transition-colors hover:text-text-primary"
						onclick={() => (showPassword = !showPassword)}
						aria-label={showPassword ? 'Hide password' : 'Show password'}
					>
						{#if showPassword}
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18"
								/>
							</svg>
						{:else}
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
								/>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
								/>
							</svg>
						{/if}
					</button>
				</div>

				<div class="flex items-center justify-between text-sm">
					<label class="flex items-center gap-2">
						<input type="checkbox" class="rounded border-border" />
						<span class="text-text-secondary">Remember me</span>
					</label>
					<a href="/forgot-password" class="text-accent hover:underline">Forgot password?</a>
				</div>

				<Button type="submit" variant="primary" size="lg" class="w-full" loading={isLoading}>
					Sign In
				</Button>
			</form>

			<p class="mt-6 text-center text-text-secondary">
				Don't have an account?
				<a href="/register" class="text-accent hover:underline">Sign up</a>
			</p>
		</div>
	</div>
</div>
