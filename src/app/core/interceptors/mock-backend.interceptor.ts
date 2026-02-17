import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_ROUTES } from '../constants/api-routes';
import { DashboardKpiResponse } from '../../shared/models/dashboard.model';
import { LoginRequest, LoginResponse, UserProfile } from '../../shared/models/auth.model';
import { SubscriberBillingResponse } from '../../shared/models/subscriber-billing.model';

interface MockUser {
  userId: string;
  email: string;
  password: string;
  profile: UserProfile;
}

const MOCK_USERS: MockUser[] = [
  {
    userId: 'c0d3x-1111-4c7a-8f2b-111111111111',
    email: 'admin@splitfy.app',
    password: '123456',
    profile: 'ADMIN',
  },
  {
    userId: 'c0d3x-2222-4c7a-8f2b-222222222222',
    email: 'viewer@splitfy.app',
    password: '123456',
    profile: 'VIEWER',
  },
];

@Injectable()
export class MockBackendInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!environment.useMockApi) {
      return next.handle(request);
    }

    const path = this.extractPath(request.url);

    if (request.method === 'POST' && path === API_ROUTES.authLogin) {
      return this.handleLogin(request);
    }

    if (request.method === 'POST' && path === API_ROUTES.authLogout) {
      return of(new HttpResponse({ status: 200, body: { message: 'Logout successful' } }));
    }

    if (request.method === 'GET' && path === API_ROUTES.dashboardKpis) {
      return this.handleDashboardKpis(request);
    }

    if (request.method === 'GET' && /^\/subscribers\/\d+\/billing$/.test(path)) {
      return this.handleSubscriberBilling(request, path);
    }

    return next.handle(request);
  }

  private handleLogin(request: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
    const payload = request.body as LoginRequest | null;
    const user = MOCK_USERS.find((item) => item.email === payload?.email);

    if (!payload?.email || !payload.password || !user || user.password !== payload.password) {
      return this.mockError(401, 'Invalid credentials');
    }

    const response: LoginResponse = {
      token: `mock-jwt-token-${user.userId}`,
      tokenType: 'Bearer',
      expiresInMs: 60 * 60 * 1000,
      userId: user.userId,
      email: user.email,
      profile: user.profile,
    };

    return of(new HttpResponse({ status: 200, body: response }));
  }

  private handleDashboardKpis(request: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
    const referenceMonth = request.params.get('referenceMonth') ?? '2026-02';
    const response: DashboardKpiResponse = {
      referenceMonth,
      currency: 'BRL',
      totalDue: 1240.0,
      totalPaid: 980.0,
      totalPending: 180.0,
      totalUnpaid: 80.0,
      delinquencyRate: 6.45,
      pendingByPlatform: [
        {
          platformId: 1,
          platformName: 'Netflix',
          pendingCount: 3,
          pendingAmount: 89.7,
        },
        {
          platformId: 2,
          platformName: 'Spotify',
          pendingCount: 2,
          pendingAmount: 47.8,
        },
        {
          platformId: 3,
          platformName: 'YouTube Premium',
          pendingCount: 1,
          pendingAmount: 42.5,
        },
      ],
    };

    return of(new HttpResponse({ status: 200, body: response }));
  }

  private handleSubscriberBilling(request: HttpRequest<unknown>, path: string): Observable<HttpEvent<unknown>> {
    const idMatch = path.match(/^\/subscribers\/(\d+)\/billing$/);
    const subscriberId = Number(idMatch?.[1]);

    if (!idMatch || Number.isNaN(subscriberId) || subscriberId <= 0) {
      return this.mockError(404, 'Subscriber not found');
    }

    const referenceMonth = request.params.get('referenceMonth') ?? '2026-02';
    const response = this.buildSubscriberBillingResponse(subscriberId, referenceMonth);
    return of(new HttpResponse({ status: 200, body: response }));
  }

  private buildSubscriberBillingResponse(userId: number, referenceMonth: string): SubscriberBillingResponse {
    const baseResponse: SubscriberBillingResponse = {
      userId,
      referenceMonth,
      items: [
        {
          serviceId: 2,
          serviceName: 'Prime Video',
          billingCycle: 'MONTHLY',
          serviceCurrency: 'BRL',
          serviceMonthlyAmount: 12.0,
          participantsCount: 4,
          userMonthlyShare: 3.0,
          serviceMonthlyAmountOriginal: null,
          userMonthlyShareOriginal: null,
          exchangeRateToBrl: null,
          exchangeRateDate: null,
          paymentStatus: 'PAID',
        },
        {
          serviceId: 5,
          serviceName: 'Microsoft 365 Family',
          billingCycle: 'ANNUAL',
          serviceCurrency: 'BRL',
          serviceMonthlyAmount: 599.0,
          participantsCount: 2,
          userMonthlyShare: 299.5,
          serviceMonthlyAmountOriginal: null,
          userMonthlyShareOriginal: null,
          exchangeRateToBrl: null,
          exchangeRateDate: null,
          paymentStatus: 'PAID',
        },
      ],
      totalMonthlyDue: 302.5,
      currency: 'BRL',
    };

    if (userId === 1) {
      return {
        ...baseResponse,
        userId,
        referenceMonth,
        items: [
          {
            serviceId: 1,
            serviceName: 'Netflix',
            billingCycle: 'MONTHLY',
            serviceCurrency: 'BRL',
            serviceMonthlyAmount: 24.9,
            participantsCount: 2,
            userMonthlyShare: 12.45,
            serviceMonthlyAmountOriginal: null,
            userMonthlyShareOriginal: null,
            exchangeRateToBrl: null,
            exchangeRateDate: null,
            paymentStatus: 'PENDING',
          },
          {
            serviceId: 2,
            serviceName: 'Spotify',
            billingCycle: 'MONTHLY',
            serviceCurrency: 'BRL',
            serviceMonthlyAmount: 34.9,
            participantsCount: 5,
            userMonthlyShare: 6.98,
            serviceMonthlyAmountOriginal: null,
            userMonthlyShareOriginal: null,
            exchangeRateToBrl: null,
            exchangeRateDate: null,
            paymentStatus: 'UNPAID',
          },
        ],
        totalMonthlyDue: 19.43,
      };
    }

    if (userId === 2) {
      return {
        ...baseResponse,
        userId,
        referenceMonth,
        items: [
          {
            serviceId: 3,
            serviceName: 'Disney+',
            billingCycle: 'MONTHLY',
            serviceCurrency: 'BRL',
            serviceMonthlyAmount: 27.9,
            participantsCount: 2,
            userMonthlyShare: 13.95,
            serviceMonthlyAmountOriginal: null,
            userMonthlyShareOriginal: null,
            exchangeRateToBrl: null,
            exchangeRateDate: null,
            paymentStatus: 'PAID',
          },
          {
            serviceId: 4,
            serviceName: 'Prime Video',
            billingCycle: 'MONTHLY',
            serviceCurrency: 'BRL',
            serviceMonthlyAmount: 19.9,
            participantsCount: 2,
            userMonthlyShare: 9.95,
            serviceMonthlyAmountOriginal: null,
            userMonthlyShareOriginal: null,
            exchangeRateToBrl: null,
            exchangeRateDate: null,
            paymentStatus: 'PENDING',
          },
          {
            serviceId: 5,
            serviceName: 'Apple TV+',
            billingCycle: 'MONTHLY',
            serviceCurrency: 'BRL',
            serviceMonthlyAmount: 21.9,
            participantsCount: 2,
            userMonthlyShare: 10.95,
            serviceMonthlyAmountOriginal: null,
            userMonthlyShareOriginal: null,
            exchangeRateToBrl: null,
            exchangeRateDate: null,
            paymentStatus: 'PAID',
          },
        ],
        totalMonthlyDue: 34.85,
      };
    }

    return {
      ...baseResponse,
      userId,
      referenceMonth,
    };
  }

  private extractPath(url: string): string {
    if (/^https?:\/\//i.test(url)) {
      return new URL(url).pathname;
    }

    return url;
  }

  private mockError(status: number, message: string): Observable<never> {
    return throwError(() => new HttpErrorResponse({ status, error: { message }, statusText: message }));
  }
}
