import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { API_ROUTES } from '../constants/api-routes';
import { ProfileCreateRequest, ProfileResponse, ProfileUpdateRequest } from '../../shared/models/profiles.model';

@Injectable({ providedIn: 'root' })
export class ProfilesService {
  constructor(private readonly http: HttpClient) {}

  list(): Observable<ProfileResponse[]> {
    return this.http.get<unknown>(API_ROUTES.profiles).pipe(map((response) => this.normalizeListResponse(response)));
  }

  create(payload: ProfileCreateRequest): Observable<unknown> {
    return this.http.post<unknown>(API_ROUTES.profiles, payload);
  }

  update(id: number | string, payload: ProfileUpdateRequest): Observable<unknown> {
    return this.http.put<unknown>(API_ROUTES.profileById(id), payload);
  }

  delete(id: number | string): Observable<void> {
    return this.http.delete<void>(API_ROUTES.profileById(id));
  }

  private normalizeListResponse(response: unknown): ProfileResponse[] {
    if (Array.isArray(response)) {
      return response
        .map((item) => this.toProfile(item))
        .filter((item): item is ProfileResponse => item !== null);
    }

    const source = (response ?? {}) as Record<string, unknown>;
    const candidates = [source['content'], source['items'], source['data']];
    const list = candidates.find((candidate) => Array.isArray(candidate)) as unknown[] | undefined;
    if (!list) {
      return [];
    }

    return list.map((item) => this.toProfile(item)).filter((item): item is ProfileResponse => item !== null);
  }

  private toProfile(input: unknown): ProfileResponse | null {
    if (!input || typeof input !== 'object') {
      return null;
    }

    const source = input as Record<string, unknown>;
    const idValue = source['id'] ?? source['name'];
    const nameValue = source['name'] ?? source['profileName'];

    const hasValidId = typeof idValue === 'number' || typeof idValue === 'string';
    if (!hasValidId || typeof nameValue !== 'string' || nameValue.trim().length === 0) {
      return null;
    }

    return {
      id: idValue,
      name: nameValue.trim(),
    };
  }
}
