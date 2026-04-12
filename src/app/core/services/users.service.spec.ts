import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UsersService],
    });
    service = TestBed.inject(UsersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('normalizes array payloads into page response', async () => {
    const promise = firstValueFrom(service.list(1, 5));
    const req = httpMock.expectOne('/users?page=1&size=5');
    req.flush([
      { id: 1, email: 'admin@a.com', profile: 'ADMIN', active: 'active', receivesDashboardEmail: 'true' },
      { userId: 2, email: 'u@a.com', role: 'viewer', enabled: false },
      { foo: 'bar' },
    ]);

    await expect(promise).resolves.toMatchObject({
      page: 1,
      size: 5,
      totalElements: 2,
      totalPages: 1,
    });
  });

  it('normalizes object payloads with fallback paging and profile mappings', async () => {
    const promise = firstValueFrom(service.list(0, 20));
    httpMock.expectOne('/users?page=0&size=20').flush({
      content: [
        { id: 'abc', email: 'x@x.com', profileName: { id: 'finance' }, isActive: true },
        { id: 9, email: 'y@y.com', role: 'READ_ONLY', receivesDashboardEmail: false },
      ],
      totalElements: 50,
      size: 10,
    });

    await expect(promise).resolves.toMatchObject({
      size: 10,
      totalElements: 50,
      totalPages: 5,
      content: [
        expect.objectContaining({ id: 'abc', profileName: 'finance', profile: 'Financeiro', active: true }),
        expect.objectContaining({ id: 9, profile: 'Somente leitura', receivesDashboardEmail: false }),
      ],
    });
  });

  it('calls create, update, patch and delete endpoints', async () => {
    const createPromise = firstValueFrom(
      service.create({ name: 'A', email: 'a@a.com', password: '12345678', profileName: 'USER', enabled: true }),
    );
    httpMock.expectOne('/users').flush({ ok: true });
    await expect(createPromise).resolves.toEqual({ ok: true });

    const updatePromise = firstValueFrom(service.update(10, { name: 'B', email: 'b@a.com', profileName: 'USER', enabled: true }));
    httpMock.expectOne('/users/10').flush({ ok: true });
    await expect(updatePromise).resolves.toEqual({ ok: true });

    const patchPromise = firstValueFrom(service.updateDashboardEmailPreference(10, { receivesDashboardEmail: true, force: false }));
    httpMock.expectOne('/users/10/dashboard-email-preference').flush({ ok: true });
    await expect(patchPromise).resolves.toEqual({ ok: true });

    const deletePromise = firstValueFrom(service.delete(10));
    httpMock.expectOne('/users/10').flush(null);
    await expect(deletePromise).resolves.toBeNull();
  });
});
