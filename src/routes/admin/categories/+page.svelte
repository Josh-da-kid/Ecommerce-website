<script lang="ts">
	import { onMount } from 'svelte';
	import { categories, fetchCategories } from '$lib/stores/products';
	import { pb, type Category } from '$lib/pocketbase';
	import { slugify } from '$lib/utils/index';
	import { Button, Input, Modal } from '$lib/components/ui';
	import { toasts } from '$lib/stores/toast';

	let searchQuery = $state('');
	let showModal = $state(false);
	let editingCategory = $state<Category | null>(null);
	let saving = $state(false);
	let loading = $state(true);
	let categoryList = $state<Category[]>([]);
	let submitted = $state(false);

	let form = $state({
		name: '',
		slug: '',
		description: '',
		image: ''
	});

	let errors = $derived({
		name: !form.name.trim() ? 'Category name is required' : ''
	});

	let isValid = $derived(!errors.name);

	let filteredCategories = $derived(
		searchQuery
			? categoryList.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
			: categoryList
	);

	function resetForm() {
		form = {
			name: '',
			slug: '',
			description: '',
			image: ''
		};
		editingCategory = null;
		submitted = false;
	}

	function openAddModal() {
		resetForm();
		showModal = true;
	}

	function openEditModal(category: Category) {
		editingCategory = category;
		form = {
			name: category.name,
			slug: category.slug,
			description: category.description || '',
			image: category.image || ''
		};
		showModal = true;
	}

	function handleNameInput() {
		form.slug = slugify(form.name);
	}

	async function handleSave() {
		submitted = true;
		if (!isValid) return;

		saving = true;
		try {
			const data = {
				name: form.name,
				slug: form.slug,
				description: form.description,
				image: form.image
			};

			if (editingCategory) {
				await pb.collection('estore_categories').update(editingCategory.id, data);
				toasts.show('success', 'Category updated successfully');
			} else {
				await pb.collection('estore_categories').create(data);
				toasts.show('success', 'Category created successfully');
			}

			showModal = false;
			resetForm();
			await fetchCategories();
		} catch (e: any) {
			toasts.show('error', e.message || 'Failed to save category');
		} finally {
			saving = false;
		}
	}

	async function deleteCategory(id: string) {
		if (!confirm('Are you sure you want to delete this category?')) return;
		try {
			await pb.collection('estore_categories').delete(id);
			toasts.show('success', 'Category deleted successfully');
			await fetchCategories();
		} catch (e: any) {
			toasts.show('error', e.message || 'Failed to delete category');
		}
	}

	onMount(() => {
		const unsub = categories.subscribe(($c) => {
			categoryList = $c;
			loading = false;
		});
		fetchCategories();
		return unsub;
	});
</script>

<svelte:head>
	<title>Categories - Admin - Urazbox</title>
</svelte:head>

