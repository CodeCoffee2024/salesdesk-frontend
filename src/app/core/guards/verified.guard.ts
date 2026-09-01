import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * TASK-030 AC: "Block unverified users from accessing protected workspace
 * routes or performing mutation actions until verification is complete."
 *
 * The real gate is the backend's EmailVerificationBehavior — this guard is
 * frontend UX only, so it's applied narrowly to the routes whose entire
 * purpose is a mutation (creating/editing a document), not to the whole app
 * shell: an unverified user still needs to reach /overview, /settings/*, etc.
 * to see the persistent verification banner and use its "Resend Email"
 * button. Redirects to /overview rather than /login since the caller is
 * already authenticated — just not yet verified.
 */
export const verifiedGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.currentUser?.isEmailVerified ?? true) {
    return true;
  }

  return router.createUrlTree(['/overview']);
};
