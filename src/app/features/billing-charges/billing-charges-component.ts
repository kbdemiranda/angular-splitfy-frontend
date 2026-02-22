import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { CircleCheck, CircleX, Clock3, LucideIconData } from 'lucide-angular';
import { I18nService } from '../../core/i18n/i18n.service';
import { SubscribersService } from '../../core/services/subscribers.service';
import { SubscriberBillingService } from '../../core/services/subscriber-billing.service';
import { PaymentConfirmationsService } from '../../core/services/payment-confirmations.service';
import { SubscriberBillingItem, SubscriberBillingResponse } from '../../shared/models/subscriber-billing.model';
import { SubscriberPageResponse, SubscriberResponse } from '../../shared/models/subscribers.model';

@Component({
  selector: 'app-billing-charges',
  templateUrl: './billing-charges-component.html',
  styleUrl: './billing-charges-component.scss',
  standalone: false,
})
export class BillingChargesComponent implements OnInit {
  subscribers: SubscriberResponse[] = [];
  subscribersPage: SubscriberPageResponse = {
    content: [],
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
  };

  isLoadingSubscribers = false;
  hasLoadedSubscribers = false;
  subscribersError: string | null = null;

  selectedSubscriber: SubscriberResponse | null = null;
  selectedSubscriberBilling: SubscriberBillingResponse | null = null;
  billingReferenceMonth = this.currentReferenceMonth();
  billingLoading = false;
  billingError: string | null = null;
  openingDetailsSubscriberId: number | null = null;
  charging = false;
  chargeFeedback: { type: 'success' | 'error'; message: string } | null = null;
  bulkChargeModalOpen = false;
  bulkChargeReferenceMonth = this.currentReferenceMonth();
  bulkChargeDestinationEmails = '';
  bulkChargeSelectedSubscriberIds = new Set<number>();
  bulkCharging = false;
  bulkChargeFeedback: { type: 'success' | 'error'; message: string } | null = null;
  registerPaymentModalOpen = false;
  registerPaymentReferenceMonth = this.currentReferenceMonth();
  registerPaymentSelectedPlatformIds = new Set<number>();
  registeringPayment = false;
  registerPaymentFeedback: { type: 'success' | 'error'; message: string } | null = null;

  readonly billingStatusIcons: Record<string, LucideIconData> = {
    PAID: CircleCheck,
    PENDING: Clock3,
    UNPAID: CircleX,
  };

  constructor(
    private readonly subscribersService: SubscribersService,
    private readonly subscriberBillingService: SubscriberBillingService,
    private readonly paymentConfirmationsService: PaymentConfirmationsService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly ngZone: NgZone,
    private readonly i18nService: I18nService,
  ) {}

  ngOnInit(): void {
    this.loadSubscribers();
  }

  trackById(_: number, subscriber: SubscriberResponse): number {
    return subscriber.id;
  }

  trackBillingItem(_: number, item: SubscriberBillingItem): number {
    return item.serviceId;
  }

  get pendingBillingItems(): SubscriberBillingItem[] {
    if (!this.selectedSubscriberBilling) {
      return [];
    }

    return this.selectedSubscriberBilling.items.filter(
      (item) => item.paymentStatus === 'PENDING' || item.paymentStatus === 'UNPAID',
    );
  }

  get registerPaymentPlatforms(): { id: number; name: string }[] {
    const uniquePlatforms = new Map<number, string>();

    for (const item of this.pendingBillingItems) {
      if (!uniquePlatforms.has(item.serviceId)) {
        uniquePlatforms.set(item.serviceId, item.serviceName);
      }
    }

    return Array.from(uniquePlatforms.entries()).map(([id, name]) => ({ id, name }));
  }

  openDetails(subscriber: SubscriberResponse): void {
    if (this.openingDetailsSubscriberId !== null) {
      return;
    }

    this.runInZone(() => {
      this.selectedSubscriber = { ...subscriber };
      this.selectedSubscriberBilling = null;
      this.billingError = null;
      this.billingLoading = true;
      this.openingDetailsSubscriberId = subscriber.id;
      this.syncView();
    });

    this.loadBilling(subscriber.id, this.billingReferenceMonth);
  }

  closeDetails(): void {
    this.selectedSubscriber = null;
    this.selectedSubscriberBilling = null;
    this.billingLoading = false;
    this.billingError = null;
    this.openingDetailsSubscriberId = null;
    this.charging = false;
    this.chargeFeedback = null;
    this.closeRegisterPaymentModal();
  }

  changeBillingMonth(referenceMonth: string): void {
    if (!referenceMonth || !this.selectedSubscriber) {
      return;
    }

    this.billingReferenceMonth = referenceMonth;
    this.loadBilling(this.selectedSubscriber.id, referenceMonth);
  }

  initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  formatCurrency(value: number | null | undefined, currency = 'BRL'): string {
    return new Intl.NumberFormat(this.i18nService.localeForIntl(), { style: 'currency', currency }).format(value ?? 0);
  }

  formatNullableCurrency(value: number | null | undefined, currency = 'BRL'): string {
    if (value === null || value === undefined) {
      return '-';
    }

    return this.formatCurrency(value, currency);
  }

  formatNullableNumber(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return '-';
    }

    return new Intl.NumberFormat(this.i18nService.localeForIntl(), {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(value);
  }

  formatNullableDate(value: string | null): string {
    if (!value) {
      return '-';
    }

    return new Intl.DateTimeFormat(this.i18nService.localeForIntl(), { dateStyle: 'short' }).format(new Date(value));
  }

  billingCycleLabel(cycle: string): string {
    if (cycle === 'MONTHLY') {
      return this.i18nService.translate('status.monthly');
    }

    if (cycle === 'SEMI_ANNUAL') {
      return this.i18nService.translate('status.semi_annual');
    }

    if (cycle === 'ANNUAL') {
      return this.i18nService.translate('status.annual');
    }

    return cycle;
  }

  paymentStatusLabel(status: string): string {
    if (status === 'PAID') {
      return this.i18nService.translate('status.paid');
    }

    if (status === 'PENDING') {
      return this.i18nService.translate('status.pending');
    }

    if (status === 'UNPAID') {
      return this.i18nService.translate('status.unpaid');
    }

    return status;
  }

  paymentStatusClass(status: string): string {
    if (status === 'PAID') {
      return 'paid';
    }

    if (status === 'PENDING') {
      return 'pending';
    }

    if (status === 'UNPAID') {
      return 'unpaid';
    }

    return 'neutral';
  }

  paymentStatusIcon(status: string): LucideIconData {
    return this.billingStatusIcons[status] ?? CircleX;
  }

  sendChargeEmail(): void {
    if (!this.selectedSubscriber || this.charging) {
      return;
    }

    this.charging = true;
    this.chargeFeedback = null;
    this.syncView();

    this.paymentConfirmationsService
      .sendBillingSummaryEmail({
        subscriberIds: [this.selectedSubscriber.id],
        emails: [this.selectedSubscriber.email],
        referenceMonth: this.billingReferenceMonth,
      })
      .subscribe({
        next: () => {
          this.runInZone(() => {
            this.charging = false;
            this.chargeFeedback = {
              type: 'success',
              message: `Cobrança enviada para o e-mail cadastrado.`,
            };
            this.syncView();
          });
        },
        error: () => {
          this.runInZone(() => {
            this.charging = false;
            this.chargeFeedback = {
              type: 'error',
              message: 'Não foi possível enviar o e-mail de cobrança.',
            };
            this.syncView();
          });
        },
      });
  }

  openBulkChargeModal(): void {
    this.bulkChargeModalOpen = true;
    this.bulkChargeReferenceMonth = this.billingReferenceMonth;
    this.bulkChargeDestinationEmails = '';
    this.bulkChargeSelectedSubscriberIds = new Set<number>();
    this.bulkChargeFeedback = null;
  }

  closeBulkChargeModal(): void {
    this.bulkChargeModalOpen = false;
    this.bulkCharging = false;
    this.bulkChargeFeedback = null;
  }

  openRegisterPaymentModal(): void {
    if (!this.selectedSubscriber) {
      return;
    }

    this.registerPaymentModalOpen = true;
    this.registerPaymentReferenceMonth = this.billingReferenceMonth;
    this.registerPaymentSelectedPlatformIds = new Set<number>();
    this.registeringPayment = false;
    this.registerPaymentFeedback = null;
  }

  closeRegisterPaymentModal(): void {
    this.registerPaymentModalOpen = false;
    this.registeringPayment = false;
    this.registerPaymentFeedback = null;
  }

  hasRegisterPaymentPlatformSelected(platformId: number): boolean {
    return this.registerPaymentSelectedPlatformIds.has(platformId);
  }

  toggleRegisterPaymentPlatform(platformId: number, checked: boolean): void {
    if (checked) {
      this.registerPaymentSelectedPlatformIds.add(platformId);
      return;
    }

    this.registerPaymentSelectedPlatformIds.delete(platformId);
  }

  submitRegisterPayment(): void {
    if (this.registeringPayment || !this.selectedSubscriber) {
      return;
    }

    const subscriberId = this.selectedSubscriber.id;
    const platformIds = Array.from(this.registerPaymentSelectedPlatformIds);

    if (platformIds.length === 0) {
      this.registerPaymentFeedback = { type: 'error', message: 'Selecione ao menos uma plataforma.' };
      return;
    }

    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(this.registerPaymentReferenceMonth)) {
      this.registerPaymentFeedback = { type: 'error', message: 'Informe o mês de referência no formato YYYY-MM.' };
      return;
    }

    this.registeringPayment = true;
    this.registerPaymentFeedback = null;
    this.syncView();

    this.paymentConfirmationsService
      .registerSubscriberPayment(subscriberId, {
        referenceMonth: this.registerPaymentReferenceMonth,
        platformIds,
      })
      .subscribe({
        next: () => {
          this.runInZone(() => {
            this.registeringPayment = false;
            this.registerPaymentFeedback = {
              type: 'success',
              message: 'Pagamento registrado com sucesso.',
            };
            this.syncView();
            this.loadBilling(subscriberId, this.billingReferenceMonth);
          });
        },
        error: () => {
          this.runInZone(() => {
            this.registeringPayment = false;
            this.registerPaymentFeedback = {
              type: 'error',
              message: 'Não foi possível registrar o pagamento.',
            };
            this.syncView();
          });
        },
      });
  }

