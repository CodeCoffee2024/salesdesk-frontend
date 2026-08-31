import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { NavStateService } from '../nav-state.service';

interface NavItem {
  label: string;
  path: string;
  /** Bootstrap Icons class suffix (bi-{icon}) — see https://icons.getbootstrap.com. */
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {
  readonly navItems: NavItem[] = [
    { label: 'Overview', path: '/overview', icon: 'grid-1x2' },
    { label: 'Documents', path: '/documents', icon: 'file-earmark-text' },
    { label: 'Customers', path: '/customers', icon: 'people' },
    { label: 'Products', path: '/products', icon: 'box-seam' },
    { label: 'Templates', path: '/templates', icon: 'layout-text-window' }
  ];

  isOpen = false;

  private navStateSubscription?: Subscription;
  private routerSubscription?: Subscription;

  constructor(
    private readonly navState: NavStateService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.navStateSubscription = this.navState.isOpen$.subscribe((open) => (this.isOpen = open));
    // Below the mobile breakpoint, picking a destination should close the drawer
    // behind it rather than leaving it covering the page it just navigated to.
    this.routerSubscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.navState.close());
  }

  ngOnDestroy(): void {
    this.navStateSubscription?.unsubscribe();
    this.routerSubscription?.unsubscribe();
  }

  close(): void {
    this.navState.close();
  }
}
