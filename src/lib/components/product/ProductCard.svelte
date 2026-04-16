<script lang="ts">
	import type { Product } from '$lib/pocketbase';
	import { formatPrice } from '$lib/utils';
	import { cart, wishlist } from '$lib/stores';
	import { toasts } from '$lib/stores/toast';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { getProductImage } from '$lib/stores/products';

	interface Props {
		product: Product;
	}

	let { product }: Props = $props();

	let isAddingToCart = $state(false);
	let wishlistValue = $state<string[]>([]);

	wishlist.subscribe((v) => (wishlistValue = v));

	function handleAddToCart() {
		const hasColors = Array.isArray(product.colors) && product.colors.length > 0;
		const hasSizes = Array.isArray(product.sizes) && product.sizes.length > 0;
		if (hasColors || hasSizes) {
			window.location.href = `/products/${product.id}`;
			return;
		}
		isAddingToCart = true;
		cart.addItem(product, 1);
		toasts.show('success', `${product.name} added to cart`);
		setTimeout(() => (isAddingToCart = false), 500);
	}

	function toggleWishlist() {
		const wasInWishlist = wishlistValue.includes(product.id);
		wishlist.toggle(product.id);
		toasts.show('info', wasInWishlist ? 'Removed from wishlist' : 'Added to wishlist');
	}

	let isInWishlist = $derived(wishlistValue.includes(product.id));
	let needsVariantSelection = $derived(
		(Array.isArray(product.colors) && product.colors.length > 0) ||
			(Array.isArray(product.sizes) && product.sizes.length > 0)
	);
	let hasDiscount = $derived(product.comparePrice && product.comparePrice > product.price);
	let discountPercent = $derived(
		hasDiscount
			? Math.round(((product.comparePrice! - product.price) / product.comparePrice!) * 100)
			: 0
	);
	let isLowStock = $derived(product.stock <= 10 && product.stock > 0);
	let isOutOfStock = $derived(product.stock === 0);
	let stockText = $derived(
		isOutOfStock
			? 'Out of Stock'
			: product.stock <= 5
				? `Only ${product.stock} left!`
				: product.stock <= 50
					? `${product.stock} in stock`
					: 'In Stock'
	);
</script>

<div
	class="group relative overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
>
	<a href="/products/{product.id}" class="block">
		<div class="relative aspect-[4/5] overflow-hidden bg-bg-secondary">
			<img
				src={getProductImage(product)}
				alt={product.name}
				class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
				loading="lazy"
			/>

			{#if hasDiscount}
				<Badge variant="error" class="absolute top-4 left-4">
					-{discountPercent}%
				</Badge>
			{/if}

			{#if product.featured}
				<Badge variant="info" class="absolute top-4 right-4">Featured</Badge>
			{/if}

			{#if isOutOfStock}
				<Badge variant="error" class="absolute bottom-4 left-4">Out of Stock</Badge>
			{:else if product.stock <= 10}
				<Badge variant="warning" class="absolute bottom-4 left-4">
					Only {product.stock} left
				</Badge>
			{:else if product.stock <= 50}
				<Badge variant="info" class="absolute bottom-4 left-4">
					{product.stock} in stock
				</Badge>
			{/if}

			<div
				class="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-colors duration-300 group-hover:bg-black/20 group-hover:opacity-100"
			>
				<button
					class="translate-y-4 rounded-xl bg-white px-6 py-3 font-medium text-primary transition-transform duration-300 group-hover:translate-y-0 hover:bg-accent hover:text-white"
					onclick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						handleAddToCart();
					}}
				>
					{isAddingToCart ? 'Added!' : needsVariantSelection ? 'Select Options' : 'Add to Cart'}
				</button>
			</div>
		</div>
	</a>

	<button
		class="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white opacity-0 shadow-lg transition-all duration-300 group-hover:opacity-100 hover:scale-110"
		onclick={(e) => {
			e.preventDefault();
			toggleWishlist();
		}}
	>
		<svg
			class="h-5 w-5 transition-colors {isInWishlist
				? 'fill-red-500 text-red-500'
				: 'text-gray-400'}"
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

	<div class="p-5">
		<a href="/products/{product.id}" class="block">
			<h3
				class="mb-2 line-clamp-1 text-lg font-semibold text-text-primary transition-colors hover:text-accent"
			>
				{product.name}
			</h3>
			{#if product.rating && product.rating > 0}
				<div class="mb-2 flex items-center gap-1">
					<div class="flex text-amber-400">
						{#each [1, 2, 3, 4, 5] as star}
							<svg
								class="h-4 w-4 {star <= Math.round(product.rating)
									? 'fill-current'
									: 'text-gray-300'}"
								fill="currentColor"
								viewBox="0 0 20 20"
							>
								<path
									d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
								/>
							</svg>
						{/each}
					</div>
					{#if product.reviewCount}
						<span class="text-xs text-text-muted">({product.reviewCount})</span>
					{/if}
				</div>
			{/if}
			<div class="flex items-center gap-3">
				<span class="text-xl font-bold text-accent">
					{formatPrice(product.price)}
				</span>
				{#if hasDiscount}
					<span class="text-sm text-text-muted line-through">
						{formatPrice(product.comparePrice!)}
					</span>
				{/if}
			</div>
		</a>
	</div>
</div>
