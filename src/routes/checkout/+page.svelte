<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { user, isAuthenticated, authInitialized } from '$lib/stores/auth';
	import { cart, cartTotal, cartSubtotal, cartSavings } from '$lib/stores';
	import { products } from '$lib/stores/products';
	import { Button, Input } from '$lib/components/ui';
	import { formatPrice } from '$lib/utils/index';
	import { getProductImage } from '$lib/stores/products';
	import { toasts } from '$lib/stores/toast';
	import { pb, type OrderItem, type ShippingAddress, type Product } from '$lib/pocketbase';

	let isProcessing = $state(false);
	let orderId = $state('');
	let orderPlaced = $state(false);
	let submitted = $state(false);
	let showPaymentModal = $state(false);
	let paymentConfirmed = $state(false);
	let timeRemaining = $state(30 * 60);
	let timerInterval: any = null;
	let orderTotal = $state(0);
	let paymentReference = $state('');
	let deliveryMethod = $state<'delivery' | 'pickup'>('delivery');
	let paymentMethod = $state<'bank-transfer' | 'pay-on-pickup'>('bank-transfer');

	$effect(() => {
		if (deliveryMethod === 'delivery') {
			paymentMethod = 'bank-transfer';
		}
	});

	function getLiveProduct(productId: string): Product | undefined {
		return $products.find((p) => p.id === productId);
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

	let hasUnavailableItems = $derived(
		$cart.some(
			(item) =>
				!isColorAvailable(item.product.id, item.color) ||
				!isSizeAvailable(item.product.id, item.size)
		)
	);

	const PAYMENT_ACCOUNT = {
		bank: 'Moniepoint',
		accountName: 'Urazbox Enterprise',
		accountNumber: '6559239886'
	};

	let contact = $state({ email: '', phone: '' });
	let shipping = $state({ name: '', street: '', city: '', state: '', zip: '', country: '' });

	let isDelivery = $derived(deliveryMethod === 'delivery');

	let errors = $derived({
		email: !contact.email.trim() ? 'Email is required' : '',
		phone: !contact.phone.trim() ? 'Phone is required' : '',
		name: isDelivery && !shipping.name.trim() ? 'Name is required' : '',
		street: isDelivery && !shipping.street.trim() ? 'Street address is required' : '',
		city: isDelivery && !shipping.city.trim() ? 'City is required' : '',
		state: isDelivery && !shipping.state.trim() ? 'State is required' : '',
		zip: isDelivery && !shipping.zip.trim() ? 'ZIP code is required' : '',
		country: isDelivery && !shipping.country.trim() ? 'Country is required' : ''
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

	let formattedTime = $derived(() => {
		const mins = Math.floor(timeRemaining / 60);
		const secs = timeRemaining % 60;
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	});

	$effect(() => {
		if ($authInitialized && !$isAuthenticated) {
			goto('/login');
		}
	});

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

	$effect(() => {
		if (showPaymentModal && !paymentConfirmed && timeRemaining > 0) {
			timerInterval = setInterval(() => {
				timeRemaining--;
				if (timeRemaining <= 0) {
					clearInterval(timerInterval);
					handlePaymentExpired();
				}
			}, 1000);
			return () => clearInterval(timerInterval);
		}
	});

	async function handlePaymentExpired() {
		if (orderId) {
			try {
				await pb.collection('estore_orders').update(orderId, { status: 'cancelled' });

				const orderRecord = await pb.collection('estore_orders').getOne<{ items: string }>(orderId);
				if (orderRecord?.items) {
					const parsed: OrderItem[] =
						typeof orderRecord.items === 'string'
							? JSON.parse(orderRecord.items)
							: orderRecord.items;
					const qtyMap: Record<string, number> = {};
					for (const item of parsed) {
						qtyMap[item.productId] = (qtyMap[item.productId] || 0) + item.quantity;
					}
					for (const pid of Object.keys(qtyMap)) {
						try {
							const fresh = await pb.collection('estore_products').getOne<Product>(pid);
							await pb
								.collection('estore_products')
								.update(pid, { stock: fresh.stock + qtyMap[pid] });
						} catch {
							// product may have been deleted
						}
					}
				}
			} catch {
				// order may not exist
			}
		}
		showPaymentModal = false;
		orderPlaced = false;
		toasts.show('error', 'Order has been cancelled due to expired payment time.');
	}

	async function confirmPayment() {
		if (!orderId) return;
		paymentConfirmed = true;
		clearInterval(timerInterval);
		try {
			await pb.collection('estore_orders').update(orderId, {
				paymentStatus: 'confirmed',
				paidAt: new Date().toISOString()
			});
			cart.clear();
			toasts.show('success', 'Payment confirmed! An admin will verify your payment shortly.');
		} catch {
			toasts.show('error', 'Failed to confirm payment. Please try again.');
		}
	}

	async function placeOrder() {
		submitted = true;
		if (!isValid) return;

		isProcessing = true;

		const now = new Date().toISOString();
		const tempId = crypto.randomUUID().slice(0, 15).toUpperCase();
		const newPaymentRef = `URZ${tempId}`;

		const items: OrderItem[] = $cart.map((item) => ({
			productId: item.product.id,
			productName: item.product.name,
			productImage: getProductImage(item.product),
			price: item.product.price,
			quantity: item.quantity,
			color: item.color || '',
			size: item.size || ''
		}));

		const shippingAddress: ShippingAddress = isDelivery
			? {
					name: shipping.name,
					email: contact.email,
					phone: contact.phone,
					street: shipping.street,
					city: shipping.city,
					state: shipping.state,
					zip: shipping.zip,
					country: shipping.country
				}
			: {
					name: contact.email,
					email: contact.email,
					phone: contact.phone,
					street: 'Pickup Station',
					city: 'Kubwa',
					state: 'FCT - Abuja',
					zip: '901101',
					country: 'Nigeria'
				};

		if (browser) {
			try {
				const stockEntries: Record<string, { qty: number; fresh: Product; item: any }> = {};
				const errors: string[] = [];

				for (const item of $cart) {
					const existing = stockEntries[item.product.id];
					const totalQty = (existing?.qty || 0) + item.quantity;
					if (existing) {
						existing.qty = totalQty;
					} else {
						const fresh = await pb.collection('estore_products').getOne<Product>(item.product.id);

						if (!fresh) {
							errors.push(`"${item.product.name}" is no longer available.`);
							continue;
						}

						if (
							item.color &&
							fresh.colors &&
							Array.isArray(fresh.colors) &&
							!fresh.colors.includes(item.color)
						) {
							errors.push(
								`Color "${item.color}" is no longer available for "${item.product.name}".`
							);
							continue;
						}

						if (
							item.size &&
							fresh.sizes &&
							Array.isArray(fresh.sizes) &&
							!fresh.sizes.includes(item.size)
						) {
							errors.push(`Size "${item.size}" is no longer available for "${item.product.name}".`);
							continue;
						}

						if (fresh.price !== item.product.price) {
							errors.push(`Price for "${item.product.name}" has changed. Please refresh the page.`);
							continue;
						}

						stockEntries[item.product.id] = { qty: totalQty, fresh, item };
					}
				}

				if (errors.length > 0) {
					toasts.show('error', errors[0]);
					isProcessing = false;
					return;
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
					paymentMethod: paymentMethod,
					paymentStatus: 'pending',
					paymentReference: newPaymentRef,
					user: $user?.id || '',
					created: now,
					updated: now,
					expiresAt:
						paymentMethod === 'bank-transfer'
							? new Date(Date.now() + 30 * 60 * 1000).toISOString()
							: ''
				});
				orderId = record.id;
				paymentReference = newPaymentRef;

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

				orderTotal = $cartTotal;

				if (paymentMethod === 'pay-on-pickup') {
					cart.clear();
					orderPlaced = true;
				} else {
					showPaymentModal = true;
				}
			} catch (_e: unknown) {
				toasts.show('error', 'Failed to place order. Please try again.');
				isProcessing = false;
				return;
			}
		} else {
			orderId = 'N/A';
		}

		isProcessing = false;
	}
</script>

<svelte:head>
	<title>Checkout - Urazbox</title>
</svelte:head>

<div class="min-h-screen bg-bg-primary pt-24 pb-16">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<h1 class="mb-8 text-4xl font-[var(--font-playfair)] font-bold text-text-primary">Checkout</h1>

		{#if orderPlaced && !showPaymentModal}
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

					{#if paymentMethod === 'pay-on-pickup'}
						<div class="mb-4 rounded-xl bg-accent/10 p-4">
							<p class="text-sm text-text-secondary">
								You will pay when you pick up your order at Kubwa, Abuja.
							</p>
						</div>
					{/if}

					{#if deliveryMethod === 'pickup'}
						<div class="mb-4 rounded-xl bg-blue-50 p-4">
							<div class="flex items-start justify-center gap-3">
								<svg
									class="h-5 w-5 shrink-0 text-blue-500"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
									/>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
									/>
								</svg>
								<div class="text-left">
									<p class="font-medium text-blue-800">Pickup at Kubwa, Abuja</p>
									<p class="text-sm text-blue-600">
										You will be notified when your order is ready for pickup.
									</p>
								</div>
							</div>
						</div>
					{/if}

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
							<h2 class="mb-4 text-xl font-semibold text-text-primary">Delivery Method</h2>
							<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<button
									type="button"
									class="rounded-xl border-2 p-4 text-left transition-all {deliveryMethod ===
									'delivery'
										? 'border-accent bg-accent/5'
										: 'border-border hover:border-accent/50'}"
									onclick={() => (deliveryMethod = 'delivery')}
								>
									<div class="mb-2 flex items-center gap-3">
										<div
											class="flex h-10 w-10 items-center justify-center rounded-lg {deliveryMethod ===
											'delivery'
												? 'bg-accent/10'
												: 'bg-bg-secondary'}"
										>
											<svg
												class="h-5 w-5 {deliveryMethod === 'delivery'
													? 'text-accent'
													: 'text-text-muted'}"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
												/>
											</svg>
										</div>
										<p class="font-semibold text-text-primary">Home Delivery</p>
									</div>
									<p class="text-sm text-text-secondary">
										Door-to-door delivery to your address. 3-7 business days.
									</p>
								</button>

								<button
									type="button"
									class="rounded-xl border-2 p-4 text-left transition-all {deliveryMethod ===
									'pickup'
										? 'border-accent bg-accent/5'
										: 'border-border hover:border-accent/50'}"
									onclick={() => (deliveryMethod = 'pickup')}
								>
									<div class="mb-2 flex items-center gap-3">
										<div
											class="flex h-10 w-10 items-center justify-center rounded-lg {deliveryMethod ===
											'pickup'
												? 'bg-accent/10'
												: 'bg-bg-secondary'}"
										>
											<svg
												class="h-5 w-5 {deliveryMethod === 'pickup'
													? 'text-accent'
													: 'text-text-muted'}"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
												/>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
												/>
											</svg>
										</div>
										<p class="font-semibold text-text-primary">Pickup Station</p>
									</div>
									<p class="text-sm text-text-secondary">
										Pick up at Kubwa, Abuja. Ready in 1-3 business days.
									</p>
								</button>
							</div>

							{#if deliveryMethod === 'pickup'}
								<div class="mt-4 rounded-xl border border-accent/30 bg-accent/5 p-4">
									<div class="flex items-start gap-3">
										<svg
											class="mt-0.5 h-5 w-5 shrink-0 text-accent"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
											/>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
											/>
										</svg>
										<div>
											<p class="font-medium text-text-primary">Pickup Location</p>
											<p class="text-sm text-text-secondary">Kubwa, FCT - Abuja, Nigeria</p>
											<p class="mt-1 text-xs text-text-muted">
												You will be notified when your order is ready for pickup.
											</p>
										</div>
									</div>
								</div>
							{/if}
						</div>

						{#if isDelivery}
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
						{:else}
							<div class="rounded-2xl bg-white p-8 shadow-lg">
								<h2 class="mb-6 text-xl font-semibold text-text-primary">Contact Information</h2>
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
										placeholder="+234 800 000 0000"
										error={submitted ? errors.phone : ''}
										required
									/>
								</div>
							</div>
						{/if}

						<div class="rounded-2xl bg-white p-8 shadow-lg">
							<h2 class="mb-4 text-xl font-semibold text-text-primary">Payment Method</h2>
							<div class="space-y-3">
								<button
									type="button"
									class="w-full rounded-xl border-2 p-4 text-left transition-all {paymentMethod ===
									'bank-transfer'
										? 'border-accent bg-accent/5'
										: 'border-border hover:border-accent/50'}"
									onclick={() => (paymentMethod = 'bank-transfer')}
								>
									<div class="flex items-center gap-3">
										<div
											class="flex h-10 w-10 items-center justify-center rounded-lg {paymentMethod ===
											'bank-transfer'
												? 'bg-accent/10'
												: 'bg-bg-secondary'}"
										>
											<svg
												class="h-5 w-5 {paymentMethod === 'bank-transfer'
													? 'text-accent'
													: 'text-text-muted'}"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M3 10h18M7 15h1m2 0h1m-2 5h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z"
												/>
											</svg>
										</div>
										<div>
											<p class="font-medium text-text-primary">Bank Transfer</p>
											<p class="text-sm text-text-muted">
												Transfer to {PAYMENT_ACCOUNT.bank} account
											</p>
										</div>
									</div>
								</button>

								{#if deliveryMethod === 'pickup'}
									<button
										type="button"
										class="w-full rounded-xl border-2 p-4 text-left transition-all {paymentMethod ===
										'pay-on-pickup'
											? 'border-accent bg-accent/5'
											: 'border-border hover:border-accent/50'}"
										onclick={() => (paymentMethod = 'pay-on-pickup')}
									>
										<div class="flex items-center gap-3">
											<div
												class="flex h-10 w-10 items-center justify-center rounded-lg {paymentMethod ===
												'pay-on-pickup'
													? 'bg-accent/10'
													: 'bg-bg-secondary'}"
											>
												<svg
													class="h-5 w-5 {paymentMethod === 'pay-on-pickup'
														? 'text-accent'
														: 'text-text-muted'}"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
													/>
												</svg>
											</div>
											<div>
												<p class="font-medium text-text-primary">Pay on Pickup</p>
												<p class="text-sm text-text-muted">
													Pay with cash or card when you collect your order at Kubwa
												</p>
											</div>
										</div>
									</button>
								{/if}
							</div>
						</div>

						<Button
							variant="primary"
							class="w-full"
							size="lg"
							loading={isProcessing}
							disabled={hasUnavailableItems}
							onclick={placeOrder}
						>
							{isProcessing
								? 'Placing Order...'
								: hasUnavailableItems
									? 'Review Cart'
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

						{#if hasUnavailableItems}
							<div class="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
								<p class="text-sm font-medium text-red-800">
									Some items in your cart are no longer available with the selected options. Please
									review your cart.
								</p>
							</div>
						{/if}

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

{#if showPaymentModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
		<div class="w-full max-w-md rounded-2xl bg-white shadow-2xl">
			<div class="p-6">
				<div class="mb-6 text-center">
					{#if paymentConfirmed}
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
									d="M5 13l4 4L19 7"
								/>
							</svg>
						</div>
						<h2 class="text-2xl font-bold text-text-primary">Payment Confirmed!</h2>
						<p class="mt-2 text-text-secondary">An admin will verify your payment shortly.</p>
					{:else}
						<div
							class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100"
						>
							<svg
								class="h-8 w-8 text-amber-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
						</div>
						<h2 class="text-2xl font-bold text-text-primary">Complete Payment</h2>
						<p class="mt-2 text-text-secondary">
							Transfer {formatPrice(orderTotal)} to complete your order
						</p>

						<div class="mt-4 rounded-xl bg-accent/10 p-4">
							<p class="mb-2 text-center text-sm font-medium text-text-muted uppercase">
								Your Payment Reference
							</p>
							<div class="flex items-center justify-center gap-2">
								<span class="font-mono text-2xl font-bold tracking-wider text-accent"
									>{paymentReference}</span
								>
								<button
									type="button"
									class="rounded-lg p-1 hover:bg-accent/20"
									onclick={() => navigator.clipboard.writeText(paymentReference)}
								>
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
											d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
										/>
									</svg>
								</button>
							</div>
							<p class="mt-3 text-center text-xs text-text-muted">
								Include this reference in your transfer description
							</p>
						</div>
					{/if}
				</div>

				<div class="mb-6 rounded-xl bg-bg-secondary p-5">
					<p class="mb-4 text-center text-sm font-medium tracking-wide text-text-muted uppercase">
						Transfer Details
					</p>
					<div class="space-y-3">
						<div class="flex justify-between">
							<span class="text-text-muted">Bank</span>
							<span class="font-semibold text-text-primary">{PAYMENT_ACCOUNT.bank}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-text-muted">Account Name</span>
							<span class="font-semibold text-text-primary">{PAYMENT_ACCOUNT.accountName}</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-text-muted">Account Number</span>
							<div class="flex items-center gap-2">
								<span class="font-mono text-lg font-bold text-accent"
									>{PAYMENT_ACCOUNT.accountNumber}</span
								>
								<button
									type="button"
									class="rounded-lg p-1 hover:bg-bg-secondary"
									onclick={() => navigator.clipboard.writeText(PAYMENT_ACCOUNT.accountNumber)}
								>
									<svg
										class="h-4 w-4 text-text-muted"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
										/>
									</svg>
								</button>
							</div>
						</div>
						<div class="flex justify-between border-t border-border pt-3">
							<span class="text-text-muted">Amount</span>
							<span class="text-xl font-bold text-accent">{formatPrice(orderTotal)}</span>
						</div>
					</div>
				</div>

				{#if !paymentConfirmed}
					<div class="mb-6 rounded-xl bg-red-50 p-4">
						<div class="flex items-center gap-3">
							<svg
								class="h-5 w-5 text-red-500"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
								/>
							</svg>
							<div>
								<p class="text-sm font-medium text-red-800">Time Remaining</p>
								<p class="text-lg font-bold text-red-600">{formattedTime()}</p>
							</div>
						</div>
					</div>
				{/if}

				<div class="space-y-3">
					{#if paymentConfirmed}
						<Button variant="primary" class="w-full" onclick={() => goto('/orders')}>
							View My Orders
						</Button>
					{:else}
						<Button variant="primary" class="w-full" onclick={confirmPayment}>
							I Have Made the Transfer
						</Button>
						<Button variant="ghost" class="w-full" onclick={handlePaymentExpired}>
							Cancel Order
						</Button>
					{/if}
				</div>

				<p class="mt-4 text-center text-xs text-text-muted">
					Order ID: <span class="font-mono">{orderId.slice(0, 8)}</span>
				</p>
			</div>
		</div>
	</div>
{/if}
