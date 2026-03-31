<script lang="ts">
  import { products, categories } from '$lib/stores/products';
  import { formatPrice } from '$lib/utils/index';

  let totalRevenue = $state(12450);
  let totalOrders = $state(48);
  let totalProducts = $derived($products.length);
  let totalCategories = $derived($categories.length);

  const recentOrders = [
    { id: 'ORD-001', customer: 'John Doe', total: 895, status: 'processing', date: '2024-01-15' },
    { id: 'ORD-002', customer: 'Jane Smith', total: 1295, status: 'shipped', date: '2024-01-14' },
    { id: 'ORD-003', customer: 'Bob Wilson', total: 645, status: 'delivered', date: '2024-01-13' },
    { id: 'ORD-004', customer: 'Alice Brown', total: 495, status: 'pending', date: '2024-01-12' }
  ];

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800'
  };
</script>

<svelte:head>
  <title>Admin Dashboard - Luxe Store</title>
</svelte:head>

<div>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <div class="bg-white rounded-2xl p-6 shadow-sm">
      <div class="flex items-center justify-between mb-4">
        <div class="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
          <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
      <p class="text-text-secondary text-sm">Total Revenue</p>
      <p class="text-2xl font-bold text-text-primary">{formatPrice(totalRevenue)}</p>
    </div>

    <div class="bg-white rounded-2xl p-6 shadow-sm">
      <div class="flex items-center justify-between mb-4">
        <div class="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
          <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
      </div>
      <p class="text-text-secondary text-sm">Total Orders</p>
      <p class="text-2xl font-bold text-text-primary">{totalOrders}</p>
    </div>

    <div class="bg-white rounded-2xl p-6 shadow-sm">
      <div class="flex items-center justify-between mb-4">
        <div class="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
          <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
      </div>
      <p class="text-text-secondary text-sm">Products</p>
      <p class="text-2xl font-bold text-text-primary">{totalProducts}</p>
    </div>

    <div class="bg-white rounded-2xl p-6 shadow-sm">
      <div class="flex items-center justify-between mb-4">
        <div class="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
          <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        </div>
      </div>
      <p class="text-text-secondary text-sm">Categories</p>
      <p class="text-2xl font-bold text-text-primary">{totalCategories}</p>
    </div>
  </div>

  <div class="bg-white rounded-2xl shadow-sm">
    <div class="px-6 py-4 border-b border-border">
      <h2 class="text-xl font-semibold text-text-primary">Recent Orders</h2>
    </div>
    
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-bg-secondary">
          <tr>
            <th class="px-6 py-3 text-left text-sm font-semibold text-text-primary">Order ID</th>
            <th class="px-6 py-3 text-left text-sm font-semibold text-text-primary">Customer</th>
            <th class="px-6 py-3 text-left text-sm font-semibold text-text-primary">Date</th>
            <th class="px-6 py-3 text-left text-sm font-semibold text-text-primary">Total</th>
            <th class="px-6 py-3 text-left text-sm font-semibold text-text-primary">Status</th>
            <th class="px-6 py-3 text-right text-sm font-semibold text-text-primary">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          {#each recentOrders as order}
            <tr class="hover:bg-bg-secondary/50">
              <td class="px-6 py-4 text-sm font-medium text-accent">{order.id}</td>
              <td class="px-6 py-4 text-sm text-text-primary">{order.customer}</td>
              <td class="px-6 py-4 text-sm text-text-secondary">{order.date}</td>
              <td class="px-6 py-4 text-sm font-semibold text-text-primary">{formatPrice(order.total)}</td>
              <td class="px-6 py-4">
                <span class="px-3 py-1 rounded-full text-xs font-medium {statusColors[order.status]}">
                  {order.status}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <button class="text-accent hover:underline text-sm">View</button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>
