import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { verifiedGuard } from './verified.guard';
import { AuthService } from '../services/auth.service';
import { CurrentUser } from '../models/auth.model';

const baseUser: CurrentUser = {
  id: 'user-1',
  email: 'maya@northstar.studio',
  fullName: 'Maya Chen',
  role: 'WorkspaceAdmin',
  workspaceId: 'workspace-1',
  hasCompletedOnboarding: true,
  isEmailVerified: true
};

describe('verifiedGuard', () => {
  function runGuard(currentUser: CurrentUser | null) {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [{ provide: AuthService, useValue: { currentUser } }]
    });

    return TestBed.runInInjectionContext(() => verifiedGuard({} as never, {} as never));
  }

  it('allows a verified user through', () => {
    expect(runGuard(baseUser)).toBeTrue();
  });

  it('redirects an unverified user to /overview', () => {
    const result = runGuard({ ...baseUser, isEmailVerified: false }) as UrlTree;
    const router = TestBed.inject(Router);
    expect(router.serializeUrl(result)).toBe('/overview');
  });

  it('allows a null/not-yet-loaded user through rather than blocking on a false negative', () => {
    expect(runGuard(null)).toBeTrue();
  });
});
