<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { user, isAuthenticated } from '$lib/stores/auth';
	import { cart, cartTotal, cartSubtotal, cartSavings } from '$lib/stores';
	import { Button, Input } from '$lib/components/ui';
	import { formatPrice } from '$lib/utils/index';
	import { getProductImage } from '$lib/stores/products';
	import { toasts } from '$lib/stores/toast';
	import { pb, type OrderItem, type ShippingAddress, type Product } from '$lib/pocketbase';

	let isProcessing = $state(false);
	let orderId = $state('');
	let orderPlaced = $state(false);
	let submitted = $state(false);

	let contact = $state({ email: '', phone: '' });
	let shipping = $state({ name: '', street: '', city: '', state: '', zip: '', country: '' });

	let errors = $derived({
		email: !contact.email.trim() ? 'Email is required' : '',
		phone: !contact.phone.trim() ? 'Phone is required' : '',
		name: !shipping.name.trim() ? 'Name is required' : '',
		street: !shipping.street.trim() ? 'Street address is required' : '',
		city: !shipping.city.trim() ? 'City is required' : '',
		state: !shipping.state.trim() ? 'State is required' : '',
		zip: !shipping.zip.trim() ? 'ZIP code is required' : '',
		country: !shipping.country.trim() ? 'Country is required' : ''
	});

	let isValid = $derived(
		!errors.email &&
			!errors.phone &&
			!errors.name &&
			!errors.street &&
			!errors.city &&
			!errors.state &&
			!errors.zip &&
			!errors.country
	);

	$effect(() => {
		if (browser && $cart.length === 0 && !orderPlaced) {
			goto('/cart');
		}
	});

	$effect(() => {
		if ($isAuthenticated && $user) {
			contact.email = contact.email || $user.email || '';
			contact.phone = contact.phone || $user.phone || '';
			shipping.name = shipping.name || $user.name || '';
		}
	});

	async function placeOrder() {
		submitted = true;
		if (!isValid) return;

		isProcessing = true;

		const now = new Date().toISOString();

		const items: OrderItem[] = $cart.map((item) => ({
			productId: item.product.id,
			productName: item.product.name,
			productImage: getProductImage(item.product),
			price: item.product.price,
			quantity: item.quantity,
			color: item.color || '',
			size: item.size || ''
		}));

		const shippingAddress: ShippingAddress = {
			name: shipping.name,
			email: contact.email,
			phone: contact.phone,
			street: shipping.street,
			city: shipping.city,
			state: shipping.state,
			zip: shipping.zip,
			country: shipping.country
		};

		if (browser) {
			try {
				const stockEntries: Record<string, { qty: number; fresh: Product }> = {};
				for (const item of $cart) {
					const existing = stockEntries[item.product.id];
					const totalQty = (existing?.qty || 0) + item.quantity;
					if (existing) {
						existing.qty = totalQty;
					} else {
						const fresh = await pb.collection('estore_products').getOne<Product>(item.product.id);
						stockEntries[item.product.id] = { qty: totalQty, fresh };
					}
				}

				for (const pid of Object.keys(stockEntries)) {
					const entry = stockEntries[pid];
					if (entry.qty > entry.fresh.stock) {
						toasts.show(
							'error',
							`Not enough stock for "${entry.fresh.name}". Only ${entry.fresh.stock} available.`
						);
						isProcessing = false;
						return;
					}
				}

				const record = await pb.collection('estore_orders').create({
					items: JSON.stringify(items),
					total: $cartTotal,
					status: 'pending',
					shippingAddress: JSON.stringify(shippingAddress),
					paymentMethod: 'pay-on-delivery',
					user: $user?.id || '',
					created: now,
					updated: now
				});
				orderId = record.id;

				for (const pid of Object.keys(stockEntries)) {
					const entry = stockEntries[pid];
					const fresh = await pb.collection('estore_products').getOne<Product>(pid);
					const newStock = Math.max(0, fresh.stock - entry.qty);
					await pb.collection('estore_products').update(pid, { stock: newStock });
				}

				const existing = localStorage.getItem('luxe_orders');
				const orders = existing ? JSON.parse(existing) : [];
				orders.push({ ...record, shippingAddress, items });
				localStorage.setItem('luxe_orders', JSON.stringify(orders));
			} catch (_e: unknown) {
				toasts.show('error', 'Failed to place order. Please try again.');
				isProcessing = false;
				return;
			}
		} else {
			orderId = 'N/A';
		}

		orderPlaced = true;
		cart.clear();
		toasts.show('success', `Order placed successfully! Order ID: ${orderId}`);
		isProcessing = false;

		setTimeout(() => {
			goto('/orders');
		}, 3000);
	}
</script>

<svelte:head>
	<title>Checkout - Luxe Store</title>
</svelte:head>

