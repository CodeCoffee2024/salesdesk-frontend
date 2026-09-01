import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NEVER, Observable, of } from 'rxjs';

import { TopbarComponent } from './topbar.component';
import { HealthService } from '../../core/services/health.service';
import { AuthService } from '../../core/services/auth.service';
import { HasRoleDirective } from '../../shared/has-role.directive';
import { CurrentUser } from '../../core/models/auth.model';

const adminUser: CurrentUser = {
  id: 'user-1',
  email: 'admin@northline.studio',
  fullName: 'Nora Admin',
  role: 'WorkspaceAdmin',
  workspaceId: 'workspace-1',
  hasCompletedOnboarding: true,
  isEmailVerified: true
};

describe('TopbarComponent', () => {
  let fixture: ComponentFixture<TopbarComponent>;

  function setup(status$: Observable<boolean>, user: CurrentUser | null = adminUser) {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['hasRole', 'logout'], {
      currentUser$: of(user)
    });
    authServiceSpy.hasRole.and.callFake((...roles: string[]) => !!user && roles.includes(user.role));

    TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule],
      declarations: [TopbarComponent, HasRoleDirective],
      providers: [
        { provide: HealthService, useValue: { status: () => status$ } },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    fixture = TestBed.createComponent(TopbarComponent);
    fixture.detectChanges();
  }

  it('should create', () => {
    setup(of(true));
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('shows a checking message before the first health check resolves', () => {
    setup(NEVER);
    const status = fixture.nativeElement.querySelector('.status');
    expect(status.textContent).toContain('Checking status');
  });

  it('shows an operational message when the API is healthy', () => {
    setup(of(true));
    const status = fixture.nativeElement.querySelector('.status');
    expect(status.textContent).toContain('All systems operational');
    expect(status.classList).not.toContain('status--down');
  });

  it('shows a connection-issue message when the API is unreachable', () => {
    setup(of(false));
    const status = fixture.nativeElement.querySelector('.status');
    expect(status.textContent).toContain('Connection issue');
    expect(status.classList).toContain('status--down');
  });

  it('links the New document button to /documents/new', () => {
    setup(of(true));
    const button = fixture.nativeElement.querySelector('.new-document-button');
    expect(button.getAttribute('href')).toBe('/documents/new');
  });

  it('hides the New document button for a Viewer', () => {
    setup(of(true), { ...adminUser, role: 'Viewer' });
    expect(fixture.nativeElement.querySelector('.new-document-button')).toBeNull();
  });

  it('hides the New document button for an unverified user (TASK-030)', () => {
    setup(of(true), { ...adminUser, isEmailVerified: false });
    expect(fixture.nativeElement.querySelector('.new-document-button')).toBeNull();
  });

  it('shows the current user name and role, and logs out on click', () => {
    setup(of(true));
    const account = fixture.nativeElement.querySelector('.account');
    expect(account.textContent).toContain('Nora Admin');
    expect(account.textContent).toContain('WorkspaceAdmin');

    fixture.nativeElement.querySelector('.account__logout').click();
    expect(TestBed.inject(AuthService).logout).toHaveBeenCalled();
  });
});
