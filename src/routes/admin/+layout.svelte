<script lang="ts">
	import { page } from '$app/stores';
	import { isAdmin, isAuthenticated, authInitialized, logout } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';

	let { children } = $props();

	let sidebarOpen = $state(true);
	let loading = $state(true);

	function checkAuth() {
		if (!get(authInitialized)) return false;
		loading = false;
		if (!get(isAuthenticated)) {
			goto('/login');
		} else if (!get(isAdmin)) {
			goto('/');
		}
		return true;
	}

	onMount(() => {
		if (!checkAuth()) {
			const unsub = authInitialized.subscribe(() => {
				checkAuth();
			});
			return unsub;
		}
	});

	const navItems = [
		{
			href: '/admin',
			label: 'Dashboard',
			icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
		},
		{
			href: '/admin/products',
			label: 'Products',
			icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
		},
		{
			href: '/admin/categories',
			label: 'Categories',
			icon: 'M4 6h16M4 10h16M4 14h16M4 18h16'
		},
		{
			href: '/admin/orders',
			label: 'Orders',
			icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'
		},
		{
			href: '/admin/analytics',
			label: 'Analytics',
			icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
		}
	];

	async function handleLogout() {
		await logout();
		goto('/');
	}
</script>

{#if loading}
	<div class="flex min-h-screen items-center justify-center bg-bg-secondary">
		<div class="text-center">
			<div
				class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent"
			></div>
			<p class="text-text-secondary">Verifying access...</p>
		</div>
	</div>
{:else}
	<div class="flex min-h-screen bg-bg-secondary">
		<aside
			class="fixed inset-y-0 left-0 z-50 w-64 flex-shrink-0 bg-primary text-white transition-transform duration-300 {sidebarOpen
				? 'translate-x-0'
				: '-translate-x-full'} lg:translate-x-0"
		>
			<div class="p-6">
				<a href="/admin" class="text-2xl font-[var(--font-playfair)] font-bold">Admin</a>
			</div>

			<nav class="mt-6 px-4">
				{#each navItems as item}
					<a
						href={item.href}
						class="flex items-center gap-3 rounded-xl px-4 py-3 transition-colors {$page.url
							.pathname === item.href
							? 'bg-accent text-white'
							: 'hover:bg-white/10'}"
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon} />
						</svg>
						<span>{item.label}</span>
					</a>
				{/each}
			</nav>

			<div class="absolute right-0 bottom-6 left-0 px-4">
				<a
					href="/"
					class="flex items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-white/10"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
						/>
					</svg>
					<span>Back to Store</span>
				</a>

				<button
					class="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-white/10"
					onclick={handleLogout}
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
						/>
					</svg>
					<span>Logout</span>
				</button>
			</div>
		</aside>

		<div class="flex-1 lg:ml-64">
			<header class="flex items-center justify-between bg-white px-6 py-4 shadow-sm">
				<button
					class="rounded-lg p-2 hover:bg-bg-secondary lg:hidden"
					onclick={() => (sidebarOpen = !sidebarOpen)}
					aria-label="Toggle sidebar"
				>
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 6h16M4 12h16M4 18h16"
						/>
					</svg>
				</button>

				<h1 class="text-xl font-semibold text-text-primary">
					{navItems.find((n) => n.href === $page.url.pathname)?.label || 'Admin'}
				</h1>

				<div class="flex items-center gap-4">
					<span class="text-sm text-text-secondary">Admin</span>
					<div
						class="flex h-10 w-10 items-center justify-center rounded-full bg-accent font-semibold text-white"
					>
						A
					</div>
				</div>
			</header>

			<main class="p-6">
				{@render children()}
			</main>
		</div>
	</div>
{/if}
