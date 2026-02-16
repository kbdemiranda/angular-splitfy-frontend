import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable()
export class ApiBaseUrlInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!environment.apiBaseUrl || this.isAbsoluteUrl(request.url)) {
      return next.handle(request);
    }

    const updatedRequest = request.clone({
      url: `${environment.apiBaseUrl}${request.url}`,
    });

    return next.handle(updatedRequest);
  }

  private isAbsoluteUrl(url: string): boolean {
    return /^https?:\/\//i.test(url);
  }
}
