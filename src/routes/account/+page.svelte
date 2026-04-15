<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { user, isAuthenticated, isAdmin, logout } from '$lib/stores/auth';
	import { browser } from '$app/environment';
	import { pb, type Order } from '$lib/pocketbase';
	import { formatPrice } from '$lib/utils/index';
	import { Button } from '$lib/components/ui';

	let loaded = $state(false);
	let activeTab = $state<'profile' | 'orders' | 'settings'>('profile');
	let orders = $state<Order[]>([]);

	async function fetchOrders() {
		try {
			const stored = browser ? localStorage.getItem('luxe_orders') : null;
			if (stored) {
				const localOrders: Order[] = JSON.parse(stored);
				const localIds = localOrders.map((o) => o.id);
				const records = await pb
					.collection('estore_orders')
					.getFullList<Order>({ sort: '-created' });

				const remoteIds = new Set(records.map((r) => r.id));
				const missing = localOrders.filter((o) => !remoteIds.has(o.id));

				orders = [...records, ...missing].sort(
					(a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
				);
			} else {
				orders = await pb.collection('estore_orders').getFullList<Order>({ sort: '-created' });
			}
		} catch {
			if (browser) {
				try {
					const stored = localStorage.getItem('luxe_orders');
					if (stored) {
						orders = JSON.parse(stored);
					}
				} catch {}
			}
		}
	}

	onMount(() => {
		if (browser && !$isAuthenticated) {
			goto('/login');
		}
		fetchOrders().then(() => {
			loaded = true;
		});

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

	const statusColors: Record<string, string> = {
		pending: 'bg-yellow-100 text-yellow-800',
		processing: 'bg-blue-100 text-blue-800',
		shipped: 'bg-purple-100 text-purple-800',
		delivered: 'bg-green-100 text-green-800',
		cancelled: 'bg-red-100 text-red-800'
	};

	async function handleLogout() {
		await logout();
		goto('/');
	}
</script>

<svelte:head>
	<title>My Account - Luxe Store</title>
</svelte:head>

{#if loaded && $isAuthenticated && $user}
	<div class="min-h-screen bg-bg-primary pt-24 pb-16">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="mb-8 flex items-center justify-between">
				<div>
					<h1 class="text-4xl font-[var(--font-playfair)] font-bold text-text-primary">
						My Account
					</h1>
					<p class="mt-2 text-text-secondary">{$user.email}</p>
				</div>
				<Button variant="secondary" onclick={handleLogout}>Sign Out</Button>
			</div>

			<div class="mb-8 flex gap-1 border-b border-border">
				<button
					class="border-b-2 px-6 pb-4 font-medium transition-colors {activeTab === 'profile'
						? 'border-accent text-accent'
						: 'border-transparent text-text-secondary hover:text-text-primary'}"
					onclick={() => (activeTab = 'profile')}
				>
					Profile
				</button>
				<button
					class="border-b-2 px-6 pb-4 font-medium transition-colors {activeTab === 'orders'
						? 'border-accent text-accent'
						: 'border-transparent text-text-secondary hover:text-text-primary'}"
					onclick={() => (activeTab = 'orders')}
				>
					My Orders
				</button>
				<button
					class="border-b-2 px-6 pb-4 font-medium transition-colors {activeTab === 'settings'
						? 'border-accent text-accent'
						: 'border-transparent text-text-secondary hover:text-text-primary'}"
					onclick={() => (activeTab = 'settings')}
				>
					Settings
				</button>
			</div>

			{#if activeTab === 'profile'}
				<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
					<div class="lg:col-span-1">
						<div class="rounded-2xl bg-white p-8 shadow-sm">
							<div class="flex flex-col items-center text-center">
								<div
									class="flex h-24 w-24 items-center justify-center rounded-full bg-accent text-3xl font-bold text-white"
								>
									{($user.name || $user.email)[0].toUpperCase()}
								</div>
								<h2 class="mt-4 text-xl font-semibold text-text-primary">
									{$user.name || 'User'}
								</h2>
								<p class="text-text-secondary">{$user.email}</p>
								{#if $user.isAdmin}
									<a
										href="/admin"
										class="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm text-white transition-colors hover:bg-primary-light"
									>
										<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
											/>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
											/>
										</svg>
										Admin Dashboard
									</a>
								{/if}
							</div>

							<div class="mt-8 space-y-4 border-t border-border pt-6">
								<div>
									<p class="text-sm text-text-muted">Username</p>
									<p class="font-medium text-text-primary">{$user.username || '-'}</p>
								</div>
								<div>
									<p class="text-sm text-text-muted">Phone</p>
									<p class="font-medium text-text-primary">{$user.phone || 'Not set'}</p>
								</div>
								<div>
									<p class="text-sm text-text-muted">Member since</p>
									<p class="font-medium text-text-primary">
										{new Date($user.created).toLocaleDateString('en-US', {
											year: 'numeric',
											month: 'long',
											day: 'numeric'
										})}
									</p>
								</div>
							</div>
						</div>
					</div>

					<div class="lg:col-span-2">
						<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
							<div class="rounded-2xl bg-white p-6 shadow-sm">
								<div class="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
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
											d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
										/>
									</svg>
								</div>
								<p class="text-sm text-text-secondary">Total Orders</p>
								<p class="text-2xl font-bold text-text-primary">{orders.length}</p>
							</div>

							<div class="rounded-2xl bg-white p-6 shadow-sm">
								<div
									class="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100"
								>
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
								<p class="text-sm text-text-secondary">Total Spent</p>
								<p class="text-2xl font-bold text-text-primary">
									{formatPrice(orders.reduce((s, o) => s + (o.total || 0), 0))}
								</p>
							</div>

							<div class="rounded-2xl bg-white p-6 shadow-sm">
								<div
									class="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100"
								>
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
								<p class="text-sm text-text-secondary">Active Orders</p>
								<p class="text-2xl font-bold text-text-primary">
									{orders.filter((o) => ['pending', 'processing', 'shipped'].includes(o.status))
										.length}
								</p>
							</div>

							<div class="rounded-2xl bg-white p-6 shadow-sm">
								<div
									class="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100"
								>
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
											d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
								</div>
								<p class="text-sm text-text-secondary">Completed</p>
								<p class="text-2xl font-bold text-text-primary">
									{orders.filter((o) => o.status === 'delivered').length}
								</p>
							</div>
						</div>

						<div class="mt-8 rounded-2xl bg-white p-6 shadow-sm">
							<h3 class="mb-4 text-lg font-semibold text-text-primary">Quick Links</h3>
							<div class="grid grid-cols-2 gap-4 sm:grid-cols-4 {$isAdmin ? 'lg:grid-cols-5' : ''}">
								<a
									href="/products"
									class="rounded-xl bg-bg-secondary p-4 text-center transition-colors hover:bg-accent/10"
								>
									<svg
										class="mx-auto mb-2 h-6 w-6 text-accent"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
										/>
									</svg>
									<span class="text-sm font-medium text-text-primary">Shop</span>
								</a>
								<a
									href="/wishlist"
									class="rounded-xl bg-bg-secondary p-4 text-center transition-colors hover:bg-accent/10"
								>
									<svg
										class="mx-auto mb-2 h-6 w-6 text-accent"
										fill="none"
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
									<span class="text-sm font-medium text-text-primary">Wishlist</span>
								</a>
								<a
									href="/orders"
									class="rounded-xl bg-bg-secondary p-4 text-center transition-colors hover:bg-accent/10"
								>
									<svg
										class="mx-auto mb-2 h-6 w-6 text-accent"
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
									<span class="text-sm font-medium text-text-primary">Orders</span>
								</a>
								<a
									href="/cart"
									class="rounded-xl bg-bg-secondary p-4 text-center transition-colors hover:bg-accent/10"
								>
									<svg
										class="mx-auto mb-2 h-6 w-6 text-accent"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
										/>
									</svg>
									<span class="text-sm font-medium text-text-primary">Cart</span>
								</a>
								{#if $isAdmin}
									<a
										href="/admin"
										class="rounded-xl bg-primary/10 p-4 text-center transition-colors hover:bg-primary/20"
									>
										<svg
											class="mx-auto mb-2 h-6 w-6 text-primary"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
											/>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
											/>
										</svg>
										<span class="text-sm font-medium text-primary">Admin</span>
									</a>
								{/if}
							</div>
						</div>
					</div>
				</div>
			{:else if activeTab === 'orders'}
				<div class="space-y-6">
					{#if orders.length === 0}
						<div class="rounded-2xl bg-white py-16 text-center shadow-sm">
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
									d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
								/>
							</svg>
							<h3 class="text-lg font-semibold text-text-primary">No orders yet</h3>
							<p class="mt-1 text-text-secondary">Your order history will appear here.</p>
							<a href="/products" class="mt-4 inline-block">
								<Button variant="primary">Start Shopping</Button>
							</a>
						</div>
					{:else}
						{#each orders as order}
							<div class="rounded-2xl bg-white shadow-sm">
								<div
									class="flex flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-4"
								>
									<div>
										<p class="font-medium text-text-primary">
											Order #{order.id.slice(0, 10)}
										</p>
										<p class="text-sm text-text-secondary">
											{new Date(order.created).toLocaleDateString('en-US', {
												year: 'numeric',
												month: 'short',
												day: 'numeric'
											})}
										</p>
									</div>
									<div class="flex items-center gap-4">
										<span
											class="rounded-full px-3 py-1 text-xs font-medium {statusColors[
												order.status
											] || 'bg-gray-100 text-gray-800'}"
										>
											{order.status}
										</span>
										<span class="text-lg font-bold text-accent">
											{formatPrice(order.total)}
										</span>
									</div>
								</div>
								<div class="divide-y divide-border px-6">
									{#each order.items || [] as item}
										<div class="flex items-center gap-4 py-4">
											<div
												class="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-bg-secondary"
											>
												{#if item.productImage}
													<img
														src={item.productImage}
														alt={item.productName}
														class="h-full w-full object-cover"
													/>
												{/if}
											</div>
											<div class="flex-1">
												<p class="font-medium text-text-primary">
													{item.productName}
												</p>
												<p class="text-sm text-text-secondary">
													Qty: {item.quantity} x {formatPrice(item.price)}
												</p>
											</div>
											<p class="font-semibold text-text-primary">
												{formatPrice(item.price * item.quantity)}
											</p>
										</div>
									{/each}
								</div>
							</div>
						{/each}
					{/if}
				</div>
			{:else}
				<div class="rounded-2xl bg-white p-8 shadow-sm">
					<h2 class="mb-6 text-xl font-semibold text-text-primary">Account Settings</h2>
					<div class="space-y-6">
						<div class="rounded-xl bg-bg-secondary p-6">
							<h3 class="mb-4 font-medium text-text-primary">Account Information</h3>
							<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div>
									<p class="text-sm text-text-muted">Name</p>
									<p class="font-medium text-text-primary">
										{$user.name || 'Not set'}
									</p>
								</div>
								<div>
									<p class="text-sm text-text-muted">Email</p>
									<p class="font-medium text-text-primary">{$user.email}</p>
								</div>
							</div>
						</div>

						<div class="rounded-xl border border-red-200 bg-red-50 p-6">
							<h3 class="mb-2 font-medium text-red-800">Danger Zone</h3>
							<p class="mb-4 text-sm text-red-600">
								Once you sign out, you'll need to log in again to access your account.
							</p>
							<Button variant="danger" onclick={handleLogout}>Sign Out</Button>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
{:else if loaded}
	<div class="flex min-h-screen items-center justify-center bg-bg-primary">
		<div class="text-center">
			<div
				class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent"
			></div>
			<p class="text-text-secondary">Redirecting...</p>
		</div>
	</div>
{/if}
