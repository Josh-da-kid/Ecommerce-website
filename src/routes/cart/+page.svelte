<script lang="ts">
	import { onMount } from 'svelte';
	import { cart, cartTotal, cartSubtotal, cartSavings } from '$lib/stores';
	import { products } from '$lib/stores/products';
	import { Button } from '$lib/components/ui';
	import { formatPrice } from '$lib/utils/index';
	import { getProductImage } from '$lib/stores/products';
	import { pb, type Product } from '$lib/pocketbase';
	import { isAuthenticated, authInitialized } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { toasts } from '$lib/stores/toast';

	let promoCode = $state('');
	let promoApplied = $state(false);
	let productStocks = $state<Record<string, number>>({});

	function getLiveProduct(productId: string): Product | undefined {
		return $products.find((p) => p.id === productId);
	}

	function getCurrentPrice(productId: string): number {
		const live = getLiveProduct(productId);
		return live?.price ?? 0;
	}

	function getCurrentComparePrice(productId: string): number | undefined {
		const live = getLiveProduct(productId);
		return live?.comparePrice ?? undefined;
	}

	function isColorAvailable(productId: string, color: string): boolean {
		const live = getLiveProduct(productId);
		if (!live?.colors || !Array.isArray(live.colors) || live.colors.length === 0) return true;
		if (!color) return false;
		return live.colors.includes(color);
	}

	function isSizeAvailable(productId: string, size: string): boolean {
		const live = getLiveProduct(productId);
		if (!live?.sizes || !Array.isArray(live.sizes) || live.sizes.length === 0) return true;
		if (!size) return false;
		return live.sizes.includes(size);
	}

	function getCurrentStock(productId: string): number {
		const live = getLiveProduct(productId);
		return live?.stock ?? 0;
	}

	function formatPriceSafe(value: number | undefined): string {
		return formatPrice(value ?? 0);
	}

	let liveCartTotal = $derived(
		($cart ?? []).reduce((sum, item) => {
			const livePrice = getCurrentPrice(item.product.id);
			return sum + livePrice * item.quantity;
		}, 0)
	);

	let liveCartSubtotal = $derived(
		($cart ?? []).reduce((sum, item) => {
			const liveComparePrice = getCurrentComparePrice(item.product.id);
			const price = liveComparePrice || getCurrentPrice(item.product.id);
			return sum + price * item.quantity;
		}, 0)
	);

	let liveCartSavings = $derived(liveCartSubtotal - liveCartTotal);

	function handleApplyPromo() {
		if (promoCode.toLowerCase() === 'luxe20') {
			promoApplied = true;
		}
	}

	function removeItem(productId: string, color: string = '', size: string = '') {
		cart.removeItem(productId, color, size);
	}

	function updateQuantity(productId: string, delta: number, color: string = '', size: string = '') {
		const item = $cart.find(
			(i) => i.product.id === productId && i.color === color && i.size === size
		);
		if (item) {
			const newQty = item.quantity + delta;
			const stock = productStocks[productId] ?? item.product.stock;
			if (newQty > stock) return;
			cart.updateQuantity(productId, newQty, color, size);
		}
	}

	let finalTotal = $derived(promoApplied ? liveCartTotal * 0.8 : liveCartTotal);

	let hasUnavailableItems = $derived(
		$cart.some(
			(item) =>
				!isColorAvailable(item.product.id, item.color) ||
				!isSizeAvailable(item.product.id, item.size)
		)
	);

	async function refreshStocks() {
		const stocks: Record<string, number> = {};
		for (const item of $cart) {
			if (!stocks[item.product.id]) {
				try {
					const fresh = await pb.collection('estore_products').getOne<Product>(item.product.id);
					stocks[item.product.id] = fresh.stock;
				} catch {
					stocks[item.product.id] = item.product.stock;
				}
			}
		}
		productStocks = stocks;
	}

	onMount(() => {
		if (!$authInitialized) {
			const unsub = authInitialized.subscribe((val) => {
				if (val) {
					if (!$isAuthenticated) {
						goto('/login');
						return;
					}
					refreshStocks();
				}
			});
			return () => unsub();
		}
		if (!$isAuthenticated) {
			goto('/login');
			return;
		}
		refreshStocks();
	});

	$effect(() => {
		if ($authInitialized && !$isAuthenticated) {
			goto('/login');
		}
	});
</script>

<svelte:head>
	<title>Cart - Urazbox</title>
</svelte:head>

