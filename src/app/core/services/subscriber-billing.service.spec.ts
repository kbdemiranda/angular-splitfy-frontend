import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { SubscriberBillingService } from './subscriber-billing.service';

describe('SubscriberBillingService', () => {
  let service: SubscriberBillingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SubscriberBillingService],
    });
    service = TestBed.inject(SubscriberBillingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('requests billing with reference month param', async () => {
    const promise = firstValueFrom(service.getBilling(10, '2026-04'));
    const req = httpMock.expectOne('/billing/10?referenceMonth=2026-04');
    expect(req.request.method).toBe('GET');
    req.flush({ userId: 10, referenceMonth: '2026-04', items: [], totalMonthlyDue: 0, currency: 'BRL' });
    await expect(promise).resolves.toMatchObject({ userId: 10 });
  });

  it('requests billing without params when month is absent', async () => {
    const promise = firstValueFrom(service.getBilling(11));
    const req = httpMock.expectOne('/billing/11');
    expect(req.request.method).toBe('GET');
    req.flush({ userId: 11, referenceMonth: '2026-04', items: [], totalMonthlyDue: 0, currency: 'BRL' });
    await expect(promise).resolves.toMatchObject({ userId: 11 });
  });
});
