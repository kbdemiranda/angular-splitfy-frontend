import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { API_ROUTES } from '../constants/api-routes';
import {
  DashboardEmailOccurrence,
  DashboardEmailScheduleRequest,
  DashboardEmailScheduleResponse,
} from '../../shared/models/email-schedules.model';

@Injectable({ providedIn: 'root' })
export class EmailSchedulesService {
  constructor(private readonly http: HttpClient) {}

  getDashboardSchedule(): Observable<DashboardEmailScheduleResponse> {
    return this.http
      .get<unknown>(API_ROUTES.dashboardEmailSchedule)
      .pipe(map((response) => this.normalizeResponse(response)));
  }

  updateDashboardSchedule(payload: DashboardEmailScheduleRequest): Observable<DashboardEmailScheduleResponse> {
    return this.http
      .put<unknown>(API_ROUTES.dashboardEmailSchedule, payload)
      .pipe(map((response) => this.normalizeResponse(response, payload)));
  }

  private normalizeResponse(
    response: unknown,
    fallback?: DashboardEmailScheduleRequest,
  ): DashboardEmailScheduleResponse {
    const source = response && typeof response === 'object' ? (response as Record<string, unknown>) : {};
    const occurrences = Array.isArray(source['occurrences'])
      ? source['occurrences'].map((item) => this.toOccurrence(item)).filter((item): item is DashboardEmailOccurrence => item !== null)
      : fallback?.occurrences ?? [];

    return {
      scheduleKey:
        typeof source['scheduleKey'] === 'string' && source['scheduleKey'].trim().length > 0
          ? source['scheduleKey']
          : 'DASHBOARD_EMAIL',
      enabled: typeof source['enabled'] === 'boolean' ? source['enabled'] : fallback?.enabled ?? false,
      timezone:
        typeof source['timezone'] === 'string' && source['timezone'].trim().length > 0
          ? source['timezone'].trim()
          : fallback?.timezone ?? 'America/Sao_Paulo',
      occurrences,
    };
  }

  private toOccurrence(input: unknown): DashboardEmailOccurrence | null {
    if (!input || typeof input !== 'object') {
      return null;
    }

    const source = input as Record<string, unknown>;
    const dayOfWeek = source['dayOfWeek'];
    const executionTime = source['executionTime'];

    if (
      typeof dayOfWeek !== 'number' ||
      dayOfWeek < 1 ||
      dayOfWeek > 7 ||
      typeof executionTime !== 'string' ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(executionTime)
    ) {
      return null;
    }

    return {
      dayOfWeek: dayOfWeek as DashboardEmailOccurrence['dayOfWeek'],
      executionTime,
    };
  }
}
