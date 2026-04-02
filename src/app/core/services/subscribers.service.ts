import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { API_ROUTES } from '../constants/api-routes';
import {
  SubscriberPageResponse,
  SubscriberPlatformsBatchPayloadItem,
  SubscriberRequest,
  SubscriberResponse,
  SubscriberUpdateRequest,
} from '../../shared/models/subscribers.model';

@Injectable({ providedIn: 'root' })
export class SubscribersService {
  constructor(private readonly http: HttpClient) {}

  list(page = 0, size = 20, name?: string): Observable<SubscriberPageResponse> {
    let params = new HttpParams().set('page', String(page)).set('size', String(size));
    if (name && name.trim() !== '') {
      params = params.set('name', name.trim());
    }
    return this.http
      .get<unknown>(API_ROUTES.subscribers, { params })
      .pipe(map((response) => this.normalizePageResponse(response, page, size)));
  }

  create(payload: SubscriberRequest): Observable<SubscriberResponse> {
    return this.http.post<SubscriberResponse>(API_ROUTES.subscribers, payload);
  }

  details(id: number): Observable<SubscriberResponse> {
    return this.http.get<SubscriberResponse>(API_ROUTES.subscriberById(id));
  }

  subscriptions(id: number): Observable<unknown> {
    return this.http.get<unknown>(API_ROUTES.subscriberSubscriptions(id));
  }

  associatePlatforms(id: number, platformIds: number[]): Observable<void> {
    const headers = new HttpHeaders().set('subscriberId', String(id)).set('subscriberID', String(id));
    const payload: SubscriberPlatformsBatchPayloadItem[] = [{ platformIds }];
    return this.http.post<void>(API_ROUTES.associateSubscriberPlatforms(id), payload, { headers });
  }

  disassociatePlatforms(id: number, platformIds: number[]): Observable<void> {
    const headers = new HttpHeaders().set('subscriberId', String(id)).set('subscriberID', String(id));
    const payload: SubscriberPlatformsBatchPayloadItem[] = [{ platformIds }];
    return this.http.put<void>(API_ROUTES.disassociateSubscriberPlatforms(id), payload, { headers });
  }

  updateProfile(id: number, payload: SubscriberUpdateRequest): Observable<SubscriberResponse> {
    return this.http.put<SubscriberResponse>(API_ROUTES.subscriberById(id), payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(API_ROUTES.subscriberById(id));
  }

  private normalizePageResponse(response: unknown, page: number, size: number): SubscriberPageResponse {
    if (Array.isArray(response)) {
      return {
        content: response as SubscriberResponse[],
        page,
        size,
        totalElements: response.length,
        totalPages: response.length === 0 ? 0 : 1,
      };
    }

    const source = (response ?? {}) as Record<string, unknown>;
    const content = this.extractContent(source);
    const totalElements = this.numberOrDefault(source['totalElements'], content.length);
    const resolvedSize = this.numberOrDefault(source['size'], size);
    const totalPages = this.numberOrDefault(
      source['totalPages'],
      resolvedSize > 0 ? Math.ceil(totalElements / resolvedSize) : 0,
    );

    return {
      content,
      page: this.numberOrDefault(source['number'] ?? source['page'], page),
      size: resolvedSize,
      totalElements,
      totalPages,
    };
  }

  private extractContent(source: Record<string, unknown>): SubscriberResponse[] {
    const candidates = [source['content'], source['items'], source['data']];
    const list = candidates.find((candidate) => Array.isArray(candidate));
    return (list ?? []) as SubscriberResponse[];
  }

  private numberOrDefault(value: unknown, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  }
}
