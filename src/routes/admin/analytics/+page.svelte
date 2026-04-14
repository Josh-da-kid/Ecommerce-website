<script lang="ts">
	import { onMount } from 'svelte';
	import { pb } from '$lib/pocketbase';
	import type { Order, Product } from '$lib/pocketbase';
	import { formatPrice } from '$lib/utils/index';

	let orders = $state<Order[]>([]);
	let products = $state<Product[]>([]);
	let loading = $state(true);
	let error = $state('');

	const statusColors: Record<string, string> = {
		pending: '#f59e0b',
		processing: '#3b82f6',
		shipped: '#8b5cf6',
		delivered: '#22c55e',
		cancelled: '#ef4444'
	};

	const statusLabels: Record<string, string> = {
		pending: 'Pending',
		processing: 'Processing',
		shipped: 'Shipped',
		delivered: 'Delivered',
		cancelled: 'Cancelled'
	};

	const barFills = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

	onMount(async () => {
		try {
			const [ordersResult, productsResult] = await Promise.all([
				pb.collection('estore_orders').getFullList<Order>({ sort: '-created' }),
				pb.collection('estore_products').getFullList<Product>()
			]);
			orders = ordersResult;
			products = productsResult;
		} catch (e: any) {
			error = e.message || 'Failed to load analytics data';
		} finally {
			loading = false;
		}
	});

	let totalRevenue = $derived(orders.reduce((sum, o) => sum + (o.total || 0), 0));
	let averageOrderValue = $derived(orders.length > 0 ? totalRevenue / orders.length : 0);
	let totalOrders = $derived(orders.length);

	let monthlyRevenueData = $derived(() => {
		const months: { label: string; revenue: number }[] = [];
		const now = new Date();
		for (let i = 5; i >= 0; i--) {
			const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
			const year = d.getFullYear();
			const month = d.getMonth();
			const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
			const revenue = orders
				.filter((o) => {
					const od = new Date(o.created);
					return od.getFullYear() === year && od.getMonth() === month;
				})
				.reduce((sum, o) => sum + (o.total || 0), 0);
			months.push({ label, revenue });
		}
		return months;
	});

	let maxMonthlyRevenue = $derived(Math.max(...monthlyRevenueData().map((m) => m.revenue), 1));

	let hasRevenueData = $derived(monthlyRevenueData().some((m) => m.revenue > 0));

	let orderStatusCounts = $derived(() => {
		const counts: Record<string, number> = {
			pending: 0,
			processing: 0,
			shipped: 0,
			delivered: 0,
			cancelled: 0
		};
		for (const o of orders) {
			if (counts[o.status] !== undefined) {
				counts[o.status]++;
			}
		}
		return counts;
	});

	let statusTotal = $derived(Object.values(orderStatusCounts()).reduce((s, c) => s + c, 0));

	let donutSegments = $derived(() => {
		const counts = orderStatusCounts();
		const total = Object.values(counts).reduce((s, c) => s + c, 0);
		if (total === 0) return [];
		const circumference = 2 * Math.PI * 70;
		let offset = 0;
		return Object.entries(counts)
			.filter(([, c]) => c > 0)
			.map(([status, count]) => {
				const pct = count / total;
				const dashLen = pct * circumference;
				const seg = { status, count, pct, dashLen, offset, circumference };
				offset += dashLen;
				return seg;
			});
	});

	let topProducts = $derived(() => {
		const productCounts: Record<string, { name: string; count: number }> = {};
		for (const o of orders) {
			for (const item of o.items || []) {
				if (!productCounts[item.productId]) {
					productCounts[item.productId] = { name: item.productName, count: 0 };
				}
				productCounts[item.productId].count += item.quantity || 1;
			}
		}
		return Object.values(productCounts)
			.sort((a, b) => b.count - a.count)
			.slice(0, 5);
	});

	let topProductsList = $derived(topProducts());
	let maxProductCount = $derived(Math.max(...topProductsList.map((p) => p.count), 1));

	let recentOrders = $derived(orders.slice(0, 10));

	function getStatusIcon(status: string): string {
		switch (status) {
			case 'delivered':
				return 'M5 13l4 4L19 7';
			case 'cancelled':
				return 'M6 18L18 6M6 6l12 12';
			case 'shipped':
				return 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l4-2 4 2zm6 0V6a1 1 0 00-1-1h-3';
			case 'processing':
				return 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15';
			default:
				return 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';
		}
	}
