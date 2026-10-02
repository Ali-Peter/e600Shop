import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';

interface PlacedOrder {
  number: string;
  total: number;
  itemCount: number;
  email: string;
  eta: string;
  emailSent: boolean;
}

type CheckoutFieldName =
  | 'fullName'
  | 'email'
  | 'phone'
  | 'address'
  | 'city'
  | 'postalCode'
  | 'country';

@Component({
  selector: 'app-checkout',
  imports: [RouterLink, CurrencyPipe, ReactiveFormsModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout {
  readonly cart = inject(CartService);
  readonly orders = inject(OrderService);

  readonly submitted = signal(false);
  readonly placedOrder = signal<PlacedOrder | null>(null);

  readonly form = new FormGroup({
    fullName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    phone: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(7)],
    }),
    address: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(5)],
    }),
    city: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    postalCode: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    country: new FormControl('Nigeria', { nonNullable: true, validators: [Validators.required] }),
    notes: new FormControl('', { nonNullable: true }),
    paymentMethod: new FormControl('card', { nonNullable: true }),
  });

  invalid(name: CheckoutFieldName): boolean {
    return this.submitted() && this.form.controls[name].invalid;
  }

  placeOrder(): void {
    this.submitted.set(true);
    if (this.form.invalid || this.cart.isEmpty() || this.orders.submitting()) {
      return;
    }

    const controls = this.form.controls;
    const email = controls.email.value.trim();

    this.orders
      .placeOrder({
        fullName: controls.fullName.value.trim(),
        email,
        phone: controls.phone.value.trim(),
        address: controls.address.value.trim(),
        city: controls.city.value.trim(),
        country: controls.country.value.trim(),
        // The API has no postal-code/notes columns yet, so those form fields stay
        // display-only for now (Address.State falls back to the city server-side).
        // Prices are omitted on purpose: the server prices every line from the
        // Products table, so a tampered client cannot set its own total.
        items: this.cart.items().map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      })
      .subscribe({
        next: (order) => {
          const deliveryDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

          this.placedOrder.set({
            number: order.orderNumber,
            total: order.totalAmount,
            itemCount: order.itemCount,
            email,
            eta: new Intl.DateTimeFormat(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            }).format(deliveryDate),
            emailSent: order.emailSent,
          });

          // Cleared only once the API confirms — a failure never loses the basket.
          this.cart.clear();
        },
        error: () => {
          // OrderService has already published the message; nothing else to do.
        },
      });
  }
}
