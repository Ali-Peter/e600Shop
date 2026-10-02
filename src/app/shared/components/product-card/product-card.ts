import { CurrencyPipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../../core/models/shop.models';
import { CartService } from '../../../core/services/cart.service';
import { ProductService } from '../../../core/services/product.service';

@Component({
  selector: 'app-product-card',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
})
export class ProductCard {
  readonly product = input.required<Product>();

  private readonly cart = inject(CartService);
  private readonly productService = inject(ProductService);
  private readonly destroyRef = inject(DestroyRef);
  private timer: ReturnType<typeof setTimeout> | undefined;

  readonly added = signal(false);

  private readonly imageFailedUrl = signal<string | null>(null);

  /** True when the API image URL exists and has not failed to load. */
  readonly showImage = computed(() => {
    const url = this.product().imageUrl;
    return !!url && this.imageFailedUrl() !== url;
  });

  readonly categoryName = computed(
    () => this.productService.categoryName(this.product().category) ?? '',
  );

  onImageError(): void {
    this.imageFailedUrl.set(this.product().imageUrl ?? null);
  }

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.timer) {
        clearTimeout(this.timer);
      }
    });
  }

  addToCart(): void {
    this.cart.add(this.product());
    this.added.set(true);
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => this.added.set(false), 1800);
  }
}
