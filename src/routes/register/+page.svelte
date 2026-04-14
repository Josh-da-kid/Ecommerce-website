<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button, Input } from '$lib/components/ui';
	import { register } from '$lib/stores/auth';
	import { toasts } from '$lib/stores/toast';

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let isLoading = $state(false);
	let error = $state('');

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';

		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		if (password.length < 8) {
			error = 'Password must be at least 8 characters';
			return;
		}

		isLoading = true;

		const result = await register(email, password, name);

		if (result.success) {
			toasts.show('success', 'Welcome to Luxe!');
			goto('/');
		} else {
			error = result.error || 'Registration failed';
		}

		isLoading = false;
	}
</script>

<svelte:head>
	<title>Register - Luxe Store</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-bg-primary px-4 py-24">
	<div class="w-full max-w-md">
		<div class="rounded-2xl bg-white p-8 shadow-lg">
			<h1 class="mb-2 text-center text-3xl font-[var(--font-playfair)] font-bold text-text-primary">
				Create Account
			</h1>
			<p class="mb-8 text-center text-text-secondary">Join the Luxe circle for exclusive access</p>

			<form onsubmit={handleSubmit} class="space-y-5">
				{#if error}
					<div class="rounded-xl bg-red-50 p-4 text-sm text-red-600">
						{error}
					</div>
				{/if}

				<Input type="text" label="Full Name" bind:value={name} placeholder="John Doe" required />

				<Input
					type="email"
					label="Email"
					bind:value={email}
					placeholder="your@email.com"
					required
				/>

				<Input
					type="password"
					label="Password"
					bind:value={password}
					placeholder="••••••••"
					required
				/>

				<Input
					type="password"
					label="Confirm Password"
					bind:value={confirmPassword}
					placeholder="••••••••"
					required
				/>

				<Button type="submit" variant="primary" size="lg" class="w-full" loading={isLoading}>
					Create Account
				</Button>
			</form>

			<p class="mt-6 text-center text-text-secondary">
				Already have an account?
				<a href="/login" class="text-accent hover:underline">Sign in</a>
			</p>
		</div>
	</div>
</div>
