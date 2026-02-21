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
import {
  PaymentConfirmationBatchRequest,
  PaymentConfirmationResponse,
  PendingPaymentApprovalResponse,
} from '../../shared/models/payment-confirmations.model';

interface MockUser {
  userId: string;
  email: string;
  password: string;
  profile: UserProfile;
}

interface MockPaymentPlatform {
  id: number;
  name: string;
  serviceType: string;
  currency: string;
  price: number;
}

interface MockPaymentSubscriber {
  id: number;
  name: string;
  email: string;
  platformIds: number[];
}

interface MockPaymentConfirmation {
  id: number;
  subscriberId: number;
  platformId: number;
  referenceMonth: string;
  status: 'PENDING' | 'CONFIRMED';
  requestedByEmail: string;
  requestedAt: string;
  validatedByEmail: string | null;
  validatedAt: string | null;
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

const MOCK_PAYMENT_PLATFORMS: MockPaymentPlatform[] = [
  { id: 1, name: 'Netflix', serviceType: 'Video Streaming', currency: 'BRL', price: 24.9 },
  { id: 2, name: 'Spotify', serviceType: 'Music Streaming', currency: 'BRL', price: 34.9 },
  { id: 3, name: 'Disney+', serviceType: 'Video Streaming', currency: 'BRL', price: 27.9 },
  { id: 4, name: 'Prime Video', serviceType: 'Video Streaming', currency: 'BRL', price: 19.9 },
  { id: 5, name: 'Apple TV+', serviceType: 'Video Streaming', currency: 'BRL', price: 21.9 },
  { id: 6, name: 'YouTube Premium', serviceType: 'Video Streaming', currency: 'BRL', price: 26.9 },
];

const MOCK_PAYMENT_SUBSCRIBERS: MockPaymentSubscriber[] = [
  { id: 1, name: 'Ana Luiza Costa', email: 'ana.luiza@email.com', platformIds: [1, 2] },
  { id: 2, name: 'Bruno Almeida', email: 'bruno.almeida@email.com', platformIds: [3, 4, 5] },
  { id: 3, name: 'Carla Ferreira', email: 'carla.ferreira@email.com', platformIds: [6] },
];

@Injectable()
export class MockBackendInterceptor implements HttpInterceptor {
  private paymentConfirmations: MockPaymentConfirmation[] = [
    {
      id: 101,
      subscriberId: 1,
      platformId: 1,
      referenceMonth: '2026-02',
      status: 'PENDING',
      requestedByEmail: 'viewer@splitfy.app',
      requestedAt: '2026-02-14T11:00:00.000Z',
      validatedByEmail: null,
      validatedAt: null,
    },
    {
      id: 102,
      subscriberId: 2,
      platformId: 4,
      referenceMonth: '2026-02',
      status: 'PENDING',
      requestedByEmail: 'viewer@splitfy.app',
      requestedAt: '2026-02-14T12:00:00.000Z',
      validatedByEmail: null,
      validatedAt: null,
    },
  ];

  private nextPaymentConfirmationId = 103;

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

    if (request.method === 'GET' && (/^\/billing\/\d+$/.test(path) || /^\/subscribers\/\d+\/billing$/.test(path))) {
      return this.handleSubscriberBilling(request, path);
    }

    if (request.method === 'POST' && path === API_ROUTES.paymentConfirmations) {
      return this.handleRegisterPaymentConfirmations(request);
    }

    if (
      request.method === 'POST' &&
      /^\/subscribers\/payments\/confirmations\/\d+\/approve$/.test(path)
    ) {
      return this.handleApprovePaymentConfirmation(request, path);
    }

