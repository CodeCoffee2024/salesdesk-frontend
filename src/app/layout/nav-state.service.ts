import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Whether the mobile off-canvas sidebar drawer is open. Shared between
 * TopbarComponent (owns the hamburger toggle) and SidebarComponent (renders as
 * the drawer below the sidebar-collapse breakpoint) — they're siblings under
 * AppComponent, so this is simpler than threading an @Output through it.
 */
@Injectable({
  providedIn: 'root'
})
export class NavStateService {
  private readonly openSubject = new BehaviorSubject<boolean>(false);
  readonly isOpen$ = this.openSubject.asObservable();

  toggle(): void {
    this.openSubject.next(!this.openSubject.value);
  }

  close(): void {
    this.openSubject.next(false);
  }
}