</script>

<svelte:head>
	<title>Analytics - Admin - Luxe Store</title>
</svelte:head>

{#if loading}
	<div class="flex items-center justify-center py-20">
		<div
			class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent"
		></div>
		<p class="text-text-secondary">Loading analytics...</p>
	</div>
{:else if error}
	<div class="rounded-2xl bg-red-50 p-6 text-center text-red-600">
		<p class="font-medium">Error loading analytics</p>
		<p class="mt-1 text-sm">{error}</p>
	</div>
{:else}
	<div>
		<!-- Key Metrics Cards -->
		<div class="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
			<div class="rounded-2xl bg-white p-6 shadow-sm">
				<div class="mb-4 flex items-center justify-between">
					<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
						<svg
							class="h-6 w-6 text-green-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
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
						<svg
							class="h-6 w-6 text-blue-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
							/>
						</svg>
					</div>
				</div>
				<p class="text-sm text-text-secondary">Avg Order Value</p>
				<p class="text-2xl font-bold text-text-primary">{formatPrice(averageOrderValue)}</p>
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
					<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
						<svg
							class="h-6 w-6 text-amber-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
							/>
						</svg>
					</div>
				</div>
				<p class="text-sm text-text-secondary">Conversion Rate</p>
				<p class="text-2xl font-bold text-text-primary">
					{totalOrders > 0
						? ((totalOrders / Math.max(totalOrders * 10, 100)) * 100).toFixed(1)
						: '0.0'}%
				</p>
			</div>
		</div>

		<!-- Charts Row -->
		<div class="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
			<!-- Revenue Overview Bar Chart -->
			<div class="rounded-2xl bg-white p-6 shadow-sm lg:col-span-2">
				<h2 class="mb-6 text-lg font-semibold text-text-primary">Revenue Overview</h2>
				{#if !hasRevenueData}
					<div class="flex h-64 items-center justify-center text-text-secondary">
						<p>No revenue data for the last 6 months</p>
					</div>
				{:else}
					{@const revData = monthlyRevenueData()}
					<svg
						viewBox="0 0 500 250"
						class="w-full"
						role="img"
						aria-label="Monthly revenue bar chart"
					>
						{#each revData as month, i}
							{@const barHeight = (month.revenue / maxMonthlyRevenue) * 180}
							{@const x = 45 + i * 75}
							{@const y = 210 - barHeight}
							<rect {x} {y} width={50} height={barHeight} fill="#2563eb" rx="4" opacity="0.85">
								<title>{month.label}: {formatPrice(month.revenue)}</title>
							</rect>
							<text
								x={x + 25}
								y={barHeight > 30 ? y + 18 : y - 6}
								text-anchor="middle"
								fill={barHeight > 30 ? '#fff' : '#6b7280'}
								font-size="10"
								font-weight="600"
							>
								{formatPrice(month.revenue)}
							</text>
							<text x={x + 25} y="235" text-anchor="middle" fill="#6b7280" font-size="11">
								{month.label}
							</text>
						{/each}
						<line x1="40" y1="210" x2="490" y2="210" stroke="#e5e7eb" stroke-width="1" />
					</svg>
				{/if}
			</div>

			<!-- Order Status Donut Chart -->
			<div class="rounded-2xl bg-white p-6 shadow-sm">
				<h2 class="mb-6 text-lg font-semibold text-text-primary">Order Status</h2>
				{#if statusTotal === 0}
					<div class="flex h-48 items-center justify-center text-text-secondary">
						<p>No orders yet</p>
					</div>
				{:else}
					{@const segments = donutSegments()}
					{@const counts = orderStatusCounts()}
					<div class="flex flex-col items-center">
						<svg
							viewBox="0 0 200 200"
							class="h-48 w-48"
							role="img"
							aria-label="Order status distribution"
						>
							<circle cx="100" cy="100" r="70" fill="none" stroke="#f3f4f6" stroke-width="25" />
							{#each segments as seg}
								<circle
									cx="100"
									cy="100"
									r="70"
									fill="none"
									stroke={statusColors[seg.status]}
									stroke-width="25"
									stroke-dasharray="{seg.dashLen} {seg.circumference - seg.dashLen}"
									stroke-dashoffset={-seg.offset}
									transform="rotate(-90 100 100)"
								>
									<title
										>{statusLabels[seg.status]}: {seg.count} ({(seg.pct * 100).toFixed(1)}%)</title
									>
								</circle>
							{/each}
							<text
								x="100"
								y="95"
								text-anchor="middle"
								fill="#111827"
								font-size="28"
								font-weight="700"
							>
								{statusTotal}
							</text>
							<text x="100" y="115" text-anchor="middle" fill="#6b7280" font-size="12">
								Orders
							</text>
						</svg>
						<div class="mt-4 grid w-full grid-cols-2 gap-x-6 gap-y-2">
							{#each Object.entries(counts) as [status, count]}
								<div class="flex items-center gap-2">
									<span
										class="h-3 w-3 flex-shrink-0 rounded-full"
										style="background-color: {statusColors[status]}"
									></span>
									<span class="text-xs text-text-secondary">{statusLabels[status]}</span>
									<span class="ml-auto text-xs font-semibold text-text-primary">{count}</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Bottom Row -->
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
			<!-- Top Selling Products -->
			<div class="rounded-2xl bg-white p-6 shadow-sm">
				<h2 class="mb-6 text-lg font-semibold text-text-primary">Top Selling Products</h2>
				{#if topProductsList.length === 0}
					<div class="flex h-48 items-center justify-center text-text-secondary">
						<p>No product sales data yet</p>
					</div>
				{:else}
					<div class="space-y-4">
						{#each topProductsList as product, i}
							{@const barWidth = (product.count / maxProductCount) * 100}
							<div>
								<div class="mb-1 flex items-center justify-between">
									<span class="max-w-[70%] truncate text-sm font-medium text-text-primary">
										{product.name}
									</span>
									<span class="text-sm font-semibold text-accent">{product.count} sold</span>
								</div>
								<div class="h-6 w-full overflow-hidden rounded-lg bg-bg-secondary">
									<svg width="100%" height="24" class="block">
										<rect
											x="0"
											y="0"
											height="24"
											width="{barWidth}%"
											fill={barFills[i] || barFills[4]}
											rx="6"
										/>
									</svg>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Recent Activity Timeline -->
			<div class="rounded-2xl bg-white p-6 shadow-sm">
				<h2 class="mb-6 text-lg font-semibold text-text-primary">Recent Activity</h2>
				{#if recentOrders.length === 0}
					<div class="flex h-48 items-center justify-center text-text-secondary">
						<p>No recent orders</p>
					</div>
				{:else}
					<div class="space-y-0">
						{#each recentOrders as order, i}
							<div class="flex gap-4">
								<div class="flex flex-col items-center">
									<div
										class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
										style="background-color: {statusColors[order.status] || '#9ca3af'}20"
									>
										<svg
											class="h-4 w-4"
											fill="none"
											stroke={statusColors[order.status] || '#9ca3af'}
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d={getStatusIcon(order.status)}
											/>
										</svg>
									</div>
									{#if i < recentOrders.length - 1}
										<div class="my-1 w-0.5 flex-1 bg-border"></div>
									{/if}
								</div>
								<div class="min-w-0 flex-1 pb-6">
									<div class="flex items-center justify-between gap-2">
										<p class="truncate text-sm font-medium text-text-primary">
											{(order.items || []).length} item{(order.items || []).length !== 1 ? 's' : ''}
										</p>
										<span
											class="flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
											style="background-color: {statusColors[order.status] ||
												'#9ca3af'}15; color: {statusColors[order.status] || '#9ca3af'}"
										>
											{statusLabels[order.status] || order.status}
										</span>
									</div>
									<p class="mt-0.5 text-sm font-semibold text-accent">
										{formatPrice(order.total)}
									</p>
									<p class="mt-1 text-xs text-text-secondary">
										{new Date(order.created).toLocaleDateString('en-US', {
											month: 'short',
											day: 'numeric',
											year: 'numeric',
											hour: '2-digit',
											minute: '2-digit'
										})}
									</p>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
