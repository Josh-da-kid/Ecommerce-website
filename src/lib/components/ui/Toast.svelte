<script lang="ts">
  import { slide } from 'svelte/transition';
  import { toasts } from '$lib/stores/toast';

  const typeStyles = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-500'
  };
</script>

<div class="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
  {#each $toasts as toast (toast.id)}
    <div
      class="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white min-w-[300px] {typeStyles[toast.type]}"
      transition:slide={{ axis: 'x', duration: 300 }}
    >
      <p class="flex-1">{toast.message}</p>
      <button
        class="p-1 hover:bg-white/20 rounded-lg transition-colors"
        onclick={() => toasts.dismiss(toast.id)}
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  {/each}
</div>
