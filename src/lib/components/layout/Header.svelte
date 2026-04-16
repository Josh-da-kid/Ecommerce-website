<script lang="ts">
	import { page } from '$app/stores';
	import { cartCount, wishlistCount, isAuthenticated, isAdmin } from '$lib/stores';
	import { goto } from '$app/navigation';
	import { fade, fly } from 'svelte/transition';

	let mobileMenuOpen = $state(false);
	let drawerOpen = $state(false);
	let scrolled = $state(false);
	let isHome = $derived($page.url.pathname === '/');

	$effect(() => {
		if (typeof window !== 'undefined') {
			const handleScroll = () => {
				scrolled = window.scrollY > 50;
			};
			handleScroll();
			window.addEventListener('scroll', handleScroll);
			return () => window.removeEventListener('scroll', handleScroll);
		}
	});

	let darkText = $derived(scrolled || !isHome);

	const navLinks = [
		{ href: '/', label: 'Home' },
		{ href: '/products', label: 'Shop' },
		{ href: '/orders', label: 'Orders' },
		{ href: '/orders/history', label: 'Order History' },
		{ href: '/wishlist', label: 'Wishlist' },
		{ href: '/account', label: 'Account' }
	];
</script>

<header
	class="fixed top-0 right-0 left-0 z-40 transition-all duration-300 {darkText
		? 'bg-white/90 py-3 shadow-sm backdrop-blur-lg'
		: 'bg-transparent py-5'}"
