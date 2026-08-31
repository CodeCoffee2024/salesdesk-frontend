import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { HealthService } from '../../core/services/health.service';
import { AuthService } from '../../core/services/auth.service';
import { OfflineQueueService } from '../../core/services/offline-queue.service';
import { PushNotificationService } from '../../core/services/push-notification.service';
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

  /** Documents created while offline, still waiting to sync (TASK-027) — see OfflineQueueService. */
  pendingSyncCount = 0;

  /** Web Push (TASK-027) — hidden entirely where the browser doesn't support it (Safari outside an installed PWA). */
  pushSupported = false;
  pushSubscribed = false;
  pushBusy = false;

  private subscription?: Subscription;
  private userSubscription?: Subscription;
  private pendingSyncSubscription?: Subscription;

  constructor(
    private readonly healthService: HealthService,
    private readonly authService: AuthService,
    private readonly offlineQueue: OfflineQueueService,
    private readonly pushNotifications: PushNotificationService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.subscription = this.healthService.status().subscribe((isOperational) => {
      this.status = isOperational ? 'up' : 'down';
    });
    this.userSubscription = this.authService.currentUser$.subscribe((user) => (this.currentUser = user));
    this.pendingSyncSubscription = this.offlineQueue.pendingCount$.subscribe((count) => (this.pendingSyncCount = count));

    this.pushSupported = this.pushNotifications.isSupported;
    if (this.pushSupported) {
      void this.pushNotifications.isSubscribed().then((subscribed) => (this.pushSubscribed = subscribed));
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.userSubscription?.unsubscribe();
    this.pendingSyncSubscription?.unsubscribe();
  }

  async toggleNotifications(): Promise<void> {
    this.pushBusy = true;
    try {
      if (this.pushSubscribed) {
        await this.pushNotifications.unsubscribe();
        this.pushSubscribed = false;
      } else {
        this.pushSubscribed = await this.pushNotifications.subscribe();
      }
    } finally {
      this.pushBusy = false;
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
