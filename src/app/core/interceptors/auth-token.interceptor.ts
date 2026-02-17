import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TokenStorageService } from '../services/token-storage.service';
import { API_ROUTES } from '../constants/api-routes';

@Injectable()
export class AuthTokenInterceptor implements HttpInterceptor {
  constructor(private readonly tokenStorage: TokenStorageService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (this.isLoginRequest(request.url)) {
      return next.handle(request);
    }

    const token = this.tokenStorage.getToken();

    if (!token) {
      return next.handle(request);
    }

    const authRequest = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    return next.handle(authRequest);
  }

  private isLoginRequest(url: string): boolean {
    return url.endsWith(API_ROUTES.authLogin);
  }
}
