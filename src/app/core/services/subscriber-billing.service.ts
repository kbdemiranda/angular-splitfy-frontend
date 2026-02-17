import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ROUTES } from '../constants/api-routes';
import { SubscriberBillingResponse } from '../../shared/models/subscriber-billing.model';

@Injectable({ providedIn: 'root' })
export class SubscriberBillingService {
  constructor(private readonly http: HttpClient) {}

  getBilling(subscriberId: number, referenceMonth?: string): Observable<SubscriberBillingResponse> {
    const params = referenceMonth
      ? new HttpParams().set('referenceMonth', referenceMonth)
      : new HttpParams();

    return this.http.get<SubscriberBillingResponse>(API_ROUTES.subscriberBilling(subscriberId), { params });
  }
}
