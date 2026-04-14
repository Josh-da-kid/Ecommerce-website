export function cn(...inputs: any[]): string {
	const classes: string[] = [];

	for (const input of inputs) {
		if (!input) continue;

		if (typeof input === 'string') {
			classes.push(input);
		} else if (Array.isArray(input)) {
			const nested = cn(...input);
			if (nested) classes.push(nested);
		} else if (typeof input === 'object') {
			for (const [key, value] of Object.entries(input)) {
				if (value) classes.push(key);
			}
		}
	}

	return classes.join(' ');
}

export function formatPrice(price: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD'
	}).format(price);
}

export function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^\w\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/--+/g, '-')
		.trim();
}

export function truncate(text: string, length: number): string {
	if (text.length <= length) return text;
	return text.slice(0, length) + '...';
}

export function debounce<T extends (...args: any[]) => any>(
	fn: T,
	delay: number
): (...args: Parameters<T>) => void {
	let timeoutId: ReturnType<typeof setTimeout>;
	return (...args: Parameters<T>) => {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => fn(...args), delay);
	};
}
