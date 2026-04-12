import { ChangeDetectorRef, NgZone } from '@angular/core';
import { of, throwError } from 'rxjs';
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
    } as unknown as jest.Mocked<SubscribersService>;

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
    } as unknown as jest.Mocked<SubscriberBillingService>;

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

    return { component, paymentConfirmationsService, subscribersService, subscriberBillingService };
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

  it('loads subscribers on init and opens details with billing data', () => {
    const { component, subscribersService } = createComponent();
    (subscribersService.list as jest.Mock).mockReturnValue(
      of({
        content: [subscriber],
        page: 0,
        size: 20,
        totalElements: 1,
        totalPages: 1,
      }),
    );

    component.ngOnInit();
    expect(component.subscribers).toEqual([subscriber]);
    expect(component.hasLoadedSubscribers).toBe(true);

    component.openDetails(subscriber);
    expect(component.selectedSubscriber?.id).toBe(7);
    expect(component.billingLoading).toBe(false);
  });

  it('handles register payment success and error', () => {
    const { component, paymentConfirmationsService } = createComponent();
    component.selectedSubscriber = subscriber;
    component.registerPaymentReferenceMonth = '2026-04';
    component.registerPaymentSelectedPlatformIds = new Set([1, 2]);

    component.submitRegisterPayment();
    expect(paymentConfirmationsService.registerSubscriberPayment).toHaveBeenCalledWith(7, {
      referenceMonth: '2026-04',
      platformIds: [1, 2],
    });
    expect(component.registerPaymentFeedback?.type).toBe('success');

    (paymentConfirmationsService.registerSubscriberPayment as jest.Mock).mockReturnValue(
      throwError(() => new Error('boom')),
    );
    component.submitRegisterPayment();
    expect(component.registerPaymentFeedback?.type).toBe('error');
  });

  it('handles bulk charge success and error', () => {
    const { component, paymentConfirmationsService } = createComponent();
    component.bulkChargeSelectedSubscriberIds = new Set([7]);
    component.bulkChargeDestinationEmails = 'alice@example.com, bob@example.com';
    component.bulkChargeReferenceMonth = '2026-04';

    component.submitBulkCharge();
    expect(paymentConfirmationsService.sendBillingSummaryEmail).toHaveBeenCalledWith({
      subscriberIds: [7],
      emails: ['alice@example.com', 'bob@example.com'],
      referenceMonth: '2026-04',
    });
    expect(component.bulkChargeFeedback?.type).toBe('success');

    (paymentConfirmationsService.sendBillingSummaryEmail as jest.Mock).mockReturnValue(
      throwError(() => new Error('boom')),
    );
    component.submitBulkCharge();
    expect(component.bulkChargeFeedback?.type).toBe('error');
  });

  it('formats labels, statuses and month navigation', () => {
    const { component } = createComponent();
    expect(component.paymentStatusClass('PAID')).toBe('paid');
    expect(component.paymentStatusClass('PENDING')).toBe('pending');
    expect(component.paymentStatusClass('UNPAID')).toBe('unpaid');
    expect(component.paymentStatusClass('OTHER')).toBe('neutral');

    expect(component.billingCycleLabel('MONTHLY')).toBe('status.monthly');
    expect(component.paymentStatusLabel('PAID')).toBe('status.paid');
    expect(component.formatNullableCurrency(null)).toBe('-');
    expect(component.formatNullableNumber(null)).toBe('-');
    expect(component.formatNullableDate(null)).toBe('-');

    const current = component.billingReferenceMonth;
    component.selectedSubscriber = subscriber;
    component.loadPreviousBillingMonth();
    expect(component.billingReferenceMonth).not.toBe(current);
    component.loadNextBillingMonth();
  });

  it('handles error flows for subscribers and billing load', () => {
    const { component, subscribersService, subscriberBillingService } = createComponent();
    (subscribersService.list as jest.Mock).mockReturnValue(throwError(() => new Error('boom')));
    component.ngOnInit();
    expect(component.subscribersError).toContain('Não foi possível carregar');

    (subscriberBillingService.getBilling as jest.Mock).mockReturnValue(throwError(() => new Error('boom')));
    component.openDetails(subscriber);
    expect(component.billingError).toContain('Não foi possível carregar a cobrança');
  });

  it('covers no-op branches and modal helpers', () => {
    const { component } = createComponent();
    component.closeDetails();
    component.openRegisterPaymentModal();
    expect(component.registerPaymentModalOpen).toBe(false);

    component.openBulkChargeModal();
    expect(component.bulkChargeModalOpen).toBe(true);
    component.closeBulkChargeModal();
    expect(component.bulkChargeModalOpen).toBe(false);

    component.changeBillingMonth('');
    component.sendChargeEmail();
    expect(component.charging).toBe(false);

    expect(component.pendingBillingItems).toEqual([]);
    expect(component.registerPaymentPlatforms).toEqual([]);
    component.toggleBulkSubscriber(1, true);
    expect(component.hasBulkSubscriberSelected(1)).toBe(true);
    component.toggleBulkSubscriber(1, false);
    expect(component.hasBulkSubscriberSelected(1)).toBe(false);
  });

  it('covers register selection toggles and guard returns', () => {
    const { component } = createComponent();
    component.toggleRegisterPaymentPlatform(3, true);
    expect(component.hasRegisterPaymentPlatformSelected(3)).toBe(true);
    component.toggleRegisterPaymentPlatform(3, false);
    expect(component.hasRegisterPaymentPlatformSelected(3)).toBe(false);

    component.registeringPayment = true;
    component.submitRegisterPayment();
    component.registeringPayment = false;
    component.selectedSubscriber = null;
    component.submitRegisterPayment();

    component.bulkCharging = true;
    component.submitBulkCharge();

    component.openingDetailsSubscriberId = 1;
    component.openDetails(subscriber);
    expect(component.selectedSubscriber).toBeNull();
  });

  it('covers status labels/icons and modal open/close branches', () => {
    const { component } = createComponent();
    component.selectedSubscriber = subscriber;
    component.openRegisterPaymentModal();
    expect(component.registerPaymentModalOpen).toBe(true);
    component.closeRegisterPaymentModal();
    expect(component.registerPaymentModalOpen).toBe(false);

    expect(component.billingCycleLabel('MONTHLY')).toBe('status.monthly');
    expect(component.billingCycleLabel('SEMI_ANNUAL')).toBe('status.semi_annual');
    expect(component.billingCycleLabel('ANNUAL')).toBe('status.annual');
    expect(component.billingCycleLabel('X')).toBe('X');

    expect(component.paymentStatusLabel('PAID')).toBe('status.paid');
    expect(component.paymentStatusLabel('PENDING')).toBe('status.pending');
    expect(component.paymentStatusLabel('UNPAID')).toBe('status.unpaid');
    expect(component.paymentStatusLabel('OTHER')).toBe('OTHER');
    expect(component.paymentStatusIcon('UNKNOWN')).toBeDefined();
  });
});
