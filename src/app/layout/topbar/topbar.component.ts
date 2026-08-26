import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { HealthService } from '../../core/services/health.service';
import { AuthService } from '../../core/services/auth.service';
import { CurrentUser } from '../../core/models/auth.model';

type ApiStatus = 'checking' | 'up' | 'down';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss']
})
export class TopbarComponent implements OnInit, OnDestroy {
  // A plain field driven by an explicit subscription, not `| async ... as x`:
  // that pattern can't tell "no value yet" (checking) apart from a resolved
  // `false` (down) — both are falsy, so *ngIf's else branch would fire for both.
  status: ApiStatus = 'checking';

  currentUser: CurrentUser | null = null;

  private subscription?: Subscription;
  private userSubscription?: Subscription;

  constructor(
    private readonly healthService: HealthService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.subscription = this.healthService.status().subscribe((isOperational) => {
      this.status = isOperational ? 'up' : 'down';
    });
    this.userSubscription = this.authService.currentUser$.subscribe((user) => (this.currentUser = user));
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.userSubscription?.unsubscribe();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
