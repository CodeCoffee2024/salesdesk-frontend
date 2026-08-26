import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Root (/) is the public marketing page (TASK-018 AC1) — an already-signed-in
 *  visitor is sent straight to their dashboard instead of seeing it again. */
export const homeGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return router.createUrlTree(['/overview']);
  }

  return true;
};
