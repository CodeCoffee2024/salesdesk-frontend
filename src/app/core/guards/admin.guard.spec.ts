import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { adminGuard } from './admin.guard';
import { AuthService } from '../services/auth.service';

describe('adminGuard', () => {
  function runGuard(hasRole: boolean) {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['hasRole']);
    authServiceSpy.hasRole.and.returnValue(hasRole);

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [{ provide: AuthService, useValue: authServiceSpy }]
    });

    return TestBed.runInInjectionContext(() =>
      adminGuard({} as never, { url: '/admin' } as never)
    );
  }

  it('allows navigation for a SystemAdmin', () => {
    expect(runGuard(true)).toBeTrue();
  });

  it('redirects to /overview for a non-SystemAdmin', () => {
    const result = runGuard(false) as UrlTree;
    const router = TestBed.inject(Router);
    expect(router.serializeUrl(result)).toBe('/overview');
  });
});
