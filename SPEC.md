# Premium E-Commerce Platform Specification

## Project Overview

- **Project Name**: Luxe Store
- **Type**: Premium E-Commerce Website with Admin Dashboard
- **Core Functionality**: High-converting online store with product management, cart, checkout, wishlist, reviews, and comprehensive admin dashboard
- **Target Users**: Luxury/product-focused online shoppers and store administrators

---

## Technical Stack

- **Frontend**: SvelteKit 2.x (latest)
- **Styling**: Tailwind CSS 4.x
- **Backend**: PocketBase (Auth, Database, File Storage)
- **Animations**: GSAP 3.x
- **Smooth Scroll**: Lenis
- **3D Effects**: Three.js with Threlte
- **Icons**: Lucide Icons

---

## Design System

### Typography

- **Primary Font**: "Outfit" (Google Fonts) - Modern geometric sans-serif
- **Display Font**: "Playfair Display" (Google Fonts) - Elegant serif for headings
- **Font Sizes**:
  - Display: 72px / 4.5rem
  - H1: 48px / 3rem
  - H2: 36px / 2.25rem
  - H3: 24px / 1.5rem
  - Body: 16px / 1rem
  - Small: 14px / 0.875rem
  - XS: 12px / 0.75rem

### Color Palette

```css
--color-primary: #1a1a1a;          /* Rich Black */
--color-primary-light: #2d2d2d;    /* Charcoal */
--color-accent: #c9a962;           /* Champagne Gold */
--color-accent-hover: #dfc07a;     /* Light Gold */
--color-success: #22c55e;          /* Green */
--color-warning: #f59e0b;          /* Amber */
--color-error: #ef4444;            /* Red */

--color-bg-primary: #fafafa;       /* Off White */
--color-bg-secondary: #f5f5f5;     /* Light Gray */
--color-bg-card: #ffffff;          /* White */
--color-bg-dark: #0f0f0f;          /* Near Black */

--color-text-primary: #1a1a1a;     /* Primary Text */
--color-text-secondary: #6b7280;   /* Secondary Text */
--color-text-muted: #9ca3af;      /* Muted Text */
--color-text-inverse: #ffffff;    /* White Text */

--border-color: #e5e7eb;           /* Light Border */
--border-color-dark: #374151;     /* Dark Border */
```

### Spacing Scale (8px System)

- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px
- 3xl: 64px
- 4xl: 96px

### Border Radius

- sm: 8px
- md: 12px
- lg: 16px
- xl: 24px
- full: 9999px

