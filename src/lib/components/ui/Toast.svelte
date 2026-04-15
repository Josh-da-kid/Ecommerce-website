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

<div class="fixed right-6 bottom-6 z-50 flex flex-col gap-3">
	{#each $toasts as toast (toast.id)}
		<div
			class="flex min-w-[300px] items-center gap-3 rounded-xl px-4 py-3 text-white shadow-lg {typeStyles[
				toast.type
			]}"
			transition:slide={{ axis: 'x', duration: 300 }}
		>
			<p class="flex-1">{toast.message}</p>
			<button
				class="rounded-lg p-1 transition-colors hover:bg-white/20"
				onclick={() => toasts.dismiss(toast.id)}
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		</div>
	{/each}
</div>
