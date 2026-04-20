<svelte:head>
	<title>Shipping Information - Urazbox</title>
</svelte:head>

<div class="min-h-screen bg-bg-primary pt-24 pb-16">
	<div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
		<div class="mb-12 text-center">
			<h1 class="mb-4 text-4xl font-[var(--font-playfair)] font-bold text-text-primary">
				Shipping Information
			</h1>
			<p class="mx-auto max-w-xl text-xl text-text-secondary">
				Everything you need to know about our delivery options and timelines.
			</p>
		</div>

		<div class="space-y-8 rounded-2xl bg-white p-8 shadow-lg sm:p-12">
			<section>
				<h2 class="mb-4 text-2xl font-semibold text-text-primary">Domestic Shipping</h2>
				<p class="mb-3 leading-relaxed text-text-secondary">
					We deliver across Nigeria. Our shipping rates and estimated delivery times are as follows:
				</p>
				<div class="overflow-x-auto">
					<table class="w-full border-collapse text-left text-text-secondary">
						<thead>
							<tr class="border-b-2 border-border">
								<th class="px-4 py-3 font-semibold text-text-primary">Location</th>
								<th class="px-4 py-3 font-semibold text-text-primary">Estimated Time</th>
								<th class="px-4 py-3 font-semibold text-text-primary">Cost</th>
							</tr>
						</thead>
						<tbody>
							<tr class="border-b border-border">
								<td class="px-4 py-3">Lagos</td>
								<td class="px-4 py-3">1-3 business days</td>
								<td class="px-4 py-3">₦1,500</td>
							</tr>
							<tr class="border-b border-border">
								<td class="px-4 py-3">Other Major Cities</td>
								<td class="px-4 py-3">3-5 business days</td>
								<td class="px-4 py-3">₦2,500</td>
							</tr>
							<tr class="border-b border-border">
								<td class="px-4 py-3">Remote Areas</td>
								<td class="px-4 py-3">5-7 business days</td>
								<td class="px-4 py-3">₦3,500</td>
							</tr>
						</tbody>
					</table>
				</div>
			</section>

			<section>
				<h2 class="mb-4 text-2xl font-semibold text-text-primary">Order Processing</h2>
				<ul class="ml-6 list-disc space-y-2 text-text-secondary">
					<li>Orders placed before 2:00 PM (WAT) are processed the same day</li>
					<li>
						Orders placed after 2:00 PM or on weekends/holidays are processed the next business day
					</li>
					<li>You will receive a confirmation email with tracking details once your order ships</li>
					<li>Processing time does not include shipping/delivery time</li>
				</ul>
			</section>

			<section>
				<h2 class="mb-4 text-2xl font-semibold text-text-primary">Free Shipping</h2>
				<p class="leading-relaxed text-text-secondary">
					Enjoy free shipping on all orders above ₦30,000 within Nigeria. This offer applies
					automatically at checkout — no coupon code needed.
				</p>
			</section>

			<section>
				<h2 class="mb-4 text-2xl font-semibold text-text-primary">International Shipping</h2>
				<p class="leading-relaxed text-text-secondary">
					Currently, we primarily ship within Nigeria. For international delivery requests, please
					contact us via
					<a href="https://wa.me/2349063497162" class="text-accent hover:underline">WhatsApp</a>
					or our
					<a href="/contact" class="text-accent hover:underline">contact page</a>
					and we will do our best to accommodate your request. International shipping rates and timelines
					vary by destination.
				</p>
			</section>

			<section>
				<h2 class="mb-4 text-2xl font-semibold text-text-primary">Order Tracking</h2>
				<p class="leading-relaxed text-text-secondary">
					Once your order is shipped, you will receive a tracking number via email or SMS. You can
					also track your order anytime using our
					<a href="/track" class="text-accent hover:underline">Order Tracking</a>
					page.
				</p>
			</section>

			<section>
				<h2 class="mb-4 text-2xl font-semibold text-text-primary">Delivery Issues</h2>
				<ul class="ml-6 list-disc space-y-2 text-text-secondary">
					<li>
						If you are not available at the time of delivery, our courier will attempt redelivery
					</li>
					<li>Please ensure your shipping address and phone number are accurate at checkout</li>
					<li>
						Delivery times are estimates and may vary during peak seasons or due to unforeseen
						circumstances
					</li>
					<li>
						For delivery-related concerns, please
						<a href="/contact" class="text-accent hover:underline">contact us</a>
						immediately
					</li>
				</ul>
			</section>

			<section class="rounded-xl bg-bg-secondary p-6 text-center">
				<h2 class="mb-3 text-xl font-semibold text-text-primary">Need Help With Shipping?</h2>
				<p class="mb-4 text-text-secondary">Reach out to us and we will be happy to assist you.</p>
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
			</section>
		</div>
	</div>
</div>
