import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { CurrentUser } from '../../core/models/auth.model';

/**
 * Unmissable, route-agnostic banner shown for the duration of a SystemAdmin's
 * "view as" session (TASK-017 admin console impersonation) — rendered once at the
 * root of AppComponent's template, above both the public-route and app-shell
 * branches, so it stays visible no matter where the impersonated session
 * navigates.
 */
@Component({
  selector: 'app-impersonation-banner',
  templateUrl: './impersonation-banner.component.html',
  styleUrls: ['./impersonation-banner.component.scss']
})
export class ImpersonationBannerComponent {
  readonly isImpersonating$: Observable<boolean> = this.authService.isImpersonating$;
  readonly currentUser$: Observable<CurrentUser | null> = this.authService.currentUser$;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  exit(): void {
    this.authService.exitImpersonation();
    this.router.navigate(['/admin/users']);
  }
}
