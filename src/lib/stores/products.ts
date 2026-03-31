import { writable, derived } from 'svelte/store';
import { pb, getFirstImage, type Product, type Category } from '$lib/pocketbase';

export const products = writable<Product[]>([]);
export const categories = writable<Category[]>([]);
export const featuredProducts = writable<Product[]>([]);
export const isLoading = writable(false);

export const searchQuery = writable('');
export const selectedCategory = writable<string | null>(null);
export const sortBy = writable<'newest' | 'price-asc' | 'price-desc' | 'popular'>('newest');

export const filteredProducts = derived(
  [products, searchQuery, selectedCategory, sortBy],
  ([$products, $searchQuery, $selectedCategory, $sortBy]) => {
    let filtered = [...$products];

    if ($searchQuery) {
      const query = $searchQuery.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
      );
    }

    if ($selectedCategory) {
      filtered = filtered.filter(p => p.category === $selectedCategory);
    }

    switch ($sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'popular':
        filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
      default:
        filtered.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
    }

    return filtered;
  }
);

export async function fetchProducts() {
  isLoading.set(true);
  try {
    const records = await pb.collection('products').getFullList<Product>({
      sort: '-created'
    });
    products.set(records);
  } catch (error) {
    console.error('Failed to fetch products:', error);
    products.set(getMockProducts());
  } finally {
    isLoading.set(false);
  }
}

export async function fetchCategories() {
  try {
    const records = await pb.collection('categories').getFullList<Category>({
      sort: 'name'
    });
    categories.set(records);
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    categories.set(getMockCategories());
  }
}

export async function fetchProductById(id: string): Promise<Product | null> {
  try {
    const record = await pb.collection('products').getOne<Product>(id);
    return record;
  } catch (error) {
    const mock = getMockProducts().find(p => p.id === id);
    return mock || null;
  }
}

export async function fetchFeaturedProducts() {
  try {
    const records = await pb.collection('products').getFullList<Product>({
      filter: 'featured = true',
      limit: 4
    });
    featuredProducts.set(records);
  } catch (error) {
    const mockFeatured = getMockProducts().filter(p => p.featured).slice(0, 4);
    featuredProducts.set(mockFeatured);
  }
}

function getMockCategories(): Category[] {
  return [
    { id: '1', name: 'Clothing', slug: 'clothing', description: 'Premium apparel', image: '', parent: '', created: '', updated: '' },
    { id: '2', name: 'Accessories', slug: 'accessories', description: 'Luxury accessories', image: '', parent: '', created: '', updated: '' },
    { id: '3', name: 'Footwear', slug: 'footwear', description: 'Designer shoes', image: '', parent: '', created: '', updated: '' },
    { id: '4', name: 'Watches', slug: 'watches', description: 'Timepieces', image: '', parent: '', created: '', updated: '' }
  ];
}

function getMockProducts(): Product[] {
  return [
    {
      id: '1',
      name: 'Silk Blend Blazer',
      slug: 'silk-blend-blazer',
      description: 'Exquisite silk blend blazer with modern tailoring. Perfect for both formal occasions and elevated casual wear. Features a single-button closure, peak lapels, and a slim fit silhouette.',
      price: 895,
      comparePrice: 1295,
      images: ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800'],
      category: '1',
      stock: 15,
      sku: 'BLZ-001',
      featured: true,
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Cashmere Sweater',
      slug: 'cashmere-sweater',
      description: 'Luxuriously soft 100% cashmere sweater. Timeless crew neck design that pairs perfectly with any outfit. Sustainably sourced from Inner Mongolia.',
      price: 495,
      comparePrice: 695,
      images: ['https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800'],
      category: '1',
      stock: 23,
      sku: 'SWT-002',
      featured: true,
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    },
    {
      id: '3',
      name: 'Leather Tote Bag',
      slug: 'leather-tote-bag',
      description: 'Handcrafted Italian leather tote bag. Spacious interior with multiple pockets. Gold-tone hardware and removable shoulder strap. A statement piece for the discerning collector.',
      price: 1295,
      comparePrice: 1595,
      images: ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800'],
      category: '2',
      stock: 8,
      sku: 'BAG-003',
      featured: true,
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    },
    {
      id: '4',
      name: 'Classic Oxford Shoes',
      slug: 'classic-oxford-shoes',
      description: 'Hand-stitched leather oxford shoes. Goodyear welted construction for durability and comfort. Italian leather upper with leather sole.',
      price: 645,
      comparePrice: 895,
      images: ['https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=800'],
      category: '3',
      stock: 12,
      sku: 'SHO-004',
      featured: true,
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    },
    {
      id: '5',
      name: 'Minimalist Watch',
      slug: 'minimalist-watch',
      description: 'Swiss-made automatic movement. Sapphire crystal glass. Italian leather strap. Water resistant to 50m. The perfect everyday timepiece.',
      price: 1895,
      comparePrice: 2295,
      images: ['https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800'],
      category: '4',
      stock: 5,
      sku: 'WTC-005',
      featured: false,
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    },
    {
      id: '6',
      name: 'Silk Scarf',
      slug: 'silk-scarf',
      description: '100% Mulberry silk scarf. Hand-rolled edges. Exclusive print designed by renowned artist. Versatile accessory that elevates any outfit.',
      price: 295,
      comparePrice: 395,
      images: ['https://images.unsplash.com/photo-1601370690183-1c7796ecec61?w=800'],
      category: '2',
      stock: 30,
      sku: 'SCF-006',
      featured: false,
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    },
    {
      id: '7',
      name: 'Wool Overcoat',
      slug: 'wool-overcoat',
      description: 'Double-breasted wool overcoat. Premium Italian wool blend. Classic silhouette with modern proportions. Fully lined with satin.',
      price: 1495,
      comparePrice: 1995,
      images: ['https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800'],
      category: '1',
      stock: 7,
      sku: 'COT-007',
      featured: false,
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    },
    {
      id: '8',
      name: 'Gold Cufflinks',
      slug: 'gold-cufflinks',
      description: '18k gold plated cufflinks. Enamel inlay with geometric pattern. Presentation box included. The perfect gift for the distinguished gentleman.',
      price: 395,
      comparePrice: 495,
      images: ['https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=800'],
      category: '2',
      stock: 18,
      sku: 'CUF-008',
      featured: false,
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    }
  ];
}

export function getMockProductById(id: string): Product | undefined {
  return getMockProducts().find(p => p.id === id);
}

export function getProductImage(product: Product): string {
  if (product.images && product.images.length > 0) {
    const img = product.images[0];
    if (img.startsWith('http')) return img;
    return img;
  }
  return 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800';
}