<div class="min-h-screen bg-bg-primary pt-24 pb-16">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<h1 class="mb-8 text-4xl font-[var(--font-playfair)] font-bold text-text-primary">Checkout</h1>

		{#if orderPlaced}
			<div class="mx-auto max-w-2xl text-center">
				<div class="rounded-2xl bg-white p-12 shadow-lg">
					<div
						class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100"
					>
						<svg
							class="h-10 w-10 text-green-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							></path>
						</svg>
					</div>
					<h2 class="mb-4 text-3xl font-bold text-text-primary">Order Confirmed!</h2>
					<p class="mb-2 text-lg text-text-secondary">Thank you for your purchase.</p>
					<p class="mb-6 text-text-muted">
						Order ID: <span class="font-semibold text-accent">{orderId}</span>
					</p>
					<p class="text-sm text-text-muted">Redirecting to your orders...</p>
				</div>
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
				<div class="lg:col-span-2">
					<div class="space-y-6">
						{#if $isAuthenticated && $user}
							<div class="rounded-2xl bg-white p-6 shadow-lg">
								<div class="flex items-center gap-4">
									<div
										class="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl font-bold text-white"
									>
										{($user.name || $user.email)[0].toUpperCase()}
									</div>
									<div>
										<p class="text-lg font-semibold text-text-primary">
											{$user.name || 'User'}
										</p>
										<p class="text-sm text-text-secondary">{$user.email}</p>
									</div>
								</div>
							</div>
						{/if}

						<div class="rounded-2xl bg-white p-8 shadow-lg">
							<h2 class="mb-6 text-xl font-semibold text-text-primary">Shipping Information</h2>
							<div class="space-y-4">
								<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
									<Input
										type="email"
										label="Email"
										bind:value={contact.email}
										placeholder="your@email.com"
										error={submitted ? errors.email : ''}
										required
									/>
									<Input
										type="tel"
										label="Phone"
										bind:value={contact.phone}
										placeholder="+1 (555) 000-0000"
										error={submitted ? errors.phone : ''}
										required
									/>
								</div>

								<hr class="border-border" />

								<Input
									label="Full Name"
									bind:value={shipping.name}
									placeholder="John Doe"
									error={submitted ? errors.name : ''}
									required
								/>
								<Input
									label="Street Address"
									bind:value={shipping.street}
									placeholder="123 Main St"
									error={submitted ? errors.street : ''}
									required
								/>
								<div class="grid grid-cols-2 gap-4">
									<Input
										label="City"
										bind:value={shipping.city}
										placeholder="Lagos"
										error={submitted ? errors.city : ''}
										required
									/>
									<Input
										label="State"
										bind:value={shipping.state}
										placeholder="Lagos"
										error={submitted ? errors.state : ''}
										required
									/>
								</div>
								<div class="grid grid-cols-2 gap-4">
									<Input
										label="ZIP Code"
										bind:value={shipping.zip}
										placeholder="10001"
										error={submitted ? errors.zip : ''}
										required
									/>
									<Input
										label="Country"
										bind:value={shipping.country}
										placeholder="Nigeria"
										error={submitted ? errors.country : ''}
										required
									/>
								</div>
							</div>
						</div>

						<div class="rounded-2xl bg-white p-8 shadow-lg">
							<h2 class="mb-4 text-xl font-semibold text-text-primary">Payment Method</h2>
							<label
								class="flex cursor-pointer items-center gap-4 rounded-xl border-2 border-accent bg-accent/5 p-4"
							>
								<input type="radio" name="payment" checked class="h-5 w-5 text-accent" />
								<div class="flex items-center gap-3">
									<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
										<svg
											class="h-5 w-5 text-accent"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
											></path>
										</svg>
									</div>
									<div>
										<p class="font-medium text-text-primary">Pay on Delivery</p>
										<p class="text-sm text-text-muted">Payment upon delivery</p>
									</div>
								</div>
							</label>
						</div>

						<Button
							variant="primary"
							class="w-full"
							size="lg"
							loading={isProcessing}
							onclick={placeOrder}
						>
							{isProcessing
								? 'Placing Order...'
								: `Place Order  \u2022  ${formatPrice($cartTotal)}`}
						</Button>

						{#if !$isAuthenticated}
							<p class="text-center text-sm text-text-secondary">
								Have an account?
								<a href="/login" class="font-medium text-accent hover:underline">Sign in</a>
								for a faster checkout
							</p>
						{/if}
					</div>
				</div>

				<div class="lg:col-span-1">
					<div class="sticky top-24 rounded-2xl bg-white p-6 shadow-lg">
						<h2 class="mb-6 text-xl font-semibold text-text-primary">Order Summary</h2>

						<div class="mb-6 max-h-60 space-y-4 overflow-y-auto">
							{#each $cart as item (`${item.product.id}-${item.color}-${item.size}`)}
								<div class="flex gap-4">
									<div class="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-bg-secondary">
										<img
											src={getProductImage(item.product)}
											alt=""
											class="h-full w-full object-cover"
										/>
									</div>
									<div class="flex-1">
										<p class="text-sm font-medium">{item.product.name}</p>
										<p class="text-sm text-text-muted">Qty: {item.quantity}</p>
										<div class="flex gap-1">
											{#if item.color}
												<span class="text-xs text-text-muted">{item.color}</span>
											{/if}
											{#if item.color && item.size}
												<span class="text-xs text-text-muted">/</span>
											{/if}
											{#if item.size}
												<span class="text-xs text-text-muted">{item.size}</span>
											{/if}
										</div>
									</div>
									<p class="font-semibold">{formatPrice(item.product.price * item.quantity)}</p>
								</div>
							{/each}
						</div>

						<div class="space-y-2 border-t border-border pt-4">
							<div class="flex justify-between text-text-secondary">
								<span>Subtotal</span>
								<span>{formatPrice($cartSubtotal)}</span>
							</div>
							{#if $cartSavings > 0}
								<div class="flex justify-between text-success">
									<span>Savings</span>
									<span>-{formatPrice($cartSavings)}</span>
								</div>
							{/if}
							<div class="flex justify-between border-t border-border pt-2 text-lg font-semibold">
								<span>Total</span>
								<span class="text-accent">{formatPrice($cartTotal)}</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
