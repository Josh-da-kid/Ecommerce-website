<script lang="ts">
	import { Button, Input } from '$lib/components/ui';
	import { toasts } from '$lib/stores/toast';

	let name = $state('');
	let email = $state('');
	let subject = $state('');
	let message = $state('');
	let isLoading = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		isLoading = true;

		await new Promise((resolve) => setTimeout(resolve, 1000));

		toasts.show('success', "Thank you! We'll get back to you soon.");
		name = '';
		email = '';
		subject = '';
		message = '';

		isLoading = false;
	}
</script>

<svelte:head>
	<title>Contact Us - Luxe Store</title>
</svelte:head>

<div class="min-h-screen bg-bg-primary pt-24 pb-16">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="mb-16 text-center">
			<h1 class="mb-4 text-4xl font-[var(--font-playfair)] font-bold text-text-primary md:text-5xl">
				Get in Touch
			</h1>
			<p class="mx-auto max-w-xl text-xl text-text-secondary">
				We'd love to hear from you. Send us a message and we'll respond as soon as possible.
			</p>
		</div>

		<div class="grid gap-12 lg:grid-cols-2">
			<!-- Contact Info -->
			<div class="space-y-8">
				<div class="rounded-2xl bg-white p-8 shadow-lg">
					<div class="mb-8 text-center">
						<div
							class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10"
						>
							<svg
								class="h-8 w-8 text-accent"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="1.5"
									d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
								/>
							</svg>
						</div>
						<h3 class="text-xl font-semibold text-text-primary">Phone</h3>
						<p class="mt-1 text-text-secondary">+234 123 456 7890</p>
						<p class="text-sm text-text-muted">Mon-Fri, 9am-6pm</p>
					</div>
				</div>

				<div class="rounded-2xl bg-white p-8 shadow-lg">
					<div class="mb-4 text-center">
						<div
							class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10"
						>
							<svg
								class="h-8 w-8 text-accent"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="1.5"
									d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m5 11v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m5-11a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2h9a2 2 0 002-2V9z"
								/>
							</svg>
						</div>
						<h3 class="text-xl font-semibold text-text-primary">Email</h3>
						<p class="mt-1 text-text-secondary">hello@luxestore.com</p>
						<p class="text-sm text-text-muted">We reply within 24 hours</p>
					</div>
				</div>

				<div class="rounded-2xl bg-white p-8 shadow-lg">
					<div class="mb-4 text-center">
						<div
							class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10"
						>
							<svg
								class="h-8 w-8 text-accent"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="1.5"
									d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
								/>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="1.5"
									d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
								/>
							</svg>
						</div>
						<h3 class="text-xl font-semibold text-text-primary">Visit Us</h3>
						<p class="mt-1 text-text-secondary">Victoria Island</p>
						<p class="text-sm text-text-muted">Lagos, Nigeria</p>
					</div>
				</div>

				<div class="rounded-2xl bg-white p-8 shadow-lg">
					<h3 class="mb-4 text-xl font-semibold text-text-primary">Follow Us</h3>
					<div class="flex justify-center gap-4">
						<a
							href="#"
							class="rounded-full bg-bg-secondary p-3 transition-colors hover:bg-accent hover:text-white"
						>
							<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
								<path
									d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.006 1.51 6.274-.541-.016-1.052-.166-1.494-.452-.118.603-.826 1.212-1.493 1.486-.044-.481-.002-.963.008-1.425.039-.145.059-.292.059-.442 0-.665-.335-1.285-.845-1.767-.573.178-1.823.696-2.512 1.486-.739-.946-1.978-1.484-3.255-1.484-.246 0-.483.022-.718.065-.736-.512-1.809-.768-2.995-.768-1.064 0-2.034.332-2.822.916-.765-.256-1.618-.399-2.476-.399-1.456 0-2.813.942-3.406 2.226-.545-.727-.924-1.593-.924-2.441 0-.635.255-1.244.676-1.735-.013-.148-.021-.3-.021-.455 0-1.684 1.373-3.052 3.064-3.052.874 0 1.68.328 2.285.877.686-.133 1.418-.233 2.142-.233 1.144 0 2.215.385 3.023.993.635-.628 1.495-1.093 2.405-1.193 1.183 0 2.164.835 2.164 2.164 0 .338-.028.668-.077.984.645.232 1.175.635 1.567 1.112z"
								/>
							</svg>
						</a>
						<a
							href="#"
							class="rounded-full bg-bg-secondary p-3 transition-colors hover:bg-accent hover:text-white"
						>
							<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
								<path
									d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.012-3.584.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
								/>
							</svg>
						</a>
						<a
							href="#"
							class="rounded-full bg-bg-secondary p-3 transition-colors hover:bg-accent hover:text-white"
						>
							<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
								<path
									d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.051c0-3.103 1.894-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.241h-1.918c-1.514 0-1.795.907-1.795 1.763v2.313h3.584l-.702 3.623h-2.882v9.294h5.083c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.326-1.326-1.326z"
								/>
							</svg>
						</a>
					</div>
				</div>
			</div>

			<!-- Contact Form -->
			<div class="rounded-2xl bg-white p-8 shadow-lg">
				<h2 class="mb-8 text-2xl font-semibold text-text-primary">Send us a Message</h2>

				<form onsubmit={handleSubmit} class="space-y-6">
					<Input label="Your Name" type="text" placeholder="John Doe" bind:value={name} />

					<Input
						label="Email Address"
						type="email"
						placeholder="john@example.com"
						bind:value={email}
					/>

					<Input label="Subject" type="text" placeholder="How can we help?" bind:value={subject} />

					<Input
						label="Subject"
						type="text"
						placeholder="How can we help?"
						bind:value={subject}
						required
					/>

					<div>
						<label class="mb-2 block text-sm font-medium text-text-primary">
							Message <span class="text-error">*</span>
						</label>
						<textarea
							bind:value={message}
							rows="6"
							placeholder="Tell us more about your inquiry..."
							class="w-full resize-none rounded-xl border-2 border-border bg-white px-4 py-3 text-text-primary placeholder-text-muted transition-colors focus:border-accent focus:outline-none"
							required
						></textarea>
					</div>

					<Button type="submit" variant="primary" size="lg" loading={isLoading} class="w-full">
						Send Message
					</Button>
				</form>
			</div>
		</div>
	</div>
</div>
