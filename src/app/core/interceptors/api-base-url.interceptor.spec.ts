import { HttpRequest, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { ApiBaseUrlInterceptor } from './api-base-url.interceptor';
import { environment } from '../../../environments/environment';

describe('ApiBaseUrlInterceptor', () => {
  it('prefixes relative URLs with apiBaseUrl', (done) => {
    const interceptor = new ApiBaseUrlInterceptor();
    const next = {
      handle: jest.fn().mockReturnValue(of(new HttpResponse({ status: 200 }))),
    };

    const request = new HttpRequest('GET', '/users');

    interceptor.intercept(request, next as never).subscribe(() => {
      const updated = (next.handle as jest.Mock).mock.calls[0][0] as HttpRequest<unknown>;
      expect(updated.url).toBe(`${environment.apiBaseUrl}/users`);
      done();
    });
  });

  it('keeps absolute URLs unchanged', (done) => {
    const interceptor = new ApiBaseUrlInterceptor();
    const next = {
      handle: jest.fn().mockReturnValue(of(new HttpResponse({ status: 200 }))),
    };

    const request = new HttpRequest('GET', 'https://api.example.com/users');

    interceptor.intercept(request, next as never).subscribe(() => {
      const updated = (next.handle as jest.Mock).mock.calls[0][0] as HttpRequest<unknown>;
      expect(updated.url).toBe('https://api.example.com/users');
      done();
    });
  });
});
