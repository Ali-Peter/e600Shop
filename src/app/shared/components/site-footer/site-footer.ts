import { CurrencyPipe } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FREE_SHIPPING_THRESHOLD } from '../../../core/services/cart.service';

@Component({
  selector: 'app-site-footer',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './site-footer.html',
  styleUrl: './site-footer.css',
})
export class SiteFooter {
  readonly year = new Date().getFullYear();
  readonly freeShippingThreshold = FREE_SHIPPING_THRESHOLD;
}
