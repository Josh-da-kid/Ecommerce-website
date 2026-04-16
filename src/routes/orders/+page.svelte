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
	let currentUserId = $state<string | null>(null);

	async function fetchOrders() {
		loading = true;
		try {
			const filter = currentUserId ? `user.id="${currentUserId}"` : '';
			orders = await pb
				.collection('estore_orders')
				.getFullList<Order>({ sort: '-created', filter, expand: 'user' });
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

		pb.collection('estore_orders').subscribe('*', (e) => {
			if (e.action === 'create') {
				const newOrder = e.record as unknown as Order;
				if (!currentUserId || newOrder.user === currentUserId) {
					orders = [newOrder, ...orders];
				}
			} else if (e.action === 'update') {
				orders = orders.map((o) => (o.id === e.record.id ? (e.record as unknown as Order) : o));
			} else if (e.action === 'delete') {
				orders = orders.filter((o) => o.id !== e.record.id);
			}
		});

		return () => {
			pb.collection('estore_orders')
				.unsubscribe('*')
				.catch(() => {});
		};
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
			case 'pending':
				return 'bg-yellow-100 text-yellow-800';
			case 'processing':
				return 'bg-blue-100 text-blue-800';
			case 'shipped':
				return 'bg-purple-100 text-purple-800';
			case 'delivered':
				return 'bg-green-100 text-green-800';
			case 'cancelled':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	let activeOrders = $derived(
		orders.filter(
			(o) => o.status === 'pending' || o.status === 'processing' || o.status === 'shipped'
		)
	);
	let hasHistory = $derived(
		orders.some((o) => o.status === 'delivered' || o.status === 'cancelled')
	);

	function toggleExpand(id: string) {
		expandedOrderId = expandedOrderId === id ? null : id;
	}
</script>

<svelte:head>
	<title>My Orders - Urazbox</title>
</svelte:head>

<div class="min-h-screen bg-bg-primary pt-24 pb-16">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="mb-8 flex items-center justify-between">
			<h1 class="text-4xl font-[var(--font-playfair)] font-bold text-text-primary">My Orders</h1>
			<a href="/products">
				<Button variant="secondary" size="md">Continue Shopping</Button>
			</a>
		</div>

		{#if loading}
			<div class="flex items-center justify-center py-20">
				<div
					class="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent"
				></div>
			</div>
		{:else if orders.length === 0}
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
				<h2 class="mb-4 text-2xl font-semibold text-text-primary">No orders yet</h2>
				<p class="mb-8 text-text-secondary">You haven't placed any orders yet.</p>
				<a href="/products">
					<Button variant="primary" size="lg">Start Shopping</Button>
				</a>
			</div>
		{:else}
			{#if activeOrders.length > 0}
				<div class="mb-12">
					<h2 class="mb-6 text-2xl font-semibold text-text-primary">Active Orders</h2>
					<div class="space-y-6">
						{#each activeOrders as order (order.id)}
							<div class="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
								<div class="p-6">
									<div class="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
										<div>
											<p class="text-sm text-text-secondary">Order Reference</p>
											<p class="font-mono text-lg font-semibold text-accent">
												{order.paymentReference || order.id.slice(0, 15).toUpperCase()}
											</p>
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
				</div>
			{:else}
				<div class="rounded-2xl bg-white p-8 text-center">
					<p class="text-text-secondary">No active orders</p>
				</div>
			{/if}

			{#if hasHistory}
				<div class="mt-8 flex justify-center">
					<a href="/orders/history">
						<Button variant="secondary" size="lg">View Order History</Button>
					</a>
				</div>
			{/if}
		{/if}
	</div>
</div>
