<script lang="ts">
	import { onMount } from 'svelte';
	import { categories, fetchCategories } from '$lib/stores/products';
	import { pb, getImageUrl, type Category } from '$lib/pocketbase';
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

	let newImageFile = $state<File | null>(null);
	let existingImageSrc = $state('');
	let imageUrlInput = $state('');
	let isFetchingUrl = $state(false);

	let form = $state({
		name: '',
		slug: '',
		description: ''
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

	function getCategoryImageSrc(cat: Category): string {
		if (!cat.image) return '';
		if (cat.image.startsWith('http')) return cat.image;
		return getImageUrl('estore_categories', cat.id, cat.image);
	}

	function resetForm() {
		form = {
			name: '',
			slug: '',
			description: ''
		};
		newImageFile = null;
		existingImageSrc = '';
		imageUrlInput = '';
		isFetchingUrl = false;
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
			description: category.description || ''
		};
		existingImageSrc = category.image || '';
		newImageFile = null;
		showModal = true;
	}

	function handleNameInput() {
		form.slug = slugify(form.name);
	}

	function handleImageFileInput(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files && input.files[0]) {
			newImageFile = input.files[0];
			existingImageSrc = '';
		}
		input.value = '';
	}

	function removeImage() {
		newImageFile = null;
		existingImageSrc = '';
	}

	async function addImageUrl() {
		const url = imageUrlInput.trim();
		if (!url) return;

		isFetchingUrl = true;
		try {
			const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
			const res = await fetch(proxyUrl);
			if (!res.ok) {
				let msg = `Failed to fetch image (${res.status})`;
				try {
					const body = await res.json();
					msg = body.message || body.error || msg;
				} catch {}
				toasts.show('error', msg);
				return;
			}

			const blob = await res.blob();
			if (!blob.type.startsWith('image/')) {
				toasts.show('error', 'URL did not return an image');
				return;
			}

			const ext = blob.type.split('/')[1] || 'jpg';
			const file = new File([blob], `category_${Date.now()}.${ext}`, { type: blob.type });
			newImageFile = file;
			existingImageSrc = '';
			imageUrlInput = '';
			toasts.show('success', 'Image added from URL');
		} catch {
			toasts.show('error', 'Network error reaching the proxy. Try restarting the dev server.');
		} finally {
			isFetchingUrl = false;
		}
	}

	async function handleSave() {
		submitted = true;
		if (!isValid) return;

		saving = true;
		try {
			if (newImageFile) {
				const formData = new FormData();
				formData.append('name', form.name);
				formData.append('slug', form.slug);
				formData.append('description', form.description);
				formData.append('image', newImageFile);

				if (editingCategory) {
					await pb.collection('estore_categories').update(editingCategory.id, formData);
					toasts.show('success', 'Category updated successfully');
				} else {
					await pb.collection('estore_categories').create(formData);
					toasts.show('success', 'Category created successfully');
				}
			} else {
				const data: Record<string, unknown> = {
					name: form.name,
					slug: form.slug,
					description: form.description
				};

				if (!existingImageSrc && editingCategory?.image) {
					data.image = '';
				} else if (existingImageSrc && !existingImageSrc.startsWith('http')) {
					data.image = existingImageSrc;
				}

				if (editingCategory) {
					await pb.collection('estore_categories').update(editingCategory.id, data);
					toasts.show('success', 'Category updated successfully');
				} else {
					await pb.collection('estore_categories').create(data);
					toasts.show('success', 'Category created successfully');
				}
			}

			showModal = false;
			resetForm();
			await fetchCategories();
		} catch (e: any) {
			toasts.show('error', e?.response?.message || e.message || 'Failed to save category');
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
								<img
									src={getCategoryImageSrc(category)}
									alt={category.name}
									class="h-full w-full object-cover"
								/>
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
					<div class="flex items-center justify-start gap-2 border-t border-border pt-3">
						<button
							class="inline-flex items-center gap-1.5 rounded-lg bg-bg-secondary px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-accent hover:text-white"
							onclick={() => openEditModal(category)}
						>
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
								/>
							</svg>
							Edit
						</button>
						<button
							class="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-600 hover:text-white"
							onclick={() => deleteCategory(category.id)}
						>
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
								/>
							</svg>
							Delete
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
							<th class="px-6 py-3 text-left text-sm font-semibold text-text-primary">Image</th>
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
									{#if category.image}
										<div class="h-10 w-10 overflow-hidden rounded-lg bg-bg-secondary">
											<img
												src={getCategoryImageSrc(category)}
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
								</td>
								<td class="px-6 py-4">
									<span class="font-medium text-text-primary">{category.name}</span>
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

		<div>
			<label class="mb-2 block text-sm font-medium text-text-primary"> Category Image </label>

			{#if newImageFile}
				<div class="relative mb-3 inline-block">
					<div class="h-32 w-32 overflow-hidden rounded-lg border border-accent/40">
						<img
							src={URL.createObjectURL(newImageFile)}
							alt="New image preview"
							class="h-full w-full object-cover"
						/>
					</div>
					<button
						type="button"
						class="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-error text-xs text-white shadow"
						onclick={removeImage}
					>
						&times;
					</button>
				</div>
			{:else if existingImageSrc}
				<div class="relative mb-3 inline-block">
					<div class="h-32 w-32 overflow-hidden rounded-lg border border-border">
						<img
							src={editingCategory ? getCategoryImageSrc(editingCategory) : existingImageSrc}
							alt="Current image"
							class="h-full w-full object-cover"
						/>
					</div>
					<button
						type="button"
						class="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-error text-xs text-white shadow"
						onclick={removeImage}
					>
						&times;
					</button>
				</div>
			{:else}
				<label
					class="mb-3 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-6 transition-colors hover:border-accent hover:bg-accent/5"
				>
					<svg
						class="mb-2 h-8 w-8 text-text-muted"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
						/>
					</svg>
					<span class="text-sm text-text-secondary">Click to upload image</span>
					<span class="mt-1 text-xs text-text-muted">PNG, JPG up to 10MB</span>
					<input type="file" accept="image/*" class="hidden" onchange={handleImageFileInput} />
				</label>
			{/if}

			{#if newImageFile || existingImageSrc}
				<label
					class="flex cursor-pointer items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:border-accent hover:bg-accent/5"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
						/>
					</svg>
					Replace image
					<input type="file" accept="image/*" class="hidden" onchange={handleImageFileInput} />
				</label>
			{/if}

			<div class="mt-3 flex flex-col gap-2 sm:flex-row">
				<input
					type="url"
					placeholder="Or paste an image URL..."
					bind:value={imageUrlInput}
					disabled={isFetchingUrl}
					class="h-10 w-full rounded-xl border border-border px-3 text-sm focus:border-accent focus:outline-none disabled:opacity-50 sm:h-12 sm:px-4"
					onkeydown={(e) => {
						if (e.key === 'Enter') {
							e.preventDefault();
							addImageUrl();
						}
					}}
				/>
				<Button variant="secondary" onclick={addImageUrl} disabled={isFetchingUrl} class="shrink-0">
					{isFetchingUrl ? 'Fetching...' : 'Add URL'}
				</Button>
			</div>
		</div>
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
