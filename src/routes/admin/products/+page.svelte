<script lang="ts">
	import { onMount } from 'svelte';
	import {
		products,
		categories,
		fetchProducts,
		fetchCategories,
		getProductImage
	} from '$lib/stores/products';
	import {
		pb,
		parseImages,
		getImageUrl,
		getProductImages,
		type Product,
		type Category
	} from '$lib/pocketbase';
	import { formatPrice, slugify } from '$lib/utils/index';
	import { Button, Input, Modal, ShareButtons } from '$lib/components/ui';
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

	let newVideoFile = $state<File | null>(null);
	let existingVideoFile = $state('');
	let videoUrlInput = $state('');
	let isFetchingVideoUrl = $state(false);
	let newVideoUrlsAdded = $state<string[]>([]);

	const MAX_IMAGES = 10;
	const MAX_VIDEOS = 3;

	let totalImageCount = $derived(existingFilenames.length + newImages.length);
	let canAddMore = $derived(totalImageCount < MAX_IMAGES);
	let hasUploadedVideo = $derived(!!(newVideoFile || existingVideoFile));
	let hasVideoUrls = $derived(newVideoUrlsAdded.length > 0);
	let videoUrlsCount = $derived(newVideoUrlsAdded.length);
	let canAddMoreVideoUrls = $derived(videoUrlsCount < MAX_VIDEOS);

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
		newVideoFile = null;
		existingVideoFile = '';
		videoUrlInput = '';
		newVideoUrlsAdded = [];
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
		existingVideoFile = product.video || '';
		if (Array.isArray(product.videoUrls)) {
			newVideoUrlsAdded = [...product.videoUrls];
		} else {
			newVideoUrlsAdded = [];
		}
		videoUrlInput = '';
		newVideoFile = null;
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

	function handleVideoFileInput(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files && input.files[0]) {
			if (hasUploadedVideo) {
				toasts.show('warning', 'Only 1 video allowed. Remove existing video first.');
				return;
			}
			newVideoFile = input.files[0];
		}
		input.value = '';
	}

	function removeNewVideo() {
		newVideoFile = null;
	}

	function removeExistingVideo() {
		existingVideoFile = '';
	}

	async function addVideoUrl() {
		const url = videoUrlInput.trim();
		if (!url) return;

		if (!canAddMoreVideoUrls) {
			toasts.show('error', `Maximum ${MAX_VIDEOS} video URLs allowed.`);
			return;
		}

		newVideoUrlsAdded = [...newVideoUrlsAdded, url.trim()];
		videoUrlInput = '';
		toasts.show('success', 'Video link added');
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
				const hasImageChanges =
					allNewFiles.length > 0 ||
					pbFilenames.length !== originalFilenames.length ||
					pbFilenames.some((f, i) => f !== originalFilenames[i]);

				const hasUploadedVideoChanges =
					!!newVideoFile ||
					existingVideoFile !== (editingProduct.video || '') ||
					(!!videoUrlInput &&
						videoUrlInput !==
							(Array.isArray(editingProduct.videoUrls) ? editingProduct.videoUrls[0] : ''));

				if (hasImageChanges || hasUploadedVideoChanges) {
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

					if (newVideoFile) {
						formData.append('video', newVideoFile);
					} else if (existingVideoFile) {
						formData.append('video', existingVideoFile);
					}

					if (newVideoUrlsAdded.length > 0) {
						formData.append('videoUrls', JSON.stringify(newVideoUrlsAdded));
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
						sizes: sizesArray,
						video: existingVideoFile || '',
						videoUrls: newVideoUrlsAdded
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

				if (newVideoFile) {
					formData.append('video', newVideoFile);
				}

				if (newVideoUrlsAdded.length > 0) {
					formData.append('videoUrls', JSON.stringify(newVideoUrlsAdded));
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

	function stockStatus(stock: number): 'out' | 'low' | 'ok' {
		if (stock === 0) return 'out';
		if (stock <= 5) return 'low';
		return 'ok';
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
				{@const status = stockStatus(product.stock)}
				<div
					class="rounded-xl bg-white p-4 shadow-sm {status === 'out'
						? 'border-2 border-red-400 bg-red-50/30'
						: status === 'low'
							? 'border-2 border-amber-400 bg-amber-50/30'
							: ''}"
				>
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
							{#if status === 'out'}
								<span
									class="ml-1 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700"
									>Out of stock</span
								>
							{:else if status === 'low'}
								<span
									class="ml-1 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700"
									>{product.stock} left</span
								>
							{:else}
								<span class="ml-1 font-medium text-text-primary">{product.stock}</span>
							{/if}
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
					<div class="flex flex-wrap items-center justify-start gap-2 border-t border-border pt-3">
						<button
							type="button"
							class="inline-flex items-center gap-1.5 rounded-lg bg-bg-secondary px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-accent hover:text-white"
							onclick={() => openEditModal(product)}
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
						<a
							href="/products/{product.id}"
							target="_blank"
							class="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-600 hover:text-white"
						>
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
								/>
							</svg>
							View
						</a>
						<ShareButtons
							url="{typeof window !== 'undefined'
								? window.location.origin
								: ''}/products/{product.id}"
							title={product.name}
							variant="icon"
						/>
						<button
							type="button"
							class="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-600 hover:text-white"
							onclick={() => deleteProduct(product.id)}
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
							{@const status = stockStatus(product.stock)}
							<tr
								class="hover:bg-bg-secondary/50 {status === 'out'
									? 'bg-red-50/40'
									: status === 'low'
										? 'bg-amber-50/40'
										: ''}"
							>
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
								<td class="px-6 py-4 text-sm">
									{#if status === 'out'}
										<span
											class="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700"
											>Out of stock</span
										>
									{:else if status === 'low'}
										<span
											class="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700"
										>
											<svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"
												><path
													fill-rule="evenodd"
													d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
													clip-rule="evenodd"
												/></svg
											>
											{product.stock} left
										</span>
									{:else}
										<span class="text-text-primary">{product.stock}</span>
									{/if}
								</td>
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
										<a
											href="/products/{product.id}"
											target="_blank"
											class="rounded-lg p-2 transition-colors hover:bg-bg-secondary"
											title="View product"
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
													d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
												/>
											</svg>
										</a>
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
										<ShareButtons
											url="{typeof window !== 'undefined'
												? window.location.origin
												: ''}/products/{product.id}"
											title={product.name}
											variant="icon"
										/>
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
	<div class="space-y-4">
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

			<div class="mt-3 flex flex-col gap-2 sm:flex-row">
				<input
					type="url"
					placeholder="Or paste an image URL..."
					bind:value={imageUrlInput}
					disabled={isFetchingUrl || !canAddMore}
					class="h-10 w-full rounded-xl border border-border px-3 text-sm focus:border-accent focus:outline-none disabled:opacity-50 sm:h-12 sm:px-4"
					onkeydown={(e) => {
						if (e.key === 'Enter') {
							e.preventDefault();
							addImageUrl();
						}
					}}
				/>
				<Button
					variant="secondary"
					onclick={addImageUrl}
					disabled={isFetchingUrl || !canAddMore}
					class="shrink-0"
				>
					{isFetchingUrl ? 'Fetching...' : 'Add URL'}
				</Button>
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

			<div class="mt-4 flex items-center gap-3">
				<input
					type="checkbox"
					id="featured"
					bind:checked={form.featured}
					class="h-5 w-5 rounded border-border text-accent focus:ring-accent"
				/>
				<label for="featured" class="text-sm font-medium text-text-primary">Featured Product</label>
			</div>
		</div>

		<!-- Product Video -->
		<div>
			<div class="mb-2 flex items-center justify-between">
				<label class="text-sm font-medium text-text-primary">Product Video</label>
				<span class="text-xs text-text-muted">
					{hasUploadedVideo || hasVideoUrls ? '1 added' : '0 added'}
				</span>
			</div>

			<!-- Uploaded Video Preview -->
			{#if hasUploadedVideo}
				<div class="mb-3 flex items-center gap-3 rounded-lg border border-border p-3">
					<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-purple-50">
						<svg
							class="h-6 w-6 text-purple-500"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
							/>
						</svg>
					</div>
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium text-text-primary">
							{newVideoFile ? newVideoFile.name : 'Uploaded video'}
						</p>
						<p class="text-xs text-text-muted">Video file</p>
					</div>
					<button
						type="button"
						class="shrink-0 rounded-lg p-2 hover:bg-red-50"
						onclick={() => {
							newVideoFile = null;
							existingVideoFile = '';
						}}
					>
						<svg class="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

			<!-- Video URL Preview -->
			{#if hasVideoUrls}
				{#each newVideoUrlsAdded as url, i}
					<div class="mb-3 flex items-center gap-3 rounded-lg border border-border p-3">
						<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-red-50">
							<svg class="h-6 w-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
								<path
									d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
								/>
								<path fill="white" d="M9.545 15.568V8.432L15.818 12z" />
							</svg>
						</div>
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium text-text-primary">{url}</p>
							<p class="text-xs text-text-muted">
								{url.includes('youtube') || url.includes('youtu.be')
									? 'YouTube'
									: url.includes('vimeo')
										? 'Vimeo'
										: 'External URL'}
							</p>
						</div>
						<button
							type="button"
							class="shrink-0 rounded-lg p-2 hover:bg-red-50"
							onclick={() => {
								newVideoUrlsAdded = newVideoUrlsAdded.filter((_, idx) => idx !== i);
							}}
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
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</div>
				{/each}
			{/if}

			<!-- Upload Button -->
			{#if !hasUploadedVideo}
				<label
					class="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-4 transition-colors hover:border-accent hover:bg-accent/5"
				>
					<svg
						class="mb-1 h-6 w-6 text-text-muted"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
						/>
					</svg>
					<span class="text-sm text-text-secondary">Upload video</span>
					<span class="mt-0.5 text-xs text-text-muted">MP4, WebM up to 50MB</span>
					<input type="file" accept="video/*" class="hidden" onchange={handleVideoFileInput} />
				</label>
			{/if}

			<!-- URL Input - always visible -->
			<div class="mt-3 flex flex-col gap-2">
				<input
					type="url"
					placeholder="Paste a video URL (YouTube, Vimeo, or direct link)..."
					bind:value={videoUrlInput}
					class="h-10 w-full rounded-xl border border-border px-3 text-sm focus:border-accent focus:outline-none sm:h-12 sm:px-4"
					onkeydown={(e) => {
						if (e.key === 'Enter') {
							e.preventDefault();
							addVideoUrl();
						}
					}}
				/>
				<Button
					variant="secondary"
					onclick={addVideoUrl}
					disabled={isFetchingVideoUrl || !videoUrlInput.trim()}
				>
					{isFetchingVideoUrl ? 'Adding...' : 'Add URL'}
				</Button>
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
		</div>
	</div></Modal
>
