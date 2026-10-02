import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { map } from 'rxjs';
import { FREE_SHIPPING_THRESHOLD } from '../../core/services/cart.service';
import { ProductService } from '../../core/services/product.service';
import { ProductCard } from '../../shared/components/product-card/product-card';

@Component({
  selector: 'app-products',
  imports: [CurrencyPipe, ProductCard],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products {
  private readonly productService = inject(ProductService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly categories = this.productService.categories;
  readonly status = this.productService.status;
  readonly errorMessage = this.productService.errorMessage;
  readonly freeShippingThreshold = FREE_SHIPPING_THRESHOLD;

  readonly query = toSignal(
    this.route.queryParams.pipe(map((params: Params): string => String(params['q'] ?? ''))),
    { initialValue: '' },
  );

  readonly activeCategory = toSignal(
    this.route.queryParams.pipe(
      map((params: Params): string => String(params['category'] ?? 'all')),
    ),
    { initialValue: 'all' },
  );

  readonly products = computed(() =>
    this.productService.search({ query: this.query(), category: this.activeCategory() }),
  );

  readonly activeCategoryName = computed(() => {
    const id = this.activeCategory();
    return id === 'all' ? '' : (this.productService.categoryName(id) ?? '');
  });

  retry(): void {
    this.productService.reload();
  }

  selectCategory(categoryId: string): void {
    void this.router.navigate(['/products'], {
      queryParams: { category: categoryId },
      queryParamsHandling: 'merge',
    });
  }

  resetFilters(): void {
    void this.router.navigate(['/products']);
  }

  clearQuery(): void {
    void this.router.navigate(['/products'], {
      queryParams: { category: this.activeCategory() },
    });
  }
}
