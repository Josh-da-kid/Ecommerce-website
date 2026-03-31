<script lang="ts">
  import { cn } from '$lib/utils';
  import { fade, scale } from 'svelte/transition';

  interface Props {
    open?: boolean;
    title?: string;
    size?: 'sm' | 'md' | 'lg';
    onclose?: () => void;
    children?: import('svelte').Snippet;
  }

  let {
    open = $bindable(false),
    title = '',
    size = 'md',
    onclose,
    children
  }: Props = $props();

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl'
  };

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      open = false;
      onclose?.();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      open = false;
      onclose?.();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    transition:fade={{ duration: 200 }}
    onclick={handleBackdropClick}
    role="dialog"
    aria-modal="true"
  >
    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
    
    <div
      class="relative bg-white rounded-2xl shadow-2xl w-full {sizeClasses[size]}"
      transition:scale={{ duration: 200, start: 0.95 }}
    >
      {#if title}
        <div class="flex items-center justify-between p-6 border-b border-border">
          <h3 class="text-xl font-semibold text-text-primary font-[var(--font-playfair)]">{title}</h3>
          <button
            class="p-2 rounded-lg hover:bg-bg-secondary transition-colors"
            onclick={() => { open = false; onclose?.(); }}
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      {/if}
      
      <div class="p-6">
        {#if children}
          {@render children()}
        {/if}
      </div>
    </div>
  </div>
{/if}
