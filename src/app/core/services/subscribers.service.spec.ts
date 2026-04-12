import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { SubscribersService } from './subscribers.service';

describe('SubscribersService', () => {
  let service: SubscribersService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SubscribersService],
    });

    service = TestBed.inject(SubscribersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('trims name filter before sending list request', async () => {
    const resultPromise = firstValueFrom(service.list(0, 20, '  Ana  '));

    const req = httpMock.expectOne((request) => request.url === '/subscribers');
    expect(req.request.params.get('name')).toBe('Ana');
    req.flush([]);

    await expect(resultPromise).resolves.toMatchObject({
      content: [],
      totalElements: 0,
      totalPages: 0,
    });
  });

  it('sends both subscriber headers when associating platforms', async () => {
    const requestPromise = firstValueFrom(service.associatePlatforms(33, [1, 2]));

    const req = httpMock.expectOne('/subscribers/33/associate');
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('subscriberId')).toBe('33');
    expect(req.request.headers.get('subscriberID')).toBe('33');
    expect(req.request.body).toEqual([{ platformIds: [1, 2] }]);
    req.flush(null);

    await expect(requestPromise).resolves.toBeNull();
  });
});
