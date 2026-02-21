import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { CircleCheck, CircleX, Clock3, LucideIconData } from 'lucide-angular';
import { SubscribersService } from '../../core/services/subscribers.service';
import { SubscriberBillingService } from '../../core/services/subscriber-billing.service';
import { SubscriberBillingItem, SubscriberBillingResponse } from '../../shared/models/subscriber-billing.model';
import { SubscriberPageResponse, SubscriberResponse } from '../../shared/models/subscribers.model';

@Component({
  selector: 'app-payment-confirmations',
  templateUrl: './payment-confirmations-component.html',
  styleUrl: './payment-confirmations-component.scss',
  standalone: false,
})
export class PaymentConfirmationsComponent implements OnInit {
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

  readonly billingStatusIcons: Record<string, LucideIconData> = {
    PAID: CircleCheck,
    PENDING: Clock3,
    UNPAID: CircleX,
  };

  constructor(
    private readonly subscribersService: SubscribersService,
    private readonly subscriberBillingService: SubscriberBillingService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly ngZone: NgZone,
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
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value ?? 0);
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

    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(value);
  }

  formatNullableDate(value: string | null): string {
    if (!value) {
      return '-';
    }

    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(value));
  }

  billingCycleLabel(cycle: string): string {
    if (cycle === 'MONTHLY') {
      return 'Mensal';
    }

    if (cycle === 'SEMI_ANNUAL') {
      return 'Semestral';
    }

    if (cycle === 'ANNUAL') {
      return 'Anual';
    }

    return cycle;
  }

  paymentStatusLabel(status: string): string {
    if (status === 'PAID') {
      return 'Pago';
    }

    if (status === 'PENDING') {
      return 'Pendente';
    }

    if (status === 'UNPAID') {
      return 'Não pago';
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
