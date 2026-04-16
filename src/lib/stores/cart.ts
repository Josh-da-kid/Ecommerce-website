import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import type { Product } from '$lib/pocketbase';
import { user } from '$lib/stores/auth';

export interface CartItem {
	product: Product;
	quantity: number;
	color: string;
	size: string;
}

const CART_KEY_PREFIX = 'luxe_cart_';

function getStorageKey(userId: string | undefined): string {
	return userId ? `${CART_KEY_PREFIX}${userId}` : 'luxe_cart_guest';
}

function getItemKey(productId: string, color: string, size: string) {
	return `${productId}__${color}__${size}`;
}

function createCart() {
	let currentUserId: string | undefined = undefined;

	const getStored = (): CartItem[] => {
		if (!browser) return [];
		const key = getStorageKey(currentUserId);
		const stored = localStorage.getItem(key);
		return stored ? JSON.parse(stored) : [];
	};

	const { subscribe, set, update } = writable<CartItem[]>([]);

	if (browser) {
		subscribe((value) => {
			const key = getStorageKey(currentUserId);
			localStorage.setItem(key, JSON.stringify(value));
		});

		user.subscribe(($user) => {
			const newUserId = $user?.id;
			if (newUserId !== currentUserId) {
				currentUserId = newUserId;
				set(getStored());
			}
		});
	}

	return {
		subscribe,
		addItem: (product: Product, quantity: number = 1, color: string = '', size: string = '') => {
			let added = false;
			update((items) => {
				const key = getItemKey(product.id, color, size);
				const existing = items.find(
					(item) => getItemKey(item.product.id, item.color, item.size) === key
				);
				if (existing) {
					const newQty = existing.quantity + quantity;
					if (newQty > product.stock) {
						return items;
					}
					return items.map((item) =>
						getItemKey(item.product.id, item.color, item.size) === key
							? { ...item, quantity: newQty }
							: item
					);
				}
				if (quantity > product.stock) {
					return items;
				}
				added = true;
				return [...items, { product, quantity, color, size }];
			});
			return added;
		},
		removeItem: (productId: string, color: string = '', size: string = '') => {
			update((items) =>
				items.filter(
					(item) =>
						getItemKey(item.product.id, item.color, item.size) !==
						getItemKey(productId, color, size)
				)
			);
		},
		updateQuantity: (
			productId: string,
			quantity: number,
			color: string = '',
			size: string = ''
		) => {
			if (quantity <= 0) {
				update((items) =>
					items.filter(
						(item) =>
							getItemKey(item.product.id, item.color, item.size) !==
							getItemKey(productId, color, size)
					)
				);
			} else {
				update((items) =>
					items.map((item) =>
						getItemKey(item.product.id, item.color, item.size) ===
						getItemKey(productId, color, size)
							? { ...item, quantity }
							: item
					)
				);
			}
		},
		clear: () => set([]),
		load: (items: CartItem[]) => set(items)
	};
}

export const cart = createCart();

export const cartCount = derived(cart, ($cart) =>
	$cart.reduce((sum, item) => sum + item.quantity, 0)
);

export const cartTotal = derived(cart, ($cart) =>
	$cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
);

export const cartSubtotal = derived(cart, ($cart) =>
	$cart.reduce((sum, item) => {
		const price = item.product.comparePrice || item.product.price;
		return sum + price * item.quantity;
	}, 0)
);

export const cartSavings = derived(
	[cartSubtotal, cartTotal],
	([$subtotal, $total]) => $subtotal - $total
);
