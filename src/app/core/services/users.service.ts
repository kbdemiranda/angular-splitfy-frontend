import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { API_ROUTES } from '../constants/api-routes';
import { UserCreateRequest, UserPageResponse, UserResponse, UserUpdateRequest } from '../../shared/models/users.model';

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(private readonly http: HttpClient) {}

  list(page = 0, size = 20): Observable<UserPageResponse> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http
      .get<unknown>(API_ROUTES.users, { params })
      .pipe(map((response) => this.normalizePageResponse(response, page, size)));
  }

  create(payload: UserCreateRequest): Observable<unknown> {
    return this.http.post<unknown>(API_ROUTES.users, payload);
  }

  update(id: number | string, payload: UserUpdateRequest): Observable<unknown> {
    return this.http.put<unknown>(API_ROUTES.userById(id), payload);
  }

  delete(id: number | string): Observable<void> {
    return this.http.delete<void>(API_ROUTES.userById(id));
  }

  private normalizePageResponse(response: unknown, page: number, size: number): UserPageResponse {
    if (Array.isArray(response)) {
      const content = response
        .map((item) => this.toUser(item))
        .filter((item): item is UserResponse => item !== null);
      return {
        content,
        page,
        size,
        totalElements: content.length,
        totalPages: content.length === 0 ? 0 : 1,
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

  private extractContent(source: Record<string, unknown>): UserResponse[] {
    const candidates = [source['content'], source['items'], source['data']];
    const list = candidates.find((candidate) => Array.isArray(candidate)) as unknown[] | undefined;
    if (!list) {
      return [];
    }

    return list.map((item) => this.toUser(item)).filter((item): item is UserResponse => item !== null);
  }

  private toUser(input: unknown): UserResponse | null {
    if (!input || typeof input !== 'object') {
      return null;
    }

    const source = input as Record<string, unknown>;
    const idValue = source['id'] ?? source['userId'] ?? source['uuid'] ?? source['email'];
    const emailValue = source['email'];
    const nameValue = source['name'] ?? source['fullName'] ?? source['username'];
    const profileValue = source['profile'] ?? source['role'] ?? source['profileName'];
    const activeValue = source['active'] ?? source['enabled'] ?? source['isActive'] ?? source['status'];

    const hasValidId = typeof idValue === 'number' || typeof idValue === 'string';
    if (!hasValidId || typeof emailValue !== 'string') {
      return null;
    }

    const name = typeof nameValue === 'string' && nameValue.trim().length > 0 ? nameValue : emailValue;
    const profileName = this.extractProfileName(profileValue);
    const profile = this.toProfilePtBr(profileName);
    const active =
      typeof activeValue === 'boolean'
        ? activeValue
        : typeof activeValue === 'string'
          ? ['active', 'ativo', 'enabled', 'true'].includes(activeValue.toLowerCase())
          : true;

    return {
      id: idValue,
      name,
      email: emailValue,
      profileName,
      profile,
      active,
    };
  }

  private toProfilePtBr(value: unknown): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      return 'Não informado';
    }

    const normalized = value.trim().toUpperCase();
    const profileMap: Record<string, string> = {
      ADMIN: 'Administrador',
      VIEWER: 'Visualizador',
      USER: 'Usuário',
      FINANCE: 'Financeiro',
      FINANCIAL: 'Financeiro',
      OPERATION: 'Operação',
      OPERATOR: 'Operador',
      READ_ONLY: 'Somente leitura',
      READONLY: 'Somente leitura',
    };

    return profileMap[normalized] ?? value;
  }

  private extractProfileName(value: unknown): string {
    if (typeof value === 'string') {
      return value.trim();
    }

    if (value && typeof value === 'object') {
      const source = value as Record<string, unknown>;
      const resolved = source['name'] ?? source['profileName'] ?? source['id'];
      return typeof resolved === 'string' ? resolved.trim() : 'UNKNOWN';
    }

    return 'UNKNOWN';
  }

  private numberOrDefault(value: unknown, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  }
}
