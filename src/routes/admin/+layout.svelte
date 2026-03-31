<script lang="ts">
  import { page } from '$app/stores';
  import { isAdmin, logout } from '$lib/stores/auth';
  import { goto } from '$app/navigation';

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { href: '/admin/products', label: 'Products', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { href: '/admin/orders', label: 'Orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { href: '/admin/reviews', label: 'Reviews', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
    { href: '/admin/categories', label: 'Categories', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
    { href: '/admin/settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' }
  ];

  let sidebarOpen = $state(true);

  async function handleLogout() {
    await logout();
    goto('/');
  }
</script>

<div class="min-h-screen bg-bg-secondary flex">
  <aside class="bg-primary text-white w-64 flex-shrink-0 fixed inset-y-0 left-0 z-50 transition-transform duration-300 {sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0">
    <div class="p-6">
      <a href="/admin" class="text-2xl font-bold font-[var(--font-playfair)]">Admin</a>
    </div>
    
    <nav class="mt-6 px-4">
      {#each navItems as item}
        <a
          href={item.href}
          class="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors {$page.url.pathname === item.href ? 'bg-accent text-white' : 'hover:bg-white/10'}"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon} />
          </svg>
          <span>{item.label}</span>
        </a>
      {/each}
    </nav>

    <div class="absolute bottom-6 left-0 right-0 px-4">
      <a
        href="/"
        class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
        <span>Back to Store</span>
      </a>
      
      <button
        class="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors text-left"
        onclick={handleLogout}
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span>Logout</span>
      </button>
    </div>
  </aside>

  <div class="flex-1 lg:ml-64">
    <header class="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
      <button
        class="lg:hidden p-2 hover:bg-bg-secondary rounded-lg"
        onclick={() => sidebarOpen = !sidebarOpen}
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      
      <h1 class="text-xl font-semibold text-text-primary">
        {navItems.find(n => n.href === $page.url.pathname)?.label || 'Admin'}
      </h1>
      
      <div class="flex items-center gap-4">
        <span class="text-sm text-text-secondary">Admin</span>
        <div class="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white font-semibold">
          A
        </div>
      </div>
    </header>

    <main class="p-6">
      {@render children()}
    </main>
  </div>
</div>
