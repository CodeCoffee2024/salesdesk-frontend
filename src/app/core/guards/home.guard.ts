import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { AuthService } from '../services/auth.service';

/**
 * Root (/) is the public marketing page (TASK-018 AC1) — an already-signed-in
 * visitor is sent straight to their dashboard instead of seeing it again.
 *
 * TASK-mobile: the native app has no visitor to pitch (it was installed on
 * purpose), so it skips the marketing page entirely and opens straight to
 * login, same as any other installed app. Regular web keeps the landing page.
 */
export const homeGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return router.createUrlTree(['/overview']);
  }

  if (Capacitor.isNativePlatform()) {
    return router.createUrlTree(['/login']);
  }

  return true;
};
