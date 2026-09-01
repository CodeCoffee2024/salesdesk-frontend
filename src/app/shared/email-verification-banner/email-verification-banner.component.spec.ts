import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { EmailVerificationBannerComponent } from './email-verification-banner.component';
import { AuthService } from '../../core/services/auth.service';
import { CurrentUser } from '../../core/models/auth.model';

const baseUser: CurrentUser = {
  id: 'user-1',
  email: 'maya@northstar.studio',
  fullName: 'Maya Chen',
  role: 'WorkspaceAdmin',
  workspaceId: 'workspace-1',
  hasCompletedOnboarding: true,
  isEmailVerified: true
};

describe('EmailVerificationBannerComponent', () => {
  let fixture: ComponentFixture<EmailVerificationBannerComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  function setup(user: CurrentUser | null) {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['resendVerificationEmail'], {
      currentUser$: of(user)
    });
    authServiceSpy.resendVerificationEmail.and.returnValue(of(undefined));

    TestBed.configureTestingModule({
      declarations: [EmailVerificationBannerComponent],
      providers: [{ provide: AuthService, useValue: authServiceSpy }]
    });

    fixture = TestBed.createComponent(EmailVerificationBannerComponent);
    fixture.detectChanges();
  }

  it('renders nothing for a verified user', () => {
    setup(baseUser);
    expect(fixture.nativeElement.querySelector('.verification-banner__text')).toBeNull();
  });

  it('renders nothing when there is no current user', () => {
    setup(null);
    expect(fixture.nativeElement.querySelector('.verification-banner__text')).toBeNull();
  });

  it('shows the banner and resends on click for an unverified user', () => {
    setup({ ...baseUser, isEmailVerified: false });

    const text = fixture.nativeElement.querySelector('.verification-banner__text');
    expect(text).not.toBeNull();

    fixture.nativeElement.querySelector('.verification-banner__resend').click();

    expect(authServiceSpy.resendVerificationEmail).toHaveBeenCalledWith({ email: 'maya@northstar.studio' });
  });
});
