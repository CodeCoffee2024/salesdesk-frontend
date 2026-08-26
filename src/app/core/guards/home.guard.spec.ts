import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { homeGuard } from './home.guard';
import { AuthService } from '../services/auth.service';

describe('homeGuard', () => {
  function runGuard(isAuthenticated: boolean) {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated']);
    authServiceSpy.isAuthenticated.and.returnValue(isAuthenticated);

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [{ provide: AuthService, useValue: authServiceSpy }]
    });

    return TestBed.runInInjectionContext(() => homeGuard({} as never, { url: '/' } as never));
  }

  it('renders the landing page for a guest', () => {
    expect(runGuard(false)).toBeTrue();
  });

  it('redirects a signed-in visitor to /overview', () => {
    const result = runGuard(true) as UrlTree;
    const router = TestBed.inject(Router);
    expect(router.serializeUrl(result)).toBe('/overview');
  });
});