<div>
	<div class="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
		<div class="relative max-w-md flex-1">
			<input
				type="search"
				placeholder="Search categories..."
				bind:value={searchQuery}
				class="h-12 w-full rounded-xl border border-border bg-white pr-4 pl-12 focus:border-accent focus:outline-none"
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

		<Button variant="primary" onclick={openAddModal}>
			<svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			Add Category
		</Button>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-20">
			<div
				class="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent"
			></div>
		</div>
	{:else if filteredCategories.length === 0}
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
					d="M4 6h16M4 10h16M4 14h16M4 18h16"
				/>
			</svg>
			<h3 class="mb-1 text-lg font-semibold text-text-primary">No categories found</h3>
			<p class="text-text-secondary">
				{searchQuery
					? 'No categories match your search.'
					: 'Add your first category to get started.'}
			</p>
		</div>
	{:else}
		<!-- Mobile Card View -->
		<div class="grid gap-3 md:hidden">
			{#each filteredCategories as category (category.id)}
				<div class="rounded-xl bg-white p-4 shadow-sm">
					<div class="mb-3 flex items-center gap-3">
						{#if category.image}
							<div class="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-bg-secondary">
								<img src={category.image} alt={category.name} class="h-full w-full object-cover" />
							</div>
						{:else}
							<div
								class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-purple-100"
							>
								<svg
									class="h-6 w-6 text-purple-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M4 6h16M4 10h16M4 14h16M4 18h16"
									/>
								</svg>
							</div>
						{/if}
						<div class="min-w-0 flex-1">
							<p class="truncate font-medium text-text-primary">{category.name}</p>
							<p class="truncate text-xs text-text-muted">{category.slug}</p>
						</div>
					</div>
					{#if category.description}
						<p class="mb-3 line-clamp-2 text-sm text-text-secondary">{category.description}</p>
					{:else}
						<p class="mb-3 text-sm text-text-muted">No description</p>
					{/if}
					<div class="flex items-center justify-end gap-2 border-t border-border pt-3">
						<button
							class="rounded-lg p-2 transition-colors hover:bg-bg-secondary"
							onclick={() => openEditModal(category)}
						>
							<svg
								class="h-5 w-5 text-text-muted"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
								/>
							</svg>
						</button>
						<button
							class="rounded-lg p-2 transition-colors hover:bg-red-50"
							onclick={() => deleteCategory(category.id)}
						>
							<svg
								class="h-5 w-5 text-red-500"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
								/>
							</svg>
						</button>
					</div>
				</div>
			{/each}
		</div>

		<!-- Desktop Table View -->
		<div class="hidden overflow-hidden rounded-2xl bg-white shadow-sm md:block">
			<div class="custom-scrollbar overflow-x-auto pb-2">
				<table class="w-full min-w-[500px]">
					<thead class="bg-bg-secondary">
						<tr>
							<th class="px-6 py-3 text-left text-sm font-semibold text-text-primary">Name</th>
							<th class="px-6 py-3 text-left text-sm font-semibold text-text-primary">Slug</th>
							<th class="px-6 py-3 text-left text-sm font-semibold text-text-primary"
								>Description</th
							>
							<th class="px-6 py-3 text-right text-sm font-semibold text-text-primary">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each filteredCategories as category (category.id)}
							<tr class="hover:bg-bg-secondary/50">
								<td class="px-6 py-4">
									<div class="flex items-center gap-3">
										{#if category.image}
											<div class="h-10 w-10 overflow-hidden rounded-lg bg-bg-secondary">
												<img
													src={category.image}
													alt={category.name}
													class="h-full w-full object-cover"
												/>
											</div>
										{:else}
											<div
												class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100"
											>
												<svg
													class="h-5 w-5 text-purple-600"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M4 6h16M4 10h16M4 14h16M4 18h16"
													/>
												</svg>
											</div>
										{/if}
										<span class="font-medium text-text-primary">{category.name}</span>
									</div>
								</td>
								<td class="px-6 py-4 text-sm text-text-secondary">{category.slug}</td>
								<td class="max-w-xs truncate px-6 py-4 text-sm text-text-secondary">
									{category.description || '-'}
								</td>
								<td class="px-6 py-4">
									<div class="flex items-center justify-end gap-2">
										<button
											class="rounded-lg p-2 transition-colors hover:bg-bg-secondary"
											onclick={() => openEditModal(category)}
										>
											<svg
												class="h-5 w-5 text-text-muted"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
												/>
											</svg>
										</button>
										<button
											class="rounded-lg p-2 transition-colors hover:bg-red-50"
											onclick={() => deleteCategory(category.id)}
										>
											<svg
												class="h-5 w-5 text-red-500"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
												/>
											</svg>
										</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>

<Modal
	bind:open={showModal}
	title={editingCategory ? 'Edit Category' : 'Add Category'}
	onclose={resetForm}
>
	<div class="space-y-4">
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<Input
				label="Category Name"
				placeholder="e.g. Electronics"
				bind:value={form.name}
				oninput={handleNameInput}
				error={submitted ? errors.name : ''}
				required
			/>
			<Input label="Slug" placeholder="auto-generated" bind:value={form.slug} />
		</div>

		<div>
			<label class="mb-2 block text-sm font-medium text-text-primary">Description</label>
			<textarea
				bind:value={form.description}
				placeholder="Category description..."
				rows="3"
				class="w-full resize-none rounded-xl border-2 border-border bg-white px-4 py-3 transition-all duration-300 placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none"
			></textarea>
		</div>

		<Input
			label="Image URL"
			placeholder="https://example.com/category-image.jpg"
			bind:value={form.image}
		/>
	</div>

	<div class="mt-6 flex items-center justify-end gap-3 border-t border-border pt-4">
		<Button
			variant="ghost"
			onclick={() => {
				showModal = false;
				resetForm();
			}}>Cancel</Button
		>
		<Button variant="primary" loading={saving} onclick={handleSave}>
			{saving ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
		</Button>
	</div>
</Modal>
