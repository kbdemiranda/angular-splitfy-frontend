import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { ProfilesService } from './profiles.service';

describe('ProfilesService', () => {
  let service: ProfilesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProfilesService],
    });
    service = TestBed.inject(ProfilesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('normalizes list responses from array and object formats', async () => {
    const arrayPromise = firstValueFrom(service.list());
    httpMock.expectOne('/profiles').flush([{ id: 1, name: 'ADMIN' }, { foo: 'bar' }]);
    await expect(arrayPromise).resolves.toEqual([{ id: 1, name: 'ADMIN' }]);

    const objectPromise = firstValueFrom(service.list());
    httpMock.expectOne('/profiles').flush({ items: [{ name: 'OP' }, { id: 2, profileName: 'USER' }] });
    await expect(objectPromise).resolves.toEqual([{ id: 'OP', name: 'OP' }, { id: 2, name: 'USER' }]);
  });

  it('calls CRUD endpoints', async () => {
    const createPromise = firstValueFrom(service.create({ name: 'ADMIN' }));
    httpMock.expectOne('/profiles').flush({ id: 1, name: 'ADMIN' });
    await expect(createPromise).resolves.toEqual({ id: 1, name: 'ADMIN' });

    const updatePromise = firstValueFrom(service.update(7, { name: 'VIEWER' }));
    httpMock.expectOne('/profiles/7').flush({ ok: true });
    await expect(updatePromise).resolves.toEqual({ ok: true });

    const deletePromise = firstValueFrom(service.delete(7));
    httpMock.expectOne('/profiles/7').flush(null);
    await expect(deletePromise).resolves.toBeNull();
  });
});
