<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { Button, Badge } from '$lib/components/ui';
  import { ProductCard } from '$lib/components/product';
  import { cart, wishlist } from '$lib/stores';
  import { toasts } from '$lib/stores/toast';
  import { getProductImage, getMockProductById, products } from '$lib/stores/products';
  import { formatPrice } from '$lib/utils/index';
  import type { Product } from '$lib/pocketbase';

  let product = $state<Product | null>(null);
  let quantity = $state(1);
  let selectedImage = $state(0);
  let isAddingToCart = $state(false);
  let activeTab = $state<'description' | 'reviews' | 'shipping'>('description');

  const productId = $page.params.id;

  onMount(() => {
    const mockProduct = getMockProductById(productId);
    if (mockProduct) {
      product = mockProduct;
    } else {
      products.subscribe(p => {
        const found = p.find(x => x.id === productId);
        if (found) product = found;
      });
    }
  });

  function handleAddToCart() {
    if (!product) return;
    isAddingToCart = true;
    cart.addItem(product, quantity);
    toasts.show('success', `${product.name} added to cart`);
    setTimeout(() => isAddingToCart = false, 500);
  }

  function toggleWishlist() {
    if (!product) return;
    wishlist.toggle(product.id);
    const isInWishlist = $wishlist.includes(product.id);
    toasts.show('info', isInWishlist ? 'Removed from wishlist' : 'Added to wishlist');
  }

  let wishlistValue = $state<string[]>([]);
  wishlist.subscribe(v => wishlistValue = v);

  let productsValue = $state<Product[]>([]);
  products.subscribe(v => productsValue = v);

  let isInWishlist = $derived(product ? wishlistValue.includes(product.id) : false);
  let hasDiscount = $derived(product?.comparePrice && product.comparePrice > product.price);
  let isLowStock = $derived(product ? product.stock <= 10 && product.stock > 0 : false);
  let relatedProducts = $derived(product ? productsValue.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4) : []);
</script>

<svelte:head>
  <title>{product?.name || 'Product'} - Luxe Store</title>
</svelte:head>

