<script lang="ts">
  import { cn } from '$lib/utils';

  interface Props {
    class?: string;
    hover?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    children?: import('svelte').Snippet;
  }

  let {
    class: className = '',
    hover = false,
    padding = 'md',
    children
  }: Props = $props();

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };
</script>

<div
  class={cn(
    'bg-white rounded-2xl shadow-lg transition-all duration-300',
    hover && 'hover:shadow-xl hover:-translate-y-1',
    paddingClasses[padding],
    className
  )}
>
  {#if children}
    {@render children()}
  {/if}
</div>
