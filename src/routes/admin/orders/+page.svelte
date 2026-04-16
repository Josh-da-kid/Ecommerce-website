<script lang="ts">
	import { onMount } from 'svelte';
	import { pb, type Order } from '$lib/pocketbase';
	import { formatPrice } from '$lib/utils/index';

	let orders = $state<Order[]>([]);
	let loading = $state(true);
	let error = $state('');
	let activeFilter = $state('all');
	let expandedOrderId = $state<string | null>(null);
	let updatingStatus = $state<string | null>(null);
	let searchQuery = $state('');

	const statuses = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];

	let filteredOrders = $derived(
		orders
			.filter((o) => activeFilter === 'all' || o.status === activeFilter)
			.filter((o) => {
				if (!searchQuery.trim()) return true;
				const query = searchQuery.toLowerCase();
				return (
					o.id.toLowerCase().includes(query) ||
					o.paymentReference?.toLowerCase().includes(query) ||
					o.shippingAddress?.name?.toLowerCase().includes(query) ||
					o.shippingAddress?.email?.toLowerCase().includes(query)
				);
			})
	);

	const statusColors: Record<string, string> = {
		pending: 'bg-yellow-100 text-yellow-800',
		processing: 'bg-blue-100 text-blue-800',
		shipped: 'bg-purple-100 text-purple-800',
		delivered: 'bg-green-100 text-green-800',
		cancelled: 'bg-red-100 text-red-800'
	};

	async function fetchOrders() {
		loading = true;
		error = '';
		try {
			orders = await pb
				.collection('estore_orders')
				.getFullList<Order>({ sort: '-created', expand: 'user' });
		} catch (e: any) {
			error = e.message || 'Failed to load orders';
		} finally {
			loading = false;
		}
	}

	async function updateStatus(id: string, newStatus: string) {
		updatingStatus = id;
		try {
			const updateData: any = { status: newStatus };
			if (newStatus === 'processing' || newStatus === 'delivered') {
				updateData.paymentStatus = 'verified';
			} else if (newStatus === 'cancelled') {
				updateData.paymentStatus = 'rejected';
			}
			await pb.collection('estore_orders').update(id, updateData);
			orders = orders.map((o) => (o.id === id ? { ...o, ...updateData } : o));
		} catch (e: any) {
			error = e.message || 'Failed to update order status';
		} finally {
			updatingStatus = null;
		}
	}

	function toggleExpand(id: string) {
		expandedOrderId = expandedOrderId === id ? null : id;
	}

	onMount(() => {
		fetchOrders();

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
	<title>Orders - Admin - Urazbox</title>
</svelte:head>

<div>
	<div class="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
		<h2 class="text-2xl font-bold text-text-primary">Orders</h2>
		<div class="flex items-center gap-3">
			<div class="relative">
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search by ID, ref, name..."
					class="h-10 w-64 rounded-xl border border-border bg-white px-4 pl-10 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
				/>
				<svg
					class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-muted"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					/>
				</svg>
			</div>
			<button
				onclick={fetchOrders}
				disabled={loading}
				class="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-text-primary shadow-sm transition-colors hover:bg-bg-secondary disabled:opacity-50"
			>
				<svg
					class="h-4 w-4 {loading ? 'animate-spin' : ''}"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
					/>
				</svg>
				Refresh
			</button>
		</div>
	</div>

	{#if error}
		<div class="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
			{error}
		</div>
	{/if}

	<div class="custom-scrollbar mb-6 flex gap-2 overflow-x-auto pb-2">
		{#each statuses as status}
			<button
				onclick={() => (activeFilter = status)}
				class="rounded-xl px-4 py-2 text-sm font-medium capitalize transition-colors {activeFilter ===
				status
					? 'bg-accent text-white'
					: 'border border-border bg-white text-text-secondary hover:bg-bg-secondary'}"
			>
				{status}
				{#if status !== 'all'}
					<span class="ml-1 text-xs">
						({orders.filter((o) => o.status === status).length})
					</span>
				{/if}
			</button>
		{/each}
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-20">
			<div
				class="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent"
			></div>
		</div>
	{:else if filteredOrders.length === 0}
		<div class="rounded-2xl bg-white p-12 text-center shadow-sm">
			<svg
				class="mx-auto mb-4 h-16 w-16 text-text-muted"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.5"
					d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
				/>
			</svg>
			<h3 class="mb-1 text-lg font-semibold text-text-primary">No orders found</h3>
			<p class="text-text-secondary">
				{activeFilter === 'all' ? 'There are no orders yet.' : `No ${activeFilter} orders found.`}
			</p>
		</div>
	{:else}
		<!-- Mobile Card View -->
		<div class="grid gap-4 md:hidden">
			{#each filteredOrders as order (order.id)}
				<div class="rounded-xl bg-white p-4 shadow-sm">
					<div class="mb-3 flex items-center justify-between">
						<div>
							<span class="font-mono text-sm font-medium text-accent"
								>#{order.paymentReference || order.id.slice(0, 15).toUpperCase()}</span
							>
							{#if order.paymentReference}
								<p class="text-[10px] text-text-muted">Ref: {order.paymentReference}</p>
							{/if}
						</div>
						<span
							class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize {statusColors[
								order.status
							] || 'bg-gray-100 text-gray-800'}">{order.status}</span
						>
					</div>
					<div class="space-y-2 text-sm">
						<div class="flex justify-between">
							<span class="text-text-muted">Customer:</span>
							<span class="text-text-primary">{order.shippingAddress?.name || 'N/A'}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-text-muted">Email:</span>
							<span class="text-text-secondary"
								>{order.shippingAddress?.email || order.guestEmail || 'N/A'}</span
							>
						</div>
						<div class="flex justify-between">
							<span class="text-text-muted">Date:</span>
							<span class="text-text-secondary"
								>{new Date(order.created).toLocaleDateString('en-US', {
									month: 'short',
									day: 'numeric',
									year: 'numeric'
								})}</span
							>
						</div>
						<div class="flex justify-between">
							<span class="text-text-muted">Total:</span>
							<span class="font-semibold text-accent">{formatPrice(order.total)}</span>
						</div>
					</div>
					<button
						class="mt-3 w-full rounded-lg border border-border py-2 text-sm font-medium text-text-primary hover:bg-bg-secondary"
						onclick={() => toggleExpand(order.id)}
					>
						{expandedOrderId === order.id ? 'Hide Details' : 'View Details'}
					</button>
					{#if expandedOrderId === order.id}
						<div class="mt-4 space-y-2 border-t border-border pt-4">
							<h4 class="font-semibold text-text-primary">Order Items</h4>
							{#each order.items as item}
								<div class="flex items-center gap-3 rounded-lg bg-bg-secondary p-2">
									<img
										src={item.productImage?.startsWith('http')
											? item.productImage
											: '/placeholder-product.svg'}
										alt={item.productName}
										class="h-10 w-10 rounded object-cover"
									/>
									<div class="flex-1">
										<p class="text-sm font-medium text-text-primary">{item.productName}</p>
										<p class="text-xs text-text-muted">
											Qty: {item.quantity} × {formatPrice(item.price)}
										</p>
									</div>
								</div>
							{/each}
							<div class="mt-3 flex items-center justify-between border-t border-border pt-3">
								<label class="text-sm font-medium text-text-primary">Update Status:</label>
								<select
									class="rounded-lg border border-border px-3 py-1 text-sm"
									value={order.status}
									onchange={(e) => updateStatus(order.id, (e.target as HTMLSelectElement).value)}
									disabled={updatingStatus === order.id}
								>
									{#each statuses.filter((s) => s !== 'all') as status}
										<option value={status}>{status}</option>
									{/each}
								</select>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>

		<!-- Desktop Table View -->
		<div class="hidden md:block md:overflow-hidden md:rounded-2xl md:bg-white md:shadow-sm">
			<div class="custom-scrollbar overflow-x-auto pb-2">
				<table class="w-full min-w-[700px]">
					<thead class="bg-bg-secondary">
						<tr>
							<th class="px-6 py-3 text-left text-sm font-semibold text-text-primary">Reference</th>
							<th class="px-6 py-3 text-left text-sm font-semibold text-text-primary">Customer</th>
							<th class="px-6 py-3 text-left text-sm font-semibold text-text-primary">Email</th>
							<th class="px-6 py-3 text-left text-sm font-semibold text-text-primary">Date</th>
							<th class="px-6 py-3 text-left text-sm font-semibold text-text-primary">Total</th>
							<th class="px-6 py-3 text-left text-sm font-semibold text-text-primary">Status</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each filteredOrders as order (order.id)}
							<tr
								class="cursor-pointer hover:bg-bg-secondary/50"
								onclick={() => toggleExpand(order.id)}
							>
								<td class="px-6 py-4"
									><span class="font-mono text-sm font-medium text-accent"
										>{order.paymentReference || order.id.slice(0, 15).toUpperCase()}</span
									></td
								>
								<td class="px-6 py-4 text-sm text-text-primary"
									>{order.shippingAddress?.name || 'N/A'}</td
								>
								<td class="px-6 py-4 text-sm text-text-secondary"
									>{order.shippingAddress?.email || order.guestEmail || 'N/A'}</td
								>
								<td class="px-6 py-4 text-sm text-text-secondary"
									>{new Date(order.created).toLocaleDateString('en-US', {
										month: 'short',
										day: 'numeric',
										year: 'numeric'
									})}</td
								>
								<td class="px-6 py-4 text-sm font-semibold text-accent"
									>{formatPrice(order.total)}</td
								>
								<td class="px-6 py-4"
									><span
										class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize {statusColors[
											order.status
										] || 'bg-gray-100 text-gray-800'}">{order.status}</span
									></td
								>
							</tr>
							{#if expandedOrderId === order.id}
								<tr>
									<td colspan="6" class="bg-bg-secondary/30 px-6 py-6">
										<div class="grid gap-6 md:grid-cols-3">
											<div>
												<h4 class="mb-3 text-sm font-semibold text-text-primary">Order Items</h4>
												<div class="space-y-2">
													{#each order.items as item}
														<div class="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm">
															<div
																class="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-bg-secondary"
															>
																<img
																	src={item.productImage?.startsWith('http')
																		? item.productImage
																		: '/placeholder-product.svg'}
																	alt={item.productName}
																	class="h-full w-full object-cover"
																/>
															</div>
															<div class="min-w-0 flex-1">
																<p class="truncate text-sm font-medium text-text-primary">
																	{item.productName}
																</p>
																<p class="text-xs text-text-secondary">
																	Qty: {item.quantity} &times;
																	{formatPrice(item.price)}
																</p>
																{#if item.color || item.size}
																	<div class="mt-0.5 flex gap-1">
																		{#if item.color}
																			<span
																				class="inline-flex items-center rounded bg-bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-text-secondary"
																				>{item.color}</span
																			>
																		{/if}
																		{#if item.size}
																			<span
																				class="inline-flex items-center rounded bg-bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-text-secondary"
																				>{item.size}</span
																			>
																		{/if}
																	</div>
																{/if}
															</div>
															<span class="text-sm font-semibold text-accent">
																{formatPrice(item.price * item.quantity)}
															</span>
														</div>
													{/each}
												</div>
											</div>

											<div>
												<h4 class="mb-3 text-sm font-semibold text-text-primary">
													Shipping Address
												</h4>
												<div class="rounded-xl bg-white p-4 shadow-sm">
													{#if order.shippingAddress}
														<p class="text-sm font-medium text-text-primary">
															{order.shippingAddress.name}
														</p>
														<p class="mt-1 text-sm text-text-secondary">
															{order.shippingAddress.street}
														</p>
														<p class="text-sm text-text-secondary">
															{order.shippingAddress.city},
															{order.shippingAddress.state}
															{order.shippingAddress.zip}
														</p>
														<p class="text-sm text-text-secondary">
															{order.shippingAddress.country}
														</p>
														<p class="mt-2 text-sm text-text-secondary">
															{order.shippingAddress.phone}
														</p>
													{:else}
														<p class="text-sm text-text-muted">No address provided</p>
													{/if}
												</div>
											</div>

											<div>
												<h4 class="mb-3 text-sm font-semibold text-text-primary">
													Payment & Status
												</h4>
												<div class="rounded-xl bg-white p-4 shadow-sm">
													<p class="text-sm text-text-secondary">
														Payment:
														<span class="font-medium text-text-primary"
															>{order.paymentMethod || 'N/A'}</span
														>
													</p>
													<p class="mt-1 text-sm text-text-secondary">
														Order Total:
														<span class="font-semibold text-accent">{formatPrice(order.total)}</span
														>
													</p>

													<div class="mt-4">
														<label class="mb-1 block text-sm font-medium text-text-primary"
															>Update Status</label
														>
														<select
															value={order.status}
															disabled={updatingStatus === order.id}
															onchange={(e) => {
																e.stopPropagation();
																updateStatus(order.id, (e.target as HTMLSelectElement).value);
															}}
															onclick={(e) => e.stopPropagation()}
															class="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none disabled:opacity-50"
														>
															{#each ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as s}
																<option value={s}>{s}</option>
															{/each}
														</select>
													</div>
												</div>
											</div>
										</div>
									</td>
								</tr>
							{/if}
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>
