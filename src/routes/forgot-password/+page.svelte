<script lang="ts">
	import { goto } from '$app/navigation';
	import { pb } from '$lib/pocketbase';
	import { Button, Input } from '$lib/components/ui';
	import { toasts } from '$lib/stores/toast';

	let email = $state('');
	let isLoading = $state(false);
	let error = $state('');
	let emailSent = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		isLoading = true;
		error = '';

		try {
			await pb.collection('estore_users').requestPasswordReset(email);
			emailSent = true;
			toasts.show('success', 'Password reset email sent!');
		} catch (err: any) {
			error =
				err?.response?.message || err.message || 'Failed to send reset email. Please try again.';
		}

		isLoading = false;
	}
</script>

<svelte:head>
	<title>Forgot Password - Urazbox</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-bg-primary pt-24 pb-16">
	<div class="w-full max-w-md">
		<div class="rounded-2xl bg-white p-8 shadow-lg">
			<h1 class="mb-4 text-center text-3xl font-[var(--font-playfair)] font-bold text-text-primary">
				Reset Your Password
			</h1>

			{#if !emailSent}
				<p class="mb-8 text-center text-text-secondary">
					Enter your email address and we will send you a link to reset your password.
				</p>

				<form onsubmit={handleSubmit} class="space-y-6">
					{#if error}
						<div class="rounded-xl bg-red-50 p-4 text-sm text-red-600">
							{error}
						</div>
					{/if}

					<Input
						type="email"
						label="Email Address"
						bind:value={email}
						placeholder="your@email.com"
						required
					/>

					<Button type="submit" variant="primary" size="lg" class="w-full" loading={isLoading}>
						Send Reset Link
					</Button>
				</form>
			{:else}
				<div class="text-center">
					<div
						class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100"
					>
						<svg
							class="h-8 w-8 text-green-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
							/>
						</svg>
					</div>
					<p class="mb-2 text-lg font-semibold text-text-primary">Check Your Email</p>
					<p class="mb-6 text-text-secondary">
						We have sent a password reset link to <strong class="text-text-primary">{email}</strong
						>. Please check your inbox and follow the instructions.
					</p>
					<p class="text-sm text-text-muted">
						Did not receive the email? Check your spam folder or
						<button
							type="button"
							class="text-accent hover:underline"
							onclick={() => (emailSent = false)}
						>
							try again
						</button>.
					</p>
				</div>
			{/if}

			<p class="mt-6 text-center text-text-secondary">
				Remember your password?
				<a href="/login" class="text-accent hover:underline">Sign in</a>
			</p>
		</div>
	</div>
</div>
