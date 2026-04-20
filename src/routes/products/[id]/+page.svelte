<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { Button, Badge } from '$lib/components/ui';
	import { ProductCard } from '$lib/components/product';
	import { cart, wishlist } from '$lib/stores';
	import { user, isAuthenticated } from '$lib/stores/auth';
	import { toasts } from '$lib/stores/toast';
	import {
		getProductImage,
		getProductImages,
		fetchProductById,
		products
	} from '$lib/stores/products';
	import { formatPrice } from '$lib/utils/index';
	import { pb, parseImages, getImageUrl, type Product, type Review } from '$lib/pocketbase';
	import {
		fetchProductReviews,
		getUnreviewedOrdersForProduct,
		submitReview
	} from '$lib/stores/reviews';

	let product = $state<Product | null>(null);
	let quantity = $state(1);
	let currentSlide = $state(0);
	let isAddingToCart = $state(false);
	let activeTab = $state<'description' | 'reviews' | 'shipping' | 'videos'>('description');
	let selectedColor = $state('');
	let selectedSize = $state('');
	let variantError = $state('');

	let productReviews = $state<Review[]>([]);
	let loadingReviews = $state(true);
	let canReview = $state(false);
	let availableOrders = $state<string[]>([]);
	let selectedOrderId = $state('');
	let reviewRating = $state(5);
	let reviewTitle = $state('');
	let reviewComment = $state('');
	let titleError = $state('');
	let isSubmittingReview = $state(false);

	const productId = $page.params.id;

	let allImages = $derived(product ? getProductImages(product) : ['/placeholder-product.svg']);
	let totalSlides = $derived(allImages.length);

	let productVideos = $derived(() => {
		if (!product?.videos) return [];
		const v = product.videos;
		if (Array.isArray(v)) return v;
		if (typeof v === 'string' && v.trim()) {
			try {
				const parsed = JSON.parse(v);
				if (Array.isArray(parsed)) return parsed;
			} catch {}
			return v
				.split(',')
				.map((s: string) => s.trim())
				.filter(Boolean);
		}
		return [];
	});

	let allVideos = $derived(productVideos());

	function getVideoInfo(url: string): {
		type: 'youtube' | 'vimeo' | 'direct';
		embedUrl: string;
		src: string;
	} {
		if (url.includes('youtube.com/watch')) {
			const match = url.match(/[?&]v=([\w-]+)/);
			return {
				type: 'youtube',
				embedUrl: match ? `https://www.youtube.com/embed/${match[1]}` : url,
				src: url
			};
		}
		if (url.includes('youtu.be/')) {
			const match = url.match(/youtu\.be\/([\w-]+)/);
			return {
				type: 'youtube',
				embedUrl: match ? `https://www.youtube.com/embed/${match[1]}` : url,
				src: url
			};
		}
		if (url.includes('youtube.com/embed/')) {
			return { type: 'youtube', embedUrl: url, src: url };
		}
		if (url.includes('vimeo.com/')) {
			const match = url.match(/vimeo\.com\/(\d+)/);
			return {
				type: 'vimeo',
				embedUrl: match ? `https://player.vimeo.com/video/${match[1]}` : url,
				src: url
			};
		}
		if (url.startsWith('http')) {
			return { type: 'direct', embedUrl: '', src: url };
		}
		return {
			type: 'direct',
			embedUrl: '',
			src: getImageUrl('estore_products', product?.id ?? '', url)
		};
	}

	function nextSlide() {
		currentSlide = (currentSlide + 1) % totalSlides;
	}

	function prevSlide() {
		currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
	}

	let availableColors = $derived(Array.isArray(product?.colors) ? product!.colors : []);
	let availableSizes = $derived(Array.isArray(product?.sizes) ? product!.sizes : []);
	let needsColor = $derived(availableColors.length > 0);
	let needsSize = $derived(availableSizes.length > 0);

	onMount(async () => {
		if (!productId) return;
		const fetched = await fetchProductById(productId);
		if (fetched) {
			product = fetched;
		} else {
			products.subscribe((p) => {
				const found = p.find((x) => x.id === productId);
				if (found) product = found;
			});
		}

		productReviews = await fetchProductReviews(productId);
		loadingReviews = false;

		if ($isAuthenticated && $user) {
			availableOrders = await getUnreviewedOrdersForProduct($user.id, productId);
			canReview = availableOrders.length > 0;
			if (availableOrders.length > 0) {
				selectedOrderId = availableOrders[0];
			}
		}
	});

	let avgRating = $derived(
		productReviews.length > 0
			? productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length
			: 0
	);
	let hasFiveStars = $derived(productReviews.some((r) => r.rating === 5));
	let hasFourStars = $derived(productReviews.some((r) => r.rating === 4));
	let hasThreeStars = $derived(productReviews.some((r) => r.rating === 3));
	let hasTwoStars = $derived(productReviews.some((r) => r.rating === 2));
	let hasOneStar = $derived(productReviews.some((r) => r.rating === 1));

	function handleAddToCart() {
		if (!product) return;
		variantError = '';

		if (needsColor && !selectedColor) {
			variantError = 'Please select a color';
			return;
		}
		if (needsSize && !selectedSize) {
			variantError = 'Please select a size';
			return;
		}

		if (quantity > product.stock) {
			variantError = `Only ${product.stock} items available in stock`;
			return;
		}

		isAddingToCart = true;
		const color = needsColor ? selectedColor : '';
		const size = needsSize ? selectedSize : '';
		cart.addItem(product, quantity, color, size);
		toasts.show('success', `${product.name} added to cart`);
		setTimeout(() => (isAddingToCart = false), 500);
	}

	function incrementQty() {
		if (!product) return;
		if (quantity < product.stock) {
			quantity++;
		}
	}

	function decrementQty() {
		quantity = Math.max(1, quantity - 1);
	}

	function toggleWishlist() {
		if (!product) return;
		const wasInWishlist = wishlistValue.includes(product.id);
		wishlist.toggle(product.id);
		toasts.show('info', wasInWishlist ? 'Removed from wishlist' : 'Added to wishlist');
	}

	async function handleSubmitReview() {
		titleError = '';
		if (!reviewTitle.trim()) {
			titleError = 'Review title is required';
			return;
		}
		if (!selectedOrderId || !product) return;

		isSubmittingReview = true;
		try {
			await submitReview(
				selectedOrderId,
				product.id,
				reviewRating,
				reviewComment,
				$user!.id,
				reviewTitle
			);
			toasts.show('success', 'Review submitted! It will be visible after approval.');
			canReview = false;
			reviewTitle = '';
			reviewComment = '';
			reviewRating = 5;
		} catch (_e: unknown) {
			toasts.show('error', 'Failed to submit review');
		} finally {
			isSubmittingReview = false;
		}
	}

	let wishlistValue = $state<string[]>([]);
	wishlist.subscribe((v) => (wishlistValue = v));

	let productsValue = $state<Product[]>([]);
	products.subscribe((v) => (productsValue = v));

	let isInWishlist = $derived(product ? wishlistValue.includes(product.id) : false);
	let hasDiscount = $derived(product?.comparePrice && product.comparePrice > product.price);
	let isLowStock = $derived(product ? product.stock <= 10 && product.stock > 0 : false);
	let isOutOfStock = $derived(product ? product.stock === 0 : false);
	let relatedProducts = $derived(
		product
			? productsValue
					.filter((p) => p.category === product!.category && p.id !== product!.id)
					.slice(0, 4)
			: []
	);
