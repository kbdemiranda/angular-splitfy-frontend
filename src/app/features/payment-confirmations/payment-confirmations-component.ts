import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { SubscribersStateService } from '../subscribers/subscribers-state.service';
import { SubscriberCard } from '../subscribers/subscribers-data';
import { PaymentConfirmationsService } from '../../core/services/payment-confirmations.service';
import { PendingPaymentApprovalResponse } from '../../shared/models/payment-confirmations.model';

@Component({
  selector: 'app-payment-confirmations',
  templateUrl: './payment-confirmations-component.html',
  styleUrl: './payment-confirmations-component.scss',
  standalone: false,
})
export class PaymentConfirmationsComponent implements OnInit {
  subscribers: SubscriberCard[] = [];
  pendingConfirmations: PendingPaymentApprovalResponse[] = [];

  loadingPending = false;
  registering = false;
  approvingIds = new Set<number>();
  errorMessage: string | null = null;
  successMessage: string | null = null;

  readonly registerForm: FormGroup<{
    referenceMonth: FormControl<string>;
    subscriberId: FormControl<string>;
  }>;

  selectedPlatformIds = new Set<number>();
  pendingReferenceMonth = this.currentReferenceMonth();

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly subscribersState: SubscribersStateService,
    private readonly paymentConfirmationsService: PaymentConfirmationsService,
  ) {
    this.registerForm = this.formBuilder.group({
      referenceMonth: this.formBuilder.nonNullable.control(this.currentReferenceMonth(), [Validators.required]),
      subscriberId: this.formBuilder.nonNullable.control('', [Validators.required]),
    });
  }

  ngOnInit(): void {
    this.subscribers = this.subscribersState.getSubscribers();
    this.loadPending();
  }

  get selectedSubscriber(): SubscriberCard | null {
    const id = Number(this.registerForm.controls.subscriberId.value);
    if (!id) {
      return null;
    }

    return this.subscribers.find((subscriber) => subscriber.id === id) ?? null;
  }

  hasPlatformSelected(platformId: number): boolean {
    return this.selectedPlatformIds.has(platformId);
  }

  togglePlatform(platformId: number, checked: boolean): void {
    if (checked) {
      this.selectedPlatformIds.add(platformId);
      return;
    }

    this.selectedPlatformIds.delete(platformId);
  }

  onSubscriberChange(): void {
    this.selectedPlatformIds.clear();
    this.clearMessages();
  }

  submitRegister(): void {
    this.clearMessages();

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.errorMessage = 'Preencha os campos obrigatórios do registro.';
      return;
    }

    const subscriberId = Number(this.registerForm.controls.subscriberId.value);
    const platformIds = Array.from(this.selectedPlatformIds);

    if (!subscriberId || platformIds.length === 0) {
      this.errorMessage = 'Selecione ao menos uma plataforma para confirmar o pagamento.';
      return;
    }

    this.registering = true;
    this.paymentConfirmationsService
      .register({
        referenceMonth: this.registerForm.controls.referenceMonth.value,
        confirmations: [
          {
            subscriberId,
            platformIds,
          },
        ],
      })
      .subscribe({
        next: (response) => {
          this.successMessage = `${response.length} confirmação(ões) registrada(s) com sucesso.`;
          this.registering = false;
          this.selectedPlatformIds.clear();
          this.loadPending();
        },
        error: () => {
          this.errorMessage = 'Falha ao registrar pagamentos.';
          this.registering = false;
        },
      });
  }

  loadPending(): void {
    this.loadingPending = true;
    this.clearMessages();

    this.paymentConfirmationsService.listPending(this.pendingReferenceMonth).subscribe({
      next: (response) => {
        this.pendingConfirmations = response;
        this.loadingPending = false;
      },
      error: () => {
        this.errorMessage = 'Falha ao carregar confirmações pendentes.';
        this.loadingPending = false;
      },
    });
  }

  approve(confirmationId: number): void {
    this.approvingIds.add(confirmationId);
    this.clearMessages();

    this.paymentConfirmationsService.approve(confirmationId).subscribe({
      next: () => {
        this.successMessage = `Confirmação #${confirmationId} aprovada.`;
        this.approvingIds.delete(confirmationId);
        this.loadPending();
      },
      error: () => {
        this.errorMessage = `Falha ao aprovar confirmação #${confirmationId}.`;
        this.approvingIds.delete(confirmationId);
      },
    });
  }

  isApproving(confirmationId: number): boolean {
    return this.approvingIds.has(confirmationId);
  }

  formatCurrency(value: number, currency = 'BRL'): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);
  }

  formatDateTime(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  trackByPendingId(_: number, item: PendingPaymentApprovalResponse): number {
    return item.confirmationId;
  }

  private currentReferenceMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private clearMessages(): void {
    this.errorMessage = null;
    this.successMessage = null;
  }
}
