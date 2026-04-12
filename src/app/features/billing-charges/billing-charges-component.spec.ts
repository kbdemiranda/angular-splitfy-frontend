import { ChangeDetectorRef, NgZone } from '@angular/core';
import { of } from 'rxjs';
import { BillingChargesComponent } from './billing-charges-component';
import { SubscribersService } from '../../core/services/subscribers.service';
import { SubscriberBillingService } from '../../core/services/subscriber-billing.service';
import { PaymentConfirmationsService } from '../../core/services/payment-confirmations.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { SubscriberResponse } from '../../shared/models/subscribers.model';

describe('BillingChargesComponent', () => {
  const createComponent = () => {
    const subscribersService = {
      list: jest.fn().mockReturnValue(of({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 })),
    } as unknown as SubscribersService;

    const subscriberBillingService = {
      getBilling: jest.fn().mockReturnValue(
        of({
          userId: 1,
          referenceMonth: '2026-04',
          items: [],
          totalMonthlyDue: 0,
          currency: 'BRL',
        }),
      ),
    } as unknown as SubscriberBillingService;

    const paymentConfirmationsService = {
      sendBillingSummaryEmail: jest.fn().mockReturnValue(of(void 0)),
      registerSubscriberPayment: jest.fn().mockReturnValue(of(void 0)),
    } as unknown as jest.Mocked<PaymentConfirmationsService>;

    const cdr = {
      markForCheck: jest.fn(),
      detectChanges: jest.fn(),
    } as unknown as ChangeDetectorRef;

    const ngZone = {
      run: (callback: () => void) => callback(),
    } as NgZone;

    const i18nService = {
      localeForIntl: jest.fn().mockReturnValue('pt-BR'),
      translate: jest.fn().mockImplementation((key: string) => key),
    } as unknown as I18nService;

    const component = new BillingChargesComponent(
      subscribersService,
      subscriberBillingService,
      paymentConfirmationsService,
      cdr,
      ngZone,
      i18nService,
    );

    return { component, paymentConfirmationsService };
  };

  const subscriber: SubscriberResponse = {
    id: 7,
    name: 'Alice',
    email: 'alice@example.com',
    associatedPlatforms: [],
  };

  it('validates register payment before sending request', () => {
    const { component, paymentConfirmationsService } = createComponent();

    component.selectedSubscriber = subscriber;
    component.registerPaymentReferenceMonth = '2026-13';

    component.submitRegisterPayment();
    expect(component.registerPaymentFeedback?.message).toContain('Selecione ao menos uma plataforma.');

    component.registerPaymentSelectedPlatformIds = new Set([1]);
    component.submitRegisterPayment();

    expect(component.registerPaymentFeedback?.message).toContain('YYYY-MM');
    expect(paymentConfirmationsService.registerSubscriberPayment).not.toHaveBeenCalled();
  });

  it('validates bulk charge inputs before sending request', () => {
    const { component, paymentConfirmationsService } = createComponent();

    component.submitBulkCharge();
    expect(component.bulkChargeFeedback?.message).toContain('Selecione ao menos um assinante.');

    component.bulkChargeSelectedSubscriberIds = new Set([1]);
    component.submitBulkCharge();
    expect(component.bulkChargeFeedback?.message).toContain('ao menos um e-mail');

    component.bulkChargeDestinationEmails = 'a@example.com';
    component.bulkChargeReferenceMonth = '2026-20';
    component.submitBulkCharge();

    expect(component.bulkChargeFeedback?.message).toContain('YYYY-MM');
    expect(paymentConfirmationsService.sendBillingSummaryEmail).not.toHaveBeenCalled();
  });

  it('sends charge email and sets success feedback', () => {
    const { component, paymentConfirmationsService } = createComponent();

    component.selectedSubscriber = subscriber;
    component.billingReferenceMonth = '2026-04';

    component.sendChargeEmail();

    expect(paymentConfirmationsService.sendBillingSummaryEmail).toHaveBeenCalledWith({
      subscriberIds: [7],
      emails: ['alice@example.com'],
      referenceMonth: '2026-04',
    });
    expect(component.chargeFeedback).toEqual({
      type: 'success',
      message: 'Cobrança enviada para o e-mail cadastrado.',
    });
    expect(component.charging).toBe(false);
  });
});
