import { writable, get } from 'svelte/store';
import { pb, type User } from '$lib/pocketbase';
import { browser } from '$app/environment';

export const user = writable<User | null>(null);
export const isAuthenticated = writable(false);
export const isAdmin = writable(false);
export const authInitialized = writable(false);

export async function initAuth() {
	if (!browser) return;

	if (pb.authStore.isValid) {
		try {
			const model = pb.authStore.record as unknown as User;
			if (model) {
				user.set(model);
				isAuthenticated.set(true);
				isAdmin.set(Boolean(model.isAdmin));
			}
		} catch {
			pb.authStore.clear();
		}
	}

	pb.authStore.onChange(() => {
		if (pb.authStore.isValid) {
			const model = pb.authStore.record as unknown as User;
			if (model) {
				user.set(model);
				isAuthenticated.set(true);
				isAdmin.set(Boolean(model.isAdmin));
			}
		} else {
			user.set(null);
			isAuthenticated.set(false);
			isAdmin.set(false);
		}
	});

	authInitialized.set(true);
}

export async function login(email: string, password: string) {
	try {
		const authData = await pb.collection('estore_users').authWithPassword(email, password);
		const model = authData.record as unknown as User;
		user.set(model);
		isAuthenticated.set(true);
		isAdmin.set(Boolean(model.isAdmin));
		return { success: true };
	} catch (error: any) {
		return { success: false, error: error?.response?.message || error.message || 'Login failed' };
	}
}

export async function register(email: string, password: string, name: string) {
	try {
		await pb.collection('estore_users').create({
			email,
			password,
			passwordConfirm: password,
			name,
			username: email.split('@')[0],
			isAdmin: false
		});
		await pb.collection('estore_users').authWithPassword(email, password);
		const model = pb.authStore.record as unknown as User;
		user.set(model);
		isAuthenticated.set(true);
		isAdmin.set(false);
		return { success: true };
	} catch (error: any) {
		return {
			success: false,
			error: error?.response?.message || error.message || 'Registration failed'
		};
	}
}

export async function logout() {
	pb.authStore.clear();
	user.set(null);
	isAuthenticated.set(false);
	isAdmin.set(false);
}

export function isUserAdmin(): boolean {
	return get(isAdmin);
}
