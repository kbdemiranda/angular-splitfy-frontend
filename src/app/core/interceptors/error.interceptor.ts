import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { API_ROUTES } from '../constants/api-routes';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        const isLoginRequest = request.url.endsWith(API_ROUTES.authLogin);
        const isLoginPage = this.router.url.startsWith('/login');

        if (error.status === 401 && !isLoginRequest && !isLoginPage) {
          this.authService.clearSession();
          void this.router.navigate(['/login']);
        }

        return throwError(() => error);
      }),
    );
  }
}
