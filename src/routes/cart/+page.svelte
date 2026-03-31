<script lang="ts">
  import { cart, cartTotal, cartSubtotal, cartSavings } from '$lib/stores';
  import { Button } from '$lib/components/ui';
  import { formatPrice } from '$lib/utils/index';
  import { getProductImage } from '$lib/stores/products';

  let promoCode = $state('');
  let promoApplied = $state(false);

  function handleApplyPromo() {
    if (promoCode.toLowerCase() === 'luxe20') {
      promoApplied = true;
    }
  }

  function removeItem(productId: string) {
    cart.removeItem(productId);
  }

  function updateQuantity(productId: string, delta: number) {
    const item = $cart.find(i => i.product.id === productId);
    if (item) {
      cart.updateQuantity(productId, item.quantity + delta);
    }
  }

  let finalTotal = $derived(promoApplied ? $cartTotal * 0.8 : $cartTotal);
</script>

<svelte:head>
  <title>Cart - Luxe Store</title>
</svelte:head>

<div class="min-h-screen bg-bg-primary pt-24 pb-16">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <h1 class="text-4xl font-bold font-[var(--font-playfair)] text-text-primary mb-8">
      Shopping Cart
    </h1>

    {#if $cart.length === 0}
      <div class="text-center py-16">
        <svg class="w-24 h-24 mx-auto text-text-muted mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        <h2 class="text-2xl font-semibold text-text-primary mb-4">Your cart is empty</h2>
        <p class="text-text-secondary mb-8">Looks like you haven't added any items to your cart yet.</p>
        <a href="/products">
          <Button variant="primary" size="lg">Start Shopping</Button>
        </a>
      </div>
    {:else}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 space-y-6">
          {#each $cart as item (item.product.id)}
            <div class="bg-white rounded-2xl p-6 flex gap-6 shadow-lg">
              <a href="/products/{item.product.id}" class="w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden bg-bg-secondary">
                <img
                  src={getProductImage(item.product)}
                  alt={item.product.name}
                  class="w-full h-full object-cover"
                />
              </a>
              
              <div class="flex-1">
                <div class="flex justify-between items-start mb-2">
                  <a href="/products/{item.product.id}" class="font-semibold text-lg text-text-primary hover:text-accent">
                    {item.product.name}
                  </a>
                  <button
                    class="p-2 hover:bg-bg-secondary rounded-lg transition-colors"
                    onclick={() => removeItem(item.product.id)}
                  >
                    <svg class="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                
                <div class="flex items-center justify-between mt-4">
                  <div class="flex items-center border border-border rounded-xl">
                    <button
                      class="w-10 h-10 flex items-center justify-center hover:bg-bg-secondary transition-colors"
                      onclick={() => updateQuantity(item.product.id, -1)}
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                      </svg>
                    </button>
                    <span class="w-10 text-center font-medium">{item.quantity}</span>
                    <button
                      class="w-10 h-10 flex items-center justify-center hover:bg-bg-secondary transition-colors"
                      onclick={() => updateQuantity(item.product.id, 1)}
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                  
                  <div class="text-right">
                    <p class="text-xl font-bold text-accent">
                      {formatPrice(item.product.price * item.quantity)}
                    </p>
                    {#if item.product.comparePrice}
                      <p class="text-sm text-text-muted line-through">
                        {formatPrice(item.product.comparePrice * item.quantity)}
                      </p>
                    {/if}
                  </div>
                </div>
              </div>
            </div>
          {/each}
        </div>

        <div class="lg:col-span-1">
          <div class="bg-white rounded-2xl p-6 shadow-lg sticky top-24">
            <h2 class="text-xl font-semibold text-text-primary mb-6">Order Summary</h2>
            
            <div class="space-y-4 mb-6">
              <div class="flex justify-between text-text-secondary">
                <span>Subtotal</span>
                <span>{formatPrice($cartSubtotal)}</span>
              </div>
              {#if $cartSavings > 0}
                <div class="flex justify-between text-success">
                  <span>Savings</span>
                  <span>-{formatPrice($cartSavings)}</span>
                </div>
              {/if}
              <div class="flex justify-between text-text-secondary">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
            </div>

            <div class="border-t border-border pt-4 mb-6">
              <div class="flex gap-2 mb-2">
                <input
                  type="text"
                  bind:value={promoCode}
                  placeholder="Promo code"
                  class="flex-1 h-12 px-4 rounded-xl border border-border focus:outline-none focus:border-accent"
                />
                <Button variant="secondary" size="md" onclick={handleApplyPromo}>
                  Apply
                </Button>
              </div>
              {#if promoApplied}
                <p class="text-sm text-success">20% discount applied!</p>
              {/if}
            </div>

            <div class="border-t border-border pt-4 mb-6">
              <div class="flex justify-between items-center">
                <span class="text-lg font-semibold">Total</span>
                <span class="text-2xl font-bold text-accent">
                  {formatPrice(finalTotal)}
                </span>
              </div>
            </div>

            <a href="/checkout" class="block">
              <Button variant="primary" size="lg" class="w-full">
                Proceed to Checkout
              </Button>
            </a>

            <a href="/products" class="block mt-4 text-center text-text-secondary hover:text-accent transition-colors">
              Continue Shopping
            </a>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
