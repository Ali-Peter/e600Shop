import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../config/api.config';
import { ApiProduct, Product } from '../models/shop.models';
import { ProductService } from './product.service';

const PRODUCTS_URL = `${API_BASE_URL}/api/Products`;

/** Minimal product payload as returned by the ASP.NET Core Product API. */
function apiProduct(overrides: Partial<ApiProduct> = {}): ApiProduct {
  return {
    id: 'a1b2c3',
    name: 'Wireless Bluetooth Headphones',
    description: 'Over-ear headphones with active noise cancelling.',
    price: 45000,
    imageUrl: 'https://picsum.photos/seed/headphones/600/600',
    category: 'Electronics',
    stockQuantity: 25,
    createdAt: '2026-01-05T09:15:00Z',
    ...overrides,
  };
}

function requestProducts(http: HttpTestingController): void {
  http.expectOne(PRODUCTS_URL).flush([
    apiProduct({
      description: 'Immersive over-ear sound with active noise cancellation.',
      imageUrl: 'https://cdn.example.com/nova-headphones.png',
    }),
    apiProduct({ id: 'x9y8z7', name: 'Running Shoes', category: 'Fashion', stockQuantity: 0 }),
  ]);
}

function setup(): { service: ProductService; http: HttpTestingController } {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });

  return {
    service: TestBed.inject(ProductService),
    http: TestBed.inject(HttpTestingController),
  };
}

describe('ProductService', () => {
  it('requests the product list from the configured API on construction', () => {
    const { http } = setup();

    const request = http.expectOne(PRODUCTS_URL);
    expect(request.request.method).toBe('GET');
    request.flush([apiProduct()]);
    http.verify();
  });

  it('maps API products onto the frontend model', () => {
    const { service, http } = setup();
    requestProducts(http);
    http.verify();

    expect(service.status()).toBe('ready');
    expect(service.errorMessage()).toBeNull();

    const product = service.all()[0];
    expect(product).toMatchObject<Partial<Product>>({
      id: 'a1b2c3',
      name: 'Wireless Bluetooth Headphones',
      price: 45000,
      stock: 25, // API `stockQuantity` -> frontend `stock`
      category: 'Electronics',
      imageUrl: 'https://cdn.example.com/nova-headphones.png',
      createdAt: '2026-01-05T09:15:00Z',
    });

    // Visual fallbacks are derived from the (case-insensitive) category.
    expect(product.emoji).toBe('🎧');
    expect(product.gradient).toContain('linear-gradient');

    // Fields the API does not supply stay undefined rather than being invented.
    expect(product.rating).toBeUndefined();
    expect(product.reviews).toBeUndefined();
    expect(product.originalPrice).toBeUndefined();
    expect(product.badge).toBeUndefined();
  });

  it('exposes loading and error state when the API call fails', () => {
    const { service, http } = setup();

    expect(service.status()).toBe('loading');

    http.expectOne(PRODUCTS_URL).flush('boom', {
      status: 500,
      statusText: 'Server Error',
    });
    http.verify();

    expect(service.status()).toBe('error');
    expect(service.errorMessage()).toContain('could not load products');
    expect(service.all()).toEqual([]);
  });

  it('recovers after a failed request when reload() is called', () => {
    const { service, http } = setup();

    http.expectOne(PRODUCTS_URL).error(new ProgressEvent('error'));
    expect(service.status()).toBe('error');

    service.reload();
    http.expectOne(PRODUCTS_URL).flush([apiProduct()]);
    http.verify();

    expect(service.status()).toBe('ready');
    expect(service.errorMessage()).toBeNull();
    expect(service.all()).toHaveLength(1);
  });

  it('surfaces HTTP error details while keeping the message user-friendly', () => {
    const { service, http } = setup();

    http
      .expectOne(PRODUCTS_URL)
      .flush('nope', new HttpErrorResponse({ status: 404, statusText: 'Not Found' }));
    http.verify();

    expect(service.status()).toBe('error');
    expect(service.errorMessage()).not.toContain('Http failure');
  });

  it('matches categories case-insensitively between the API and the shop', () => {
    const { service, http } = setup();
    requestProducts(http);
    http.verify();

    // The API sends "Electronics"; the shop links use the lowercase id "electronics".
    expect(service.byCategory('electronics')).toHaveLength(1);
    expect(service.byCategory('ELECTRONICS')[0].name).toBe('Wireless Bluetooth Headphones');
    expect(service.search({ category: 'fashion' })).toHaveLength(1);
    expect(service.categoryName('electronics')).toBe('Electronics');
    expect(service.categoryName('Electronics')).toBe('Electronics');
  });

  it('searches across name, description and category name', () => {
    const { service, http } = setup();
    requestProducts(http);
    http.verify();

    expect(service.search({ query: 'Bluetooth' })).toHaveLength(1);
    expect(service.search({ query: 'Running Shoes' })).toHaveLength(1);
    expect(service.search({ query: 'NOISE cancelling' })).toHaveLength(1);
    expect(service.search({ query: 'Electronics' })).toHaveLength(1);
    expect(service.search({ query: 'nothing here' })).toHaveLength(0);
    expect(service.search({ query: 'Electronics', category: 'fashion' })).toHaveLength(0);
    expect(service.search({ query: '', category: 'all' })).toHaveLength(2);
  });

  it('treats the first six API products as featured', () => {
    const { service, http } = setup();

    const many = Array.from({ length: 8 }, (_, index) =>
      apiProduct({ id: `id-${index}`, name: `Product ${index}` }),
    );
    http.expectOne(PRODUCTS_URL).flush(many);
    http.verify();

    expect(service.featured()).toHaveLength(6);
    expect(service.featured()[0].id).toBe('id-0');
    expect(service.featured()[5].id).toBe('id-5');
  });

  it('looks products up by id and ignores missing ids', () => {
    const { service, http } = setup();
    requestProducts(http);
    http.verify();

    expect(service.byId('x9y8z7')?.name).toBe('Running Shoes');
    expect(service.byId('missing')).toBeUndefined();
    expect(service.byId(undefined)).toBeUndefined();
    expect(service.byId('')).toBeUndefined();
  });

  it('treats a blank image URL as "no image"', () => {
    const { service, http } = setup();
    http.expectOne(PRODUCTS_URL).flush([apiProduct({ imageUrl: '   ' })]);
    http.verify();

    expect(service.all()[0].imageUrl).toBeUndefined();
  });

  it('falls back to generic visuals for unknown categories', () => {
    const { service, http } = setup();
    http.expectOne(PRODUCTS_URL).flush([apiProduct({ category: 'Groceries' })]);
    http.verify();

    const product = service.all()[0];
    expect(product.emoji).toBe('📦');
    expect(product.gradient).toContain('linear-gradient');
    expect(service.categoryName(product.category)).toBeUndefined();
  });
});
