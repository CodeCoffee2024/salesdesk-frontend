import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Attaches the bearer token to every request, and clears an expired/invalid
// session on a 401 so the guard redirects to /login on the next navigation.
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private readonly authService: AuthService, private readonly router: Router) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.getToken();
    const authorizedRequest = token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request;

    return next.handle(authorizedRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && this.authService.isAuthenticated()) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }

        return throwError(() => error);
      })
    );
  }
}
