import PocketBase from 'pocketbase';

export const PB_URL = 'http://127.0.0.1:8090';

export const pb = new PocketBase(PB_URL);

export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  phone: string;
  avatar: string;
  role: 'admin' | 'customer';
  wishlist: string[];
  created: string;
  updated: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  parent: string;
  created: string;
  updated: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice: number;
  images: string[];
  category: string;
  categoryData?: Category;
  stock: number;
  sku: string;
  featured: boolean;
  created: string;
  updated: string;
}

export interface Order {
  id: string;
  user: string;
  userData?: User;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  created: string;
  updated: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
}

export interface ShippingAddress {
  name: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface Review {
  id: string;
  user: string;
  userData?: User;
  product: string;
  productData?: Product;
  rating: number;
  comment: string;
  approved: boolean;
  created: string;
}

export function getImageUrl(collection: string, id: string, filename: string): string {
  return `${PB_URL}/api/files/${collection}/${id}/${filename}`;
}

export function getFirstImage(product: Product): string {
  if (product.images && product.images.length > 0) {
    return getImageUrl('products', product.id, product.images[0]);
  }
  return '/placeholder-product.svg';
}
