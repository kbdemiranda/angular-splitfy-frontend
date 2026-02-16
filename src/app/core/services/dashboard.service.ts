import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ROUTES } from '../constants/api-routes';
import { DashboardKpiResponse } from '../../shared/models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private readonly http: HttpClient) {}

  getKpis(referenceMonth?: string): Observable<DashboardKpiResponse> {
    const params = referenceMonth
      ? new HttpParams().set('referenceMonth', referenceMonth)
      : new HttpParams();

    return this.http.get<DashboardKpiResponse>(API_ROUTES.dashboardKpis, { params });
  }
}
