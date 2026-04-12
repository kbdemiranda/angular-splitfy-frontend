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

  it('lists pending confirmations without reference month', async () => {
    const resultPromise = firstValueFrom(service.listPending());
    const req = httpMock.expectOne('/subscribers/payments/confirmations/pending');
    expect(req.request.method).toBe('GET');
    req.flush([]);
    await expect(resultPromise).resolves.toEqual([]);
  });

  it('handles register, approve and send email endpoints', async () => {
    const registerPromise = firstValueFrom(
      service.register({
        referenceMonth: '2026-04',
        confirmations: [{ subscriberId: 1, platformIds: [1, 2] }],
      }),
    );
    const registerReq = httpMock.expectOne('/subscribers/payments/confirmations');
    expect(registerReq.request.method).toBe('POST');
    registerReq.flush([{ id: 1 }]);
    await expect(registerPromise).resolves.toEqual([{ id: 1 }]);

    const approvePromise = firstValueFrom(service.approve(55));
    const approveReq = httpMock.expectOne('/subscribers/payments/confirmations/55/approve');
    expect(approveReq.request.method).toBe('POST');
    approveReq.flush({ id: 55, status: 'CONFIRMED' });
    await expect(approvePromise).resolves.toEqual({ id: 55, status: 'CONFIRMED' });

    const emailPromise = firstValueFrom(
      service.sendBillingSummaryEmail({ subscriberIds: [1], emails: ['a@a.com'], referenceMonth: '2026-04' }),
    );
    const emailReq = httpMock.expectOne('/subscribers/billing/email-summary');
    expect(emailReq.request.method).toBe('POST');
    emailReq.flush(null);
    await expect(emailPromise).resolves.toBeNull();
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
