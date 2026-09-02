import { NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { TopbarComponent } from './layout/topbar/topbar.component';
import { BreadcrumbComponent } from './layout/breadcrumb/breadcrumb.component';
import { EmptyStateComponent } from './shared/empty-state/empty-state.component';
import { LandingComponent } from './pages/landing/landing.component';
import { OverviewComponent } from './pages/overview/overview.component';
import { DocumentsListComponent } from './pages/documents/documents-list/documents-list.component';
import { DocumentPreviewComponent } from './pages/documents/document-preview/document-preview.component';
import { CustomersComponent } from './pages/customers/customers.component';
import { ProductsComponent } from './pages/products/products.component';
import { TemplatesComponent } from './pages/templates/templates.component';
import { TemplateEditorComponent } from './pages/templates/template-editor/template-editor.component';
import { NotFoundPageComponent } from './pages/not-found-page/not-found-page.component';
import { StatusBadgeComponent } from './shared/status-badge/status-badge.component';
import { ConfirmDialogComponent } from './shared/confirm-dialog/confirm-dialog.component';
import { DocumentFormComponent } from './pages/documents/document-form/document-form.component';
import { LoginComponent } from './pages/auth/login/login.component';
import { RegisterComponent } from './pages/auth/register/register.component';
import { ForgotPasswordComponent } from './pages/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './pages/auth/reset-password/reset-password.component';
import { VerifyEmailComponent } from './pages/auth/verify-email/verify-email.component';
import { EmailVerificationBannerComponent } from './shared/email-verification-banner/email-verification-banner.component';
import { AdminDashboardComponent } from './pages/admin/admin-dashboard/admin-dashboard.component';
import { AdminWorkspacesComponent } from './pages/admin/admin-workspaces/admin-workspaces.component';
import { AdminUsersComponent } from './pages/admin/admin-users/admin-users.component';
import { AdminAuditLogComponent } from './pages/admin/admin-audit-log/admin-audit-log.component';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { HasRoleDirective } from './shared/has-role.directive';
import { ImpersonationBannerComponent } from './shared/impersonation-banner/impersonation-banner.component';
import { SignatureCanvasComponent } from './shared/signature-canvas/signature-canvas.component';
import { SignatureAcceptanceModalComponent } from './shared/signature-acceptance-modal/signature-acceptance-modal.component';
import { DocumentSignComponent } from './pages/public/document-sign/document-sign.component';
import { ReminderSettingsComponent } from './pages/settings/reminder-settings/reminder-settings.component';
import { WorkspaceProfileComponent } from './pages/settings/workspace-profile/workspace-profile.component';
import { BillingComponent } from './pages/settings/billing/billing.component';
import { OnboardingChecklistComponent } from './shared/onboarding-checklist/onboarding-checklist.component';
import { FloatingHelpWidgetComponent } from './shared/floating-help-widget/floating-help-widget.component';
import { InfoTooltipComponent } from './shared/info-tooltip/info-tooltip.component';
import { AiParseModalComponent } from './shared/ai-parse-modal/ai-parse-modal.component';
import { CurrencyLocalePipe } from './core/pipes/currency-locale.pipe';
import { ServiceWorkerModule } from '@angular/service-worker';

@NgModule({
  declarations: [
    AppComponent,
    SidebarComponent,
    TopbarComponent,
    BreadcrumbComponent,
    EmptyStateComponent,
    LandingComponent,
    OverviewComponent,
    DocumentsListComponent,
    DocumentPreviewComponent,
    CustomersComponent,
    ProductsComponent,
    TemplatesComponent,
    TemplateEditorComponent,
    NotFoundPageComponent,
    StatusBadgeComponent,
    ConfirmDialogComponent,
    DocumentFormComponent,
    LoginComponent,
    RegisterComponent,
    ForgotPasswordComponent,
    ResetPasswordComponent,
    VerifyEmailComponent,
    EmailVerificationBannerComponent,
    AdminDashboardComponent,
    AdminWorkspacesComponent,
    AdminUsersComponent,
    AdminAuditLogComponent,
    HasRoleDirective,
    ImpersonationBannerComponent,
    SignatureCanvasComponent,
    SignatureAcceptanceModalComponent,
    DocumentSignComponent,
    ReminderSettingsComponent,
    WorkspaceProfileComponent,
    BillingComponent,
    OnboardingChecklistComponent,
    FloatingHelpWidgetComponent,
    InfoTooltipComponent,
    CurrencyLocalePipe,
    AiParseModalComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    AppRoutingModule,
    ServiceWorkerModule.register('custom-sw.js', {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    })
  ],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }],
  bootstrap: [AppComponent]
})
export class AppModule { }
