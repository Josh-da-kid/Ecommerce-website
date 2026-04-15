import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import type { Product } from '$lib/pocketbase';

const WISHLIST_KEY = 'luxe_wishlist';

function createWishlist() {
	const stored = browser ? localStorage.getItem(WISHLIST_KEY) : null;
	const initial: string[] = stored ? JSON.parse(stored) : [];

	const { subscribe, set, update } = writable<string[]>(initial);

	if (browser) {
		subscribe((value) => {
			localStorage.setItem(WISHLIST_KEY, JSON.stringify(value));
		});
	}

	return {
		subscribe,
		toggle: (productId: string) => {
			update((ids) => {
				if (ids.includes(productId)) {
					return ids.filter((id) => id !== productId);
				}
				return [...ids, productId];
			});
		},
		add: (productId: string) => {
			update((ids) => {
				if (!ids.includes(productId)) {
					return [...ids, productId];
				}
				return ids;
			});
		},
		remove: (productId: string) => {
			update((ids) => ids.filter((id) => id !== productId));
		},
		clear: () => set([]),
		has: (productId: string, ids: string[]) => ids.includes(productId)
	};
}

export const wishlist = createWishlist();

export const wishlistCount = derived(wishlist, ($wishlist) => $wishlist.length);
