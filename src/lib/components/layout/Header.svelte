<script lang="ts">
  import { page } from '$app/stores';
  import { cartCount, wishlistCount, isAuthenticated, isAdmin } from '$lib/stores';
  import Button from '$lib/components/ui/Button.svelte';

  let mobileMenuOpen = $state(false);
  let scrolled = $state(false);

  $effect(() => {
    if (typeof window !== 'undefined') {
      const handleScroll = () => {
        scrolled = window.scrollY > 50;
      };
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  });

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/products', label: 'Shop' },
    { href: '/wishlist', label: 'Wishlist' }
  ];
</script>

<header
  class="fixed top-0 left-0 right-0 z-40 transition-all duration-300 {scrolled ? 'bg-white/90 backdrop-blur-lg shadow-sm py-3' : 'bg-transparent py-5'}"
>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between">
      <a href="/" class="flex items-center gap-2">
        <span class="text-2xl font-bold font-[var(--font-playfair)] text-primary">LUXE</span>
      </a>

      <nav class="hidden md:flex items-center gap-8">
        {#each navLinks as link}
          <a
            href={link.href}
            class="text-sm font-medium transition-colors hover:text-accent {$page.url.pathname === link.href ? 'text-accent' : 'text-text-secondary'}"
          >
            {link.label}
          </a>
        {/each}
      </nav>

      <div class="flex items-center gap-4">
        <a href="/cart" class="relative p-2 rounded-xl hover:bg-bg-secondary transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          {#if $cartCount > 0}
            <span class="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white text-xs rounded-full flex items-center justify-center">
              {$cartCount}
            </span>
          {/if}
        </a>

        <a href="/wishlist" class="relative p-2 rounded-xl hover:bg-bg-secondary transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          {#if $wishlistCount > 0}
            <span class="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white text-xs rounded-full flex items-center justify-center">
              {$wishlistCount}
            </span>
          {/if}
        </a>

        {#if $isAuthenticated}
          {#if $isAdmin}
            <a href="/admin" class="p-2 rounded-xl hover:bg-bg-secondary transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </a>
          {/if}
          <a href="/account" class="p-2 rounded-xl hover:bg-bg-secondary transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </a>
        {:else}
          <a href="/login">
            <Button variant="primary" size="sm">Sign In</Button>
          </a>
        {/if}

        <button
          class="md:hidden p-2 rounded-xl hover:bg-bg-secondary transition-colors"
          onclick={() => mobileMenuOpen = !mobileMenuOpen}
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {#if mobileMenuOpen}
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            {:else}
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            {/if}
          </svg>
        </button>
      </div>
    </div>
  </div>

  {#if mobileMenuOpen}
    <div class="md:hidden absolute top-full left-0 right-0 bg-white shadow-xl p-4">
      <nav class="flex flex-col gap-2">
        {#each navLinks as link}
          <a
            href={link.href}
            class="px-4 py-3 rounded-xl hover:bg-bg-secondary transition-colors"
            onclick={() => mobileMenuOpen = false}
          >
            {link.label}
          </a>
        {/each}
      </nav>
    </div>
  {/if}
</header>
