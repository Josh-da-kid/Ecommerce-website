<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui';
	import { formatPrice } from '$lib/utils/index';
	import { fetchAllReviews, approveReview, deleteReview } from '$lib/stores/reviews';
	import { toasts } from '$lib/stores/toast';
	import type { Review } from '$lib/pocketbase';

	let reviews = $state<Review[]>([]);
	let loading = $state(true);
	let filter = $state<'all' | 'pending' | 'approved'>('all');

	onMount(async () => {
		reviews = await fetchAllReviews();
		loading = false;
	});

	let filteredReviews = $derived(
		filter === 'all'
			? reviews
			: filter === 'pending'
				? reviews.filter((r) => !r.approved)
				: reviews.filter((r) => r.approved)
	);

	async function handleApprove(reviewId: string) {
		try {
			await approveReview(reviewId);
			reviews = reviews.map((r) => (r.id === reviewId ? { ...r, approved: true } : r));
			toasts.show('success', 'Review approved');
		} catch (_e: unknown) {
			toasts.show('error', 'Failed to approve review');
		}
	}

	async function handleDelete(reviewId: string) {
		if (!confirm('Are you sure you want to delete this review?')) return;
		try {
			await deleteReview(reviewId);
			reviews = reviews.filter((r) => r.id !== reviewId);
			toasts.show('success', 'Review deleted');
		} catch (_e: unknown) {
			toasts.show('error', 'Failed to delete review');
		}
	}
</script>

<svelte:head>
	<title>Reviews - Admin - Urazbox</title>
</svelte:head>

<div>
	<div
		class="mb-6 flex flex-col gap-4 overflow-x-hidden md:flex-row md:items-center md:justify-between"
	>
		<h1 class="text-2xl font-bold text-text-primary md:text-3xl">Reviews</h1>

		<div class="custom-scrollbar grid grid-cols-3 gap-2 overflow-x-auto pb-2 sm:flex sm:gap-2">
			<button
				class="rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:px-4 sm:text-sm {filter ===
				'all'
					? 'bg-accent text-white'
					: 'bg-white text-text-secondary hover:bg-bg-secondary'}"
				onclick={() => (filter = 'all')}
			>
				All ({reviews.length})
			</button>
			<button
				class="rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:px-4 sm:text-sm {filter ===
				'pending'
					? 'bg-amber-500 text-white'
					: 'bg-white text-text-secondary hover:bg-bg-secondary'}"
				onclick={() => (filter = 'pending')}
			>
				Pending ({reviews.filter((r) => !r.approved).length})
			</button>
			<button
				class="rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:px-4 sm:text-sm {filter ===
				'approved'
					? 'bg-green-500 text-white'
					: 'bg-white text-text-secondary hover:bg-bg-secondary'}"
				onclick={() => (filter = 'approved')}
			>
				Approved ({reviews.filter((r) => r.approved).length})
			</button>
		</div>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-20">
			<div
				class="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent"
			></div>
		</div>
	{:else if filteredReviews.length === 0}
		<div class="rounded-2xl bg-white p-12 text-center shadow-sm">
			<svg
				class="mx-auto mb-4 h-16 w-16 text-text-muted"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.5"
					d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
				/>
			</svg>
			<h3 class="mb-1 text-lg font-semibold text-text-primary">No reviews found</h3>
			<p class="text-text-secondary">
				{filter === 'all'
					? 'No reviews yet.'
					: filter === 'pending'
						? 'No pending reviews.'
						: 'No approved reviews yet.'}
			</p>
		</div>
	{:else}
		<div class="space-y-4">
			{#each filteredReviews as review (review.id)}
				<div class="rounded-xl bg-white p-4 shadow-sm sm:p-6">
					<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
						<div class="min-w-0">
							<div class="flex flex-wrap items-center gap-2">
								<span class="font-semibold text-text-primary">
									{review.title}
								</span>
								<span
									class="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
								>
									<svg class="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
										<path
											fill-rule="evenodd"
											d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
											clip-rule="evenodd"
										/>
									</svg>
									Verified Purchase
								</span>
								{#if review.approved}
									<span
										class="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
									>
										Approved
									</span>
								{:else}
									<span
										class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700"
									>
										Pending
									</span>
								{/if}
							</div>
							<p class="text-sm text-text-muted">
								{review.expand?.user?.email || ''}
							</p>

							<div class="mt-2 flex text-amber-400">
								{#each Array(review.rating) as _}
									<span>★</span>
								{/each}
							</div>

							{#if review.comment}
								<p class="mt-2 text-text-secondary">{review.comment}</p>
							{/if}

							<div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-muted">
								<span>
									Product: {review.expand?.product?.name || review.product}
								</span>
								<span>
									{new Date(review.created).toLocaleDateString()}
								</span>
							</div>
						</div>

						<div class="flex flex-shrink-0 gap-2">
							{#if !review.approved}
								<Button variant="primary" size="sm" onclick={() => handleApprove(review.id)}>
									Approve
								</Button>
							{/if}
							<Button
								variant="ghost"
								size="sm"
								class="text-red-500 hover:bg-red-50"
								onclick={() => handleDelete(review.id)}
							>
								Delete
							</Button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
