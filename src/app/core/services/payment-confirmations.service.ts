import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ROUTES } from '../constants/api-routes';
import {
  PaymentConfirmationBatchRequest,
  PaymentConfirmationResponse,
  PendingPaymentApprovalResponse,
  SubscriberBillingEmailRequest,
} from '../../shared/models/payment-confirmations.model';

@Injectable({ providedIn: 'root' })
export class PaymentConfirmationsService {
  constructor(private readonly http: HttpClient) {}

  register(payload: PaymentConfirmationBatchRequest): Observable<PaymentConfirmationResponse[]> {
    return this.http.post<PaymentConfirmationResponse[]>(API_ROUTES.paymentConfirmations, payload);
  }

  approve(confirmationId: number): Observable<PaymentConfirmationResponse> {
    return this.http.post<PaymentConfirmationResponse>(
      API_ROUTES.approvePaymentConfirmation(confirmationId),
      {},
    );
  }

  listPending(referenceMonth?: string): Observable<PendingPaymentApprovalResponse[]> {
    const params = referenceMonth
      ? new HttpParams().set('referenceMonth', referenceMonth)
      : new HttpParams();

    return this.http.get<PendingPaymentApprovalResponse[]>(API_ROUTES.pendingPaymentConfirmations, {
      params,
    });
  }

  sendBillingSummaryEmail(payload: SubscriberBillingEmailRequest): Observable<void> {
    return this.http.post<void>(API_ROUTES.sendSubscriberBillingEmail, payload);
  }
}
