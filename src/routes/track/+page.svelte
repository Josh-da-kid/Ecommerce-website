<script lang="ts">
	import { pb, type Order } from '$lib/pocketbase';
	import { isAuthenticated } from '$lib/stores/auth';
	import { Button, Input } from '$lib/components/ui';

	let orderId = $state('');
	let isLoading = $state(false);
	let error = $state('');
	let order: Order | null = $state(null);

	async function handleTrack(e: Event) {
		e.preventDefault();
		if (!orderId.trim()) return;

		isLoading = true;
		error = '';
		order = null;

		try {
			const record = await pb.collection('estore_orders').getOne(orderId.trim(), {
				expand: 'user'
			});
			order = record as unknown as Order;
		} catch {
			error = 'Order not found. Please check your order ID and try again.';
		}

		isLoading = false;
	}

	const statusSteps = ['pending', 'processing', 'shipped', 'delivered'];

	function getStatusIndex(status: string): number {
		return statusSteps.indexOf(status);
	}

	function getStatusLabel(status: string): string {
		const labels: Record<string, string> = {
			pending: 'Order Placed',
			processing: 'Processing',
			shipped: 'Shipped',
			delivered: 'Delivered',
			cancelled: 'Cancelled'
		};
		return labels[status] || status;
	}
</script>

<svelte:head>
	<title>Track Order - Urazbox</title>
</svelte:head>

<div class="min-h-screen bg-bg-primary pt-24 pb-16">
	<div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
		<div class="mb-12 text-center">
			<h1 class="mb-4 text-4xl font-[var(--font-playfair)] font-bold text-text-primary">
				Track Your Order
			</h1>
			<p class="mx-auto max-w-xl text-xl text-text-secondary">
				Enter your order ID to check the current status of your order.
			</p>
		</div>

		<div class="mb-8 rounded-2xl bg-white p-8 shadow-lg sm:p-12">
			<form onsubmit={handleTrack} class="flex flex-col gap-4 sm:flex-row">
				<div class="flex-1">
					<Input
						type="text"
						label="Order ID"
						bind:value={orderId}
						placeholder="Enter your order ID (e.g. ORDER1234...)"
						required
					/>
				</div>
				<div class="flex items-end">
					<Button
						type="submit"
						variant="primary"
						size="lg"
						loading={isLoading}
						class="w-full sm:w-auto"
					>
						Track Order
					</Button>
				</div>
			</form>

			{#if $isAuthenticated}
				<p class="mt-4 text-sm text-text-secondary">
					You can also view all your orders on the
					<a href="/orders" class="text-accent hover:underline">Orders page</a>.
				</p>
			{/if}
		</div>

		{#if error}
			<div class="mb-8 rounded-xl bg-red-50 p-4 text-center text-red-600">
				{error}
			</div>
		{/if}

		{#if order}
			<div class="rounded-2xl bg-white p-8 shadow-lg sm:p-12">
				<div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h2 class="text-2xl font-semibold text-text-primary">Order #{order.id.slice(0, 8)}</h2>
						<p class="text-sm text-text-secondary">
							Placed on {new Date(order.created).toLocaleDateString('en-US', {
								year: 'numeric',
								month: 'long',
								day: 'numeric'
							})}
						</p>
					</div>
					<div
						class="inline-flex self-start rounded-full px-4 py-2 text-sm font-semibold {order.status ===
						'delivered'
							? 'bg-green-100 text-green-700'
							: order.status === 'cancelled'
								? 'bg-red-100 text-red-700'
								: 'bg-accent/10 text-accent'}"
					>
						{getStatusLabel(order.status)}
					</div>
				</div>

				{#if order.status !== 'cancelled'}
					<div class="mb-8">
						<div class="flex items-center justify-between">
							{#each statusSteps as step, i}
								<div class="flex flex-1 flex-col items-center">
									<div
										class="flex h-10 w-10 items-center justify-center rounded-full border-2 {getStatusIndex(
											order.status
										) >= i
											? 'border-accent bg-accent text-white'
											: 'border-border bg-white text-text-muted'}"
									>
										{#if getStatusIndex(order.status) > i}
											<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M5 13l4 4L19 7"
												/>
											</svg>
										{:else}
											<span class="text-sm font-semibold">{i + 1}</span>
										{/if}
									</div>
									<span
										class="mt-2 text-xs font-medium {getStatusIndex(order.status) >= i
											? 'text-accent'
											: 'text-text-muted'}"
									>
										{getStatusLabel(step)}
									</span>
								</div>
								{#if i < statusSteps.length - 1}
									<div
										class="mx-1 h-1 flex-1 rounded-full {getStatusIndex(order.status) > i
											? 'bg-accent'
											: 'bg-border'}"
									></div>
								{/if}
							{/each}
						</div>
					</div>
				{/if}

				<div class="space-y-4 border-t border-border pt-6">
					<h3 class="text-lg font-semibold text-text-primary">Order Items</h3>
					{#each order.items as item}
						<div class="flex items-center gap-4 rounded-xl bg-bg-secondary p-4">
							<div class="flex-1">
								<p class="font-medium text-text-primary">{item.productName}</p>
								<p class="text-sm text-text-secondary">
									Qty: {item.quantity}
									{#if item.size}
										&middot; Size: {item.size}{/if}
									{#if item.color}
										&middot; Color: {item.color}{/if}
								</p>
							</div>
							<p class="font-semibold text-text-primary">
								₦{item.price.toLocaleString()}
							</p>
						</div>
					{/each}
				</div>

				<div class="mt-6 flex items-center justify-between border-t border-border pt-6">
					<span class="text-lg font-semibold text-text-primary">Total</span>
					<span class="text-xl font-bold text-accent">₦{order.total.toLocaleString()}</span>
				</div>

				{#if order.shippingAddress}
					<div class="mt-6 border-t border-border pt-6">
						<h3 class="mb-2 text-lg font-semibold text-text-primary">Shipping Address</h3>
						<p class="text-text-secondary">
							{order.shippingAddress.name}<br />
							{order.shippingAddress.street}<br />
							{order.shippingAddress.city}, {order.shippingAddress.state}<br />
							{order.shippingAddress.phone}
						</p>
					</div>
				{/if}
			</div>
		{/if}

		{#if !order && !error}
			<div class="rounded-2xl bg-white p-8 text-center shadow-lg sm:p-12">
				<div
					class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10"
				>
					<svg class="h-8 w-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
						/>
					</svg>
				</div>
				<h2 class="mb-2 text-xl font-semibold text-text-primary">Where is my Order ID?</h2>
				<p class="mb-4 text-text-secondary">
					Your order ID was included in your order confirmation email. It typically looks like a
					long alphanumeric string.
				</p>
				<p class="text-text-secondary">
					Lost your confirmation email? Please
					<a href="/contact" class="text-accent hover:underline">contact us</a>
					and we will help you find it.
				</p>
			</div>
		{/if}
	</div>
</div>