  hasBulkSubscriberSelected(subscriberId: number): boolean {
    return this.bulkChargeSelectedSubscriberIds.has(subscriberId);
  }

  toggleBulkSubscriber(subscriberId: number, checked: boolean): void {
    if (checked) {
      this.bulkChargeSelectedSubscriberIds.add(subscriberId);
      return;
    }

    this.bulkChargeSelectedSubscriberIds.delete(subscriberId);
  }

  submitBulkCharge(): void {
    if (this.bulkCharging) {
      return;
    }

    const subscriberIds = Array.from(this.bulkChargeSelectedSubscriberIds);
    const emails = this.bulkChargeDestinationEmails
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);

    if (subscriberIds.length === 0) {
      this.bulkChargeFeedback = { type: 'error', message: 'Selecione ao menos um assinante.' };
      return;
    }

    if (emails.length === 0) {
      this.bulkChargeFeedback = { type: 'error', message: 'Informe ao menos um e-mail de destino.' };
      return;
    }

    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(this.bulkChargeReferenceMonth)) {
      this.bulkChargeFeedback = { type: 'error', message: 'Informe o mês de referência no formato YYYY-MM.' };
      return;
    }

    this.bulkCharging = true;
    this.bulkChargeFeedback = null;
    this.syncView();

    this.paymentConfirmationsService
      .sendBillingSummaryEmail({
        subscriberIds,
        emails,
        referenceMonth: this.bulkChargeReferenceMonth,
      })
      .subscribe({
        next: () => {
          this.runInZone(() => {
            this.bulkCharging = false;
            this.bulkChargeFeedback = {
              type: 'success',
              message: `Cobrança enviada`,
            };
            this.syncView();
          });
        },
        error: () => {
          this.runInZone(() => {
            this.bulkCharging = false;
            this.bulkChargeFeedback = {
              type: 'error',
              message: 'Não foi possível enviar a cobrança em lote.',
            };
            this.syncView();
          });
        },
      });
  }

  private loadSubscribers(page = 0, size = 20): void {
    this.runInZone(() => {
      this.isLoadingSubscribers = true;
      this.hasLoadedSubscribers = false;
      this.subscribersError = null;
      this.syncView();
    });

    this.subscribersService.list(page, size).subscribe({
      next: (response) => {
        this.runInZone(() => {
          const list = [...response.content];
          this.subscribersPage = { ...response, content: list };
          this.subscribers = list;
          this.isLoadingSubscribers = false;
          this.hasLoadedSubscribers = true;
          this.subscribersError = null;
          this.syncView();
        });
      },
      error: () => {
        this.runInZone(() => {
          this.isLoadingSubscribers = false;
          this.hasLoadedSubscribers = false;
          this.subscribersError = 'Não foi possível carregar os assinantes.';
          this.syncView();
        });
      },
    });
  }

  private loadBilling(subscriberId: number, referenceMonth: string): void {
    this.runInZone(() => {
      this.billingLoading = true;
      this.billingError = null;
      this.syncView();
    });

    this.subscriberBillingService.getBilling(subscriberId, referenceMonth).subscribe({
      next: (response) => {
        this.runInZone(() => {
          this.selectedSubscriberBilling = {
            ...response,
            items: [...response.items],
          };
          this.billingLoading = false;
          this.openingDetailsSubscriberId = null;
          this.syncView();
        });
      },
      error: () => {
        this.runInZone(() => {
          this.billingError = 'Não foi possível carregar a cobrança deste assinante.';
          this.billingLoading = false;
          this.openingDetailsSubscriberId = null;
          this.syncView();
        });
      },
    });
  }

  private currentReferenceMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private runInZone(action: () => void): void {
    this.ngZone.run(action);
  }

  private syncView(): void {
    this.changeDetectorRef.markForCheck();
    this.changeDetectorRef.detectChanges();
  }
}