    if (request.method === 'GET' && path === API_ROUTES.pendingPaymentConfirmations) {
      return this.handleListPendingPaymentConfirmations(request);
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
    const idMatch = path.match(/^\/billing\/(\d+)$/) ?? path.match(/^\/subscribers\/(\d+)\/billing$/);
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

  private handleRegisterPaymentConfirmations(
    request: HttpRequest<unknown>,
  ): Observable<HttpEvent<unknown>> {
    const payload = request.body as PaymentConfirmationBatchRequest | null;

    if (!payload || !this.isValidReferenceMonth(payload.referenceMonth) || !Array.isArray(payload.confirmations)) {
      return this.mockError(400, 'Invalid request');
    }

    const requesterEmail = this.resolveRequesterEmail(request);
    const requestedAt = new Date().toISOString();
    const created: PaymentConfirmationResponse[] = [];

    for (const item of payload.confirmations) {
      const subscriber = MOCK_PAYMENT_SUBSCRIBERS.find((entry) => entry.id === item.subscriberId);
      if (!subscriber || !Array.isArray(item.platformIds) || item.platformIds.length === 0) {
        return this.mockError(400, 'Invalid request');
      }

      for (const platformId of item.platformIds) {
        if (!subscriber.platformIds.includes(platformId)) {
          return this.mockError(400, 'Invalid platform IDs');
        }

        const platform = MOCK_PAYMENT_PLATFORMS.find((entry) => entry.id === platformId);
        if (!platform) {
          return this.mockError(400, 'Invalid platform IDs');
        }

        const confirmation: MockPaymentConfirmation = {
          id: this.nextPaymentConfirmationId++,
          subscriberId: subscriber.id,
          platformId: platform.id,
          referenceMonth: payload.referenceMonth,
          status: 'PENDING',
          requestedByEmail: requesterEmail,
          requestedAt,
          validatedByEmail: null,
          validatedAt: null,
        };

        this.paymentConfirmations.push(confirmation);
        created.push(this.toPaymentConfirmationResponse(confirmation));
      }
    }

    return of(new HttpResponse({ status: 200, body: created }));
  }

  private handleApprovePaymentConfirmation(
    request: HttpRequest<unknown>,
    path: string,
  ): Observable<HttpEvent<unknown>> {
    const idMatch = path.match(/^\/subscribers\/payments\/confirmations\/(\d+)\/approve$/);
    const confirmationId = Number(idMatch?.[1]);

    if (!idMatch || Number.isNaN(confirmationId)) {
      return this.mockError(404, 'Payment confirmation not found');
    }

    const index = this.paymentConfirmations.findIndex((entry) => entry.id === confirmationId);
    if (index < 0) {
      return this.mockError(404, 'Payment confirmation not found');
    }

    const updated: MockPaymentConfirmation = {
      ...this.paymentConfirmations[index],
      status: 'CONFIRMED',
      validatedByEmail: this.resolveRequesterEmail(request),
      validatedAt: new Date().toISOString(),
    };

    this.paymentConfirmations[index] = updated;
    return of(new HttpResponse({ status: 200, body: this.toPaymentConfirmationResponse(updated) }));
  }

  private handleListPendingPaymentConfirmations(
    request: HttpRequest<unknown>,
  ): Observable<HttpEvent<unknown>> {
    const referenceMonth = request.params.get('referenceMonth');
    if (referenceMonth && !this.isValidReferenceMonth(referenceMonth)) {
      return this.mockError(400, 'Invalid reference month format');
    }

    const pending = this.paymentConfirmations
      .filter(
        (entry) =>
          entry.status === 'PENDING' && (!referenceMonth || entry.referenceMonth === referenceMonth),
      )
      .map((entry) => this.toPendingPaymentApprovalResponse(entry));

    return of(new HttpResponse({ status: 200, body: pending }));
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

  private isValidReferenceMonth(value: string): boolean {
    return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
  }

  private resolveRequesterEmail(request: HttpRequest<unknown>): string {
    const authorizationHeader = request.headers.get('Authorization') ?? '';
    const tokenMatch = authorizationHeader.match(/^Bearer mock-jwt-token-(.+)$/);
    if (!tokenMatch) {
      return 'system@splitfy.app';
    }

    const user = MOCK_USERS.find((entry) => entry.userId === tokenMatch[1]);
    return user?.email ?? 'system@splitfy.app';
  }

  private toPaymentConfirmationResponse(
    confirmation: MockPaymentConfirmation,
  ): PaymentConfirmationResponse {
    return {
      id: confirmation.id,
      subscriberId: confirmation.subscriberId,
      platformId: confirmation.platformId,
      referenceMonth: confirmation.referenceMonth,
      status: confirmation.status,
      requestedByEmail: confirmation.requestedByEmail,
      requestedAt: confirmation.requestedAt,
      validatedByEmail: confirmation.validatedByEmail,
      validatedAt: confirmation.validatedAt,
    };
  }

  private toPendingPaymentApprovalResponse(
    confirmation: MockPaymentConfirmation,
  ): PendingPaymentApprovalResponse {
    const subscriber = MOCK_PAYMENT_SUBSCRIBERS.find((entry) => entry.id === confirmation.subscriberId);
    const platform = MOCK_PAYMENT_PLATFORMS.find((entry) => entry.id === confirmation.platformId);

    return {
      confirmationId: confirmation.id,
      referenceMonth: confirmation.referenceMonth,
      status: confirmation.status,
      requestedByEmail: confirmation.requestedByEmail,
      requestedAt: confirmation.requestedAt,
      subscriber: {
        id: subscriber?.id ?? confirmation.subscriberId,
        name: subscriber?.name ?? `Assinante #${confirmation.subscriberId}`,
        email: subscriber?.email ?? 'unknown@splitfy.app',
      },
      platform: {
        id: platform?.id ?? confirmation.platformId,
        name: platform?.name ?? `Plataforma #${confirmation.platformId}`,
        serviceType: platform?.serviceType ?? 'Software',
        currency: platform?.currency ?? 'BRL',
        price: platform?.price ?? 0,
      },
    };
  }
}
