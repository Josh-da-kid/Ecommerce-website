import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import type { Product } from '$lib/pocketbase';
import { user } from '$lib/stores/auth';

const WISHLIST_KEY_PREFIX = 'luxe_wishlist_';

function getStorageKey(userId: string | undefined): string {
	return userId ? `${WISHLIST_KEY_PREFIX}${userId}` : 'luxe_wishlist_guest';
}

function createWishlist() {
	let currentUserId: string | undefined = undefined;

	const getStored = (): string[] => {
		if (!browser) return [];
		const key = getStorageKey(currentUserId);
		const stored = localStorage.getItem(key);
		return stored ? JSON.parse(stored) : [];
	};

	const { subscribe, set, update } = writable<string[]>([]);

	if (browser) {
		subscribe((value) => {
			const key = getStorageKey(currentUserId);
			localStorage.setItem(key, JSON.stringify(value));
		});
	}

	if (browser) {
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
