import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { UserAvatar } from '../user-avatar/user-avatar';

@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive, UserAvatar],
  templateUrl: './site-header.html',
  styleUrl: './site-header.css',
})
export class SiteHeader {
  readonly cart = inject(CartService);
  readonly auth = inject(AuthService);
  readonly menuOpen = signal(false);
  readonly query = signal('');

  private readonly router = inject(Router);

  readonly cartLabel = computed(() => {
    const count = this.cart.count();
    return count > 0 ? `Shopping cart, ${count} items` : 'Shopping cart, empty';
  });

  onQueryInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  search(event: Event): void {
    event.preventDefault();
    const term = this.query().trim();
    this.menuOpen.set(false);
    void this.router.navigate(['/products'], { queryParams: term ? { q: term } : {} });
  }

  signInWithGoogle(): void {
    this.menuOpen.set(false);
    void this.auth.signInWithGoogle();
  }

  signOut(): void {
    this.menuOpen.set(false);
    void this.auth.signOut();
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }
}
