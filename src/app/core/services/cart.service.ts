import { Injectable, computed, signal } from '@angular/core';
import { CartItem, Product } from '../models/shop.models';

export const FREE_SHIPPING_THRESHOLD = 75;
export const FLAT_SHIPPING_RATE = 6.95;
const MAX_QUANTITY = 99;

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly itemsState = signal<CartItem[]>([]);

  readonly items = this.itemsState.asReadonly();
  readonly count = computed(() =>
    this.itemsState().reduce((total, item) => total + item.quantity, 0),
  );
  readonly subtotal = computed(() =>
    roundCurrency(
      this.itemsState().reduce((total, item) => total + item.product.price * item.quantity, 0),
    ),
  );
  readonly shipping = computed(() =>
    this.subtotal() === 0 || this.subtotal() >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_RATE,
  );
  readonly total = computed(() => roundCurrency(this.subtotal() + this.shipping()));
  readonly isEmpty = computed(() => this.itemsState().length === 0);

  quantityOf(productId: string): number {
    return this.itemsState().find((item) => item.product.id === productId)?.quantity ?? 0;
  }

  add(product: Product, quantity = 1): void {
    const amount = Math.max(1, Math.floor(quantity));
    this.itemsState.update((items) => {
      const existing = items.find((item) => item.product.id === product.id);
      if (existing) {
        return items.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(MAX_QUANTITY, item.quantity + amount) }
            : item,
        );
      }
      return [...items, { product, quantity: Math.min(MAX_QUANTITY, amount) }];
    });
  }

  updateQuantity(productId: string, quantity: number): void {
    if (quantity < 1) {
      this.remove(productId);
      return;
    }
    this.itemsState.update((items) =>
      items.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: Math.min(MAX_QUANTITY, Math.floor(quantity)) }
          : item,
      ),
    );
  }

  remove(productId: string): void {
    this.itemsState.update((items) => items.filter((item) => item.product.id !== productId));
  }

  clear(): void {
    this.itemsState.set([]);
  }
}
