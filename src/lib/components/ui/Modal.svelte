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
		sm: 'max-w-sm',
		md: 'max-w-lg',
		lg: 'max-w-4xl'
	};

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			open = false;
			onclose?.();
		}
	}

	function closeModal() {
		open = false;
		onclose?.();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		transition:fade={{ duration: 200 }}
	>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="absolute inset-0 bg-black/50 backdrop-blur-sm"
			onclick={closeModal}
			role="button"
			tabindex="-1"
			aria-label="Close modal"
		></div>

		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="relative w-full {sizeClasses[
				size
			]} max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl"
			role="dialog"
			aria-modal="true"
		>
			{#if title}
				<div class="flex shrink-0 items-center justify-between border-b border-border p-4 sm:p-6">
					<h3 class="text-lg font-semibold text-text-primary sm:text-xl">
						{title}
					</h3>
					<button
						class="rounded-lg p-2 transition-colors hover:bg-bg-secondary"
						onclick={closeModal}
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

			<div
				class="custom-scrollbar h-[80vh] overflow-y-auto p-4 sm:h-auto sm:max-h-[calc(90vh-70px)] sm:overflow-y-auto sm:p-6"
				style="-webkit-overflow-scrolling: touch;"
			>
				{#if children}
					{@render children()}
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.custom-scrollbar {
		scrollbar-width: thin;
		scrollbar-color: #888 transparent;
	}
	.custom-scrollbar::-webkit-scrollbar {
		width: 6px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background-color: #888;
		border-radius: 3px;
	}
</style>
