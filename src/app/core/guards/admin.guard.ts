import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Gates the /admin routes to SystemAdmin only. Backend enforcement is what actually
 *  matters (every api/admin/* endpoint requires the SystemAdmin role) — this just
 *  keeps a non-admin from landing on a page that will only 403 against the API. */
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.hasRole('SystemAdmin')) {
    return true;
  }

  return router.createUrlTree(['/overview']);
};
