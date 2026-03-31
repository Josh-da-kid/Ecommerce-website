<script lang="ts">
  import { cn } from '$lib/utils';

  interface Props {
    variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
    size?: 'sm' | 'md';
    class?: string;
    children?: import('svelte').Snippet;
  }

  let {
    variant = 'default',
    size = 'md',
    class: className = '',
    children
  }: Props = $props();

  const variantClasses = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-amber-100 text-amber-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    default: 'bg-gray-100 text-gray-800'
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm'
  };
</script>

<span
  class={cn(
    'inline-flex items-center font-medium rounded-full',
    variantClasses[variant],
    sizeClasses[size],
    className
  )}
>
  {#if children}
    {@render children()}
  {/if}
</span>
