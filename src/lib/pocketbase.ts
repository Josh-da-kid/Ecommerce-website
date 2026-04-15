import PocketBase from 'pocketbase';
import { browser } from '$app/environment';

export const PB_URL = 'https://playgzero.pb.itcass.net';

export const pb = new PocketBase(PB_URL);

if (browser) {
	pb.autoCancellation(false);
}

export interface User {
	id: string;
	email: string;
	username: string;
	name: string;
	phone: string;
	avatar: string;
	isAdmin: boolean;
	created: string;
	updated: string;
}

export interface Category {
	id: string;
	name: string;
	slug: string;
	description: string;
	image: string;
	parent: string;
	created: string;
	updated: string;
}

export interface Product {
	id: string;
	name: string;
	slug: string;
	description: string;
	price: number;
	comparePrice: number;
	images: string | string[];
	category: string;
	categoryData?: Category;
	stock: number;
	sku: string;
	colors: string[];
	sizes: string[];
	featured: boolean;
	created: string;
	updated: string;
}

export function parseImages(images: string | string[] | undefined): string[] {
	if (!images) return [];
	if (Array.isArray(images)) return images;
	if (typeof images === 'string') {
		const trimmed = images.trim();
		if (!trimmed) return [];
		try {
			const parsed = JSON.parse(trimmed);
			if (Array.isArray(parsed)) return parsed.map(String);
		} catch {}
		return trimmed
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean);
	}
	return [];
}

export interface Order {
	id: string;
	user: string;
	items: OrderItem[];
	total: number;
	status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
	shippingAddress: ShippingAddress;
	paymentMethod: string;
	guestEmail: string;
	created: string;
	updated: string;
}

export interface OrderItem {
	productId: string;
	productName: string;
	productImage: string;
	price: number;
	quantity: number;
	color: string;
	size: string;
}

export interface ShippingAddress {
	name: string;
	email: string;
	phone: string;
	street: string;
	city: string;
	state: string;
	zip: string;
	country: string;
}

export function getImageUrl(collection: string, id: string, filename: string): string {
	return `${PB_URL}/api/files/${collection}/${id}/${filename}`;
}

export function getFirstImage(product: Product): string {
	const imgs = parseImages(product.images);
	if (imgs.length > 0) {
		const img = imgs[0];
		if (img.startsWith('http')) return img;
		return getImageUrl('estore_products', product.id, img);
	}
	return '/placeholder-product.svg';
}

export function getProductImages(product: Product): string[] {
	const imgs = parseImages(product.images);
	if (imgs.length === 0) return ['/placeholder-product.svg'];
	return imgs.map((img) => {
		if (img.startsWith('http')) return img;
		return getImageUrl('estore_products', product.id, img);
	});
}
