<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui';
	import { ProductCard } from '$lib/components/product';
	import ParticleBackground from '$lib/components/layout/ParticleBackground.svelte';
	import { featuredProducts, fetchFeaturedProducts } from '$lib/stores/products';
	import { scrollTo } from '$lib/animations/smoothScroll';

	let loaded = $state(false);

	onMount(() => {
		fetchFeaturedProducts();
		setTimeout(() => (loaded = true), 100);
	});

	const features = [
		{
			icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
			title: 'Premium Quality',
			description: 'Curated selection of luxury products'
		},
		{
			icon: 'M12 8v13m0-13V6a4 4 0 00-4-4H6.5a2.5 2.5 0 000 5H12m0 0V6a4 4 0 014-4h1.5a2.5 2.5 0 010 5H12',
			title: 'Free Shipping',
			description: 'On all orders over ₦300,000'
		},
		{
			icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
			title: 'Secure Payment',
			description: '100% secure checkout process'
		},
		{
			icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
			title: 'Easy Returns',
			description: '30-day hassle-free returns'
		}
	];
</script>

<svelte:head>
	<title>Luxe Store - Premium E-Commerce</title>
	<meta
		name="description"
		content="Elevate your style with our curated collection of premium products."
	/>
</svelte:head>

<section
	class="relative z-0 flex min-h-screen items-center justify-center overflow-hidden bg-bg-dark"
>
	<ParticleBackground />

	<div
		class="absolute inset-0 z-[1] bg-gradient-to-b from-transparent via-transparent to-bg-dark/90"
	></div>

	<div class="relative z-10 mx-auto max-w-7xl px-4 py-32 text-center sm:px-6 lg:px-8">
		<div
			class="space-y-10 {loaded
				? 'translate-y-0 opacity-100'
				: 'translate-y-10 opacity-0'} transition-all duration-1000"
		>
			<h1
				class="text-5xl leading-tight font-[var(--font-playfair)] font-bold text-white md:text-7xl lg:text-8xl"
			>
				Elevate Your
				<span class="text-gradient block">Style</span>
			</h1>

			<p class="mx-auto max-w-2xl text-xl text-gray-300 md:text-2xl">
				Discover curated luxury pieces crafted for those who appreciate exceptional quality and
				timeless elegance.
			</p>

			<div class="flex flex-col justify-center gap-5 pt-6 sm:flex-row">
				<a href="/products">
					<Button
						variant="primary"
						size="lg"
						class="min-w-[200px] bg-accent text-white shadow-lg shadow-accent/30 hover:scale-105 hover:bg-accent-hover hover:shadow-xl hover:shadow-accent/40"
					>
						Shop Collection
					</Button>
				</a>
				<button onclick={() => scrollTo('#features', 100)}>
					<Button
						variant="secondary"
						size="lg"
						class="!min-w-[200px] !border-2 !border-white !text-white hover:!bg-white hover:!text-primary"
					>
						Learn More
					</Button>
				</button>
			</div>
		</div>

		<div class="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
			<svg class="h-6 w-6 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M19 14l-7 7m0 0l-7-7m7 7V3"
				/>
			</svg>
		</div>
	</div>
</section>

<section id="features" class="bg-bg-primary py-32">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
			{#each features as feature, i}
				<div
					class="group rounded-2xl p-8 text-center transition-all duration-300 hover:bg-white hover:shadow-lg"
					style="animation-delay: {i * 100}ms"
				>
					<div
						class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 transition-colors group-hover:bg-accent group-hover:text-white"
					>
						<svg
							class="h-8 w-8 text-accent group-hover:text-white"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
								d={feature.icon}
							/>
						</svg>
					</div>
					<h3 class="mb-3 text-xl font-semibold text-text-primary">{feature.title}</h3>
					<p class="text-text-secondary">{feature.description}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<section class="bg-bg-secondary py-32">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="mb-16 text-center">
			<h2 class="mb-4 text-4xl font-[var(--font-playfair)] font-bold text-text-primary md:text-5xl">
				Featured Collection
			</h2>
			<p class="mx-auto max-w-2xl text-xl text-text-secondary">
				Handpicked pieces that define modern luxury
			</p>
		</div>

		<div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
			{#each $featuredProducts as product, i}
				<div
					class="animate-fade-up opacity-0"
					style="animation-delay: {i * 100}ms; animation-fill-mode: forwards;"
				>
					<ProductCard {product} />
				</div>
			{/each}
		</div>

		<div class="mt-12 text-center">
			<a href="/products">
				<Button variant="secondary" size="lg">View All Products</Button>
			</a>
		</div>
	</div>
</section>

<section class="relative overflow-hidden bg-primary py-32 text-white">
	<div class="absolute inset-0 opacity-10">
		<div class="absolute top-0 left-0 h-96 w-96 rounded-full bg-accent blur-3xl filter"></div>
		<div class="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-accent blur-3xl filter"></div>
	</div>

	<div class="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
			<div>
				<h2 class="mb-6 text-4xl font-[var(--font-playfair)] font-bold md:text-5xl">
					Join the Luxe Circle
				</h2>
				<p class="mb-8 text-xl text-gray-300">
					Subscribe to our newsletter for exclusive offers, early access to new collections, and
					style inspiration.
				</p>
				<form class="flex flex-col gap-4 sm:flex-row">
					<input
						type="email"
						placeholder="Enter your email"
						class="h-14 flex-1 rounded-xl border border-white/20 bg-white/10 px-6 text-white placeholder:text-gray-400 focus:border-accent focus:outline-none"
					/>
					<Button variant="primary" size="lg">Subscribe</Button>
				</form>
			</div>

			<div class="hidden lg:block">
				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-4">
						<div class="h-32 rounded-2xl bg-accent/20"></div>
						<div class="h-48 rounded-2xl bg-white/10"></div>
					</div>
					<div class="space-y-4 pt-8">
						<div class="h-48 rounded-2xl bg-white/10"></div>
						<div class="h-32 rounded-2xl bg-accent/20"></div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>
