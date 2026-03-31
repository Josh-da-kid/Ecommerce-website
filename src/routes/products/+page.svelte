<script lang="ts">
  import { page } from '$app/stores';
  import { ProductCard } from '$lib/components/product';
  import { Button, Input } from '$lib/components/ui';
  import { 
    filteredProducts, 
    categories, 
    searchQuery, 
    selectedCategory, 
    sortBy,
    isLoading 
  } from '$lib/stores/products';
  import { debounce } from '$lib/utils';

  let searchValue = $state('');
  let showFilters = $state(false);

  const handleSearch = debounce((value: string) => {
    searchQuery.set(value);
  }, 300);

  function handleSearchInput(e: Event) {
    const target = e.target as HTMLInputElement;
    searchValue = target.value;
    handleSearch(searchValue);
  }

  function selectCategory(categoryId: string | null) {
    selectedCategory.set(categoryId);
  }
</script>

<svelte:head>
  <title>Shop - Luxe Store</title>
</svelte:head>

<div class="min-h-screen bg-bg-primary pt-24 pb-16">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="mb-12">
      <h1 class="text-4xl md:text-5xl font-bold font-[var(--font-playfair)] text-text-primary mb-4">
        Shop All
      </h1>
      <p class="text-xl text-text-secondary">
        Browse our complete collection of premium products
      </p>
    </div>

    <div class="flex flex-col lg:flex-row gap-8">
      <aside class="lg:w-64 flex-shrink-0">
        <div class="lg:hidden mb-6">
          <Button onclick={() => showFilters = !showFilters} variant="secondary" class="w-full">
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </div>
        
        <div class="space-y-8 {showFilters ? 'block' : 'hidden lg:block'}">
          <div>
            <h3 class="font-semibold text-text-primary mb-4">Search</h3>
            <div class="relative">
              <input
                type="search"
                placeholder="Search products..."
                value={searchValue}
                oninput={handleSearchInput}
                class="w-full h-12 pl-12 pr-4 rounded-xl border border-border bg-white focus:outline-none focus:border-accent"
              />
              <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div>
            <h3 class="font-semibold text-text-primary mb-4">Categories</h3>
            <div class="space-y-2">
              <button
                class="w-full text-left px-4 py-2 rounded-lg transition-colors {!$selectedCategory ? 'bg-accent text-white' : 'hover:bg-bg-secondary'}"
                onclick={() => selectCategory(null)}
              >
                All Products
              </button>
              {#each $categories as category}
                <button
                  class="w-full text-left px-4 py-2 rounded-lg transition-colors {$selectedCategory === category.id ? 'bg-accent text-white' : 'hover:bg-bg-secondary'}"
                  onclick={() => selectCategory(category.id)}
                >
                  {category.name}
                </button>
              {/each}
            </div>
          </div>

          <div>
            <h3 class="font-semibold text-text-primary mb-4">Sort By</h3>
            <select
              value={$sortBy}
              onchange={(e) => sortBy.set(e.currentTarget.value as any)}
              class="w-full h-12 px-4 rounded-xl border border-border bg-white focus:outline-none focus:border-accent"
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>
      </aside>

      <div class="flex-1">
        {#if $isLoading}
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {#each Array(6) as _}
              <div class="bg-white rounded-2xl overflow-hidden animate-pulse">
                <div class="aspect-[4/5] bg-gray-200"></div>
                <div class="p-5 space-y-3">
                  <div class="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div class="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            {/each}
          </div>
        {:else if $filteredProducts.length === 0}
          <div class="text-center py-16">
            <svg class="w-24 h-24 mx-auto text-text-muted mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 class="text-xl font-semibold text-text-primary mb-2">No products found</h3>
            <p class="text-text-secondary">Try adjusting your search or filter criteria</p>
          </div>
        {:else}
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {#each $filteredProducts as product, i}
              <div 
                class="opacity-0 animate-fade-up"
                style="animation-delay: {i * 50}ms; animation-fill-mode: forwards;"
              >
                <ProductCard {product} />
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