</script>

<svelte:head>
	<title>{product?.name || 'Product'} - Urazbox</title>
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
						{#each allImages as src, i}
							<div
								class="absolute inset-0 transition-transform duration-500 ease-in-out {i ===
								currentSlide
									? 'translate-x-0'
									: i < currentSlide
										? '-translate-x-full'
										: 'translate-x-full'}"
							>
								<img
									{src}
									alt="{product!.name} - Image {i + 1}"
									class="h-full w-full object-cover"
								/>
							</div>
						{/each}

						{#if hasDiscount}
							<Badge variant="error" class="absolute top-4 left-4 z-10">Sale</Badge>
						{/if}
						{#if isOutOfStock}
							<Badge variant="error" class="absolute bottom-4 left-4 z-10">Out of Stock</Badge>
						{:else if isLowStock}
							<Badge variant="warning" class="absolute bottom-4 left-4 z-10">
								Only {product!.stock} left
							</Badge>
						{/if}

						{#if totalSlides > 1}
							<button
								class="absolute top-1/2 left-3 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md transition-colors hover:bg-white"
								onclick={prevSlide}
								aria-label="Previous image"
							>
								<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M15 19l-7-7 7-7"
									/>
								</svg>
							</button>
							<button
								class="absolute top-1/2 right-3 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md transition-colors hover:bg-white"
								onclick={nextSlide}
								aria-label="Next image"
							>
								<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 5l7 7-7 7"
									/>
								</svg>
							</button>

							<div
								class="absolute right-4 bottom-4 z-10 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1"
							>
								{#each allImages as _, i}
									<button
										class="h-2 w-2 rounded-full transition-all {i === currentSlide
											? 'w-4 bg-white'
											: 'bg-white/50'}"
										onclick={() => (currentSlide = i)}
										aria-label="Go to image {i + 1}"
									></button>
								{/each}
							</div>
						{/if}
					</div>

					{#if totalSlides > 1}
						<div class="flex gap-3 overflow-x-auto pb-1">
							{#each allImages as src, i}
								<button
									class="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all {currentSlide ===
									i
										? 'border-accent ring-1 ring-accent/30'
										: 'border-transparent opacity-70 hover:opacity-100'}"
									onclick={() => (currentSlide = i)}
								>
									<img {src} alt="Thumbnail {i + 1}" class="h-full w-full object-cover" />
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

					{#if productReviews.length > 0}
						<div class="mb-4 flex items-center gap-2">
							<div class="flex text-amber-400">
								{#each [1, 2, 3, 4, 5] as star}
									<svg
										class="h-5 w-5 {star <= Math.round(avgRating)
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
							<span class="text-sm font-medium text-text-primary">
								{avgRating.toFixed(1)}
							</span>
							<span class="text-sm text-text-muted">
								({productReviews.length} review{productReviews.length !== 1 ? 's' : ''})
							</span>
						</div>
					{/if}

					<div
						class="mb-4 text-sm font-medium {isOutOfStock
							? 'text-error'
							: product.stock <= 10
								? 'text-amber-600'
								: 'text-green-600'}"
					>
						{#if isOutOfStock}
							Out of Stock
						{:else if product.stock <= 5}
							Hurry! Only {product.stock} pieces left
						{:else if product.stock <= 20}
							{product.stock} pieces available
						{:else}
							In Stock ({product.stock} available)
						{/if}
					</div>

					<p class="mb-8 text-text-secondary">
						{product.description}
					</p>

					{#if needsColor}
						<div class="mb-6">
							<label class="mb-3 block text-sm font-semibold text-text-primary">
								Color <span class="text-error">*</span>
								{#if selectedColor}
									<span class="ml-2 font-normal text-text-secondary">({selectedColor})</span>
								{/if}
							</label>
							<div class="flex flex-wrap gap-2">
								{#each availableColors as color}
									<button
										class="rounded-xl border-2 px-4 py-2 text-sm font-medium transition-all {selectedColor ===
										color
											? 'border-accent bg-accent/10 text-accent'
											: 'border-border text-text-secondary hover:border-accent/50'}"
										onclick={() => (selectedColor = color)}
									>
										{color}
									</button>
								{/each}
							</div>
						</div>
					{/if}

					{#if needsSize}
						<div class="mb-6">
							<label class="mb-3 block text-sm font-semibold text-text-primary">
								Size <span class="text-error">*</span>
								{#if selectedSize}
									<span class="ml-2 font-normal text-text-secondary">({selectedSize})</span>
								{/if}
							</label>
							<div class="flex flex-wrap gap-2">
								{#each availableSizes as size}
									<button
										class="rounded-xl border-2 px-4 py-2 text-sm font-medium transition-all {selectedSize ===
										size
											? 'border-accent bg-accent/10 text-accent'
											: 'border-border text-text-secondary hover:border-accent/50'}"
										onclick={() => (selectedSize = size)}
									>
										{size}
									</button>
								{/each}
							</div>
						</div>
					{/if}

					{#if variantError}
						<p class="mb-4 text-sm font-medium text-error">{variantError}</p>
					{/if}

					<div class="mb-8 flex items-center gap-4">
						<div class="flex items-center rounded-xl border border-border">
							<button
								class="flex h-12 w-12 items-center justify-center transition-colors hover:bg-bg-secondary"
								onclick={decrementQty}
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
								onclick={incrementQty}
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
						disabled={isOutOfStock}
						onclick={handleAddToCart}
					>
						{isOutOfStock ? 'Out of Stock' : isAddingToCart ? 'Added!' : 'Add to Cart'}
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
					{#if allVideos.length > 0}
						<button
							class="border-b-2 pb-4 font-medium transition-colors {activeTab === 'videos'
								? 'border-accent text-accent'
								: 'border-transparent'}"
							onclick={() => (activeTab = 'videos')}
						>
							Videos ({allVideos.length})
						</button>
					{/if}
				</div>

				{#if activeTab === 'description'}
					<div class="prose max-w-none">
						<p class="leading-relaxed text-text-secondary">{product.description}</p>
					</div>
				{:else if activeTab === 'reviews'}
					{#if loadingReviews}
						<div class="py-12 text-center">
							<div
								class="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent"
							></div>
						</div>
					{:else if productReviews.length === 0}
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
							<p class="text-text-secondary">
								No reviews yet. Be the first to review this product!
							</p>
						</div>
					{:else}
						<div class="space-y-6">
							{#if canReview && $isAuthenticated}
								<div class="rounded-2xl border-2 border-accent/30 bg-accent/5 p-6">
									<h3 class="mb-4 font-semibold text-text-primary">Write a Review</h3>
									<p class="mb-4 text-sm text-text-secondary">
										You have {availableOrders.length} order(s) you can review.
									</p>

									{#if availableOrders.length > 1}
										<div class="mb-4">
											<label class="mb-2 block text-sm font-medium text-text-primary">
												Select order to review
											</label>
											<select
												bind:value={selectedOrderId}
												class="h-12 w-full rounded-xl border border-border px-4 focus:border-accent focus:outline-none"
											>
												{#each availableOrders as orderId}
													<option value={orderId}>Order #{orderId.slice(0, 8)}</option>
												{/each}
											</select>
										</div>
									{/if}

									<div class="mb-4">
										<label class="mb-2 block text-sm font-medium text-text-primary">
											Review Title <span class="text-error">*</span>
										</label>
										<input
											type="text"
											bind:value={reviewTitle}
											placeholder="e.g., Amazing quality!"
											class="w-full rounded-xl border border-border px-4 py-3 focus:border-accent focus:outline-none"
										/>
										{#if titleError}
											<p class="mt-1 text-sm text-error">{titleError}</p>
										{/if}
									</div>

									<div class="mb-4">
										<label class="mb-2 block text-sm font-medium text-text-primary">Rating</label>
										<div class="flex gap-2">
											{#each [1, 2, 3, 4, 5] as star}
												<button
													type="button"
													class="text-2xl transition-colors {reviewRating >= star
														? 'text-amber-400'
														: 'text-gray-300'}"
													onclick={() => (reviewRating = star)}
												>
													★
												</button>
											{/each}
										</div>
									</div>

									<div class="mb-4">
										<label class="mb-2 block text-sm font-medium text-text-primary">
											Comment (optional)
										</label>
										<textarea
											bind:value={reviewComment}
											placeholder="Share your experience with this product..."
											rows="3"
											class="w-full resize-none rounded-xl border border-border px-4 py-3 focus:border-accent focus:outline-none"
										></textarea>
									</div>

									<Button
										variant="primary"
										disabled={isSubmittingReview}
										onclick={handleSubmitReview}
									>
										{isSubmittingReview ? 'Submitting...' : 'Submit Review'}
									</Button>
								</div>
							{/if}

							<div class="mb-6 flex items-center gap-4">
								<div class="text-3xl font-bold text-text-primary">{avgRating.toFixed(1)}</div>
								<div class="flex text-amber-400">
									{#each [1, 2, 3, 4, 5] as star}
										<svg
											class="h-5 w-5 {star <= Math.round(avgRating)
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
								<span class="text-text-muted">({productReviews.length} reviews)</span>
							</div>

							{#each productReviews as review}
								<div class="rounded-xl border border-border p-6">
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-2">
											<span class="font-semibold text-text-primary">
												{review.title}
											</span>
											<span
												class="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
											>
												<svg class="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
													<path
														fill-rule="evenodd"
														d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
														clip-rule="evenodd"
													/>
												</svg>
												Verified Purchase
											</span>
										</div>
										<div class="flex text-amber-400">
											{#each Array(review.rating) as _}
												<span>★</span>
											{/each}
										</div>
									</div>
									{#if review.comment}
										<p class="mt-2 text-text-secondary">{review.comment}</p>
									{/if}
									<p class="mt-2 text-xs text-text-muted">
										{new Date(review.created).toLocaleDateString()}
									</p>
								</div>
							{/each}
						</div>
					{/if}
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

				{#if activeTab === 'videos' && allVideos.length > 0}
					<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
						{#each allVideos as videoUrl, i}
							{@const info = getVideoInfo(videoUrl)}
							<div class="overflow-hidden rounded-2xl bg-white shadow-sm">
								{#if info.type === 'youtube' || info.type === 'vimeo'}
									<div class="relative w-full" style="padding-bottom: 56.25%;">
										<iframe
											src={info.embedUrl}
											title="{product.name} - Video {i + 1}"
											class="absolute inset-0 h-full w-full"
											frameborder="0"
											allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
											allowfullscreen
										></iframe>
									</div>
								{:else}
									<video
										src={info.src}
										controls
										class="w-full"
										preload="metadata"
										aria-label="{product.name} - Video {i + 1}"
									>
										<track kind="captions" />
										Your browser does not support the video tag.
									</video>
								{/if}
							</div>
						{/each}
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
