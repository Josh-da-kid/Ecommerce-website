<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { pb, type Order } from '$lib/pocketbase';
	import { formatPrice } from '$lib/utils/index';
	import { Button } from '$lib/components/ui';
	import { isAuthenticated, user } from '$lib/stores/auth';

	let orders = $state<Order[]>([]);
	let expandedOrderId = $state<string | null>(null);
	let loading = $state(true);
	let filter = $state<'all' | 'delivered' | 'cancelled'>('all');
	let currentUserId = $state<string | null>(null);

	async function fetchOrders() {
		loading = true;
		try {
			const pbFilter = currentUserId ? `user.id="${currentUserId}"` : '';
			orders = await pb
				.collection('estore_orders')
				.getFullList<Order>({ sort: '-created', filter: pbFilter, expand: 'user' });
		} catch {
			if (browser) {
				try {
					const stored = localStorage.getItem('luxe_orders');
					if (stored) {
						orders = (JSON.parse(stored) as Order[])
							.filter((o) => !currentUserId || o.user === currentUserId)
							.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
					}
				} catch {}
			}
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		if (!$isAuthenticated) {
			goto('/login');
			return;
		}
		currentUserId = $user?.id ?? null;
		fetchOrders();
	});

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function statusColor(status: string): string {
		switch (status) {
			case 'delivered':
				return 'bg-green-100 text-green-800';
			case 'cancelled':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	let filteredOrders = $derived(
		filter === 'all'
			? orders.filter((o) => o.status === 'delivered' || o.status === 'cancelled')
			: orders.filter((o) => o.status === filter)
	);

	function toggleExpand(id: string) {
		expandedOrderId = expandedOrderId === id ? null : id;
	}
</script>

<svelte:head>
	<title>Order History - Luxe Store</title>
</svelte:head>

<div class="min-h-screen bg-bg-primary pt-24 pb-16">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="mb-8 flex items-center justify-between">
			<div class="flex items-center gap-4">
				<a href="/orders" class="text-text-secondary hover:text-accent">
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 19l-7-7 7-7"
						/>
					</svg>
				</a>
				<h1 class="text-4xl font-[var(--font-playfair)] font-bold text-text-primary">
					Order History
				</h1>
			</div>
		</div>

		<div class="mb-6 flex gap-2">
			<button
				class="rounded-lg px-4 py-2 text-sm font-medium transition-colors {filter === 'all'
					? 'bg-accent text-white'
					: 'bg-white text-text-secondary hover:bg-bg-secondary'}"
				onclick={() => (filter = 'all')}
			>
				All
			</button>
			<button
				class="rounded-lg px-4 py-2 text-sm font-medium transition-colors {filter === 'delivered'
					? 'bg-green-500 text-white'
					: 'bg-white text-text-secondary hover:bg-bg-secondary'}"
				onclick={() => (filter = 'delivered')}
			>
				Delivered
			</button>
			<button
				class="rounded-lg px-4 py-2 text-sm font-medium transition-colors {filter === 'cancelled'
					? 'bg-red-500 text-white'
					: 'bg-white text-text-secondary hover:bg-bg-secondary'}"
				onclick={() => (filter = 'cancelled')}
			>
				Cancelled
			</button>
		</div>

		{#if loading}
			<div class="flex items-center justify-center py-20">
				<div
					class="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent"
				></div>
			</div>
		{:else if filteredOrders.length === 0}
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
						d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
					/>
				</svg>
				<h2 class="mb-4 text-2xl font-semibold text-text-primary">No orders found</h2>
				<p class="mb-8 text-text-secondary">
					{filter === 'all'
						? "You haven't completed any orders yet."
						: filter === 'delivered'
							? 'No delivered orders yet.'
							: 'No cancelled orders.'}
				</p>
				<a href="/products">
					<Button variant="primary" size="lg">Start Shopping</Button>
				</a>
			</div>
		{:else}
			<div class="space-y-6">
				{#each filteredOrders as order (order.id)}
					<div class="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
						<div class="p-6">
							<div class="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
								<div>
									<p class="text-sm text-text-secondary">Order ID</p>
									<p class="font-semibold text-text-primary">{order.id}</p>
								</div>
								<div class="flex items-center gap-4">
									<p class="text-sm text-text-secondary">{formatDate(order.created)}</p>
									<span
										class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize {statusColor(
											order.status
										)}"
									>
										{order.status}
									</span>
								</div>
							</div>

							<div class="space-y-4">
								{#each order.items as item (item.productId)}
									<div class="flex items-center gap-4">
										<a
											href="/products/{item.productId}"
											class="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-bg-secondary"
										>
											<img
												src={item.productImage}
												alt={item.productName}
												class="h-full w-full object-cover"
											/>
										</a>
										<div class="min-w-0 flex-1">
											<a
												href="/products/{item.productId}"
												class="truncate font-medium text-text-primary hover:text-accent"
											>
												{item.productName}
											</a>
											<p class="text-sm text-text-muted">Qty: {item.quantity}</p>
											{#if order.status === 'delivered'}
												<a
													href="/products/{item.productId}#reviews"
													class="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-white"
												>
													<span class="text-base">★</span>
													<span>Write a Review</span>
												</a>
											{/if}
										</div>
										<p class="font-semibold whitespace-nowrap text-text-primary">
											{formatPrice(item.price * item.quantity)}
										</p>
									</div>
								{/each}
							</div>

							<div class="mt-6 flex items-center justify-between border-t border-border pt-4">
								<p class="text-lg font-bold text-text-primary">
									Total: <span class="text-accent">{formatPrice(order.total)}</span>
								</p>
								<button
									class="text-sm font-medium text-accent hover:underline"
									onclick={() => toggleExpand(order.id)}
								>
									{expandedOrderId === order.id ? 'Hide Details' : 'View Details'}
								</button>
							</div>
						</div>

						{#if expandedOrderId === order.id}
							<div class="border-t border-border bg-bg-secondary p-6">
								<h3 class="mb-3 font-semibold text-text-primary">Shipping Address</h3>
								{#if order.shippingAddress}
									<div class="space-y-1 text-sm text-text-secondary">
										<p>{order.shippingAddress.name}</p>
										<p>{order.shippingAddress.street}</p>
										<p>
											{order.shippingAddress.city}, {order.shippingAddress.state}
											{order.shippingAddress.zip}
										</p>
										<p>{order.shippingAddress.country}</p>
										{#if order.shippingAddress.phone}
											<p>{order.shippingAddress.phone}</p>
										{/if}
										{#if order.shippingAddress.email}
											<p>{order.shippingAddress.email}</p>
										{/if}
									</div>
								{:else}
									<p class="text-sm text-text-muted">No shipping address available.</p>
								{/if}

								<div class="mt-4 border-t border-border pt-4">
									<h3 class="mb-2 font-semibold text-text-primary">Payment Method</h3>
									<p class="text-sm text-text-secondary capitalize">
										{order.paymentMethod || 'Pay on Delivery'}
									</p>
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
