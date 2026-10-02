import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, defer, tap } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

/** One cart line exactly as POST /api/Orders expects it. */
export interface OrderItemRequest {
  productId: string;
  quantity: number;
}

/**
 * Checkout payload. Prices and totals are deliberately absent — the API recomputes
 * them from the database so the charge can never be manipulated from the client.
 */
export interface PlaceOrderRequest {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  items: OrderItemRequest[];
}

/** Shape of the 201 response from POST /api/Orders. */
export interface PlaceOrderResponse {
  id: string;
  orderNumber: string;
  totalAmount: number;
  itemCount: number;
  status: string;
  createdAt: string;
  /** False when Mailgun was unreachable — the order still saved. */
  emailSent: boolean;
}

/**
 * Places orders through the Orders API. Submission state lives here (mirroring
 * ProductService/AuthService) so the checkout component only binds to signals.
 */
@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);

  private readonly submittingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly submitting = this.submittingState.asReadonly();
  readonly errorMessage = this.errorState.asReadonly();

  /**
   * Posts the checkout. The returned observable is cold: the submitting signal flips
   * on subscribe and the error signal is populated before the error reaches the
   * subscriber, so the component only has to render `errorMessage()`.
   *
   * The cart is never cleared here — that stays the caller's decision on success.
   */
  placeOrder(request: PlaceOrderRequest): Observable<PlaceOrderResponse> {
    return defer(() => {
      this.submittingState.set(true);
      this.errorState.set(null);

      return this.http.post<PlaceOrderResponse>(`${API_BASE_URL}/api/Orders`, request);
    }).pipe(
      tap({
        next: () => this.submittingState.set(false),
        error: () => {
          this.submittingState.set(false);
          this.errorState.set(
            'We could not place your order. Your cart is untouched — please try again.',
          );
        },
      }),
    );
  }
}