import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService, FREE_SHIPPING_THRESHOLD } from '../../core/services/cart.service';
import { ProductService } from '../../core/services/product.service';
import { QtyStepper } from '../../shared/components/qty-stepper/qty-stepper';

@Component({
  selector: 'app-cart',
  imports: [RouterLink, CurrencyPipe, QtyStepper],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart {
  readonly cart = inject(CartService);
  private readonly productService = inject(ProductService);

  readonly freeShippingThreshold = FREE_SHIPPING_THRESHOLD;
  readonly remainingForFreeShipping = computed(() =>
    Math.max(0, FREE_SHIPPING_THRESHOLD - this.cart.subtotal()),
  );

  categoryName(categoryId: string): string {
    return this.productService.categoryName(categoryId) ?? '';
  }
}
