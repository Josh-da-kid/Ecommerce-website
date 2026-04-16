<script lang="ts">
	let openIndex = $state<number | null>(null);

	function toggle(index: number) {
		openIndex = openIndex === index ? null : index;
	}

	const faqs = [
		{
			question: 'How do I place an order?',
			answer:
				'Browse our collection, add items to your cart, and proceed to checkout. You can pay securely online or choose Pay on Delivery. You will receive an order confirmation via email once your order is placed.'
		},
		{
			question: 'What payment methods do you accept?',
			answer:
				'We accept bank transfers, card payments, and Pay on Delivery for orders within Nigeria. All online payments are processed securely.'
		},
		{
			question: 'How long does delivery take?',
			answer:
				'Delivery within Lagos typically takes 1-3 business days. Deliveries to other states take 3-7 business days. You will receive tracking information once your order has been shipped.'
		},
		{
			question: 'Do you offer international shipping?',
			answer:
				'Currently, we primarily ship within Nigeria. For international orders, please contact us via WhatsApp at +234 9063497162 and we will do our best to accommodate your request.'
		},
		{
			question: 'Can I return or exchange an item?',
			answer:
				'Yes! We accept returns within 7 days of delivery for items in their original condition. Please visit our Returns page for full details on the return process.'
		},
		{
			question: 'How do I know my ring or bracelet size?',
			answer:
				'We provide a size guide on each product page. If you are unsure, feel free to contact us on WhatsApp and we will help you find the perfect fit.'
		},
		{
			question: 'Are your products real gold/silver?',
			answer:
				'Our product descriptions clearly state the materials used for each piece. We use a variety of high-quality materials including sterling silver, gold-plated metals, and premium alloys. Each product page has detailed material information.'
		},
		{
			question: 'How do I care for my jewelry?',
			answer:
				'Store your jewelry in a cool, dry place away from direct sunlight. Avoid contact with water, perfume, and chemicals. Clean gently with a soft cloth. Remove jewelry before swimming, exercising, or sleeping.'
		},
		{
			question: 'Do you offer custom or personalized jewelry?',
			answer:
				'Yes! We love creating custom pieces. Contact us via WhatsApp at +234 9063497162 to discuss your custom jewelry needs.'
		},
		{
			question: 'How can I track my order?',
			answer:
				'Once your order is shipped, you will receive a tracking number via email or SMS. You can also use our <a href="/track" class="text-accent hover:underline">Order Tracking</a> page to check your order status.'
		},
		{
			question: 'I have an issue with my order. How do I get help?',
			answer:
				'We are here to help! You can reach us through our <a href="/contact" class="text-accent hover:underline">Contact page</a>, email, or WhatsApp at +234 9063497162. We typically respond within 24 hours.'
		}
	];
</script>

<svelte:head>
	<title>FAQ - Urazbox</title>
</svelte:head>

<div class="min-h-screen bg-bg-primary pt-24 pb-16">
	<div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
		<div class="mb-12 text-center">
			<h1 class="mb-4 text-4xl font-[var(--font-playfair)] font-bold text-text-primary">
				Frequently Asked Questions
			</h1>
			<p class="mx-auto max-w-xl text-xl text-text-secondary">
				Find answers to common questions about our products and services.
			</p>
		</div>

		<div class="space-y-3">
			{#each faqs as faq, index}
				<div
					class="overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md"
				>
					<button
						class="flex w-full items-center justify-between p-6 text-left"
						onclick={() => toggle(index)}
					>
						<span class="pr-4 text-lg font-semibold text-text-primary">{faq.question}</span>
						<svg
							class="h-5 w-5 shrink-0 text-text-muted transition-transform {openIndex === index
								? 'rotate-180'
								: ''}"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 9l-7 7-7-7"
							/>
						</svg>
					</button>
					{#if openIndex === index}
						<div class="border-t border-border px-6 pt-4 pb-6">
							<p class="leading-relaxed text-text-secondary">{@html faq.answer}</p>
						</div>
					{/if}
				</div>
			{/each}
		</div>

		<div class="mt-12 rounded-2xl bg-white p-8 text-center shadow-lg sm:p-12">
			<h2 class="mb-3 text-2xl font-[var(--font-playfair)] font-bold text-text-primary">
				Still Have Questions?
			</h2>
			<p class="mb-6 text-text-secondary">We are happy to help. Reach out to us anytime.</p>
			<div class="flex flex-wrap items-center justify-center gap-4">
				<a
					href="/contact"
					class="inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-3 font-semibold text-white transition-colors hover:bg-accent/90"
				>
					Contact Us
				</a>
				<a
					href="https://wa.me/2349063497162"
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex items-center gap-2 rounded-xl border-2 border-accent px-8 py-3 font-semibold text-accent transition-colors hover:bg-accent hover:text-white"
				>
					WhatsApp Us
				</a>
			</div>
		</div>
	</div>
</div>
