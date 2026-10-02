import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { API_BASE_URL } from '../config/api.config';
import { CATEGORIES } from '../data/categories';
import { ApiProduct, Category, Product, ProductQuery } from '../models/shop.models';

export type ProductsStatus = 'loading' | 'ready' | 'error';

/**
 * The Product API has no "featured" flag yet, so the first 6 products returned by
 * the API are used as the temporary featured list on the home page.
 */
const FEATURED_LIMIT = 6;
const DEFAULT_EMOJI = '📦';
const DEFAULT_GRADIENT = 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);

  private readonly productsState = signal<Product[]>([]);
  private readonly categoriesState = signal<Category[]>([...CATEGORIES]);
  private readonly statusState = signal<ProductsStatus>('loading');
  private readonly errorState = signal<string | null>(null);

  readonly products = this.productsState.asReadonly();
  readonly categories = this.categoriesState.asReadonly();
  readonly status = this.statusState.asReadonly();
  readonly errorMessage = this.errorState.asReadonly();

  constructor() {
    this.fetch();
  }

  /** Refetches the product list from the API (used by error-state retry buttons). */
  reload(): void {
    this.fetch();
  }

  all(): Product[] {
    return this.productsState();
  }

  featured(): Product[] {
    return this.productsState().slice(0, FEATURED_LIMIT);
  }

  byId(id: string | null | undefined): Product | undefined {
    if (!id) {
      return undefined;
    }
    return this.productsState().find((product) => product.id === id);
  }

  byCategory(categoryId: string): Product[] {
    const normalized = categoryId.trim().toLowerCase();
    return this.productsState().filter(
      (product) => product.category.trim().toLowerCase() === normalized,
    );
  }

  /** Resolves a display name for a category value coming from the API (case-insensitive). */
  categoryName(categoryId: string): string | undefined {
    const normalized = categoryId.trim().toLowerCase();
    return this.categoriesState().find(
      (category) =>
        category.id.toLowerCase() === normalized ||
        category.name.toLowerCase() === normalized,
    )?.name;
  }

  search(query: ProductQuery = {}): Product[] {
    const term = (query.query ?? '').trim().toLowerCase();
    const category =
      query.category && query.category !== 'all' ? query.category.trim().toLowerCase() : '';

    return this.productsState().filter((product) => {
      if (category && product.category.trim().toLowerCase() !== category) {
        return false;
      }
      if (!term) {
        return true;
      }
      const haystack =
        `${product.name} ${product.description} ${this.categoryName(product.category) ?? product.category}`.toLowerCase();
      return haystack.includes(term);
    });
  }

  private fetch(): void {
    this.statusState.set('loading');
    this.errorState.set(null);

    this.http.get<ApiProduct[]>(`${API_BASE_URL}/api/Products`).subscribe({
      next: (data) => {
        this.productsState.set(data.map((dto) => this.mapApiProduct(dto)));
        this.statusState.set('ready');
      },
      error: () => {
        this.statusState.set('error');
        this.errorState.set(
          'We could not load products. Check your connection and try again.',
        );
      },
    });
  }

  private mapApiProduct(dto: ApiProduct): Product {
    const visuals = this.visualsFor(dto.category);
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description ?? '',
      price: dto.price,
      imageUrl: dto.imageUrl?.trim() || undefined,
      category: dto.category,
      stock: dto.stockQuantity,
      createdAt: dto.createdAt,
      emoji: visuals.emoji,
      gradient: visuals.gradient,
    };
  }

  private visualsFor(category: string): { emoji: string; gradient: string } {
    const normalized = category.trim().toLowerCase();
    const match = this.categoriesState().find(
      (candidate) =>
        candidate.id.toLowerCase() === normalized ||
        candidate.name.toLowerCase() === normalized,
    );

    return {
      emoji: match?.emoji ?? DEFAULT_EMOJI,
      gradient: match?.gradient ?? DEFAULT_GRADIENT,
    };
  }
}
