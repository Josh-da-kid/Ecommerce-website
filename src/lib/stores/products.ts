import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import {
	pb,
	getFirstImage,
	getProductImages,
	parseImages,
	type Product,
	type Category
} from '$lib/pocketbase';

export const products = writable<Product[]>([]);
export const categories = writable<Category[]>([]);
export const featuredProducts = writable<Product[]>([]);
export const isLoading = writable(false);

export const searchQuery = writable('');
export const selectedCategory = writable<string | null>(null);
export const sortBy = writable<'newest' | 'price-asc' | 'price-desc' | 'popular'>('newest');

export const filteredProducts = derived(
	[products, searchQuery, selectedCategory, sortBy],
	([$products, $searchQuery, $selectedCategory, $sortBy]) => {
		let filtered = [...$products];

		if ($searchQuery) {
			const query = $searchQuery.toLowerCase();
			filtered = filtered.filter(
				(p) => p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query)
			);
		}

		if ($selectedCategory) {
			filtered = filtered.filter((p) => p.category === $selectedCategory);
		}

		switch ($sortBy) {
			case 'price-asc':
				filtered.sort((a, b) => a.price - b.price);
				break;
			case 'price-desc':
				filtered.sort((a, b) => b.price - a.price);
				break;
			case 'popular':
				filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
				break;
			default:
				filtered.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
		}

		return filtered;
	}
);

export async function fetchProducts() {
	isLoading.set(true);
	try {
		const records = await pb.collection('estore_products').getFullList<Product>({
			sort: '-created'
		});
		products.set(records);
	} catch (error) {
		console.error('Failed to fetch products:', error);
		products.set([]);
	} finally {
		isLoading.set(false);
	}
}

export async function fetchCategories() {
	try {
		const records = await pb.collection('estore_categories').getFullList<Category>({
			sort: 'name'
		});
		categories.set(records);
	} catch (error) {
		console.error('Failed to fetch categories:', error);
		categories.set([]);
	}
}

export async function fetchProductById(id: string): Promise<Product | null> {
	try {
		const record = await pb.collection('estore_products').getOne<Product>(id);
		return record;
	} catch {
		return null;
	}
}

export async function fetchFeaturedProducts() {
	try {
		const records = await pb.collection('estore_products').getFullList<Product>({
			filter: 'featured = true',
			sort: '-created'
		});
		featuredProducts.set(records.slice(0, 4));
	} catch (error) {
		console.error('Failed to fetch featured products:', error);
		featuredProducts.set([]);
	}
}

export function getProductImage(product: Product): string {
	return getFirstImage(product);
}

export { getProductImages };

if (browser) {
	pb.collection('estore_products').subscribe('*', (e) => {
		if (e.action === 'create') {
			products.update((list) => {
				if (list.some((p) => p.id === e.record.id)) return list;
				return [e.record as unknown as Product, ...list];
			});
		} else if (e.action === 'update') {
			products.update((list) =>
				list.map((p) => (p.id === e.record.id ? (e.record as unknown as Product) : p))
			);
		} else if (e.action === 'delete') {
			products.update((list) => list.filter((p) => p.id !== e.record.id));
		}
	});

	pb.collection('estore_categories').subscribe('*', (e) => {
		if (e.action === 'create') {
			categories.update((list) => {
				if (list.some((c) => c.id === e.record.id)) return list;
				return [...list, e.record as unknown as Category];
			});
		} else if (e.action === 'update') {
			categories.update((list) =>
				list.map((c) => (c.id === e.record.id ? (e.record as unknown as Category) : c))
			);
		} else if (e.action === 'delete') {
			categories.update((list) => list.filter((c) => c.id !== e.record.id));
		}
	});
}
