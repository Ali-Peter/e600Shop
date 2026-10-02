export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  originalPrice?: number;
  category: string;
  rating?: number;
  reviews?: number;
  stock: number;
  emoji: string;
  gradient: string;
  featured?: boolean;
  badge?: string;
  createdAt?: string;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  description: string;
  gradient: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ProductQuery {
  query?: string;
  category?: string;
}

/** Shape of a product exactly as returned by the ASP.NET Core Product API. */
export interface ApiProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  category: string;
  stockQuantity: number;
  createdAt: string;
}