<div class="min-h-screen bg-bg-primary pt-24 pb-16">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<h1 class="mb-8 text-4xl font-[var(--font-playfair)] font-bold text-text-primary">
			Shopping Cart
		</h1>

		{#if $cart.length === 0}
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
						d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
					/>
				</svg>
				<h2 class="mb-4 text-2xl font-semibold text-text-primary">Your cart is empty</h2>
				<p class="mb-8 text-text-secondary">
					Looks like you haven't added any items to your cart yet.
				</p>
				<a href="/products">
					<Button variant="primary" size="lg">Start Shopping</Button>
				</a>
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
				<div class="space-y-6 lg:col-span-2">
					{#each $cart as item (`${item.product.id}-${item.color}-${item.size}`)}
						{@const stock = getCurrentStock(item.product.id)}
						{@const isOverStock = item.quantity > stock}
						{@const colorAvailable = isColorAvailable(item.product.id, item.color)}
						{@const sizeAvailable = isSizeAvailable(item.product.id, item.size)}
						{@const isUnavailable = !colorAvailable || !sizeAvailable}
						<div
							class="flex gap-6 rounded-2xl bg-white p-6 shadow-lg {isOverStock || isUnavailable
								? 'ring-2 ring-error/50'
								: ''}"
						>
							<a
								href="/products/{item.product.id}"
								class="h-32 w-32 flex-shrink-0 overflow-hidden rounded-xl bg-bg-secondary"
							>
								<img
									src={getProductImage(item.product)}
									alt={item.product.name}
									class="h-full w-full object-cover"
								/>
							</a>

							<div class="flex-1">
								<div class="mb-2 flex items-start justify-between">
									<div>
										<a
											href="/products/{item.product.id}"
											class="text-lg font-semibold text-text-primary hover:text-accent"
										>
											{item.product.name}
										</a>
										<div class="mt-1 flex flex-wrap items-center gap-2 text-sm text-text-secondary">
											{#if item.color}
												<span
													class="inline-flex items-center rounded-full bg-bg-secondary px-2.5 py-0.5 text-xs font-medium"
													>{item.color}</span
												>
											{/if}
											{#if item.size}
												<span
													class="inline-flex items-center rounded-full bg-bg-secondary px-2.5 py-0.5 text-xs font-medium"
													>{item.size}</span
												>
											{/if}
										</div>
									</div>
									<button
										class="rounded-lg p-2 transition-colors hover:bg-bg-secondary"
										onclick={() => removeItem(item.product.id, item.color, item.size)}
									>
										<svg
											class="h-5 w-5 text-text-muted"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
											/>
										</svg>
									</button>
								</div>

								{#if isOverStock}
									<p class="mb-2 text-xs font-medium text-error">
										Only {stock} left in stock. Please update quantity.
									</p>
								{/if}

								{#if isUnavailable}
									<p class="mb-2 text-xs font-medium text-error">
										{#if !colorAvailable}Color "{item.color}" is no longer available.{/if}
										{#if !colorAvailable && !sizeAvailable}{/if}
										{#if !sizeAvailable}Size "{item.size}" is no longer available.{/if}
										<a href="/products/{item.product.id}" class="underline">Choose options</a> to proceed.
									</p>
								{/if}

								<div class="mt-4 flex items-center justify-between">
									<div class="flex items-center rounded-xl border border-border">
										<button
											class="flex h-10 w-10 items-center justify-center transition-colors hover:bg-bg-secondary"
											onclick={() => updateQuantity(item.product.id, -1, item.color, item.size)}
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
										<span class="w-10 text-center font-medium">{item.quantity}</span>
										<button
											class="flex h-10 w-10 items-center justify-center transition-colors hover:bg-bg-secondary {item.quantity >=
											stock
												? 'cursor-not-allowed opacity-30'
												: ''}"
											onclick={() => updateQuantity(item.product.id, 1, item.color, item.size)}
											disabled={item.quantity >= stock}
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

									<div class="text-right">
										<p class="text-xl font-bold text-accent">
											{formatPrice(getCurrentPrice(item.product.id) * item.quantity)}
										</p>
										{#if getCurrentComparePrice(item.product.id)}
											<p class="text-sm text-text-muted line-through">
												{formatPrice(
													(getCurrentComparePrice(item.product.id) ?? 0) * item.quantity
												)}
											</p>
										{/if}
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>

				<div class="lg:col-span-1">
					<div class="sticky top-24 rounded-2xl bg-white p-6 shadow-lg">
						<h2 class="mb-6 text-xl font-semibold text-text-primary">Order Summary</h2>

						<div class="mb-6 space-y-4">
							<div class="flex justify-between text-text-secondary">
								<span>Subtotal</span>
								<span>{formatPrice(liveCartSubtotal)}</span>
							</div>
							{#if liveCartSavings > 0}
								<div class="flex justify-between text-success">
									<span>Savings</span>
									<span>-{formatPrice(liveCartSavings)}</span>
								</div>
							{/if}
							<div class="flex justify-between text-text-secondary">
								<span>Shipping</span>
								<span>Calculated at checkout</span>
							</div>
						</div>

						<div class="mb-6 border-t border-border pt-4">
							<div class="mb-2 flex gap-2">
								<input
									type="text"
									bind:value={promoCode}
									placeholder="Promo code"
									class="h-12 flex-1 rounded-xl border border-border px-4 focus:border-accent focus:outline-none"
								/>
								<Button variant="secondary" size="md" onclick={handleApplyPromo}>Apply</Button>
							</div>
							{#if promoApplied}
								<p class="text-sm text-success">20% discount applied!</p>
							{/if}
						</div>

						<div class="mb-6 border-t border-border pt-4">
							<div class="flex items-center justify-between">
								<span class="text-lg font-semibold">Total</span>
								<span class="text-2xl font-bold text-accent">
									{formatPrice(finalTotal)}
								</span>
							</div>
						</div>

						<a href="/checkout" class="block">
							<Button variant="primary" size="lg" class="w-full" disabled={hasUnavailableItems}>
								{hasUnavailableItems
									? 'Remove unavailable items to checkout'
									: 'Proceed to Checkout'}
							</Button>
						</a>

						<a
							href="/products"
							class="mt-4 block text-center text-text-secondary transition-colors hover:text-accent"
						>
							Continue Shopping
						</a>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
