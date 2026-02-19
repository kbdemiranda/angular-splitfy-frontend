import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CircleCheck, CircleX, Clock3, LucideIconData } from 'lucide-angular';
import { SubscriberBillingService } from '../../core/services/subscriber-billing.service';
import { SubscriberBillingItem, SubscriberBillingResponse } from '../../shared/models/subscriber-billing.model';
import {
  SubscriberPageResponse,
  SubscriberRequest,
  SubscriberResponse,
} from '../../shared/models/subscribers.model';
import { SubscribersService } from '../../core/services/subscribers.service';

@Component({
  selector: 'app-subscribers',
  templateUrl: './subscribers-component.html',
  styleUrl: './subscribers-component.scss',
  standalone: false,
})
export class SubscribersComponent implements OnInit {
  private readonly createSentinelId = -1;
  subscribers: SubscriberResponse[] = [];
  subscribersPage: SubscriberPageResponse = {
    content: [],
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
  };
  isLoadingSubscribers = false;
  subscribersError: string | null = null;
  hasLoadedSubscribers = false;

  selectedSubscriber: SubscriberResponse | null = null;
  selectedSubscriberBilling: SubscriberBillingResponse | null = null;
  billingReferenceMonth = this.currentReferenceMonth();
  billingLoading = false;
  billingError: string | null = null;
  openingDetailsSubscriberId: number | null = null;
  subscriberToDelete: SubscriberResponse | null = null;
  editOptionsSubscriber: SubscriberResponse | null = null;
  editingSubscriberId: number | null = null;
  editErrorMessage: string | null = null;
  placeholderMessage: string | null = null;
  readonly editProfileForm: FormGroup<{
    name: FormControl<string>;
    email: FormControl<string>;
  }>;
  readonly billingStatusIcons: Record<string, LucideIconData> = {
    PAID: CircleCheck,
    PENDING: Clock3,
    UNPAID: CircleX,
  };

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly router: Router,
    private readonly subscribersService: SubscribersService,
    private readonly subscriberBillingService: SubscriberBillingService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly ngZone: NgZone,
  ) {
    this.editProfileForm = this.formBuilder.group({
      name: this.formBuilder.nonNullable.control('', [Validators.required, Validators.minLength(3)]),
      email: this.formBuilder.nonNullable.control('', [Validators.required, Validators.email]),
    });
  }

  ngOnInit(): void {
    this.loadSubscribers();
  }

  get isCreateMode(): boolean {
    return this.editingSubscriberId === this.createSentinelId;
  }

  trackById(_: number, subscriber: SubscriberResponse): number {
    return subscriber.id;
  }

  openDetails(subscriber: SubscriberResponse): void {
    if (this.openingDetailsSubscriberId !== null) {
      return;
    }

    this.runInZone(() => {
      this.openingDetailsSubscriberId = subscriber.id;
      this.billingLoading = true;
      this.billingError = null;
      this.selectedSubscriberBilling = null;
      this.syncView();
    });

    this.subscriberBillingService.getBilling(subscriber.id, this.billingReferenceMonth).subscribe({
      next: (response) => {
        this.runInZone(() => {
          this.selectedSubscriber = { ...subscriber };
          this.selectedSubscriberBilling = {
            ...response,
            items: [...response.items],
          };
          this.billingLoading = false;
          this.billingError = null;
          this.openingDetailsSubscriberId = null;
          this.syncView();
        });
      },
      error: () => {
        this.runInZone(() => {
          this.billingError = 'Não foi possível carregar as pendências deste assinante.';
          this.billingLoading = false;
          this.openingDetailsSubscriberId = null;
          this.syncView();
        });
      },
    });
  }

  closeDetails(): void {
    this.selectedSubscriber = null;
    this.selectedSubscriberBilling = null;
    this.billingLoading = false;
    this.billingError = null;
    this.openingDetailsSubscriberId = null;
  }

  openEditOptions(subscriber: SubscriberResponse | null): void {
    if (!subscriber) {
      return;
    }

    this.editOptionsSubscriber = subscriber;
  }

  closeEditOptions(): void {
    this.editOptionsSubscriber = null;
  }

  chooseEditSubscriber(): void {
    const subscriber = this.editOptionsSubscriber;
    this.closeEditOptions();

    if (!subscriber) {
      return;
    }

    this.editingSubscriberId = subscriber.id;
    this.editErrorMessage = null;
    this.editProfileForm.setValue({
      name: subscriber.name,
      email: subscriber.email,
    });
  }

  openCreate(): void {
    this.editingSubscriberId = this.createSentinelId;
    this.editErrorMessage = null;
    this.editProfileForm.reset({
      name: '',
      email: '',
    });
  }

  cancelEdit(): void {
    this.editingSubscriberId = null;
    this.editErrorMessage = null;
    this.editProfileForm.reset({
      name: '',
      email: '',
    });
  }

  saveEdit(): void {
    if (this.editingSubscriberId === null) {
      return;
    }

    if (this.editProfileForm.invalid) {
      this.editProfileForm.markAllAsTouched();
      return;
    }

    const { name, email } = this.editProfileForm.getRawValue();
    const payload: SubscriberRequest = { name: name.trim(), email: email.trim() };

    if (this.isCreateMode) {
      this.subscribersService.create(payload).subscribe({
        next: (createdSubscriber) => {
          this.runInZone(() => {
            this.subscribers = [...this.subscribers, createdSubscriber];
            this.subscribersPage = {
              ...this.subscribersPage,
              content: this.subscribers,
              totalElements: this.subscribersPage.totalElements + 1,
            };
            this.cancelEdit();
            this.placeholderMessage = 'Assinante criado com sucesso.';
            this.syncView();
          });
        },
        error: () => {
          this.runInZone(() => {
            this.editErrorMessage = 'Falha ao criar assinante.';
            this.syncView();
          });
        },
      });
      return;
    }

    const editingId = this.editingSubscriberId;
    this.subscribersService.updateProfile(editingId, payload).subscribe({
      next: (updatedSubscriber) => {
        this.runInZone(() => {
          this.subscribers = this.subscribers.map((subscriber) =>
            subscriber.id === editingId ? updatedSubscriber : subscriber,
          );
          this.subscribersPage = {
            ...this.subscribersPage,
            content: this.subscribers,
          };
          if (this.selectedSubscriber?.id === editingId) {
            this.selectedSubscriber = updatedSubscriber;
          }
          this.cancelEdit();
          this.placeholderMessage = 'Assinante atualizado com sucesso.';
          this.syncView();
        });
      },
      error: () => {
        this.runInZone(() => {
          this.editErrorMessage = 'Falha ao atualizar assinante.';
          this.syncView();
        });
      },
    });
  }

  chooseEditSubscriptions(): void {
    const subscriber = this.editOptionsSubscriber;
    this.closeEditOptions();

    if (!subscriber) {
      return;
    }

    void this.router.navigate(['/subscriber', subscriber.id, 'subscriptions']);
  }

  askDelete(subscriber: SubscriberResponse | null): void {
    if (!subscriber) {
      return;
    }

    this.subscriberToDelete = subscriber;
  }

  cancelDelete(): void {
    this.subscriberToDelete = null;
  }

  confirmDelete(): void {
    if (!this.subscriberToDelete) {
      return;
    }

    const deletedId = this.subscriberToDelete.id;
    this.subscribersService.delete(deletedId).subscribe({
      next: () => {
        this.runInZone(() => {
          this.subscribers = this.subscribers.filter((subscriber) => subscriber.id !== deletedId);
          this.subscribersPage = {
            ...this.subscribersPage,
            content: this.subscribers,
            totalElements: Math.max(0, this.subscribersPage.totalElements - 1),
          };
          this.subscriberToDelete = null;

          if (this.selectedSubscriber?.id === deletedId) {
            this.closeDetails();
          }
          this.placeholderMessage = 'Assinante excluído com sucesso.';
          this.syncView();
        });
      },
      error: () => {
        this.runInZone(() => {
          this.placeholderMessage = 'Falha ao excluir assinante.';
          this.syncView();
        });
      },
    });
  }

  closePlaceholderMessage(): void {
    this.placeholderMessage = null;
  }

  initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  formatCurrency(value: number, currency = 'BRL'): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);
  }

  changeBillingMonth(referenceMonth: string): void {
    if (!referenceMonth) {
      return;
    }

    this.billingReferenceMonth = referenceMonth;
    if (this.selectedSubscriber) {
      this.loadSubscriberBilling(this.selectedSubscriber.id, referenceMonth, true);
    }
  }

  trackBillingItem(_: number, item: SubscriberBillingItem): number {
    return item.serviceId;
  }

  billingCycleLabel(cycle: string): string {
    if (cycle === 'MONTHLY') {
      return 'Mensal';
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

  paymentStatusIcon(status: string): LucideIconData {
    return this.billingStatusIcons[status] ?? CircleX;
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

  private currentReferenceMonth(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${now.getFullYear()}-${month}`;
  }

  private loadSubscriberBilling(subscriberId: number, referenceMonth?: string, keepCurrentData = false): void {
    this.runInZone(() => {
      this.billingLoading = true;
      this.billingError = null;
      if (!keepCurrentData) {
        this.selectedSubscriberBilling = null;
      }
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
          this.syncView();
        });
      },
      error: () => {
        this.runInZone(() => {
          this.billingError = 'Não foi possível carregar as pendências deste assinante.';
          this.billingLoading = false;
          this.syncView();
        });
      },
    });
  }

  private loadSubscribers(page = 0, size = 20): void {
    this.runInZone(() => {
      this.isLoadingSubscribers = true;
      this.subscribersError = null;
      this.hasLoadedSubscribers = false;
      this.syncView();
    });

    this.subscribersService.list(page, size).subscribe({
      next: (response) => {
        this.runInZone(() => {
          const list = [...response.content];
          this.subscribersPage = { ...response, content: list };
          this.subscribers = list;
          this.isLoadingSubscribers = false;
          this.subscribersError = null;
          this.hasLoadedSubscribers = true;
          this.syncView();
        });
      },
      error: () => {
        this.runInZone(() => {
          this.subscribersError = 'Falha ao carregar assinantes.';
          this.isLoadingSubscribers = false;
          this.hasLoadedSubscribers = false;
          this.syncView();
        });
      },
    });
  }

  private runInZone(action: () => void): void {
    this.ngZone.run(action);
  }

  private syncView(): void {
    this.changeDetectorRef.markForCheck();
    this.changeDetectorRef.detectChanges();
  }
}
