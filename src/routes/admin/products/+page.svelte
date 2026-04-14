<script lang="ts">
	import { onMount } from 'svelte';
	import {
		products,
		categories,
		fetchProducts,
		fetchCategories,
		getProductImage
	} from '$lib/stores/products';
	import { pb, parseImages, type Product } from '$lib/pocketbase';
	import { formatPrice, slugify } from '$lib/utils/index';
	import { Button, Input, Modal } from '$lib/components/ui';
	import { toasts } from '$lib/stores/toast';

	let searchQuery = $state('');
	let showModal = $state(false);
	let editingProduct = $state<Product | null>(null);
	let saving = $state(false);
	let loading = $state(true);
	let productList = $state<Product[]>([]);
	let categoryList = $state<{ id: string; name: string }[]>([]);
	let submitted = $state(false);

	let form = $state({
		name: '',
		slug: '',
		description: '',
		price: '',
		comparePrice: '',
		stock: '',
		sku: '',
		featured: false,
		category: '',
		images: ''
	});

	let errors = $derived({
		name: !form.name.trim() ? 'Product name is required' : '',
		price: !form.price || Number(form.price) <= 0 ? 'Valid price is required' : '',
		stock: form.stock === '' || Number(form.stock) < 0 ? 'Valid stock quantity is required' : '',
		category: !form.category ? 'Please select a category' : ''
	});

	let isValid = $derived(!errors.name && !errors.price && !errors.stock && !errors.category);

	let filteredProducts = $derived(
		searchQuery
			? productList.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
			: productList
	);

	function resetForm() {
		form = {
			name: '',
			slug: '',
			description: '',
			price: '',
			comparePrice: '',
			stock: '',
			sku: '',
			featured: false,
			category: '',
			images: ''
		};
		editingProduct = null;
		submitted = false;
	}

	function openAddModal() {
		resetForm();
		showModal = true;
	}

	function openEditModal(product: Product) {
		editingProduct = product;
		form = {
			name: product.name,
			slug: product.slug,
			description: product.description || '',
			price: String(product.price || 0),
			comparePrice: String(product.comparePrice || 0),
			stock: String(product.stock || 0),
			sku: product.sku || '',
			featured: product.featured || false,
			category: product.category || '',
			images: parseImages(product.images).join(', ')
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
			const imagesArray = form.images
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean);

			const data = {
				name: form.name,
				slug: form.slug,
				description: form.description,
				price: Number(form.price),
				comparePrice: Number(form.comparePrice) || 0,
				stock: Number(form.stock),
				sku: form.sku,
				featured: form.featured,
				category: form.category,
				images: imagesArray.join(',')
			};

			if (editingProduct) {
				await pb.collection('estore_products').update(editingProduct.id, data);
				toasts.show('success', 'Product updated successfully');
			} else {
				await pb.collection('estore_products').create(data);
				toasts.show('success', 'Product created successfully');
			}

			showModal = false;
			resetForm();
			await fetchProducts();
		} catch (e: any) {
			toasts.show('error', e?.response?.message || e.message || 'Failed to save product');
		} finally {
			saving = false;
		}
	}

	async function deleteProduct(id: string) {
		if (!confirm('Are you sure you want to delete this product?')) return;
		try {
			await pb.collection('estore_products').delete(id);
			toasts.show('success', 'Product deleted successfully');
			await fetchProducts();
		} catch (e: any) {
			toasts.show('error', e.message || 'Failed to delete product');
		}
	}

	function getCategoryName(categoryId: string): string {
		const cat = categoryList.find((c) => c.id === categoryId);
		return cat?.name || categoryId;
	}

	onMount(() => {
		const unsubProducts = products.subscribe(($p) => {
			productList = [...$p];
			loading = false;
		});
		const unsubCategories = categories.subscribe(($c) => {
			categoryList = [...$c];
		});
		fetchProducts();
		fetchCategories();
		return () => {
			unsubProducts();
			unsubCategories();
		};
	});
</script>

<svelte:head>
	<title>Products - Admin - Luxe Store</title>
</svelte:head>

