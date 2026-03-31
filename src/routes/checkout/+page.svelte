<script lang="ts">
  import { cart, cartTotal, cartSubtotal, cartSavings } from '$lib/stores';
  import { Button, Input } from '$lib/components/ui';
  import { formatPrice } from '$lib/utils/index';
  import { getProductImage } from '$lib/stores/products';
  import { toasts } from '$lib/stores/toast';

  let step = $state(1);
  let isProcessing = $state(false);

  let contact = $state({ email: '', phone: '' });
  let shipping = $state({ name: '', street: '', city: '', state: '', zip: '', country: '' });
  let payment = $state({ cardNumber: '', expiry: '', cvv: '', nameOnCard: '' });

  function nextStep() {
    if (step < 4) step++;
  }

  function prevStep() {
    if (step > 1) step--;
  }

  async function handleSubmit() {
    isProcessing = true;
    await new Promise(resolve => setTimeout(resolve, 2000));
    cart.clear();
    toasts.show('success', 'Order placed successfully!');
    isProcessing = false;
    window.location.href = '/';
  }

  const steps = [
    { number: 1, label: 'Contact' },
    { number: 2, label: 'Shipping' },
    { number: 3, label: 'Payment' },
    { number: 4, label: 'Review' }
  ];
</script>

<svelte:head>
  <title>Checkout - Luxe Store</title>
</svelte:head>

<div class="min-h-screen bg-bg-primary pt-24 pb-16">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <h1 class="text-4xl font-bold font-[var(--font-playfair)] text-text-primary mb-8">
      Checkout
    </h1>

    <div class="flex items-center justify-center mb-12">
      {#each steps as s, i}
        <div class="flex items-center">
          <div class="flex items-center justify-center w-10 h-10 rounded-full transition-colors {step >= s.number ? 'bg-accent text-white' : 'bg-bg-secondary text-text-muted'}">
            {s.number}
          </div>
          <span class="ml-2 text-sm font-medium {step >= s.number ? 'text-text-primary' : 'text-text-muted'}">{s.label}</span>
        </div>
        {#if i < steps.length - 1}
          <div class="w-16 h-0.5 mx-4 {step > s.number ? 'bg-accent' : 'bg-bg-secondary'}"></div>
        {/if}
      {/each}
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2">
        <div class="bg-white rounded-2xl p-8 shadow-lg">
          {#if step === 1}
            <h2 class="text-2xl font-semibold text-text-primary mb-6">Contact Information</h2>
            <div class="space-y-4">
              <Input
                type="email"
                label="Email"
                bind:value={contact.email}
                placeholder="your@email.com"
                required
              />
              <Input
                type="tel"
                label="Phone"
                bind:value={contact.phone}
                placeholder="+1 (555) 000-0000"
                required
              />
            </div>
          {:else if step === 2}
            <h2 class="text-2xl font-semibold text-text-primary mb-6">Shipping Address</h2>
            <div class="space-y-4">
              <Input
                label="Full Name"
                bind:value={shipping.name}
                placeholder="John Doe"
                required
              />
              <Input
                label="Street Address"
                bind:value={shipping.street}
                placeholder="123 Main St"
                required
              />
              <div class="grid grid-cols-2 gap-4">
                <Input
                  label="City"
                  bind:value={shipping.city}
                  placeholder="New York"
                  required
                />
                <Input
                  label="State"
                  bind:value={shipping.state}
                  placeholder="NY"
                  required
                />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <Input
                  label="ZIP Code"
                  bind:value={shipping.zip}
                  placeholder="10001"
                  required
                />
                <Input
                  label="Country"
                  bind:value={shipping.country}
                  placeholder="United States"
                  required
                />
              </div>
            </div>
          {:else if step === 3}
            <h2 class="text-2xl font-semibold text-text-primary mb-6">Payment Details</h2>
            <div class="space-y-4">
              <Input
                label="Name on Card"
                bind:value={payment.nameOnCard}
                placeholder="John Doe"
                required
              />
              <Input
                label="Card Number"
                bind:value={payment.cardNumber}
                placeholder="4242 4242 4242 4242"
                required
              />
              <div class="grid grid-cols-2 gap-4">
                <Input
                  label="Expiry Date"
                  bind:value={payment.expiry}
                  placeholder="MM/YY"
                  required
                />
                <Input
                  label="CVV"
                  bind:value={payment.cvv}
                  placeholder="123"
                  required
                />
              </div>
            </div>
          {:else}
            <h2 class="text-2xl font-semibold text-text-primary mb-6">Review Your Order</h2>
            
            <div class="space-y-6">
              <div class="p-4 bg-bg-secondary rounded-xl">
                <h3 class="font-semibold mb-2">Contact</h3>
                <p class="text-text-secondary">{contact.email}</p>
                <p class="text-text-secondary">{contact.phone}</p>
              </div>
              
              <div class="p-4 bg-bg-secondary rounded-xl">
                <h3 class="font-semibold mb-2">Shipping Address</h3>
                <p class="text-text-secondary">{shipping.name}</p>
                <p class="text-text-secondary">{shipping.street}</p>
                <p class="text-text-secondary">{shipping.city}, {shipping.state} {shipping.zip}</p>
                <p class="text-text-secondary">{shipping.country}</p>
              </div>
              
              <div class="p-4 bg-bg-secondary rounded-xl">
                <h3 class="font-semibold mb-2">Payment</h3>
                <p class="text-text-secondary">Card ending in {payment.cardNumber.slice(-4)}</p>
              </div>
            </div>
          {/if}

          <div class="flex gap-4 mt-8">
            {#if step > 1}
              <Button variant="secondary" onclick={prevStep}>Back</Button>
            {/if}
            {#if step < 4}
              <Button variant="primary" class="flex-1" onclick={nextStep}>
                Continue
              </Button>
            {:else}
              <Button variant="primary" class="flex-1" loading={isProcessing} onclick={handleSubmit}>
                Place Order
              </Button>
            {/if}
          </div>
        </div>
      </div>

      <div class="lg:col-span-1">
        <div class="bg-white rounded-2xl p-6 shadow-lg sticky top-24">
          <h2 class="text-xl font-semibold text-text-primary mb-6">Order Summary</h2>
          
          <div class="space-y-4 mb-6 max-h-60 overflow-y-auto">
            {#each $cart as item}
              <div class="flex gap-4">
                <div class="w-16 h-16 rounded-lg overflow-hidden bg-bg-secondary flex-shrink-0">
                  <img src={getProductImage(item.product)} alt="" class="w-full h-full object-cover" />
                </div>
                <div class="flex-1">
                  <p class="font-medium text-sm">{item.product.name}</p>
                  <p class="text-text-muted text-sm">Qty: {item.quantity}</p>
                </div>
                <p class="font-semibold">{formatPrice(item.product.price * item.quantity)}</p>
              </div>
            {/each}
          </div>

          <div class="border-t border-border pt-4 space-y-2">
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
            <div class="flex justify-between text-lg font-semibold pt-2 border-t border-border">
              <span>Total</span>
              <span class="text-accent">{formatPrice($cartTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
