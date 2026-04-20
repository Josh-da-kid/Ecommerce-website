<script lang="ts">
	import { page } from '$app/stores';
	import { ProductCard } from '$lib/components/product';
	import { Button, Input } from '$lib/components/ui';
	import {
		filteredProducts,
		categories,
		searchQuery,
		selectedCategory,
		sortBy,
		isLoading
	} from '$lib/stores/products';
	import { debounce } from '$lib/utils';

	let searchValue = $state('');
	let showFilters = $state(false);
	let searchFocused = $state(false);
	let searchInputEl: HTMLInputElement;

	const handleSearch = debounce((value: string) => {
		searchQuery.set(value);
	}, 300);

	function handleSearchInput(e: Event) {
		const target = e.target as HTMLInputElement;
		searchValue = target.value;
		handleSearch(searchValue);
	}

	function selectCategory(categoryId: string | null) {
		selectedCategory.set(categoryId);
	}

	function focusSearchInput() {
		searchFocused = true;
		showFilters = true;
		setTimeout(() => {
			if (searchInputEl) {
				searchInputEl.focus();
				searchInputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}
		}, 100);
	}

	function handleSearchBlur() {
		searchFocused = false;
	}

	$effect(() => {
		const focus = $page.url.searchParams.get('focus');
		if (focus === 'search') {
			focusSearchInput();
		}
	});
</script>

<svelte:head>
	<title>Shop - Urazbox Store</title>
</svelte:head>

<div class="min-h-screen bg-bg-primary pt-24 pb-16">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="mb-12">
			<h1 class="mb-4 text-4xl font-[var(--font-playfair)] font-bold text-text-primary md:text-5xl">
				Shop All
			</h1>
			<p class="text-xl text-text-secondary">Browse our complete collection of premium products</p>
		</div>

		<div class="flex flex-col gap-8 lg:flex-row">
			<aside class="flex-shrink-0 lg:w-64">
				<div class="mb-6 lg:hidden">
					<Button onclick={() => (showFilters = !showFilters)} variant="secondary" class="w-full">
						{showFilters ? 'Hide Filters' : 'Show Filters'}
					</Button>
				</div>

				<div class="space-y-8 {showFilters ? 'block' : 'hidden lg:block'}">
					<div>
						<h3 class="mb-4 font-semibold text-text-primary">Search</h3>
						<div class="relative">
							<input
								bind:this={searchInputEl}
								type="search"
								placeholder="Search products..."
								value={searchValue}
								oninput={handleSearchInput}
								onblur={handleSearchBlur}
								class="h-12 w-full rounded-xl border-2 bg-white pr-4 pl-12 transition-all duration-200 {searchFocused
									? 'scale-105 border-accent ring-2 ring-accent/30'
									: 'border-border hover:border-accent/50 focus:border-accent focus:outline-none'}"
							/>
							<svg
								class="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-text-muted"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
								/>
							</svg>
						</div>
					</div>

					<div>
						<h3 class="mb-4 font-semibold text-text-primary">Categories</h3>
						<div class="space-y-2">
							<button
								class="w-full rounded-lg px-4 py-2 text-left transition-colors {!$selectedCategory
									? 'bg-accent text-white'
									: 'hover:bg-bg-secondary'}"
								onclick={() => selectCategory(null)}
							>
								All Products
							</button>
							{#each $categories as category}
								<button
									class="w-full rounded-lg px-4 py-2 text-left transition-colors {$selectedCategory ===
									category.id
										? 'bg-accent text-white'
										: 'hover:bg-bg-secondary'}"
									onclick={() => selectCategory(category.id)}
								>
									{category.name}
								</button>
							{/each}
						</div>
					</div>

					<div>
						<h3 class="mb-4 font-semibold text-text-primary">Sort By</h3>
						<select
							value={$sortBy}
							onchange={(e) => sortBy.set(e.currentTarget.value as any)}
							class="h-12 w-full rounded-xl border border-border bg-white px-4 focus:border-accent focus:outline-none"
						>
							<option value="newest">Newest</option>
							<option value="price-asc">Price: Low to High</option>
							<option value="price-desc">Price: High to Low</option>
							<option value="popular">Most Popular</option>
						</select>
					</div>
				</div>
			</aside>

			<div class="flex-1">
				{#if $isLoading}
					<div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
						{#each Array(6) as _}
							<div class="animate-pulse overflow-hidden rounded-2xl bg-white">
								<div class="aspect-[4/5] bg-gray-200"></div>
								<div class="space-y-3 p-5">
									<div class="h-6 w-3/4 rounded bg-gray-200"></div>
									<div class="h-6 w-1/2 rounded bg-gray-200"></div>
								</div>
							</div>
						{/each}
					</div>
				{:else if $filteredProducts.length === 0}
					<div class="py-16 text-center">
						<svg
							class="mx-auto mb-6 h-24 w-24 text-text-muted"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1"
								d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<h3 class="mb-2 text-xl font-semibold text-text-primary">No products found</h3>
						<p class="text-text-secondary">Try adjusting your search or filter criteria</p>
					</div>
				{:else}
					<div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
						{#each $filteredProducts as product, i}
							<div
								class="animate-fade-up opacity-0"
								style="animation-delay: {i * 50}ms; animation-fill-mode: forwards;"
							>
								<ProductCard {product} />
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
