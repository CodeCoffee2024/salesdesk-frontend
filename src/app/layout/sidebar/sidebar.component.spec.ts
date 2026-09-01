import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { SidebarComponent } from './sidebar.component';
import { AuthService } from '../../core/services/auth.service';
import { HasRoleDirective } from '../../shared/has-role.directive';
import { UserRole } from '../../core/models/auth.model';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;

  function setup(role: UserRole = 'WorkspaceAdmin') {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['hasRole'], { currentUser$: of(null) });
    authServiceSpy.hasRole.and.callFake((...roles: UserRole[]) => roles.includes(role));

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [SidebarComponent, HasRoleDirective],
      providers: [{ provide: AuthService, useValue: authServiceSpy }]
    });

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', () => {
    setup();
    expect(component).toBeTruthy();
  });

  it('renders one link per nav item, in order', () => {
    // Scoped to the first .nav-list (the Workspace section) so this stays
    // unaffected by the Automations/Platform sections' own nav-item links.
    setup();
    const workspaceNavList = fixture.nativeElement.querySelector('.nav-section .nav-list');
    const links = workspaceNavList.querySelectorAll('a.nav-item');
    expect(links.length).toBe(component.navItems.length);

    component.navItems.forEach((item, index) => {
      expect(links[index].textContent).toContain(item.label);
      expect(links[index].getAttribute('href')).toBe(item.path);
    });
  });

  it('shows the SalesDesk brand name', () => {
    setup();
    expect(fixture.nativeElement.querySelector('.brand__name').textContent).toContain('SalesDesk');
  });

  it('hides the Admin console link for a non-SystemAdmin', () => {
    setup('WorkspaceAdmin');
    expect(fixture.nativeElement.querySelector('a[routerLink="/admin"]')).toBeNull();
  });

  it('shows the Admin console link for a SystemAdmin', () => {
    setup('SystemAdmin');
    const link = fixture.nativeElement.querySelector('a[routerLink="/admin"]');
    expect(link).not.toBeNull();
    expect(link.textContent).toContain('Admin console');
  });

  it('shows the Reminders link for a WorkspaceAdmin', () => {
    setup('WorkspaceAdmin');
    const link = fixture.nativeElement.querySelector('a[routerLink="/settings/reminders"]');
    expect(link).not.toBeNull();
    expect(link.textContent).toContain('Reminders');
  });

  it('hides the Reminders link for a Viewer', () => {
    setup('Viewer');
    expect(fixture.nativeElement.querySelector('a[routerLink="/settings/reminders"]')).toBeNull();
  });

  it('shows the Billing link for a WorkspaceAdmin (TASK-031)', () => {
    setup('WorkspaceAdmin');
    const link = fixture.nativeElement.querySelector('a[routerLink="/settings/billing"]');
    expect(link).not.toBeNull();
    expect(link.textContent).toContain('Billing');
  });

  it('hides the Billing link for a Viewer', () => {
    setup('Viewer');
    expect(fixture.nativeElement.querySelector('a[routerLink="/settings/billing"]')).toBeNull();
  });
});
