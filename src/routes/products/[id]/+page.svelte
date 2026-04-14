<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { Button, Badge } from '$lib/components/ui';
	import { ProductCard } from '$lib/components/product';
	import { cart, wishlist } from '$lib/stores';
	import { toasts } from '$lib/stores/toast';
	import { getProductImage, fetchProductById, products } from '$lib/stores/products';
	import { formatPrice } from '$lib/utils/index';
	import { parseImages, type Product } from '$lib/pocketbase';

	let product = $state<Product | null>(null);
	let quantity = $state(1);
	let selectedImage = $state(0);
	let isAddingToCart = $state(false);
	let activeTab = $state<'description' | 'reviews' | 'shipping'>('description');

	const productId = $page.params.id;

	onMount(async () => {
		const fetched = await fetchProductById(productId);
		if (fetched) {
			product = fetched;
		} else {
			products.subscribe((p) => {
				const found = p.find((x) => x.id === productId);
				if (found) product = found;
			});
		}
	});

	function handleAddToCart() {
		if (!product) return;
		isAddingToCart = true;
		cart.addItem(product, quantity);
		toasts.show('success', `${product.name} added to cart`);
		setTimeout(() => (isAddingToCart = false), 500);
	}

	function toggleWishlist() {
		if (!product) return;
		wishlist.toggle(product.id);
		const isInWishlist = $wishlist.includes(product.id);
		toasts.show('info', isInWishlist ? 'Removed from wishlist' : 'Added to wishlist');
	}

	let wishlistValue = $state<string[]>([]);
	wishlist.subscribe((v) => (wishlistValue = v));

	let productsValue = $state<Product[]>([]);
	products.subscribe((v) => (productsValue = v));

	let isInWishlist = $derived(product ? wishlistValue.includes(product.id) : false);
	let hasDiscount = $derived(product?.comparePrice && product.comparePrice > product.price);
	let isLowStock = $derived(product ? product.stock <= 10 && product.stock > 0 : false);
	let relatedProducts = $derived(
		product
			? productsValue
					.filter((p) => p.category === product.category && p.id !== product.id)
					.slice(0, 4)
			: []
	);
</script>

<svelte:head>
	<title>{product?.name || 'Product'} - Luxe Store</title>
</svelte:head>

