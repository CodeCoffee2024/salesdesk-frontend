import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { ResetPasswordComponent } from './reset-password.component';
import { AuthService } from '../../../core/services/auth.service';
import { AuthResponse } from '../../../core/models/auth.model';

function makeAuthResponse(): AuthResponse {
  return {
    token: 'fake-token',
    expiresAt: new Date().toISOString(),
    user: {
      id: 'u1',
      email: 'maya@northstar.studio',
      fullName: 'Maya Chen',
      role: 'WorkspaceAdmin',
      workspaceId: 'w1',
      hasCompletedOnboarding: true,
      isEmailVerified: true
    }
  };
}

describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  function setup(token: string | null = 'abc123') {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['resetPassword']);
    authServiceSpy.resetPassword.and.returnValue(of(makeAuthResponse()));
    routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [ResetPasswordComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(token ? { token } : {}) } }
        }
      ]
    });

    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('reads the token from the query string', () => {
    setup('abc123');
    expect(component.token).toBe('abc123');
  });

  it('does not submit when there is no token', () => {
    setup(null);
    component.form.setValue({ newPassword: 'new-correct-horse' });

    component.submit();

    expect(authServiceSpy.resetPassword).not.toHaveBeenCalled();
  });

  it('does not submit an invalid form', () => {
    setup();
    component.form.setValue({ newPassword: 'short' });

    component.submit();

    expect(authServiceSpy.resetPassword).not.toHaveBeenCalled();
  });

  it('submits the token and new password, then navigates to /overview', () => {
    setup('abc123');
    component.form.setValue({ newPassword: 'new-correct-horse' });

    component.submit();

    expect(authServiceSpy.resetPassword).toHaveBeenCalledWith({ token: 'abc123', newPassword: 'new-correct-horse' });
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/overview');
  });

  it('shows an error message for an expired/invalid token (401)', () => {
    setup();
    authServiceSpy.resetPassword.and.returnValue(throwError(() => new HttpErrorResponse({ status: 401 })));
    component.form.setValue({ newPassword: 'new-correct-horse' });

    component.submit();

    expect(component.errorMessage).toContain('invalid or has expired');
    expect(component.submitting).toBeFalse();
  });
});