{#if product}
  <div class="min-h-screen bg-bg-primary pt-24 pb-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <nav class="flex items-center gap-2 text-sm text-text-secondary mb-8">
        <a href="/" class="hover:text-accent">Home</a>
        <span>/</span>
        <a href="/products" class="hover:text-accent">Products</a>
        <span>/</span>
        <span class="text-text-primary">{product.name}</span>
      </nav>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        <div class="space-y-4">
          <div class="relative aspect-square rounded-2xl overflow-hidden bg-bg-secondary">
            <img
              src={getProductImage(product)}
              alt={product.name}
              class="w-full h-full object-cover"
            />
            {#if hasDiscount}
              <Badge variant="error" class="absolute top-4 left-4">
                Sale
              </Badge>
            {/if}
            {#if isLowStock}
              <Badge variant="warning" class="absolute bottom-4 left-4">
                Only {product.stock} left
              </Badge>
            {/if}
          </div>
          
          {#if product.images && product.images.length > 1}
            <div class="flex gap-4">
              {#each product.images as image, i}
                <button
                  class="w-20 h-20 rounded-xl overflow-hidden border-2 transition-colors {selectedImage === i ? 'border-accent' : 'border-transparent'}"
                  onclick={() => selectedImage = i}
                >
                  <img src={image} alt="" class="w-full h-full object-cover" />
                </button>
              {/each}
            </div>
          {/if}
        </div>

        <div>
          <h1 class="text-4xl font-bold font-[var(--font-playfair)] text-text-primary mb-4">
            {product.name}
          </h1>
          
          <div class="flex items-center gap-4 mb-6">
            <span class="text-3xl font-bold text-accent">
              {formatPrice(product.price)}
            </span>
            {#if hasDiscount}
              <span class="text-xl text-text-muted line-through">
                {formatPrice(product.comparePrice!)}
              </span>
            {/if}
          </div>

          <p class="text-text-secondary mb-8">
            {product.description}
          </p>

          <div class="flex items-center gap-4 mb-8">
            <div class="flex items-center border border-border rounded-xl">
              <button
                class="w-12 h-12 flex items-center justify-center hover:bg-bg-secondary transition-colors"
                onclick={() => quantity = Math.max(1, quantity - 1)}
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                </svg>
              </button>
              <span class="w-12 text-center font-medium">{quantity}</span>
              <button
                class="w-12 h-12 flex items-center justify-center hover:bg-bg-secondary transition-colors"
                onclick={() => quantity++}
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            <button
              class="p-3 rounded-xl border border-border hover:bg-bg-secondary transition-colors"
              onclick={toggleWishlist}
            >
              <svg 
                class="w-6 h-6 transition-colors {isInWishlist ? 'text-red-500 fill-red-500' : 'text-text-secondary'}" 
                fill={isInWishlist ? 'currentColor' : 'none'} 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>

          <Button 
            variant="primary" 
            size="lg" 
            class="w-full mb-4"
            loading={isAddingToCart}
            onclick={handleAddToCart}
          >
            {isAddingToCart ? 'Added!' : 'Add to Cart'}
          </Button>

          <div class="flex items-center gap-6 text-sm text-text-secondary">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <span>Free shipping on orders over $200</span>
            </div>
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>30-day returns</span>
            </div>
          </div>
        </div>
      </div>

      <div class="mb-16">
        <div class="flex gap-8 border-b border-border mb-8">
          <button
            class="pb-4 font-medium transition-colors border-b-2 {activeTab === 'description' ? 'border-accent text-accent' : 'border-transparent'}"
            onclick={() => activeTab = 'description'}
          >
            Description
          </button>
          <button
            class="pb-4 font-medium transition-colors border-b-2 {activeTab === 'reviews' ? 'border-accent text-accent' : 'border-transparent'}"
            onclick={() => activeTab = 'reviews'}
          >
            Reviews
          </button>
          <button
            class="pb-4 font-medium transition-colors border-b-2 {activeTab === 'shipping' ? 'border-accent text-accent' : 'border-transparent'}"
            onclick={() => activeTab = 'shipping'}
          >
            Shipping
          </button>
        </div>

        {#if activeTab === 'description'}
          <div class="prose max-w-none">
            <p class="text-text-secondary leading-relaxed">{product.description}</p>
          </div>
        {:else if activeTab === 'reviews'}
          <div class="text-center py-12">
            <svg class="w-16 h-16 mx-auto text-text-muted mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <p class="text-text-secondary">No reviews yet. Be the first to review this product!</p>
          </div>
        {:else}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="bg-white p-6 rounded-2xl">
              <h3 class="font-semibold mb-4">Standard Shipping</h3>
              <p class="text-text-secondary">5-7 business days</p>
              <p class="text-text-secondary">Free on orders over $200</p>
            </div>
            <div class="bg-white p-6 rounded-2xl">
              <h3 class="font-semibold mb-4">Express Shipping</h3>
              <p class="text-text-secondary">2-3 business days</p>
              <p class="text-text-secondary">$15.00</p>
            </div>
          </div>
        {/if}
      </div>

      {#if relatedProducts.length > 0}
        <div>
          <h2 class="text-3xl font-bold font-[var(--font-playfair)] text-text-primary mb-8">
            You May Also Like
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {#each relatedProducts as relatedProduct}
              <ProductCard product={relatedProduct} />
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>
{:else}
  <div class="min-h-screen bg-bg-primary pt-24 flex items-center justify-center">
    <div class="text-center">
      <div class="animate-spin w-12 h-12 border-4 border-accent border-t-transparent rounded-full mx-auto mb-4"></div>
      <p class="text-text-secondary">Loading product...</p>
    </div>
  </div>
{/if}
