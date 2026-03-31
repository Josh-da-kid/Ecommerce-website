<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '$lib/components/ui';
  import { ProductCard } from '$lib/components/product';
  import ParticleBackground from '$lib/components/layout/ParticleBackground.svelte';
  import { featuredProducts, fetchFeaturedProducts } from '$lib/stores/products';
  import { scrollTo } from '$lib/animations/smoothScroll';

  let loaded = $state(false);

  onMount(() => {
    fetchFeaturedProducts();
    setTimeout(() => loaded = true, 100);
  });

  const features = [
    {
      icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
      title: 'Premium Quality',
      description: 'Curated selection of luxury products'
    },
    {
      icon: 'M12 8v13m0-13V6a4 4 0 00-4-4H6.5a2.5 2.5 0 000 5H12m0 0V6a4 4 0 014-4h1.5a2.5 2.5 0 010 5H12',
      title: 'Free Shipping',
      description: 'On all orders over $200'
    },
    {
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      title: 'Secure Payment',
      description: '100% secure checkout process'
    },
    {
      icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
      title: 'Easy Returns',
      description: '30-day hassle-free returns'
    }
  ];
</script>

<svelte:head>
  <title>Luxe Store - Premium E-Commerce</title>
  <meta name="description" content="Elevate your style with our curated collection of premium products." />
</svelte:head>

<section class="relative min-h-screen flex items-center justify-center overflow-hidden bg-bg-dark">
  <ParticleBackground />
  
  <div class="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg-dark/90"></div>
  
  <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">
    <div class="space-y-8 {loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} transition-all duration-1000">
      <h1 class="text-5xl md:text-7xl lg:text-8xl font-bold text-white font-[var(--font-playfair)] leading-tight">
        Elevate Your
        <span class="block text-gradient">Style</span>
      </h1>
      
      <p class="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto">
        Discover curated luxury pieces crafted for those who appreciate exceptional quality and timeless elegance.
      </p>
      
      <div class="flex flex-col sm:flex-row gap-4 justify-center pt-4">
        <a href="/products">
          <Button variant="primary" size="lg">
            Shop Collection
          </Button>
        </a>
        <button onclick={() => scrollTo('#features', 100)}>
          <Button variant="secondary" size="lg" class="!border-white !text-white hover:!bg-white hover:!text-primary">
            Learn More
          </Button>
        </button>
      </div>
    </div>

    <div class="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
      <svg class="w-6 h-6 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    </div>
  </div>
</section>

<section id="features" class="py-24 bg-bg-primary">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {#each features as feature, i}
        <div 
          class="text-center p-8 rounded-2xl hover:bg-white transition-all duration-300 hover:shadow-lg group"
          style="animation-delay: {i * 100}ms"
        >
          <div class="w-16 h-16 mx-auto mb-6 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-colors">
            <svg class="w-8 h-8 text-accent group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={feature.icon} />
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-3 text-text-primary">{feature.title}</h3>
          <p class="text-text-secondary">{feature.description}</p>
        </div>
      {/each}
    </div>
  </div>
</section>

<section class="py-24 bg-bg-secondary">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <h2 class="text-4xl md:text-5xl font-bold font-[var(--font-playfair)] text-text-primary mb-4">
        Featured Collection
      </h2>
      <p class="text-xl text-text-secondary max-w-2xl mx-auto">
        Handpicked pieces that define modern luxury
      </p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      {#each $featuredProducts as product, i}
        <div 
          class="opacity-0 animate-fade-up"
          style="animation-delay: {i * 100}ms; animation-fill-mode: forwards;"
        >
          <ProductCard {product} />
        </div>
      {/each}
    </div>

    <div class="text-center mt-12">
      <a href="/products">
        <Button variant="secondary" size="lg">
          View All Products
        </Button>
      </a>
    </div>
  </div>
</section>

<section class="py-24 bg-primary text-white relative overflow-hidden">
  <div class="absolute inset-0 opacity-10">
    <div class="absolute top-0 left-0 w-96 h-96 bg-accent rounded-full filter blur-3xl"></div>
    <div class="absolute bottom-0 right-0 w-96 h-96 bg-accent rounded-full filter blur-3xl"></div>
  </div>
  
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
      <div>
        <h2 class="text-4xl md:text-5xl font-bold font-[var(--font-playfair)] mb-6">
          Join the Luxe Circle
        </h2>
        <p class="text-xl text-gray-300 mb-8">
          Subscribe to our newsletter for exclusive offers, early access to new collections, and style inspiration.
        </p>
        <form class="flex flex-col sm:flex-row gap-4">
          <input
            type="email"
            placeholder="Enter your email"
            class="flex-1 h-14 px-6 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:outline-none focus:border-accent"
          />
          <Button variant="primary" size="lg">
            Subscribe
          </Button>
        </form>
      </div>
      
      <div class="hidden lg:block">
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-4">
            <div class="h-32 rounded-2xl bg-accent/20"></div>
            <div class="h-48 rounded-2xl bg-white/10"></div>
          </div>
          <div class="space-y-4 pt-8">
            <div class="h-48 rounded-2xl bg-white/10"></div>
            <div class="h-32 rounded-2xl bg-accent/20"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
