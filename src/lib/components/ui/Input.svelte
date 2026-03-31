<script lang="ts">
  import { cn } from '$lib/utils';

  interface Props {
    type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'search';
    placeholder?: string;
    value?: string | number;
    name?: string;
    label?: string;
    error?: string;
    disabled?: boolean;
    required?: boolean;
    class?: string;
    oninput?: (e: Event) => void;
    onchange?: (e: Event) => void;
  }

  let {
    type = 'text',
    placeholder = '',
    value = $bindable(''),
    name = '',
    label = '',
    error = '',
    disabled = false,
    required = false,
    class: className = '',
    oninput,
    onchange
  }: Props = $props();
</script>

<div class="w-full {className}">
  {#if label}
    <label class="block text-sm font-medium text-text-primary mb-2">
      {label}
      {#if required}
        <span class="text-error">*</span>
      {/if}
    </label>
  {/if}
  <input
    {type}
    {name}
    {placeholder}
    {disabled}
    {required}
    bind:value
    class={cn(
      'w-full h-14 px-4 bg-white border-2 rounded-xl transition-all duration-300',
      'placeholder:text-text-muted',
      'focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20',
      error ? 'border-error' : 'border-border',
      disabled && 'bg-bg-secondary cursor-not-allowed opacity-50',
      className
    )}
    {oninput}
    {onchange}
  />
  {#if error}
    <p class="mt-1 text-sm text-error">{error}</p>
  {/if}
</div>
