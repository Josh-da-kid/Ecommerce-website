<script lang="ts">
  import { products } from '$lib/stores/products';
  import { Button, Input, Badge } from '$lib/components/ui';
  import { formatPrice } from '$lib/utils/index';
  import { getProductImage } from '$lib/stores/products';
  import { toasts } from '$lib/stores/toast';

  let searchQuery = $state('');
  let showAddModal = $state(false);

  let filteredProducts = $derived(
    searchQuery 
      ? $products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      : $products
  );

  function deleteProduct(id: string) {
    if (confirm('Are you sure you want to delete this product?')) {
      products.update(p => p.filter(prod => prod.id !== id));
      toasts.show('success', 'Product deleted');
    }
  }
</script>

<svelte:head>
  <title>Products - Admin - Luxe Store</title>
</svelte:head>

<div>
  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
    <div class="relative flex-1 max-w-md">
      <input
        type="search"
        placeholder="Search products..."
        bind:value={searchQuery}
        class="w-full h-12 pl-12 pr-4 rounded-xl border border-border bg-white focus:outline-none focus:border-accent"
      />
      <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
    
    <Button variant="primary" onclick={() => showAddModal = true}>
      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      Add Product
    </Button>
  </div>

  <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-bg-secondary">
          <tr>
            <th class="px-6 py-3 text-left text-sm font-semibold text-text-primary">Product</th>
            <th class="px-6 py-3 text-left text-sm font-semibold text-text-primary">SKU</th>
            <th class="px-6 py-3 text-left text-sm font-semibold text-text-primary">Price</th>
            <th class="px-6 py-3 text-left text-sm font-semibold text-text-primary">Stock</th>
            <th class="px-6 py-3 text-left text-sm font-semibold text-text-primary">Status</th>
            <th class="px-6 py-3 text-right text-sm font-semibold text-text-primary">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          {#each filteredProducts as product}
            <tr class="hover:bg-bg-secondary/50">
              <td class="px-6 py-4">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-lg overflow-hidden bg-bg-secondary">
                    <img src={getProductImage(product)} alt="" class="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p class="font-medium text-text-primary">{product.name}</p>
                    <p class="text-sm text-text-muted">{product.category}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-text-secondary">{product.sku}</td>
              <td class="px-6 py-4 text-sm font-semibold text-accent">{formatPrice(product.price)}</td>
              <td class="px-6 py-4 text-sm text-text-primary">{product.stock}</td>
              <td class="px-6 py-4">
                <Badge variant={product.stock > 0 ? 'success' : 'error'}>
                  {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                </Badge>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center justify-end gap-2">
                  <button class="p-2 hover:bg-bg-secondary rounded-lg transition-colors">
                    <svg class="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button 
                    class="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    onclick={() => deleteProduct(product.id)}
                  >
                    <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>