{#if product}
	<div class="min-h-screen bg-bg-primary pt-24 pb-16">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<nav class="mb-8 flex items-center gap-2 text-sm text-text-secondary">
				<a href="/" class="hover:text-accent">Home</a>
				<span>/</span>
				<a href="/products" class="hover:text-accent">Products</a>
				<span>/</span>
				<span class="text-text-primary">{product.name}</span>
			</nav>

			<div class="mb-16 grid grid-cols-1 gap-12 lg:grid-cols-2">
				<div class="space-y-4">
					<div class="relative aspect-square overflow-hidden rounded-2xl bg-bg-secondary">
						<img
							src={getProductImage(product)}
							alt={product.name}
							class="h-full w-full object-cover"
						/>
						{#if hasDiscount}
							<Badge variant="error" class="absolute top-4 left-4">Sale</Badge>
						{/if}
						{#if isLowStock}
							<Badge variant="warning" class="absolute bottom-4 left-4">
								Only {product.stock} left
							</Badge>
						{/if}
					</div>

					{#if parseImages(product.images).length > 1}
						<div class="flex gap-4">
							{#each parseImages(product.images) as image, i}
								<button
									class="h-20 w-20 overflow-hidden rounded-xl border-2 transition-colors {selectedImage ===
									i
										? 'border-accent'
										: 'border-transparent'}"
									onclick={() => (selectedImage = i)}
								>
									<img src={image} alt="" class="h-full w-full object-cover" />
								</button>
							{/each}
						</div>
					{/if}
				</div>

				<div>
					<h1 class="mb-4 text-4xl font-[var(--font-playfair)] font-bold text-text-primary">
						{product.name}
					</h1>

					<div class="mb-6 flex items-center gap-4">
						<span class="text-3xl font-bold text-accent">
							{formatPrice(product.price)}
						</span>
						{#if hasDiscount}
							<span class="text-xl text-text-muted line-through">
								{formatPrice(product.comparePrice!)}
							</span>
						{/if}
					</div>

					<p class="mb-8 text-text-secondary">
						{product.description}
					</p>

					<div class="mb-8 flex items-center gap-4">
						<div class="flex items-center rounded-xl border border-border">
							<button
								class="flex h-12 w-12 items-center justify-center transition-colors hover:bg-bg-secondary"
								onclick={() => (quantity = Math.max(1, quantity - 1))}
							>
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M20 12H4"
									/>
								</svg>
							</button>
							<span class="w-12 text-center font-medium">{quantity}</span>
							<button
								class="flex h-12 w-12 items-center justify-center transition-colors hover:bg-bg-secondary"
								onclick={() => quantity++}
							>
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 4v16m8-8H4"
									/>
								</svg>
							</button>
						</div>

						<button
							class="rounded-xl border border-border p-3 transition-colors hover:bg-bg-secondary"
							onclick={toggleWishlist}
						>
							<svg
								class="h-6 w-6 transition-colors {isInWishlist
									? 'fill-red-500 text-red-500'
									: 'text-text-secondary'}"
								fill={isInWishlist ? 'currentColor' : 'none'}
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
								/>
							</svg>
						</button>
					</div>

					<Button
						variant="primary"
						size="lg"
						class="mb-4 w-full"
						loading={isAddingToCart}
						onclick={handleAddToCart}
					>
						{isAddingToCart ? 'Added!' : 'Add to Cart'}
					</Button>

					<div class="flex items-center gap-6 text-sm text-text-secondary">
						<div class="flex items-center gap-2">
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="1.5"
									d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
								/>
							</svg>
							<span>Free shipping on orders over ₦300,000</span>
						</div>
						<div class="flex items-center gap-2">
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="1.5"
									d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
								/>
							</svg>
							<span>30-day returns</span>
						</div>
					</div>
				</div>
			</div>

			<div class="mb-16">
				<div class="mb-8 flex gap-8 border-b border-border">
					<button
						class="border-b-2 pb-4 font-medium transition-colors {activeTab === 'description'
							? 'border-accent text-accent'
							: 'border-transparent'}"
						onclick={() => (activeTab = 'description')}
					>
						Description
					</button>
					<button
						class="border-b-2 pb-4 font-medium transition-colors {activeTab === 'reviews'
							? 'border-accent text-accent'
							: 'border-transparent'}"
						onclick={() => (activeTab = 'reviews')}
					>
						Reviews
					</button>
					<button
						class="border-b-2 pb-4 font-medium transition-colors {activeTab === 'shipping'
							? 'border-accent text-accent'
							: 'border-transparent'}"
						onclick={() => (activeTab = 'shipping')}
					>
						Shipping
					</button>
				</div>

				{#if activeTab === 'description'}
					<div class="prose max-w-none">
						<p class="leading-relaxed text-text-secondary">{product.description}</p>
					</div>
				{:else if activeTab === 'reviews'}
					<div class="py-12 text-center">
						<svg
							class="mx-auto mb-4 h-16 w-16 text-text-muted"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1"
								d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
							/>
						</svg>
						<p class="text-text-secondary">No reviews yet. Be the first to review this product!</p>
					</div>
				{:else}
					<div class="grid grid-cols-1 gap-8 md:grid-cols-2">
						<div class="rounded-2xl bg-white p-6">
							<h3 class="mb-4 font-semibold">Standard Shipping</h3>
							<p class="text-text-secondary">5-7 business days</p>
							<p class="text-text-secondary">Free on orders over ₦300,000</p>
						</div>
						<div class="rounded-2xl bg-white p-6">
							<h3 class="mb-4 font-semibold">Express Shipping</h3>
							<p class="text-text-secondary">2-3 business days</p>
							<p class="text-text-secondary">₦5,000</p>
						</div>
					</div>
				{/if}
			</div>

			{#if relatedProducts.length > 0}
				<div>
					<h2 class="mb-8 text-3xl font-[var(--font-playfair)] font-bold text-text-primary">
						You May Also Like
					</h2>
					<div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
						{#each relatedProducts as relatedProduct}
							<ProductCard product={relatedProduct} />
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
{:else}
	<div class="flex min-h-screen items-center justify-center bg-bg-primary pt-24">
		<div class="text-center">
			<div
				class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent"
			></div>
			<p class="text-text-secondary">Loading product...</p>
		</div>
	</div>
{/if}
