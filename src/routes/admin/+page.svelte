<script lang="ts">
	import { products, categories } from '$lib/stores/products';
	import { formatPrice } from '$lib/utils/index';
	import { pb } from '$lib/pocketbase';
	import type { Order } from '$lib/pocketbase';
	import { onMount } from 'svelte';

	let orders = $state<Order[]>([]);
	let isLoading = $state(true);

	let totalRevenue = $derived(orders.reduce((sum, o) => sum + o.total, 0));
	let totalOrders = $derived(orders.length);
	let totalProducts = $derived($products.length);
	let totalCategories = $derived($categories.length);

	const statusColors: Record<string, string> = {
		pending: 'bg-yellow-100 text-yellow-800',
		processing: 'bg-blue-100 text-blue-800',
		shipped: 'bg-purple-100 text-purple-800',
		delivered: 'bg-green-100 text-green-800',
		cancelled: 'bg-red-100 text-red-800'
	};

	function getCustomerName(order: Order): string {
		if (order.shippingAddress?.name) return order.shippingAddress.name;
		if (order.guestEmail) return order.guestEmail;
		return order.user || 'Unknown';
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	onMount(() => {
		(async () => {
			try {
				const records = await pb.collection('estore_orders').getFullList<Order>({
					sort: '-created'
				});
				orders = records;
			} catch (error) {
				console.error('Failed to fetch orders:', error);
				orders = [];
			} finally {
				isLoading = false;
			}
		})();

		pb.collection('estore_orders').subscribe('*', (e) => {
			if (e.action === 'create') {
				orders = [e.record as unknown as Order, ...orders];
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
</script>

<svelte:head>
	<title>Admin Dashboard - Luxe Store</title>
</svelte:head>

<div>
	<div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
		<div class="rounded-2xl bg-white p-6 shadow-sm">
			<div class="mb-4 flex items-center justify-between">
				<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
					<svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				</div>
			</div>
			<p class="text-sm text-text-secondary">Total Revenue</p>
			<p class="text-2xl font-bold text-text-primary">{formatPrice(totalRevenue)}</p>
		</div>

		<div class="rounded-2xl bg-white p-6 shadow-sm">
			<div class="mb-4 flex items-center justify-between">
				<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
					<svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
						/>
					</svg>
				</div>
			</div>
			<p class="text-sm text-text-secondary">Total Orders</p>
			<p class="text-2xl font-bold text-text-primary">{totalOrders}</p>
		</div>

		<div class="rounded-2xl bg-white p-6 shadow-sm">
			<div class="mb-4 flex items-center justify-between">
				<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
					<svg
						class="h-6 w-6 text-purple-600"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
						/>
					</svg>
				</div>
			</div>
			<p class="text-sm text-text-secondary">Products</p>
			<p class="text-2xl font-bold text-text-primary">{totalProducts}</p>
		</div>

		<div class="rounded-2xl bg-white p-6 shadow-sm">
			<div class="mb-4 flex items-center justify-between">
				<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
					<svg class="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 6h16M4 10h16M4 14h16M4 18h16"
						/>
					</svg>
				</div>
			</div>
			<p class="text-sm text-text-secondary">Categories</p>
			<p class="text-2xl font-bold text-text-primary">{totalCategories}</p>
		</div>
	</div>

	<div class="rounded-2xl bg-white shadow-sm">
		<div class="border-b border-border px-6 py-4">
			<h2 class="text-xl font-semibold text-text-primary">Recent Orders</h2>
		</div>

		{#if isLoading}
			<div class="flex items-center justify-center py-12">
				<div
					class="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent"
				></div>
			</div>
		{:else if orders.length === 0}
			<div class="flex flex-col items-center justify-center py-12 text-text-secondary">
				<svg
					class="mb-4 h-12 w-12 text-text-secondary/50"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
					/>
				</svg>
				<p class="text-lg font-medium">No orders yet</p>
				<p class="mt-1 text-sm">Orders will appear here once customers start purchasing.</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="bg-bg-secondary">
						<tr>
							<th class="px-6 py-3 text-left text-sm font-semibold text-text-primary">Order ID</th>
							<th class="px-6 py-3 text-left text-sm font-semibold text-text-primary">Customer</th>
							<th class="px-6 py-3 text-left text-sm font-semibold text-text-primary">Date</th>
							<th class="px-6 py-3 text-left text-sm font-semibold text-text-primary">Total</th>
							<th class="px-6 py-3 text-left text-sm font-semibold text-text-primary">Status</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each orders as order}
							<tr class="hover:bg-bg-secondary/50">
								<td class="px-6 py-4 text-sm font-medium text-accent"
									>{order.id.slice(0, 8).toUpperCase()}</td
								>
								<td class="px-6 py-4 text-sm text-text-primary">{getCustomerName(order)}</td>
								<td class="px-6 py-4 text-sm text-text-secondary">{formatDate(order.created)}</td>
								<td class="px-6 py-4 text-sm font-semibold text-text-primary"
									>{formatPrice(order.total)}</td
								>
								<td class="px-6 py-4">
									<span
										class="rounded-full px-3 py-1 text-xs font-medium {statusColors[order.status] ||
											'bg-gray-100 text-gray-800'}"
									>
										{order.status}
									</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
