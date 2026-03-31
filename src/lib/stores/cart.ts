import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import type { Product } from '$lib/pocketbase';

export interface CartItem {
  product: Product;
  quantity: number;
}

const CART_KEY = 'luxe_cart';

function createCart() {
  const stored = browser ? localStorage.getItem(CART_KEY) : null;
  const initial: CartItem[] = stored ? JSON.parse(stored) : [];

  const { subscribe, set, update } = writable<CartItem[]>(initial);

  if (browser) {
    subscribe(value => {
      localStorage.setItem(CART_KEY, JSON.stringify(value));
    });
  }

  return {
    subscribe,
    addItem: (product: Product, quantity: number = 1) => {
      update(items => {
        const existing = items.find(item => item.product.id === product.id);
        if (existing) {
          return items.map(item =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        }
        return [...items, { product, quantity }];
      });
    },
    removeItem: (productId: string) => {
      update(items => items.filter(item => item.product.id !== productId));
    },
    updateQuantity: (productId: string, quantity: number) => {
      if (quantity <= 0) {
        update(items => items.filter(item => item.product.id !== productId));
      } else {
        update(items =>
          items.map(item =>
            item.product.id === productId ? { ...item, quantity } : item
          )
        );
      }
    },
    clear: () => set([]),
    load: (items: CartItem[]) => set(items)
  };
}

export const cart = createCart();

export const cartCount = derived(cart, $cart =>
  $cart.reduce((sum, item) => sum + item.quantity, 0)
);

export const cartTotal = derived(cart, $cart =>
  $cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
);

export const cartSubtotal = derived(cart, $cart =>
  $cart.reduce((sum, item) => {
    const price = item.product.comparePrice || item.product.price;
    return sum + price * item.quantity;
  }, 0)
);

export const cartSavings = derived([cartSubtotal, cartTotal], ([$subtotal, $total]) =>
  $subtotal - $total
);
