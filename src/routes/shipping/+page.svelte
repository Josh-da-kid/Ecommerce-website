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
				<h2 class="mb-4 text-2xl font-semibold text-text-primary">Pickup Station</h2>
				<div class="rounded-xl border-2 border-accent/30 bg-accent/5 p-6">
					<div class="flex items-start gap-4">
						<div
							class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10"
						>
							<svg
								class="h-6 w-6 text-accent"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
								/>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
								/>
							</svg>
						</div>
						<div>
							<h3 class="text-lg font-semibold text-text-primary">Kubwa, Abuja</h3>
							<p class="mt-1 text-text-secondary">FCT - Abuja, Nigeria</p>
							<ul class="mt-3 space-y-1 text-sm text-text-secondary">
								<li>Orders are ready for pickup within 1-3 business days</li>
								<li>You will receive a notification when your order is ready</li>
								<li>Pay on pickup available (cash or card)</li>
								<li>Bring your order ID and a valid ID for verification</li>
							</ul>
						</div>
					</div>
				</div>
			</section>

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
				<h2 class="mb-4 text-2xl font-semibold text-text-primary">Payment Options</h2>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div class="rounded-xl border border-border p-6">
						<div class="mb-3 flex items-center gap-3">
							<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-bg-secondary">
								<svg
									class="h-5 w-5 text-text-muted"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M3 10h18M7 15h1m2 0h1m-2 5h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z"
									/>
								</svg>
							</div>
							<h3 class="font-semibold text-text-primary">Bank Transfer</h3>
						</div>
						<p class="text-sm text-text-secondary">
							Transfer to our Moniepoint account (Urazbox Enterprise). Payment must be confirmed
							within 30 minutes of placing your order.
						</p>
					</div>
					<div class="rounded-xl border border-border p-6">
						<div class="mb-3 flex items-center gap-3">
							<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-bg-secondary">
								<svg
									class="h-5 w-5 text-text-muted"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
									/>
								</svg>
							</div>
							<h3 class="font-semibold text-text-primary">Pay on Pickup</h3>
						</div>
						<p class="text-sm text-text-secondary">
							Pay with cash or card when you pick up your order at our Kubwa, Abuja station.
							Available for pickup orders only.
						</p>
					</div>
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