### Shadows

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
--shadow-glow: 0 0 40px rgba(201, 169, 98, 0.3);
```

### Glassmorphism

```css
background: rgba(255, 255, 255, 0.7);
backdrop-filter: blur(12px);
border: 1px solid rgba(255, 255, 255, 0.3);
```

---

## UI Components

### Buttons

1. **Primary Button**
   - Background: `--color-accent`
   - Text: White
   - Padding: 16px 32px
   - Border Radius: 12px
   - Hover: Lighten 10%, scale 1.02

2. **Secondary Button**
   - Background: Transparent
   - Border: 2px solid `--color-primary`
   - Text: `--color-primary`
   - Padding: 14px 30px

3. **Ghost Button**
   - Background: Transparent
   - Text: `--color-text-secondary`
   - Hover: Background `--color-bg-secondary`

4. **Icon Button**
   - Square, rounded
   - Icon centered

### Cards

- Background: White
- Border Radius: 24px
- Padding: 24px
- Shadow: `--shadow-lg`
- Hover: translateY(-4px), shadow increase

### Form Inputs

- Height: 56px
- Border: 2px solid `--border-color`
- Border Radius: 12px
- Focus: Border color `--color-accent`
- Padding: 16px

### Badges

- Pill shape (full radius)
- Variants: success, warning, error, info
- Small text, padding 4px 12px

### Modals

- Centered, max-width 500px
- Backdrop blur
- Slide-up animation

### Toast Notifications

- Fixed bottom-right
- Slide-in from right
- Auto-dismiss 5s

---

## Page Structure

### 1. Landing Page (`/`)

**Hero Section**
- Full viewport height
- Three.js animated particle background (subtle)
- Large display headline: "Elevate Your Style"
- Subtext with value proposition
- CTA button with hover animation
- Scroll indicator at bottom

**Features Section**
- 4-column grid
- Icon + title + description
- Staggered reveal animation

**Featured Products**
- Section title
- 4-product grid
- Quick view on hover

**Newsletter Section**
- Email capture form
- Glassmorphism card
- Animated input

**Footer**
- 4-column layout
- Links, social, newsletter
- Copyright

### 2. Products Page (`/products`)

- Category filter sidebar (collapsible on mobile)
- Sort dropdown
- Search bar
- Product grid (responsive: 1/2/3/4 columns)
- Pagination or infinite scroll
- Product cards with hover effects

### 3. Product Detail Page (`/products/[id]`)

- Image gallery (main + thumbnails)
- Zoom on hover
- Product info (name, price, description)
- Quantity selector
- Add to cart button
- Stock indicator ("Only X left")
- Wishlist button
- Tabs: Description, Reviews, Shipping
- Related products

### 4. Cart Page (`/cart`)

- List of cart items
- Quantity controls
- Remove button
- Subtotal
- Promo code input
- Checkout button
- Continue shopping link

### 5. Checkout Page (`/checkout`)

- Multi-step form:
  1. Contact info
  2. Shipping address
  3. Payment (UI only - mock)
  4. Review
- Progress indicator
- Order summary sidebar

### 6. Wishlist Page (`/wishlist`)

- Grid of wishlisted products
- Quick add to cart
- Remove from wishlist
- Empty state

### 7. Account Pages

- Login (`/login`)
- Register (`/register`)
- Profile (`/account`)

---

## Admin Dashboard (`/admin`)

### Layout

- Fixed sidebar (240px width)
- Top header with user info
- Main content area
- Responsive: sidebar collapses to icon-only on tablet, drawer on mobile

### Pages

1. **Dashboard** (`/admin`)
   - Stats cards (orders, revenue, products, users)
   - Recent orders table
   - Revenue chart (simple bar chart)

2. **Products** (`/admin/products`)
   - Products table with search
   - Add/Edit product modal
   - Delete confirmation
   - Bulk actions

3. **Orders** (`/admin/orders`)
   - Orders table with status filter
   - Order detail modal
   - Update status dropdown

4. **Reviews** (`/admin/reviews`)
   - Reviews list
   - Approve/Delete actions

5. **Categories** (`/admin/categories`)
   - Category management

6. **Settings** (`/admin/settings`)
   - Site settings (logo, name, etc.)

---

## Animations (GSAP + Lenis)

### Scroll Animations

- Hero text: Fade up on load
- Section headings: Reveal on scroll
- Product cards: Staggered entrance
- Feature icons: Scale in on scroll

### Micro-interactions

- Button hover: Scale + glow
- Card hover: Lift + shadow
- Input focus: Border color + subtle glow
- Add to cart: Button pulse + cart icon bounce

### Page Transitions

- Fade + slide between pages

### Three.js Effects

- Hero: Floating particles with subtle movement
- Performance: Low particle count, simple geometry

---

## PocketBase Schema

### Collections

1. **users** (system)
   - email, username, password
   - name, phone, avatar
   - role: admin | customer
   - wishlist: relation (products)
   - created, updated

2. **categories**
   - name
   - slug
   - description
   - image
   - parent: relation (self)
   - created, updated

3. **products**
   - name
   - slug
   - description
   - price
   - comparePrice (optional)
   - images: file[]
   - category: relation (categories)
   - stock
   - sku
   - featured: bool
   - created, updated

4. **orders**
   - user: relation (users)
   - items: json
   - total
   - status: pending | processing | shipped | delivered | cancelled
   - shippingAddress: json
   - paymentMethod
   - created, updated

5. **reviews**
   - user: relation (users)
   - product: relation (products)
   - rating: number (1-5)
   - comment
   - approved: bool
   - created

---

## Functionality

### Cart

- Persisted in localStorage
- Synced with PocketBase when logged in
- Add, remove, update quantity
- Calculate totals
- Apply promo codes (client-side for demo)

### Wishlist

- Toggle product
- Persisted locally + synced
- Move to cart

### Search

- Client-side filter
- Search by name, description
- Debounced input

### Auth

- PocketBase auth
- Role-based access
- Protected routes

---

## Performance Optimizations

- Lazy load images (loading="lazy")
- Code splitting per route
- Optimized Three.js (simple scene)
- GSAP with ScrollTrigger
- Lenis for smooth scroll
- Minimal JS bundle

---

## Responsive Breakpoints

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px
- Large: > 1280px

---

## Acceptance Criteria

1. Landing page loads with Three.js animation
2. Smooth scroll works throughout
3. Products display in grid with filters
4. Product detail shows gallery, add to cart works
5. Cart persists and calculates totals
6. Checkout flow completes (mock)
7. Admin dashboard shows stats
8. Product CRUD works in admin
9. Responsive on all devices
10. Animations are smooth (60fps)
