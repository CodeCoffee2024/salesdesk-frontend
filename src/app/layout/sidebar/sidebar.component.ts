import { Component } from '@angular/core';

interface NavItem {
  label: string;
  path: string;
  icon: 'overview' | 'documents' | 'customers' | 'products' | 'templates';
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  readonly navItems: NavItem[] = [
    { label: 'Overview', path: '/overview', icon: 'overview' },
    { label: 'Documents', path: '/documents', icon: 'documents' },
    { label: 'Customers', path: '/customers', icon: 'customers' },
    { label: 'Products', path: '/products', icon: 'products' },
    { label: 'Templates', path: '/templates', icon: 'templates' }
  ];
}
