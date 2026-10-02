import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Routes } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { API_BASE_URL } from '../../core/config/api.config';
import { ApiProduct } from '../../core/models/shop.models';
import { Products } from './products';

const PRODUCTS_URL = `${API_BASE_URL}/api/Products`;
const routes: Routes = [{ path: 'products', component: Products }];

const CATALOGUE: ApiProduct[] = [
  {
    id: 'p1',
    name: 'Aurora wireless headphones',
    description: 'Immersive over-ear sound with active noise cancellation.',
    price: 45000,
    imageUrl: null,
    category: 'Electronics',
    stockQuantity: 5,
    createdAt: '2026-01-05T09:15:00Z',
  },
  {
    id: 'p2',
    name: 'Trail running shoes',
    description: 'Lightweight runners built for long distances.',
    price: 32000,
    imageUrl: null,
    category: 'Fashion',
    stockQuantity: 0,
    createdAt: '2026-01-06T09:15:00Z',
  },
];

describe('Products', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Products],
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
  });

  async function render(url = '/products') {
    const harness = await RouterTestingHarness.create(url);
    return { harness, native: harness.routeNativeElement as HTMLElement };
  }

  it('shows a loading state until the API responds', async () => {
    const { native } = await render();

    expect(native.querySelector('.state-block')?.textContent).toContain('Loading products');
    http.expectOne(PRODUCTS_URL).flush(CATALOGUE);
  });

  it('lists every product returned by the API', async () => {
    const { harness, native } = await render();

    http.expectOne(PRODUCTS_URL).flush(CATALOGUE);
    harness.detectChanges();

    expect(native.querySelectorAll('app-product-card').length).toBe(2);
    expect(native.querySelector('.empty-state')).toBeFalsy();
  });

  it('filters by the category query parameter, matching the API casing', async () => {
    const { harness, native } = await render('/products?category=electronics');

    http.expectOne(PRODUCTS_URL).flush(CATALOGUE);
    harness.detectChanges();

    const cards = native.querySelectorAll('app-product-card');
    expect(cards.length).toBe(1);
    expect(cards[0].textContent).toContain('Aurora wireless headphones');

    // The shop category id ("electronics") maps onto the API value ("Electronics").
    expect(native.querySelector('.filter-note')?.textContent).toContain('Electronics');
  });

  it('shows an empty state when nothing matches the search term', async () => {
    const { harness, native } = await render('/products?q=nonexistent');

    http.expectOne(PRODUCTS_URL).flush(CATALOGUE);
    harness.detectChanges();

    expect(native.querySelector('.empty-state')?.textContent).toContain('No products found');
    expect(native.querySelectorAll('app-product-card').length).toBe(0);
  });

  it('shows an error state and retries via reload()', async () => {
    const { harness, native } = await render();

    http.expectOne(PRODUCTS_URL).error(new ProgressEvent('error'));
    harness.detectChanges();

    const alert = native.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('We could not load products');

    (alert?.querySelector('button') as HTMLButtonElement).click();
    http.expectOne(PRODUCTS_URL).flush(CATALOGUE);
    harness.detectChanges();

    expect(native.querySelector('[role="alert"]')).toBeFalsy();
    expect(native.querySelectorAll('app-product-card').length).toBe(2);
  });
});