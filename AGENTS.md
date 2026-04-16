# AGENTS.md

## Dev Commands

```sh
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run check        # svelte-kit sync + svelte-check (required before committing)
npm run lint         # prettier --check . && eslint .
npm run format       # prettier --write .
npm run test:unit    # vitest (runs client + server tests)
npm run test:e2e     # playwright (requires build first: npm run build && npm run preview)
npm run test         # Runs both unit and e2e tests
```

**Order matters**: Run `npm run check` before committing. E2E tests build first via `webServer` in playwright.config.ts.

## Tech Stack

- SvelteKit 2.x with Svelte 5 runes mode
- Tailwind CSS 4.x (configured via `@tailwindcss/vite`)
- PocketBase backend (remote: `https://playgzero.pb.itcass.net`)
- GSAP, Lenis (smooth scroll), Three.js/Threlte (3D effects)

## Architecture

- **Stores**: `src/lib/stores/*.ts` (cart, wishlist, auth, products, reviews, toast)
- **Components**: `src/lib/components/` (ui/, layout/, product/)
- **Routes**: `src/routes/` - standard SvelteKit file-based routing
- **Admin**: `/admin/*` routes for dashboard, products, orders, reviews, categories

## Testing

- **Unit tests**: `src/**/*.{test,spec}.{js,ts}` (exclude svelte component tests)
- **Svelte component tests**: `src/**/*.svelte.{test,spec}.{js,ts}` (browser mode with playwright)
- **E2E tests**: `**/*.e2e.{ts,js}` (require build + preview server)

## PocketBase

- URL: `https://playgzero.pb.itcass.net`
- Use `getImageUrl(collection, id, filename)` or `getFirstImage(product)` from `$lib/pocketbase` to construct image URLs
- Images can be stored as JSON array or comma-separated string in `products.images` field

## Important Patterns

- `src/routes/+layout.svelte` wraps all pages
- Use `$lib/stores/` for client-side state (cart persisted in localStorage)
- Admin routes use `$lib/stores/auth` for role-based access (`isAdmin` field)
