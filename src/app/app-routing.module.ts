import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LandingComponent } from './pages/landing/landing.component';
import { OverviewComponent } from './pages/overview/overview.component';
import { DocumentsListComponent } from './pages/documents/documents-list/documents-list.component';
import { DocumentFormComponent } from './pages/documents/document-form/document-form.component';
import { DocumentPreviewComponent } from './pages/documents/document-preview/document-preview.component';
import { CustomersComponent } from './pages/customers/customers.component';
import { ProductsComponent } from './pages/products/products.component';
import { TemplatesComponent } from './pages/templates/templates.component';
import { TemplateEditorComponent } from './pages/templates/template-editor/template-editor.component';
import { NotFoundPageComponent } from './pages/not-found-page/not-found-page.component';
import { LoginComponent } from './pages/auth/login/login.component';
import { RegisterComponent } from './pages/auth/register/register.component';
import { ForgotPasswordComponent } from './pages/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './pages/auth/reset-password/reset-password.component';
import { AdminDashboardComponent } from './pages/admin/admin-dashboard/admin-dashboard.component';
import { AdminWorkspacesComponent } from './pages/admin/admin-workspaces/admin-workspaces.component';
import { AdminUsersComponent } from './pages/admin/admin-users/admin-users.component';
import { AdminAuditLogComponent } from './pages/admin/admin-audit-log/admin-audit-log.component';
import { DocumentSignComponent } from './pages/public/document-sign/document-sign.component';
import { ReminderSettingsComponent } from './pages/settings/reminder-settings/reminder-settings.component';
import { WorkspaceProfileComponent } from './pages/settings/workspace-profile/workspace-profile.component';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { homeGuard } from './core/guards/home.guard';

const routes: Routes = [
  // TASK-018: the public marketing page lives at root for guests; homeGuard sends
  // an already-authenticated visitor straight to /overview instead.
  { path: '', component: LandingComponent, canActivate: [homeGuard], data: { title: 'Professional quotes & invoices' } },
  { path: 'login', component: LoginComponent, data: { title: 'Sign in' } },
  { path: 'register', component: RegisterComponent, data: { title: 'Create your account' } },
  { path: 'forgot-password', component: ForgotPasswordComponent, data: { title: 'Reset your password' } },
  { path: 'reset-password', component: ResetPasswordComponent, data: { title: 'Set a new password' } },
  // TASK-023/024: the unauthenticated link a client opens from their quote/invoice
  // — never behind authGuard, since the whole point is that the client has no
  // SalesDesk account.
  { path: 'view/:token', component: DocumentSignComponent, data: { title: 'Your document' } },
  {
    path: '',
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      { path: 'overview', component: OverviewComponent, data: { breadcrumb: [{ label: 'Overview' }] } },
      { path: 'documents', component: DocumentsListComponent, data: { breadcrumb: [{ label: 'Documents' }] } },
      {
        path: 'documents/new',
        component: DocumentFormComponent,
        data: { breadcrumb: [{ label: 'Documents', url: '/documents' }, { label: 'New document' }] }
      },
      {
        path: 'documents/:id/edit',
        component: DocumentFormComponent,
        data: { breadcrumb: [{ label: 'Documents', url: '/documents' }, { label: 'Edit' }] }
      },
      {
        path: 'documents/:id/preview',
        component: DocumentPreviewComponent,
        data: { breadcrumb: [{ label: 'Documents', url: '/documents' }, { label: 'Preview' }] }
      },
      { path: 'customers', component: CustomersComponent, data: { breadcrumb: [{ label: 'Customers' }] } },
      { path: 'products', component: ProductsComponent, data: { breadcrumb: [{ label: 'Products & services' }] } },
      { path: 'templates', component: TemplatesComponent, data: { breadcrumb: [{ label: 'Templates' }] } },
      {
        path: 'templates/:id/edit',
        component: TemplateEditorComponent,
        data: { breadcrumb: [{ label: 'Templates', url: '/templates' }, { label: 'Edit content' }] }
      },
      {
        path: 'settings/reminders',
        component: ReminderSettingsComponent,
        data: { breadcrumb: [{ label: 'Automated reminders' }] }
      },
      {
        path: 'settings/workspace',
        component: WorkspaceProfileComponent,
        data: { breadcrumb: [{ label: 'Business profile' }] }
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        canActivateChild: [adminGuard],
        children: [
          { path: '', component: AdminDashboardComponent, data: { breadcrumb: [{ label: 'Admin console' }] } },
          {
            path: 'workspaces',
            component: AdminWorkspacesComponent,
            data: { breadcrumb: [{ label: 'Admin console', url: '/admin' }, { label: 'Workspaces' }] }
          },
          {
            path: 'users',
            component: AdminUsersComponent,
            data: { breadcrumb: [{ label: 'Admin console', url: '/admin' }, { label: 'Users' }] }
          },
          {
            path: 'audit-log',
            component: AdminAuditLogComponent,
            data: { breadcrumb: [{ label: 'Admin console', url: '/admin' }, { label: 'Audit log' }] }
          }
        ]
      }
    ]
  },
  { path: '**', component: NotFoundPageComponent, data: { title: 'Page not found' } }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
