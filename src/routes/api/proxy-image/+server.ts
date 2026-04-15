import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url, fetch }) => {
	const imageUrl = url.searchParams.get('url');

	if (!imageUrl) {
		throw error(400, 'Missing url parameter');
	}

	let res: Response;
	try {
		res = await fetch(imageUrl, {
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
				Accept: 'image/*,*/*'
			}
		});
	} catch {
		throw error(502, `Could not reach the remote server. Check if the URL is correct.`);
	}

	if (!res.ok) {
		throw error(502, `Remote server returned status ${res.status}`);
	}

	const contentType = res.headers.get('content-type') || '';
	if (!contentType.startsWith('image/')) {
		throw error(
			400,
			`The URL returned "${contentType}" which is not an image. Use a direct link to an image file (e.g. ending in .jpg, .png, .webp).`
		);
	}

	const arrayBuffer = await res.arrayBuffer();

	return new Response(arrayBuffer, {
		headers: {
			'content-type': contentType,
			'cache-control': 'public, max-age=86400'
		}
	});
};
