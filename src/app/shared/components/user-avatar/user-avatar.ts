import { Component, computed, input, signal } from '@angular/core';

@Component({
  selector: 'app-user-avatar',
  templateUrl: './user-avatar.html',
  styleUrl: './user-avatar.css',
})
export class UserAvatar {
  /** Avatar image URL carried by the authenticated user's session, when available. */
  readonly src = input<string | null>(null);

  /** Display name used to derive the initial-letter fallback. */
  readonly name = input<string | null>(null);

  /** 'sm' matches the header account chip; 'lg' matches the login card. */
  readonly size = input<'sm' | 'lg'>('sm');

  /** URL of an image that already failed to load (mirrors ProductCard). */
  private readonly failedUrl = signal<string | null>(null);

  /** The image URL, unless it is missing or has failed to load. */
  readonly imageUrl = computed(() => {
    const url = this.src()?.trim() || null;
    return url && this.failedUrl() !== url ? url : null;
  });

  /** Upper-cased first letter of the display name, or '?' when unknown. */
  readonly initial = computed(() => {
    const name = (this.name() ?? '').trim();
    return name ? name.charAt(0).toUpperCase() : '?';
  });

  onImageError(url: string): void {
    this.failedUrl.set(url);
  }
}
