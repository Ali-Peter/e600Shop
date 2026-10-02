import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserAvatar } from '../../shared/components/user-avatar/user-avatar';

@Component({
  selector: 'app-login',
  imports: [RouterLink, UserAvatar],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  readonly auth = inject(AuthService);

  signInWithGoogle(): void {
    void this.auth.signInWithGoogle();
  }

  signOut(): void {
    void this.auth.signOut();
  }
}