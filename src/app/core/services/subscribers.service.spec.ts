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

  it('normalizes object list response and disassociates platforms', async () => {
    const listPromise = firstValueFrom(service.list(2, 5));
    const listReq = httpMock.expectOne('/subscribers?page=2&size=5');
    listReq.flush({
      items: [{ id: 1, name: 'A', email: 'a@a.com', associatedPlatforms: [] }],
      page: 3,
      size: 10,
      totalElements: 30,
      totalPages: 3,
    });
    await expect(listPromise).resolves.toMatchObject({
      page: 3,
      size: 10,
      totalElements: 30,
      totalPages: 3,
    });

    const disassociatePromise = firstValueFrom(service.disassociatePlatforms(8, [1]));
    const disassociateReq = httpMock.expectOne('/subscribers/8/disassociate');
    expect(disassociateReq.request.method).toBe('PUT');
    expect(disassociateReq.request.headers.get('subscriberId')).toBe('8');
    expect(disassociateReq.request.body).toEqual([{ platformIds: [1] }]);
    disassociateReq.flush(null);
    await expect(disassociatePromise).resolves.toBeNull();
  });

  it('calls details, subscriptions, create, update and delete', async () => {
    const detailsPromise = firstValueFrom(service.details(4));
    httpMock.expectOne('/subscribers/4').flush({ id: 4, name: 'A', email: 'a@a.com', associatedPlatforms: [] });
    await expect(detailsPromise).resolves.toMatchObject({ id: 4 });

    const subscriptionsPromise = firstValueFrom(service.subscriptions(4));
    httpMock.expectOne('/subscribers/4/subscriptions').flush([{ id: 1 }]);
    await expect(subscriptionsPromise).resolves.toEqual([{ id: 1 }]);

    const createPromise = firstValueFrom(service.create({ name: 'A', email: 'a@a.com' }));
    httpMock.expectOne('/subscribers').flush({ ok: true });
    await expect(createPromise).resolves.toEqual({ ok: true });

    const updatePromise = firstValueFrom(service.updateProfile(4, { name: 'B', email: 'b@a.com' }));
    httpMock.expectOne('/subscribers/4').flush({ ok: true });
    await expect(updatePromise).resolves.toEqual({ ok: true });

    const deletePromise = firstValueFrom(service.delete(4));
    httpMock.expectOne('/subscribers/4').flush(null);
    await expect(deletePromise).resolves.toBeNull();
  });

  it('does not send name query param when filter is blank', async () => {
    const promise = firstValueFrom(service.list(0, 20, '   '));
    const req = httpMock.expectOne('/subscribers?page=0&size=20');
    expect(req.request.params.has('name')).toBe(false);
    req.flush({ content: [], number: 0, size: 20, totalElements: 0, totalPages: 0 });
    await expect(promise).resolves.toMatchObject({ totalElements: 0 });
  });
});
