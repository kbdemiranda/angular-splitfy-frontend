import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { PlatformsService } from './platforms.service';

describe('PlatformsService', () => {
  let service: PlatformsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PlatformsService],
    });

    service = TestBed.inject(PlatformsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('normalizes plain array responses into a page result', async () => {
    const resultPromise = firstValueFrom(service.list(2, 10));

    const req = httpMock.expectOne((request) => request.url === '/platforms');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('size')).toBe('10');

    req.flush([
      {
        id: 10,
        name: 'Netflix',
      },
    ]);

    await expect(resultPromise).resolves.toMatchObject({
      page: 2,
      size: 10,
      totalElements: 1,
      totalPages: 1,
      content: [{ id: 10, name: 'Netflix' }],
    });
  });

  it('normalizes object responses with fallback defaults', async () => {
    const resultPromise = firstValueFrom(service.list(1, 25));

    const req = httpMock.expectOne('/platforms?page=1&size=25');
    req.flush({
      items: [{ id: 7, name: 'YouTube' }],
      page: 'invalid',
      totalElements: 30,
      size: 15,
    });

    await expect(resultPromise).resolves.toMatchObject({
      page: 1,
      size: 15,
      totalElements: 30,
      totalPages: 2,
      content: [{ id: 7, name: 'YouTube' }],
    });
  });

  it('returns empty content when payload does not contain list data', async () => {
    const resultPromise = firstValueFrom(service.list(3, 7));
    const req = httpMock.expectOne('/platforms?page=3&size=7');
    req.flush({ foo: 'bar' });

    await expect(resultPromise).resolves.toMatchObject({
      page: 3,
      size: 7,
      totalElements: 0,
      totalPages: 0,
      content: [],
    });
  });
});
