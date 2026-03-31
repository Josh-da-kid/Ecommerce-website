<script lang="ts">
  import { wishlist } from '$lib/stores';
  import { products } from '$lib/stores/products';
  import { ProductCard } from '$lib/components/product';
  import { Button } from '$lib/components/ui';
  import type { Product } from '$lib/pocketbase';

  let wishlistValue = $state<string[]>([]);
  wishlist.subscribe(v => wishlistValue = v);

  let productsValue = $state<Product[]>([]);
  products.subscribe(v => productsValue = v);

  let wishlistProducts = $derived(productsValue.filter(p => wishlistValue.includes(p.id)));
</script>

<svelte:head>
  <title>Wishlist - Luxe Store</title>
</svelte:head>

<div class="min-h-screen bg-bg-primary pt-24 pb-16">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <h1 class="text-4xl font-bold font-[var(--font-playfair)] text-text-primary mb-8">
      My Wishlist
    </h1>

    {#if wishlistProducts.length === 0}
      <div class="text-center py-16">
        <svg class="w-24 h-24 mx-auto text-text-muted mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        <h2 class="text-2xl font-semibold text-text-primary mb-4">Your wishlist is empty</h2>
        <p class="text-text-secondary mb-8">Save items you love by clicking the heart icon.</p>
        <a href="/products">
          <Button variant="primary" size="lg">Browse Products</Button>
        </a>
      </div>
    {:else}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {#each wishlistProducts as product}
          <ProductCard {product} />
        {/each}
      </div>
    {/if}
  </div>
</div>
