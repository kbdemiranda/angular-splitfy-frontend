import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CircleCheck, CircleX, Clock3, LucideIconData } from 'lucide-angular';
import { SubscriberCard } from './subscribers-data';
import { SubscribersStateService } from './subscribers-state.service';
import { SubscriberBillingService } from '../../core/services/subscriber-billing.service';
import { SubscriberBillingItem, SubscriberBillingResponse } from '../../shared/models/subscriber-billing.model';

@Component({
  selector: 'app-subscribers',
  templateUrl: './subscribers-component.html',
  styleUrl: './subscribers-component.scss',
  standalone: false,
})
export class SubscribersComponent implements OnInit {
  subscribers: SubscriberCard[] = [];

  selectedSubscriber: SubscriberCard | null = null;
  selectedSubscriberBilling: SubscriberBillingResponse | null = null;
  billingReferenceMonth = this.currentReferenceMonth();
  billingLoading = false;
  billingError: string | null = null;
  subscriberToDelete: SubscriberCard | null = null;
  editOptionsSubscriber: SubscriberCard | null = null;
  editingSubscriberId: number | null = null;
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
    private readonly subscribersState: SubscribersStateService,
    private readonly subscriberBillingService: SubscriberBillingService,
  ) {
    this.editProfileForm = this.formBuilder.group({
      name: this.formBuilder.nonNullable.control('', [Validators.required, Validators.minLength(3)]),
      email: this.formBuilder.nonNullable.control('', [Validators.required, Validators.email]),
    });
  }

  ngOnInit(): void {
    this.refreshSubscribers();
  }

  trackById(_: number, subscriber: SubscriberCard): number {
    return subscriber.id;
  }

  openDetails(subscriber: SubscriberCard): void {
    this.selectedSubscriber = subscriber;
    this.loadSubscriberBilling(subscriber.id, this.billingReferenceMonth);
  }

  closeDetails(): void {
    this.selectedSubscriber = null;
    this.selectedSubscriberBilling = null;
    this.billingLoading = false;
    this.billingError = null;
  }

  openEditOptions(subscriber: SubscriberCard | null): void {
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
    this.editProfileForm.setValue({
      name: subscriber.name,
      email: subscriber.email,
    });
  }

  cancelEdit(): void {
    this.editingSubscriberId = null;
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
    this.subscribersState.updateSubscriberProfile(this.editingSubscriberId, name.trim(), email.trim());
    this.refreshSubscribers();

    if (this.selectedSubscriber?.id === this.editingSubscriberId) {
      this.selectedSubscriber = this.subscribers.find(
        (subscriber) => subscriber.id === this.editingSubscriberId,
      ) ?? null;
    }

    this.cancelEdit();
  }

  chooseEditSubscriptions(): void {
    const subscriber = this.editOptionsSubscriber;
    this.closeEditOptions();

    if (!subscriber) {
      return;
    }

    void this.router.navigate(['/users', subscriber.id, 'subscriptions']);
  }

  askDelete(subscriber: SubscriberCard | null): void {
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
    this.subscribersState.deleteSubscriber(deletedId);
    this.refreshSubscribers();
    this.subscriberToDelete = null;

    if (this.selectedSubscriber?.id === deletedId) {
      this.closeDetails();
    }
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
      this.loadSubscriberBilling(this.selectedSubscriber.id, referenceMonth);
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

  private refreshSubscribers(): void {
    this.subscribers = this.subscribersState.getSubscribers();
  }

  private currentReferenceMonth(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${now.getFullYear()}-${month}`;
  }

  private loadSubscriberBilling(subscriberId: number, referenceMonth?: string): void {
    this.billingLoading = true;
    this.billingError = null;
    this.selectedSubscriberBilling = null;

    this.subscriberBillingService.getBilling(subscriberId, referenceMonth).subscribe({
      next: (response) => {
        this.selectedSubscriberBilling = response;
        this.billingLoading = false;
      },
      error: () => {
        this.billingError = 'Não foi possível carregar as pendências deste assinante.';
        this.billingLoading = false;
      },
    });
  }
}
