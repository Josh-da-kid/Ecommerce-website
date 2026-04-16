<script lang="ts">
	import { onMount } from 'svelte';
	import { wishlist } from '$lib/stores';
	import { products } from '$lib/stores/products';
	import { ProductCard } from '$lib/components/product';
	import { Button } from '$lib/components/ui';
	import type { Product } from '$lib/pocketbase';
	import { isAuthenticated } from '$lib/stores/auth';
	import { goto } from '$app/navigation';

	let wishlistValue = $state<string[]>([]);
	wishlist.subscribe((v) => (wishlistValue = v));

	let productsValue = $state<Product[]>([]);
	products.subscribe((v) => (productsValue = v));

	let wishlistProducts = $derived(
		productsValue.filter(
			(p, i, arr) => wishlistValue.includes(p.id) && arr.findIndex((x) => x.id === p.id) === i
		)
	);

	onMount(() => {
		if (!$isAuthenticated) {
			goto('/login');
		}
	});
</script>

<svelte:head>
	<title>Wishlist - Luxe Store</title>
</svelte:head>

<div class="min-h-screen bg-bg-primary pt-24 pb-16">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<h1 class="mb-8 text-4xl font-[var(--font-playfair)] font-bold text-text-primary">
			My Wishlist
		</h1>

		{#if wishlistProducts.length === 0}
			<div class="py-16 text-center">
				<svg
					class="mx-auto mb-6 h-24 w-24 text-text-muted"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="1"
						d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
					/>
				</svg>
				<h2 class="mb-4 text-2xl font-semibold text-text-primary">Your wishlist is empty</h2>
				<p class="mb-8 text-text-secondary">Save items you love by clicking the heart icon.</p>
				<a href="/products">
					<Button variant="primary" size="lg">Browse Products</Button>
				</a>
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
				{#each wishlistProducts as product}
					<ProductCard {product} />
				{/each}
			</div>
		{/if}
	</div>
</div>
