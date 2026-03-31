<script lang="ts">
  import type { Product } from '$lib/pocketbase';
  import { formatPrice } from '$lib/utils';
  import { cart, wishlist } from '$lib/stores';
  import { toasts } from '$lib/stores/toast';
  import Badge from '$lib/components/ui/Badge.svelte';
  import { getProductImage } from '$lib/stores/products';

  interface Props {
    product: Product;
  }

  let { product }: Props = $props();

  let isAddingToCart = $state(false);
  let wishlistValue = $state<string[]>([]);

  wishlist.subscribe(v => wishlistValue = v);

  function handleAddToCart() {
    isAddingToCart = true;
    cart.addItem(product, 1);
    toasts.show('success', `${product.name} added to cart`);
    setTimeout(() => isAddingToCart = false, 500);
  }

  function toggleWishlist() {
    wishlist.toggle(product.id);
    const isInWishlist = wishlistValue.includes(product.id);
    toasts.show('info', isInWishlist ? 'Removed from wishlist' : 'Added to wishlist');
  }

  let isInWishlist = $derived(wishlistValue.includes(product.id));
  let hasDiscount = $derived(product.comparePrice && product.comparePrice > product.price);
  let discountPercent = $derived(hasDiscount 
    ? Math.round(((product.comparePrice! - product.price) / product.comparePrice!) * 100)
    : 0);
  let isLowStock = $derived(product.stock <= 10 && product.stock > 0);
</script>

<div class="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
  <a href="/products/{product.id}" class="block">
    <div class="relative aspect-[4/5] overflow-hidden bg-bg-secondary">
      <img
        src={getProductImage(product)}
        alt={product.name}
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />
      
      {#if hasDiscount}
        <Badge variant="error" class="absolute top-4 left-4">
          -{discountPercent}%
        </Badge>
      {/if}

      {#if product.featured}
        <Badge variant="info" class="absolute top-4 right-4">
          Featured
        </Badge>
      {/if}

      {#if isLowStock}
        <Badge variant="warning" class="absolute bottom-4 left-4">
          Only {product.stock} left
        </Badge>
      {/if}

      <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
        <button
          class="translate-y-4 group-hover:translate-y-0 transition-transform duration-300 bg-white text-primary px-6 py-3 rounded-xl font-medium hover:bg-accent hover:text-white"
          onclick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddToCart(); }}
        >
          {isAddingToCart ? 'Added!' : 'Add to Cart'}
        </button>
      </div>
    </div>
  </a>

  <button
    class="absolute top-4 right-4 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 z-10"
    onclick={(e) => { e.preventDefault(); toggleWishlist(); }}
  >
    <svg 
      class="w-5 h-5 transition-colors {isInWishlist ? 'text-red-500 fill-red-500' : 'text-gray-400'}" 
      fill={isInWishlist ? 'currentColor' : 'none'} 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  </button>

  <div class="p-5">
    <a href="/products/{product.id}" class="block">
      <h3 class="font-semibold text-lg text-text-primary mb-2 hover:text-accent transition-colors line-clamp-1">
        {product.name}
      </h3>
      <div class="flex items-center gap-3">
        <span class="text-xl font-bold text-accent">
          {formatPrice(product.price)}
        </span>
        {#if hasDiscount}
          <span class="text-sm text-text-muted line-through">
            {formatPrice(product.comparePrice!)}
          </span>
        {/if}
      </div>
    </a>
  </div>
</div>
