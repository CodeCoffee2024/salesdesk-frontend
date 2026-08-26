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
    // Default role is WorkspaceAdmin, so the SystemAdmin-only Admin console link
    // isn't rendered — a.nav-item matches only the workspace nav items here.
    setup();
    const links = fixture.nativeElement.querySelectorAll('a.nav-item');
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
});
