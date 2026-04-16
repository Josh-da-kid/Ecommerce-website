import { writable, get } from 'svelte/store';
import { pb, type User } from '$lib/pocketbase';
import { browser } from '$app/environment';

export const user = writable<User | null>(null);
export const isAuthenticated = writable(false);
export const isAdmin = writable(false);
export const authInitialized = writable(false);

let userSubscription: any = null;

function cleanupUserSubscription() {
	if (userSubscription) {
		try {
			if (typeof userSubscription.unsubscribe === 'function') {
				userSubscription.unsubscribe();
			}
		} catch (e) {
			console.error('Error unsubscribing:', e);
		}
		userSubscription = null;
	}
}

function subscribeToUserChanges(userId: string) {
	if (!browser) return;

	cleanupUserSubscription();

	userSubscription = pb.collection('estore_users').subscribe(userId, (e) => {
		if (e.action === 'update') {
			const updatedUser = e.record as unknown as User;
			user.set(updatedUser);
			isAdmin.set(Boolean(updatedUser.isAdmin));
		} else if (e.action === 'delete') {
			user.set(null);
			isAuthenticated.set(false);
			isAdmin.set(false);
			cleanupUserSubscription();
		}
	});
}

export async function initAuth() {
	if (!browser) return;

	if (pb.authStore.isValid) {
		try {
			const model = pb.authStore.record as unknown as User;
			if (model && model.id) {
				user.set(model);
				isAuthenticated.set(true);
				isAdmin.set(Boolean(model.isAdmin));
				subscribeToUserChanges(model.id);
			}
		} catch {
			pb.authStore.clear();
		}
	}

	pb.authStore.onChange(() => {
		if (pb.authStore.isValid) {
			const model = pb.authStore.record as unknown as User;
			if (model && model.id) {
				user.set(model);
				isAuthenticated.set(true);
				isAdmin.set(Boolean(model.isAdmin));
				subscribeToUserChanges(model.id);
			}
		} else {
			user.set(null);
			isAuthenticated.set(false);
			isAdmin.set(false);
			cleanupUserSubscription();
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
		if (model.id) {
			subscribeToUserChanges(model.id);
		}
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
		if (model.id) {
			subscribeToUserChanges(model.id);
		}
		return { success: true };
	} catch (error: any) {
		return {
			success: false,
			error: error?.response?.message || error.message || 'Registration failed'
		};
	}
}

export async function logout() {
	try {
		cleanupUserSubscription();
		pb.authStore.clear();
		user.set(null);
		isAuthenticated.set(false);
		isAdmin.set(false);
	} catch (error) {
		console.error('Logout error:', error);
		pb.authStore.clear();
		user.set(null);
		isAuthenticated.set(false);
		isAdmin.set(false);
	}
}

export function isUserAdmin(): boolean {
	return get(isAdmin);
}
