import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  CurrentUser,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  UserRole
} from '../models/auth.model';

const BASE_URL = `${environment.apiBaseUrl}/api/auth`;
const TOKEN_KEY = 'sd_auth_token';
const USER_KEY = 'sd_auth_user';

// Stashes the SystemAdmin's own session while "viewing as" another user (TASK-017
// admin console impersonation), separately from the normal session keys above, so
// exitImpersonation() can restore it without a re-login.
const IMPERSONATOR_TOKEN_KEY = 'sd_impersonator_token';
const IMPERSONATOR_USER_KEY = 'sd_impersonator_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly currentUserSubject: BehaviorSubject<CurrentUser | null>;
  private readonly impersonatingSubject: BehaviorSubject<boolean>;

  readonly currentUser$: Observable<CurrentUser | null>;
  readonly isImpersonating$: Observable<boolean>;

  constructor(private readonly http: HttpClient) {
    this.currentUserSubject = new BehaviorSubject<CurrentUser | null>(this.readStoredUser());
    this.currentUser$ = this.currentUserSubject.asObservable();

    this.impersonatingSubject = new BehaviorSubject<boolean>(!!localStorage.getItem(IMPERSONATOR_TOKEN_KEY));
    this.isImpersonating$ = this.impersonatingSubject.asObservable();
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${BASE_URL}/login`, request).pipe(tap(response => this.storeSession(response)));
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${BASE_URL}/register`, request).pipe(tap(response => this.storeSession(response)));
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<void> {
    return this.http.post<void>(`${BASE_URL}/forgot-password`, request);
  }

  resetPassword(request: ResetPasswordRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${BASE_URL}/reset-password`, request).pipe(tap(response => this.storeSession(response)));
  }

  me(): Observable<CurrentUser> {
    return this.http.get<CurrentUser>(`${BASE_URL}/me`);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(IMPERSONATOR_TOKEN_KEY);
    localStorage.removeItem(IMPERSONATOR_USER_KEY);
    this.currentUserSubject.next(null);
    this.impersonatingSubject.next(false);
  }

  /**
   * Switches the active session to `response`'s user, stashing the current
   * (SystemAdmin) session first so exitImpersonation() can restore it. The caller
   * is responsible for confirming `response` actually came back from the
   * impersonate endpoint — this just performs the storage swap.
   */
  beginImpersonation(response: AuthResponse): void {
    const impersonatorToken = this.getToken();
    const impersonatorUser = this.currentUser;

    if (impersonatorToken && impersonatorUser) {
      localStorage.setItem(IMPERSONATOR_TOKEN_KEY, impersonatorToken);
      localStorage.setItem(IMPERSONATOR_USER_KEY, JSON.stringify(impersonatorUser));
    }

    this.storeSession(response);
    this.impersonatingSubject.next(true);
  }

  /** Restores the stashed SystemAdmin session. Falls back to a full logout if
   *  nothing was stashed (shouldn't happen — isImpersonating$ gates the exit UI —
   *  but leaves no route where this silently no-ops with a stale session). */
  exitImpersonation(): void {
    const impersonatorToken = localStorage.getItem(IMPERSONATOR_TOKEN_KEY);
    const impersonatorUserRaw = localStorage.getItem(IMPERSONATOR_USER_KEY);

    if (!impersonatorToken || !impersonatorUserRaw) {
      this.logout();
      return;
    }

    localStorage.setItem(TOKEN_KEY, impersonatorToken);
    localStorage.setItem(USER_KEY, impersonatorUserRaw);
    localStorage.removeItem(IMPERSONATOR_TOKEN_KEY);
    localStorage.removeItem(IMPERSONATOR_USER_KEY);

    this.currentUserSubject.next(JSON.parse(impersonatorUserRaw) as CurrentUser);
    this.impersonatingSubject.next(false);
  }

  get isImpersonating(): boolean {
    return this.impersonatingSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  get currentUser(): CurrentUser | null {
    return this.currentUserSubject.value;
  }

  // TASK-016: UI-hiding only, mirroring the backend's CanManage/CanDelete
  // policies for the buttons those actions gate — the real enforcement is the
  // [Authorize(Policy = ...)] on the API endpoints, not this check.
  hasRole(...roles: UserRole[]): boolean {
    const role = this.currentUserSubject.value?.role;
    return !!role && roles.includes(role);
  }

  private storeSession(response: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    this.currentUserSubject.next(response.user);
  }

  private readStoredUser(): CurrentUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as CurrentUser;
    } catch {
      return null;
    }
  }
}
