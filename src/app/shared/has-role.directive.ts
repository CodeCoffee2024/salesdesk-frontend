import { Directive, Input, OnDestroy, TemplateRef, ViewContainerRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { UserRole } from '../core/models/auth.model';

/**
 * Structural directive gating an element on the current user's role, e.g.
 * `*appHasRole="['WorkspaceAdmin', 'SalesManager']"`. Reacts to `AuthService.currentUser$`
 * so it updates on login/logout without a page reload. UI-hiding only (TASK-016) —
 * the API's CanManage/CanDelete policies are what actually enforce this.
 */
@Directive({
  selector: '[appHasRole]'
})
export class HasRoleDirective implements OnDestroy {
  private roles: UserRole[] = [];
  private hasView = false;
  private readonly subscription: Subscription;

  constructor(
    private readonly templateRef: TemplateRef<unknown>,
    private readonly viewContainer: ViewContainerRef,
    private readonly authService: AuthService
  ) {
    this.subscription = this.authService.currentUser$.subscribe(() => this.updateView());
  }

  @Input()
  set appHasRole(roles: UserRole[]) {
    this.roles = roles ?? [];
    this.updateView();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private updateView(): void {
    const allowed = this.authService.hasRole(...this.roles);

    if (allowed && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!allowed && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
