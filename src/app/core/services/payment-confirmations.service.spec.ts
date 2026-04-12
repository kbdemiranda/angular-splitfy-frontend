import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { PaymentConfirmationsService } from './payment-confirmations.service';

describe('PaymentConfirmationsService', () => {
  let service: PaymentConfirmationsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PaymentConfirmationsService],
    });

    service = TestBed.inject(PaymentConfirmationsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('adds reference month as query param for pending confirmations', async () => {
    const resultPromise = firstValueFrom(service.listPending('2026-04'));

    const req = httpMock.expectOne('/subscribers/payments/confirmations/pending?referenceMonth=2026-04');
    expect(req.request.method).toBe('GET');
    req.flush([]);

    await expect(resultPromise).resolves.toEqual([]);
  });

  it('sends subscriber headers when registering payments', async () => {
    const requestPromise = firstValueFrom(
      service.registerSubscriberPayment(44, {
        referenceMonth: '2026-04',
        platformIds: [1, 3],
      }),
    );

    const req = httpMock.expectOne('/paymnets/subscribers/44');
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('subscriberId')).toBe('44');
    expect(req.request.headers.get('subscriberID')).toBe('44');
    req.flush(null);

    await expect(requestPromise).resolves.toBeNull();
  });
});
