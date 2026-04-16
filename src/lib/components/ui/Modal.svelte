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

	let { open = $bindable(false), title = '', size = 'md', onclose, children }: Props = $props();

	const sizeClasses = {
		sm: 'max-w-sm max-h-[90vh]',
		md: 'max-w-lg max-h-[90vh]',
		lg: 'max-w-2xl max-h-[90vh]'
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
			class="relative w-full overflow-hidden rounded-2xl bg-white shadow-2xl {sizeClasses[size]}"
			transition:scale={{ duration: 200, start: 0.95 }}
		>
			{#if title}
				<div class="flex shrink-0 items-center justify-between border-b border-border p-6">
					<h3 class="text-xl font-[var(--font-playfair)] font-semibold text-text-primary">
						{title}
					</h3>
					<button
						class="rounded-lg p-2 transition-colors hover:bg-bg-secondary"
						onclick={() => {
							open = false;
							onclose?.();
						}}
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>
			{/if}

			<div class="max-h-[calc(90vh-80px)] overflow-y-auto p-6">
				{#if children}
					{@render children()}
				{/if}
			</div>
		</div>
	</div>
{/if}
