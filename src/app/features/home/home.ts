import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FREE_SHIPPING_THRESHOLD } from '../../core/services/cart.service';
import { ProductService } from '../../core/services/product.service';
import { ProductCard } from '../../shared/components/product-card/product-card';

@Component({
  selector: 'app-home',
  imports: [CurrencyPipe, RouterLink, ProductCard],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private readonly productService = inject(ProductService);

  readonly categories = this.productService.categories;
  readonly status = this.productService.status;
  readonly errorMessage = this.productService.errorMessage;
  readonly featured = computed(() => this.productService.featured());
  readonly freeShippingThreshold = FREE_SHIPPING_THRESHOLD;

  retry(): void {
    this.productService.reload();
  }
}
