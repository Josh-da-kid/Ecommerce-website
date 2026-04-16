<script lang="ts">
	import { onMount } from 'svelte';
	import {
		products,
		categories,
		fetchProducts,
		fetchCategories,
		getProductImage
	} from '$lib/stores/products';
	import { pb, parseImages, getImageUrl, getProductImages, type Product } from '$lib/pocketbase';
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
		colors: '',
		sizes: ''
	});

	let newImages = $state<File[]>([]);
	let existingFilenames = $state<string[]>([]);
	let imageUrlInput = $state('');
	let isFetchingUrl = $state(false);

	const MAX_IMAGES = 10;

	let totalImageCount = $derived(existingFilenames.length + newImages.length);
	let canAddMore = $derived(totalImageCount < MAX_IMAGES);

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
			colors: '',
			sizes: ''
		};
		newImages = [];
		existingFilenames = [];
		imageUrlInput = '';
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
			colors: Array.isArray(product.colors) ? product.colors.join(', ') : '',
			sizes: Array.isArray(product.sizes) ? product.sizes.join(', ') : ''
		};
		existingFilenames = parseImages(product.images);
		newImages = [];
		showModal = true;
	}

	function handleFileInput(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files) {
			const remaining = MAX_IMAGES - totalImageCount;
			const toAdd = Array.from(input.files).slice(0, remaining);
			newImages = [...newImages, ...toAdd];
			if (Array.from(input.files).length > toAdd.length) {
				toasts.show('warning', `Only ${toAdd.length} image(s) added. Maximum is ${MAX_IMAGES}.`);
			}
		}
		input.value = '';
	}

	function removeNewImage(index: number) {
		newImages = newImages.filter((_, i) => i !== index);
	}

	function removeExistingImage(index: number) {
		existingFilenames = existingFilenames.filter((_, i) => i !== index);
	}

	async function addImageUrl() {
		const url = imageUrlInput.trim();
		if (!url) return;

		if (!canAddMore) {
			toasts.show('error', `Maximum ${MAX_IMAGES} images allowed.`);
			return;
		}

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
				isFetchingUrl = false;
				return;
			}

			const blob = await res.blob();

			if (!blob.type.startsWith('image/')) {
				toasts.show('error', 'URL did not return an image');
				isFetchingUrl = false;
				return;
			}

			const ext = blob.type.split('/')[1] || 'jpg';
			const filename = `image_${Date.now()}.${ext}`;
			const file = new File([blob], filename, { type: blob.type });
			newImages = [...newImages, file];
			imageUrlInput = '';
			toasts.show('success', 'Image added from URL');
		} catch (_e: unknown) {
			toasts.show('error', 'Network error reaching the proxy. Try restarting the dev server.');
		} finally {
			isFetchingUrl = false;
		}
	}

	function handleNameInput() {
		form.slug = slugify(form.name);
	}

	async function handleSave() {
		submitted = true;
		if (!isValid) return;

		saving = true;
		try {
			const colorsArray = form.colors
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean);

			const sizesArray = form.sizes
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean);

			if (editingProduct) {
				const pbFilenames = existingFilenames.filter((f) => !f.startsWith('http'));
				const urlFilenames = existingFilenames.filter((f) => f.startsWith('http'));

				let allNewFiles = [...newImages];

				for (const url of urlFilenames) {
					try {
						const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
						const res = await fetch(proxyUrl);
						if (res.ok) {
							const blob = await res.blob();
							const ext = blob.type.split('/')[1] || 'jpg';
							const file = new File([blob], `image_${Date.now()}.${ext}`, {
								type: blob.type
							});
							allNewFiles.push(file);
						}
					} catch {}
				}

				const originalFilenames = parseImages(editingProduct.images);
				const hasChanges =
					allNewFiles.length > 0 ||
					pbFilenames.length !== originalFilenames.length ||
					pbFilenames.some((f, i) => f !== originalFilenames[i]);

				if (hasChanges) {
					const formData = new FormData();
					formData.append('name', form.name);
					formData.append('slug', form.slug);
					formData.append('description', form.description);
					formData.append('price', String(Number(form.price)));
					formData.append('comparePrice', String(Number(form.comparePrice) || 0));
					formData.append('stock', String(Number(form.stock)));
					formData.append('sku', form.sku);
					formData.append('featured', String(form.featured));
					formData.append('category', form.category);
					formData.append('colors', JSON.stringify(colorsArray));
					formData.append('sizes', JSON.stringify(sizesArray));

					if (pbFilenames.length > 0) {
						formData.append('images', JSON.stringify(pbFilenames));
					}

					for (const file of allNewFiles) {
						formData.append('images', file);
					}

					await pb.collection('estore_products').update(editingProduct.id, formData);
				} else {
					const data: Record<string, unknown> = {
						name: form.name,
						slug: form.slug,
						description: form.description,
						price: Number(form.price),
						comparePrice: Number(form.comparePrice) || 0,
						stock: Number(form.stock),
						sku: form.sku,
						featured: form.featured,
						category: form.category,
						colors: colorsArray,
						sizes: sizesArray
					};

					await pb.collection('estore_products').update(editingProduct.id, data);
				}

				toasts.show('success', 'Product updated successfully');
			} else {
				const formData = new FormData();
				formData.append('name', form.name);
				formData.append('slug', form.slug);
				formData.append('description', form.description);
				formData.append('price', String(Number(form.price)));
				formData.append('comparePrice', String(Number(form.comparePrice) || 0));
				formData.append('stock', String(Number(form.stock)));
				formData.append('sku', form.sku);
				formData.append('featured', String(form.featured));
				formData.append('category', form.category);
				formData.append('colors', JSON.stringify(colorsArray));
				formData.append('sizes', JSON.stringify(sizesArray));

				for (const file of newImages) {
					formData.append('images', file);
				}

				await pb.collection('estore_products').create(formData);
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
	<title>Products - Admin - Urazbox</title>
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
		<!-- Mobile Card View -->
		<div class="grid gap-3 md:hidden">
			{#each filteredProducts as product (product.id)}
				<div class="rounded-xl bg-white p-4 shadow-sm">
					<div class="mb-3 flex items-start gap-3">
						<div class="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-bg-secondary">
							<img
								src={getProductImage(product)}
								alt={product.name}
								class="h-full w-full object-cover"
							/>
						</div>
						<div class="min-w-0 flex-1">
							<p class="truncate font-medium text-text-primary">{product.name}</p>
							<p class="text-xs text-text-muted">{product.sku}</p>
							<p class="text-xs text-text-secondary">{getCategoryName(product.category)}</p>
						</div>
						{#if product.featured}
							<span
								class="flex-shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-800"
								>Featured</span
							>
						{/if}
					</div>
					<div class="mb-3 grid grid-cols-2 gap-2 text-sm">
						<div>
							<span class="text-text-muted">Price:</span>
							<span class="ml-1 font-semibold text-accent">{formatPrice(product.price)}</span>
						</div>
						<div>
							<span class="text-text-muted">Stock:</span>
							<span class="ml-1 font-medium text-text-primary">{product.stock}</span>
						</div>
					</div>
					{#if Array.isArray(product.colors) && product.colors.length > 0}
						<div class="mb-2 flex flex-wrap gap-1">
							{#each product.colors as color}
								<span
									class="inline-flex items-center rounded-full bg-bg-secondary px-2 py-0.5 text-xs text-text-secondary"
									>{color}</span
								>
							{/each}
						</div>
					{/if}
					{#if Array.isArray(product.sizes) && product.sizes.length > 0}
						<div class="mb-3 flex flex-wrap gap-1">
							{#each product.sizes as size}
								<span
									class="inline-flex items-center rounded-full bg-bg-secondary px-2 py-0.5 text-xs text-text-secondary"
									>{size}</span
								>
							{/each}
						</div>
					{/if}
					<div class="flex items-center justify-end gap-2 border-t border-border pt-3">
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
				</div>
			{/each}
		</div>

		<!-- Desktop Table View -->
		<div class="hidden overflow-hidden rounded-2xl bg-white shadow-sm md:block">
			<div class="custom-scrollbar overflow-x-auto pb-2">
				<table class="w-full min-w-[800px]">
					<thead class="bg-bg-secondary">
						<tr>
							<th class="px-6 py-3 text-left text-sm font-semibold text-text-primary">Image</th>
							<th class="px-6 py-3 text-left text-sm font-semibold text-text-primary">Name</th>
							<th class="px-6 py-3 text-left text-sm font-semibold text-text-primary">Category</th>
							<th class="px-6 py-3 text-left text-sm font-semibold text-text-primary">Price</th>
							<th class="px-6 py-3 text-left text-sm font-semibold text-text-primary">Stock</th>
							<th class="px-6 py-3 text-left text-sm font-semibold text-text-primary">Colors</th>
							<th class="px-6 py-3 text-left text-sm font-semibold text-text-primary">Sizes</th>
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
								<td class="px-6 py-4 text-sm text-text-secondary">
									{#if Array.isArray(product.colors) && product.colors.length > 0}
										<div class="flex flex-wrap gap-1">
											{#each product.colors as color}
												<span
													class="inline-flex items-center rounded-full bg-bg-secondary px-2 py-0.5 text-xs"
													>{color}</span
												>
											{/each}
										</div>
									{:else}
										<span class="text-text-muted">-</span>
									{/if}
								</td>
								<td class="px-6 py-4 text-sm text-text-secondary">
									{#if Array.isArray(product.sizes) && product.sizes.length > 0}
										<div class="flex flex-wrap gap-1">
											{#each product.sizes as size}
												<span
													class="inline-flex items-center rounded-full bg-bg-secondary px-2 py-0.5 text-xs"
													>{size}</span
												>
											{/each}
										</div>
									{:else}
										<span class="text-text-muted">-</span>
									{/if}
								</td>
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

		<div>
			<div class="mb-2 flex items-center justify-between">
				<label class="text-sm font-medium text-text-primary">Product Images</label>
				<span class="text-xs {canAddMore ? 'text-text-muted' : 'font-medium text-error'}">
					{totalImageCount} / {MAX_IMAGES} images
				</span>
			</div>

			{#if !canAddMore}
				<div class="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
					Maximum of {MAX_IMAGES} images reached. Remove an existing image to add more.
				</div>
			{/if}

			{#if existingFilenames.length > 0}
				<div class="mb-3 flex flex-wrap gap-2">
					{#each existingFilenames as filename, i}
						{@const src = filename.startsWith('http')
							? filename
							: getImageUrl('estore_products', editingProduct?.id ?? '', filename)}
						<div class="group relative h-20 w-20 overflow-hidden rounded-lg border border-border">
							<img {src} alt="Image {i + 1}" class="h-full w-full object-cover" />
							<button
								type="button"
								class="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-bl-lg bg-error text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
								onclick={() => removeExistingImage(i)}
							>
								&times;
							</button>
						</div>
					{/each}
				</div>
			{/if}

			{#if newImages.length > 0}
				<div class="mb-3 flex flex-wrap gap-2">
					{#each newImages as file, i}
						<div class="relative h-20 w-20 overflow-hidden rounded-lg border border-accent/40">
							<img
								src={URL.createObjectURL(file)}
								alt="New {i + 1}"
								class="h-full w-full object-cover"
							/>
							<button
								type="button"
								class="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-bl-lg bg-error text-xs text-white"
								onclick={() => removeNewImage(i)}
							>
								&times;
							</button>
						</div>
					{/each}
				</div>
			{/if}

			<label
				class="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-6 transition-colors hover:border-accent hover:bg-accent/5 {!canAddMore
					? 'pointer-events-none opacity-40'
					: ''}"
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
				<span class="text-sm text-text-secondary">Click to upload images</span>
				<span class="mt-1 text-xs text-text-muted">PNG, JPG up to 10MB each</span>
				<input
					type="file"
					accept="image/*"
					multiple
					class="hidden"
					onchange={handleFileInput}
					disabled={!canAddMore}
				/>
			</label>

			<div class="mt-3 flex gap-2">
				<input
					type="url"
					placeholder="Or paste an image URL..."
					bind:value={imageUrlInput}
					disabled={isFetchingUrl || !canAddMore}
					class="h-12 flex-1 rounded-xl border border-border px-4 focus:border-accent focus:outline-none disabled:opacity-50"
					onkeydown={(e) => {
						if (e.key === 'Enter') {
							e.preventDefault();
							addImageUrl();
						}
					}}
				/>
				<Button variant="secondary" onclick={addImageUrl} disabled={isFetchingUrl || !canAddMore}>
					{isFetchingUrl ? 'Fetching...' : 'Add URL'}
				</Button>
			</div>
		</div>

		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<Input
				label="Available Colors (comma-separated)"
				placeholder="e.g. Red, Blue, Black"
				bind:value={form.colors}
			/>
			<Input
				label="Available Sizes (comma-separated)"
				placeholder="e.g. S, M, L, XL"
				bind:value={form.sizes}
			/>
		</div>

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
