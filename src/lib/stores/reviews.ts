import { writable } from 'svelte/store';
import { pb } from '$lib/pocketbase';
import type { Review } from '$lib/pocketbase';

export const reviews = writable<Review[]>([]);
export const isLoading = writable(false);

export async function fetchProductReviews(productId: string): Promise<Review[]> {
	try {
		const records = await pb.collection('estore_reviews').getList<Review>(1, 50, {
			filter: `product = "${productId}" && approved = true`,
			sort: '-created',
			expand: 'user'
		});
		return records.items as unknown as Review[];
	} catch {
		return [];
	}
}

export async function fetchAllReviews(): Promise<Review[]> {
	try {
		const records = await pb.collection('estore_reviews').getList<Review>(1, 100, {
			sort: '-created',
			expand: 'user,product'
		});
		return records.items as unknown as Review[];
	} catch {
		return [];
	}
}

export async function submitReview(
	orderId: string,
	productId: string,
	rating: number,
	comment: string,
	userId: string,
	title: string
): Promise<Review> {
	const record = await pb.collection('estore_reviews').create({
		order: orderId,
		product: productId,
		user: userId,
		title,
		rating,
		comment,
		approved: false
	});
	return record as unknown as Review;
}

export async function checkUserReviewedOrder(
	orderId: string,
	productId: string,
	userId: string
): Promise<boolean> {
	try {
		const records = await pb.collection('estore_reviews').getList(1, 1, {
			filter: `order = "${orderId}" && product = "${productId}" && user = "${userId}"`
		});
		return records.items.length > 0;
	} catch {
		return false;
	}
}

export async function getUserOrderForProduct(
	userId: string,
	productId: string
): Promise<string | null> {
	try {
		const orders = await pb.collection('estore_orders').getList(1, 50, {
			filter: `user = "${userId}" && status = "delivered"`,
			sort: '-created'
		});

		for (const order of orders.items) {
			const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
			const hasProduct = items.some((item: { productId: string }) => item.productId === productId);
			if (hasProduct) {
				return order.id;
			}
		}
		return null;
	} catch {
		return null;
	}
}

export async function getUnreviewedOrdersForProduct(
	userId: string,
	productId: string
): Promise<string[]> {
	try {
		const orders = await pb.collection('estore_orders').getList(1, 50, {
			filter: `user = "${userId}" && status = "delivered"`,
			sort: '-created'
		});

		const unreviewed: string[] = [];

		for (const order of orders.items) {
			const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
			const hasProduct = items.some((item: { productId: string }) => item.productId === productId);

			if (hasProduct) {
				const existing = await pb.collection('estore_reviews').getList(1, 1, {
					filter: `order = "${order.id}" && product = "${productId}" && user = "${userId}"`
				});

				if (existing.items.length === 0) {
					unreviewed.push(order.id);
				}
			}
		}

		return unreviewed;
	} catch {
		return [];
	}
}

export async function approveReview(reviewId: string): Promise<void> {
	await pb.collection('estore_reviews').update(reviewId, { approved: true });

	const review = await pb.collection('estore_reviews').getOne(reviewId);
	await updateProductRating(review.product);
}

export async function deleteReview(reviewId: string): Promise<void> {
	const review = await pb.collection('estore_reviews').getOne(reviewId);
	await pb.collection('estore_reviews').delete(reviewId);
	await updateProductRating(review.product);
}

async function updateProductRating(productId: string): Promise<void> {
	const reviews = await pb.collection('estore_reviews').getList(1, 100, {
		filter: `product = "${productId}" && approved = true`
	});

	if (reviews.items.length === 0) {
		await pb.collection('estore_products').update(productId, {
			rating: 0,
			reviewCount: 0
		});
		return;
	}

	const total = reviews.items.reduce(
		(sum: number, r: Record<string, unknown>) => sum + (r.rating as number),
		0
	);
	const avg = total / reviews.items.length;

	await pb.collection('estore_products').update(productId, {
		rating: Math.round(avg * 10) / 10,
		reviewCount: reviews.items.length
	});
}
