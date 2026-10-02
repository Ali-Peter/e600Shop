import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { API_BASE_URL } from '../../../core/config/api.config';
import { ApiProduct } from '../../../core/models/shop.models';
import { ProductService } from '../../../core/services/product.service';
import { ProductCard } from './product-card';

const PRODUCTS_URL = `${API_BASE_URL}/api/Products`;

const API_PRODUCT: ApiProduct = {
  id: 'p1',
  name: 'Aurora wireless headphones',
  description: 'Immersive over-ear sound with active noise cancellation.',
  price: 45000,
  imageUrl: 'https://picsum.photos/seed/aurora/600/600',
  category: 'Electronics',
  stockQuantity: 4,
  createdAt: '2026-01-05T09:15:00Z',
};

describe('ProductCard', () => {
  let http: HttpTestingController;
  let service: ProductService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCard],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(ProductService);
    // ProductService fetches on construction - resolve it so cards can resolve names.
    http.expectOne(PRODUCTS_URL).flush([API_PRODUCT]);
  });

  function render(product = service.all()[0]) {
    const fixture = TestBed.createComponent(ProductCard);
    fixture.componentRef.setInput('product', product);
    fixture.detectChanges();
    return fixture;
  }

  it('renders the API image and the category display name', () => {
    const fixture = render();
    const native = fixture.nativeElement as HTMLElement;

    const image = native.querySelector('img.product-image') as HTMLImageElement | null;
    expect(image?.getAttribute('src')).toBe(API_PRODUCT.imageUrl);
    expect(native.querySelector('.product-category')?.textContent).toContain('Electronics');
  });

  it('falls back to the category emoji when the product has no image', () => {
    const fixture = render({ ...service.all()[0], imageUrl: undefined });
    const native = fixture.nativeElement as HTMLElement;

    expect(native.querySelector('img.product-image')).toBeFalsy();
    expect(native.querySelector('.product-emoji')?.textContent).toContain('\uD83C\uDFA7');
  });

  it('swaps the image for the emoji tile when loading fails', () => {
    const fixture = render();
    const native = fixture.nativeElement as HTMLElement;

    native.querySelector('img.product-image')?.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(native.querySelector('img.product-image')).toBeFalsy();
    expect(native.querySelector('.product-emoji')?.textContent).toContain('\uD83C\uDFA7');
  });

  it('renders the price in Nigerian Naira', () => {
    const fixture = render();
    const native = fixture.nativeElement as HTMLElement;

    const price = native.querySelector('.price-current')?.textContent ?? '';
    expect(price).toContain('\u20A6');
    expect(price.replace(/\s/g, '')).toContain('45,000');
  });

  it('hides the rating row for products without ratings', () => {
    const fixture = render();
    expect(fixture.nativeElement.querySelector('.product-rating')).toBeFalsy();
  });
});
