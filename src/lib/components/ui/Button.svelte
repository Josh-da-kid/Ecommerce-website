<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
		size?: 'sm' | 'md' | 'lg';
		disabled?: boolean;
		loading?: boolean;
		type?: 'button' | 'submit' | 'reset';
		class?: string;
		onclick?: () => void;
		children?: import('svelte').Snippet;
	}

	let {
		variant = 'primary',
		size = 'md',
		disabled = false,
		loading = false,
		type = 'button',
		class: className = '',
		onclick,
		children
	}: Props = $props();
</script>

<button
	{type}
	disabled={disabled || loading}
	class={cn(
		'inline-flex items-center justify-center font-medium transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:outline-none',
		{
			'bg-accent text-white hover:scale-[1.02] hover:bg-accent-hover focus:ring-accent':
				variant === 'primary',
			'border-2 border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary':
				variant === 'secondary',
			'text-text-secondary hover:bg-bg-secondary hover:text-text-primary focus:ring-gray-300':
				variant === 'ghost',
			'bg-error text-white hover:bg-red-600 focus:ring-error': variant === 'danger'
		},
		{
			'rounded-lg px-4 py-2 text-sm': size === 'sm',
			'rounded-xl px-6 py-3 text-base': size === 'md',
			'rounded-xl px-8 py-4 text-lg': size === 'lg'
		},
		(disabled || loading) && 'cursor-not-allowed opacity-50',
		className
	)}
	{onclick}
>
	{#if loading}
		<svg
			class="mr-2 -ml-1 h-4 w-4 animate-spin"
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
		>
			<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
			></circle>
			<path
				class="opacity-75"
				fill="currentColor"
				d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
			></path>
		</svg>
	{/if}
	{#if children}
		{@render children()}
	{/if}
</button>