<div>
	<div class="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
		<div class="relative max-w-md flex-1">
			<input
				type="search"
				placeholder="Search products..."
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
			Add Product
		</Button>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-20">
			<div
				class="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent"
			></div>
		</div>
	{:else if filteredProducts.length === 0}
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
					d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
				/>
			</svg>
			<h3 class="mb-1 text-lg font-semibold text-text-primary">No products found</h3>
			<p class="text-text-secondary">
				{searchQuery ? 'No products match your search.' : 'Add your first product to get started.'}
			</p>
		</div>
	{:else}
		<div class="overflow-hidden rounded-2xl bg-white shadow-sm">
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="bg-bg-secondary">
						<tr>
							<th class="px-6 py-3 text-left text-sm font-semibold text-text-primary">Image</th>
							<th class="px-6 py-3 text-left text-sm font-semibold text-text-primary">Name</th>
							<th class="px-6 py-3 text-left text-sm font-semibold text-text-primary">Category</th>
							<th class="px-6 py-3 text-left text-sm font-semibold text-text-primary">Price</th>
							<th class="px-6 py-3 text-left text-sm font-semibold text-text-primary">Stock</th>
							<th class="px-6 py-3 text-left text-sm font-semibold text-text-primary">Featured</th>
							<th class="px-6 py-3 text-right text-sm font-semibold text-text-primary">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each filteredProducts as product (product.id)}
							<tr class="hover:bg-bg-secondary/50">
								<td class="px-6 py-4">
									<div class="h-12 w-12 overflow-hidden rounded-lg bg-bg-secondary">
										<img
											src={getProductImage(product)}
											alt={product.name}
											class="h-full w-full object-cover"
										/>
									</div>
								</td>
								<td class="px-6 py-4">
									<p class="font-medium text-text-primary">{product.name}</p>
									<p class="text-sm text-text-muted">{product.sku}</p>
								</td>
								<td class="px-6 py-4 text-sm text-text-secondary"
									>{getCategoryName(product.category)}</td
								>
								<td class="px-6 py-4 text-sm font-semibold text-accent"
									>{formatPrice(product.price)}</td
								>
								<td class="px-6 py-4 text-sm text-text-primary">{product.stock}</td>
								<td class="px-6 py-4">
									{#if product.featured}
										<span
											class="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800"
											>Yes</span
										>
									{:else}
										<span
											class="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600"
											>No</span
										>
									{/if}
								</td>
								<td class="px-6 py-4">
									<div class="flex items-center justify-end gap-2">
										<button
											type="button"
											class="rounded-lg p-2 transition-colors hover:bg-bg-secondary"
											onclick={() => openEditModal(product)}
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
											type="button"
											class="rounded-lg p-2 transition-colors hover:bg-red-50"
											onclick={() => deleteProduct(product.id)}
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
	title={editingProduct ? 'Edit Product' : 'Add Product'}
	size="lg"
	onclose={resetForm}
>
	<div class="max-h-[70vh] space-y-4 overflow-y-auto pr-2">
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<Input
				label="Product Name"
				placeholder="e.g. Leather Bag"
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
				placeholder="Product description..."
				rows="3"
				class="w-full resize-none rounded-xl border-2 bg-white px-4 py-3 transition-all duration-300 placeholder:text-text-muted focus:ring-2 focus:ring-accent/20 focus:outline-none {submitted &&
				errors.name
					? ''
					: 'border-border focus:border-accent'}"
			></textarea>
		</div>

		<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
			<Input
				type="number"
				label="Price"
				placeholder="0"
				bind:value={form.price}
				error={submitted ? errors.price : ''}
				required
			/>
			<Input type="number" label="Compare Price" placeholder="0" bind:value={form.comparePrice} />
			<Input
				type="number"
				label="Stock"
				placeholder="0"
				bind:value={form.stock}
				error={submitted ? errors.stock : ''}
				required
			/>
		</div>

		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<Input label="SKU" placeholder="e.g. SKU-001" bind:value={form.sku} />
			<div>
				<label class="mb-2 block text-sm font-medium text-text-primary">
					Category
					<span class="text-error">*</span>
				</label>
				<select
					bind:value={form.category}
					class="h-14 w-full rounded-xl border-2 px-4 transition-all duration-300 focus:ring-2 focus:ring-accent/20 focus:outline-none {submitted &&
					errors.category
						? 'border-error'
						: 'border-border focus:border-accent'}"
				>
					<option value="">Select category</option>
					{#each categoryList as cat (cat.id)}
						<option value={cat.id}>{cat.name}</option>
					{/each}
				</select>
				{#if submitted && errors.category}
					<p class="mt-1 text-sm text-error">{errors.category}</p>
				{/if}
			</div>
		</div>

		<Input
			label="Images (comma-separated URLs)"
			placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
			bind:value={form.images}
		/>

		<div class="flex items-center gap-3">
			<input
				type="checkbox"
				id="featured"
				bind:checked={form.featured}
				class="h-5 w-5 rounded border-border text-accent focus:ring-accent"
			/>
			<label for="featured" class="text-sm font-medium text-text-primary">Featured Product</label>
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
			{saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
		</Button>
	</div>
</Modal>
