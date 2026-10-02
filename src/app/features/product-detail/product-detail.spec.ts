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
import { ProductDetail } from './product-detail';

const PRODUCTS_URL = `${API_BASE_URL}/api/Products`;
const routes: Routes = [{ path: 'products/:id', component: ProductDetail }];

function apiProduct(overrides: Partial<ApiProduct> = {}): ApiProduct {
  return {
    id: 'p1',
    name: 'Aurora wireless headphones',
    description: 'Immersive over-ear sound with active noise cancellation.',
    price: 45000,
    imageUrl: null,
    category: 'Electronics',
    stockQuantity: 3,
    createdAt: '2026-01-05T09:15:00Z',
    ...overrides,
  };
}

describe('ProductDetail', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductDetail],
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
  });

  async function render(url: string) {
    const harness = await RouterTestingHarness.create(url);
    return { harness, native: harness.routeNativeElement as HTMLElement };
  }

  it('shows a loading state until the API responds', async () => {
    const { native } = await render('/products/p1');

    expect(native.querySelector('.state-block')?.textContent).toContain('Loading product');
    http.expectOne(PRODUCTS_URL).flush([apiProduct()]);
  });

  it('renders the product matched by the route id', async () => {
    const { harness, native } = await render('/products/p1');

    http.expectOne(PRODUCTS_URL).flush([
      apiProduct(),
      apiProduct({ id: 'p2', name: 'Trail running shoes', category: 'Fashion' }),
    ]);
    harness.detectChanges();

    expect(native.querySelector('h1')?.textContent).toContain('Aurora wireless headphones');
    expect(native.querySelector('.detail-category')?.textContent).toContain('Electronics');
    expect(native.querySelector('.detail-stock')?.textContent).toContain('In stock');
  });

  it('shows only same-category products as related', async () => {
    const { harness, native } = await render('/products/p1');

    http.expectOne(PRODUCTS_URL).flush([
      apiProduct(),
      apiProduct({ id: 'p2', name: 'Trail running shoes', category: 'Fashion' }),
      apiProduct({ id: 'p3', name: 'Studio monitor speakers', category: 'Electronics' }),
    ]);
    harness.detectChanges();

    const related = native.querySelector('.related');
    expect(related?.textContent).toContain('Studio monitor speakers');
    expect(related?.textContent).not.toContain('Trail running shoes');
  });

  it('renders the price as NGN and falls back to the emoji tile', async () => {
    const { harness, native } = await render('/products/p1');

    http.expectOne(PRODUCTS_URL).flush([apiProduct()]);
    harness.detectChanges();

    const price = native.querySelector('.price-current')?.textContent ?? '';
    expect(price).toContain('\u20A6');
    expect(price.replace(/\s/g, '')).toContain('45,000');

    expect(native.querySelector('img.detail-image')).toBeFalsy();
    expect(native.querySelector('.detail-emoji')?.textContent).toContain('\uD83C\uDFA7');
  });

  it('shows a not-found state for an unknown id', async () => {
    const { harness, native } = await render('/products/does-not-exist');

    http.expectOne(PRODUCTS_URL).flush([apiProduct()]);
    harness.detectChanges();

    expect(native.querySelector('.not-found')?.textContent).toContain('Product not found');
  });

  it('shows an error state and retries via reload()', async () => {
    const { harness, native } = await render('/products/p1');

    http.expectOne(PRODUCTS_URL).error(new ProgressEvent('error'));
    harness.detectChanges();

    const alert = native.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('We could not load this product');

    (alert?.querySelector('button') as HTMLButtonElement).click();
    http.expectOne(PRODUCTS_URL).flush([apiProduct()]);
    harness.detectChanges();

    expect(native.querySelector('[role="alert"]')).toBeFalsy();
    expect(native.querySelector('h1')?.textContent).toContain('Aurora wireless headphones');
  });
});