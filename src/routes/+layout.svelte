<script lang="ts">
  import './layout.css';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { initSmoothScroll } from '$lib/animations/smoothScroll';
  import { initAuth } from '$lib/stores/auth';
  import { fetchProducts, fetchCategories } from '$lib/stores/products';
  import { Header, Footer } from '$lib/components/layout';
  import Toast from '$lib/components/ui/Toast.svelte';
  import favicon from '$lib/assets/favicon.svg';

  let { children } = $props();

  let isAdminRoute = $derived($page.url.pathname.startsWith('/admin'));

  onMount(() => {
    const cleanup = initSmoothScroll();
    initAuth();
    fetchProducts();
    fetchCategories();
    
    return () => cleanup?.();
  });
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

<Toast />

{#if !isAdminRoute}
  <Header />
{/if}

<main class:pt-0={isAdminRoute}>
  {@render children()}
</main>

{#if !isAdminRoute}
  <Footer />
{/if}

<style>
  main {
    min-height: 100vh;
  }
</style>
