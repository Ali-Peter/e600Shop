import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { API_BASE_URL } from '../../core/config/api.config';
import { ApiProduct } from '../../core/models/shop.models';
import { Home } from './home';

const PRODUCTS_URL = `${API_BASE_URL}/api/Products`;

function apiProduct(overrides: Partial<ApiProduct> = {}): ApiProduct {
  return {
    id: 'p1',
    name: 'Aurora wireless headphones',
    description: 'Immersive over-ear sound with active noise cancellation.',
    price: 45000,
    imageUrl: null,
    category: 'Electronics',
    stockQuantity: 5,
    createdAt: '2026-01-05T09:15:00Z',
    ...overrides,
  };
}

import { Routes } from '@angular/router';

const routes: Routes = [{ path: '', component: Home }];

describe('Home', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
  });

  async function render() {
    const harness = await RouterTestingHarness.create('/');
    return { harness, native: harness.routeNativeElement as HTMLElement };
  }

  it('shows a loading state until the API responds', async () => {
    const { native } = await render();

    expect(native.querySelector('.state-block')?.textContent).toContain('Loading products');
    http.expectOne(PRODUCTS_URL).flush([apiProduct()]);
  });

  it('renders the featured products returned by the API', async () => {
    const { harness, native } = await render();

    http.expectOne(PRODUCTS_URL).flush([apiProduct()]);
    harness.detectChanges();

    expect(native.querySelectorAll('app-product-card').length).toBe(1);
    expect(native.querySelector('.state-block')).toBeFalsy();
  });

  it('renders the shared free-shipping threshold as NGN', async () => {
    const { harness, native } = await render();
    http.expectOne(PRODUCTS_URL).flush([]);
    harness.detectChanges();

    expect(native.querySelector('.hero-text')?.textContent).toContain('\u20A6');
  });

  it('shows an error state and retries via reload()', async () => {
    const { harness, native } = await render();

    http.expectOne(PRODUCTS_URL).error(new ProgressEvent('error'));
    harness.detectChanges();

    const alert = native.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('We could not load products');

    (alert?.querySelector('button') as HTMLButtonElement).click();
    http.expectOne(PRODUCTS_URL).flush([apiProduct()]);
    harness.detectChanges();

    expect(native.querySelector('[role="alert"]')).toBeFalsy();
    expect(native.querySelectorAll('app-product-card').length).toBe(1);
  });
});