>
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="flex items-center justify-between">
			<!-- Contact Us for desktop -->
			<a
				href="/contact"
				class="hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors lg:flex {darkText
					? 'text-text-secondary hover:text-text-primary'
					: 'text-white hover:text-white'}"
			>
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="1.5"
						d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
					/>
				</svg>
				<span class="uppercase">Contact Us</span>
			</a>

			<!-- Logo in center -->
			<a href="/" class="flex items-center gap-2">
				<span
					class="text-2xl font-[var(--font-playfair)] font-bold transition-colors duration-300 {darkText
						? 'text-primary'
						: 'text-white'}">LUXE</span
				>
			</a>

			<!-- Mobile/Tablet icons: search + cart + wishlist + hamburger -->
			<div class="flex items-center gap-1 md:hidden">
				<button
					class="rounded-xl p-2 transition-colors {darkText
						? 'hover:bg-bg-secondary'
						: 'hover:bg-white/10'}"
					onclick={() => goto('/products?focus=search')}
					aria-label="Search products"
				>
					<svg
						class="h-6 w-6 transition-colors duration-300 {darkText
							? 'text-text-primary'
							: 'text-white'}"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
				</button>

				<a
					href="/cart"
					class="relative rounded-xl p-2 transition-colors {darkText
						? 'hover:bg-bg-secondary'
						: 'hover:bg-white/10'}"
				>
					<svg
						class="h-6 w-6 transition-colors duration-300 {darkText
							? 'text-text-primary'
							: 'text-white'}"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
						/>
					</svg>
					{#if $cartCount > 0}
						<span
							class="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs text-white"
							>{$cartCount}</span
						>
					{/if}
				</a>

				<a
					href="/wishlist"
					class="relative rounded-xl p-2 transition-colors {darkText
						? 'hover:bg-bg-secondary'
						: 'hover:bg-white/10'}"
				>
					<svg
						class="h-6 w-6 transition-colors duration-300 {darkText
							? 'text-text-primary'
							: 'text-white'}"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
						/>
					</svg>
					{#if $wishlistCount > 0}
						<span
							class="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs text-white"
							>{$wishlistCount}</span
						>
					{/if}
				</a>

				<button
					class="rounded-xl p-2 transition-colors {darkText
						? 'hover:bg-bg-secondary'
						: 'hover:bg-white/10'}"
					onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
				>
					<svg
						class="h-6 w-6 transition-colors duration-300 {darkText
							? 'text-text-primary'
							: 'text-white'}"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						{#if mobileMenuOpen}
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						{:else}
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 6h16M4 12h16M4 18h16"
							/>
						{/if}
					</svg>
				</button>
			</div>

			<!-- Desktop icons: lg+ (icons only like mobile: search + cart + wishlist + hamburger) -->
			<div class="hidden items-center gap-2 lg:flex">
				<button
					class="rounded-xl p-2 transition-colors {darkText
						? 'hover:bg-bg-secondary'
						: 'hover:bg-white/10'}"
					onclick={() => goto('/products?focus=search')}
					aria-label="Search products"
				>
					<svg
						class="h-6 w-6 transition-colors duration-300 {darkText
							? 'text-text-primary'
							: 'text-white'}"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
				</button>

				<a
					href="/cart"
					class="relative rounded-xl p-2 transition-colors {darkText
						? 'hover:bg-bg-secondary'
						: 'hover:bg-white/10'}"
				>
					<svg
						class="h-6 w-6 transition-colors duration-300 {darkText
							? 'text-text-primary'
							: 'text-white'}"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
						/>
					</svg>
					{#if $cartCount > 0}
						<span
							class="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs text-white"
							>{$cartCount}</span
						>
					{/if}
				</a>

				<a
					href="/wishlist"
					class="relative rounded-xl p-2 transition-colors {darkText
						? 'hover:bg-bg-secondary'
						: 'hover:bg-white/10'}"
				>
					<svg
						class="h-6 w-6 transition-colors duration-300 {darkText
							? 'text-text-primary'
							: 'text-white'}"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
						/>
					</svg>
					{#if $wishlistCount > 0}
						<span
							class="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs text-white"
							>{$wishlistCount}</span
						>
					{/if}
				</a>

				<button
					class="flex items-center gap-2 rounded-xl px-3 py-2 transition-colors {darkText
						? 'hover:bg-bg-secondary'
						: 'hover:bg-white/10'}"
					onclick={() => (drawerOpen = true)}
					aria-label="Open menu"
				>
					<svg
						class="h-6 w-6 transition-colors duration-300 {darkText
							? 'text-text-primary'
							: 'text-white'}"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 6h16M4 12h16M4 18h16"
						/>
					</svg>
					<span
						class="text-sm font-medium uppercase {darkText ? 'text-text-primary' : 'text-white'}"
						>Menu</span
					>
				</button>
			</div>
		</div>
	</div>

	<!-- Mobile hamburger menu with slide animation -->
	{#if mobileMenuOpen}
		<div
			class="absolute top-full right-0 left-0 bg-white p-4 shadow-xl md:hidden"
			transition:fly={{ y: -10, duration: 200 }}
		>
			<nav class="flex flex-col gap-2">
				<a
					href="/contact"
					class="rounded-xl px-4 py-3 text-text-primary transition-colors hover:bg-bg-secondary"
					onclick={() => (mobileMenuOpen = false)}
				>
					Contact Us
				</a>
				{#each navLinks as link}
					<a
						href={link.href}
						class="rounded-xl px-4 py-3 text-text-primary transition-colors hover:bg-bg-secondary"
						onclick={() => (mobileMenuOpen = false)}
					>
						{link.label}
					</a>
				{/each}
				<hr class="my-2 border-border" />
				{#if $isAuthenticated}
					{#if $isAdmin}
						<a
							href="/admin"
							class="rounded-xl px-4 py-3 text-text-primary transition-colors hover:bg-bg-secondary"
							onclick={() => (mobileMenuOpen = false)}
						>
							Admin Dashboard
						</a>
					{/if}
					<a
						href="/account"
						class="rounded-xl px-4 py-3 text-text-primary transition-colors hover:bg-bg-secondary"
						onclick={() => (mobileMenuOpen = false)}
					>
						My Account
					</a>
				{:else}
					<a
						href="/login"
						class="rounded-xl px-4 py-3 text-text-primary transition-colors hover:bg-bg-secondary"
						onclick={() => (mobileMenuOpen = false)}
					>
						Sign In
					</a>
				{/if}
			</nav>
		</div>
	{/if}
</header>

<!-- Desktop right drawer (lg+) with slide animation -->
{#if drawerOpen}
	<!-- Backdrop with blur and fade -->
	<button
		class="fixed inset-0 z-50 cursor-default border-none bg-black/30 backdrop-blur-sm"
		onclick={() => (drawerOpen = false)}
		aria-label="Close menu"
		transition:fade={{ duration: 200 }}
	></button>

	<!-- Right drawer with fly animation -->
	<div
		class="fixed top-0 right-0 z-50 h-full w-80 max-w-full bg-white shadow-2xl"
		role="dialog"
		aria-modal="true"
		aria-label="Navigation menu"
		transition:fly={{ x: 100, duration: 300 }}
	>
		<div class="flex h-full flex-col">
			<!-- Drawer header -->
			<div class="flex items-center justify-between border-b border-border p-4">
				<span class="text-lg font-semibold text-text-primary">Menu</span>
				<button
					class="flex items-center gap-2 rounded-xl px-3 py-2 transition-colors hover:bg-bg-secondary"
					onclick={() => (drawerOpen = false)}
					aria-label="Close menu"
				>
					<svg
						class="h-6 w-6 text-text-primary"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
					<span class="text-sm font-medium text-text-primary uppercase"> Close </span>
				</button>
			</div>

			<!-- Drawer nav links -->
			<nav class="flex-1 overflow-y-auto p-4">
				<div class="flex flex-col gap-2">
					<a
						href="/contact"
						class="rounded-xl px-4 py-3 text-text-primary transition-colors hover:bg-bg-secondary"
						onclick={() => (drawerOpen = false)}
					>
						Contact Us
					</a>
					{#each navLinks as link}
						<a
							href={link.href}
							class="rounded-xl px-4 py-3 text-text-primary transition-colors hover:bg-bg-secondary"
							onclick={() => (drawerOpen = false)}
						>
							{link.label}
						</a>
					{/each}
				</div>

				<hr class="my-4 border-border" />

				{#if $isAuthenticated}
					{#if $isAdmin}
						<a
							href="/admin"
							class="rounded-xl px-4 py-3 text-text-primary transition-colors hover:bg-bg-secondary"
							onclick={() => (drawerOpen = false)}
						>
							Admin Dashboard
						</a>
					{/if}
					<a
						href="/account"
						class="rounded-xl px-4 py-3 text-text-primary transition-colors hover:bg-bg-secondary"
						onclick={() => (drawerOpen = false)}
					>
						My Account
					</a>
				{:else}
					<a
						href="/login"
						class="rounded-xl px-4 py-3 text-text-primary transition-colors hover:bg-bg-secondary"
						onclick={() => (drawerOpen = false)}
					>
						Sign In
					</a>
				{/if}
			</nav>
		</div>
	</div>
{/if}
