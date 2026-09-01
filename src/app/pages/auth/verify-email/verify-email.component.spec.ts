import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';

import { VerifyEmailComponent } from './verify-email.component';
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

describe('VerifyEmailComponent', () => {
  let component: VerifyEmailComponent;
  let fixture: ComponentFixture<VerifyEmailComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  function setup(token: string | null = 'abc123') {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['verifyEmail', 'resendVerificationEmail']);
    routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [VerifyEmailComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(token ? { token } : {}) } }
        }
      ]
    });

    fixture = TestBed.createComponent(VerifyEmailComponent);
    component = fixture.componentInstance;
  }

  it('shows the missing-token state when there is no token in the query string', () => {
    setup(null);
    fixture.detectChanges();

    expect(component.status).toBe('missing-token');
    expect(authServiceSpy.verifyEmail).not.toHaveBeenCalled();
  });

  it('verifies the token on load and redirects to /overview shortly after success', fakeAsync(() => {
    setup('abc123');
    authServiceSpy.verifyEmail.and.returnValue(of(makeAuthResponse()));

    fixture.detectChanges();

    expect(authServiceSpy.verifyEmail).toHaveBeenCalledWith({ token: 'abc123' });
    expect(component.status).toBe('success');
    expect(routerSpy.navigateByUrl).not.toHaveBeenCalled();

    tick(1500);
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/overview');
  }));

  it('shows the error state for an expired/invalid token', () => {
    setup('abc123');
    authServiceSpy.verifyEmail.and.returnValue(throwError(() => new Error('invalid')));

    fixture.detectChanges();

    expect(component.status).toBe('error');
  });

  it('resends a verification email from the error state', () => {
    setup('abc123');
    authServiceSpy.verifyEmail.and.returnValue(throwError(() => new Error('invalid')));
    authServiceSpy.resendVerificationEmail.and.returnValue(of(undefined));
    fixture.detectChanges();

    component.resendForm.setValue({ email: 'maya@northstar.studio' });
    component.resend();

    expect(authServiceSpy.resendVerificationEmail).toHaveBeenCalledWith({ email: 'maya@northstar.studio' });
    expect(component.resendSent).toBeTrue();
  });
});
