import { writable, get } from 'svelte/store';
import { pb, type User } from '$lib/pocketbase';
import { browser } from '$app/environment';

export const user = writable<User | null>(null);
export const isAuthenticated = writable(false);
export const isAdmin = writable(false);

export async function initAuth() {
  if (!browser) return;

  pb.authStore.loadFromCookie(document.cookie);

  if (pb.authStore.isValid) {
    try {
      const model = pb.authStore.model as User;
      user.set(model);
      isAuthenticated.set(true);
      isAdmin.set(model?.role === 'admin');
    } catch {
      pb.authStore.clear();
    }
  }

  pb.authStore.onChange(() => {
    if (pb.authStore.isValid) {
      const model = pb.authStore.model as User;
      user.set(model);
      isAuthenticated.set(true);
      isAdmin.set(model?.role === 'admin');
    } else {
      user.set(null);
      isAuthenticated.set(false);
      isAdmin.set(false);
    }
  });
}

export async function login(email: string, password: string) {
  try {
    await pb.collection('users').authWithPassword(email, password);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function register(email: string, password: string, name: string) {
  try {
    await pb.collection('users').create({
      email,
      password,
      passwordConfirm: password,
      name,
      username: email.split('@')[0]
    });
    await pb.collection('users').authWithPassword(email, password);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function logout() {
  pb.authStore.clear();
  if (browser) {
    document.cookie = pb.authStore.exportToCookie({ httpOnly: false });
  }
}

export function isUserAdmin(): boolean {
  return get(isAdmin);
}
