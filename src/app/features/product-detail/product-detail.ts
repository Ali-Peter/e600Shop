import { CurrencyPipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { Product } from '../../core/models/shop.models';
import { CartService, FREE_SHIPPING_THRESHOLD } from '../../core/services/cart.service';
import { ProductService } from '../../core/services/product.service';
import { ProductCard } from '../../shared/components/product-card/product-card';
import { QtyStepper } from '../../shared/components/qty-stepper/qty-stepper';

@Component({
  selector: 'app-product-detail',
  imports: [RouterLink, CurrencyPipe, ProductCard, QtyStepper],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
})
export class ProductDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productService = inject(ProductService);
  private readonly cart = inject(CartService);
  private readonly destroyRef = inject(DestroyRef);
  private timer: ReturnType<typeof setTimeout> | undefined;

  private readonly productId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? '')),
    { initialValue: '' },
  );

  readonly product = computed(() => this.productService.byId(this.productId()));

  readonly categoryName = computed(() => {
    const current = this.product();
    return current ? (this.productService.categoryName(current.category) ?? '') : '';
  });

  readonly related = computed(() => {
    const current = this.product();
    if (!current) {
      return [];
    }
    return this.productService
      .byCategory(current.category)
      .filter((item) => item.id !== current.id)
      .slice(0, 4);
  });

  readonly status = this.productService.status;
  readonly errorMessage = this.productService.errorMessage;

  private readonly imageFailedUrl = signal<string | null>(null);

  /** True when the API image URL exists and has not failed to load. */
  readonly showImage = computed(() => {
    const current = this.product();
    return !!current?.imageUrl && this.imageFailedUrl() !== current.imageUrl;
  });

  readonly freeShippingThreshold = FREE_SHIPPING_THRESHOLD;
  readonly quantity = signal(1);
  readonly added = signal(false);

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.timer) {
        clearTimeout(this.timer);
      }
    });
  }

  retry(): void {
    this.productService.reload();
  }

  onImageError(): void {
    this.imageFailedUrl.set(this.product()?.imageUrl ?? null);
  }

  savingsPercent(product: Product): number {
    const was = product.originalPrice;
    if (!was || was <= product.price) {
      return 0;
    }
    return Math.round((1 - product.price / was) * 100);
  }

  addToCart(): void {
    const current = this.product();
    if (!current || current.stock === 0) {
      return;
    }
    this.cart.add(current, this.quantity());
    this.added.set(true);
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => this.added.set(false), 2000);
  }

  buyNow(): void {
    this.addToCart();
    void this.router.navigate(['/checkout']);
  }
}
