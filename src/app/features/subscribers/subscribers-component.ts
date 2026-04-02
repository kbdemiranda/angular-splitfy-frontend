import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { forkJoin, map, of } from 'rxjs';
import { CircleCheck, CircleUser, CircleX, Clock3, LucideIconData } from 'lucide-angular';
import { I18nService } from '../../core/i18n/i18n.service';
import { SubscriberBillingService } from '../../core/services/subscriber-billing.service';
import { SubscriberBillingItem, SubscriberBillingResponse } from '../../shared/models/subscriber-billing.model';
import { PlatformResponse } from '../../shared/models/platforms.model';
import {
  SubscriberPlatform,
  SubscriberPageResponse,
  SubscriberRequest,
  SubscriberResponse,
} from '../../shared/models/subscribers.model';
import { PlatformsService } from '../../core/services/platforms.service';
import { SubscribersService } from '../../core/services/subscribers.service';

type PlatformCatalogItem = SubscriberPlatform & {
  availableSlots: number;
};

type SubscriberPlatformsItem = {
  id: number;
  associatedPlatforms: SubscriberPlatform[];
};

@Component({
  selector: 'app-subscribers',
  templateUrl: './subscribers-component.html',
  styleUrl: './subscribers-component.scss',
  standalone: false,
})
export class SubscribersComponent implements OnInit {
  private readonly createSentinelId = -1;
  private financialResponsibleSearchRequestId = 0;
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
  editingSubscriptionsSubscriber: SubscriberResponse | null = null;
  subscriptionsAssociatedPlatforms: SubscriberPlatform[] = [];
  subscriptionsAvailablePlatforms: SubscriberPlatform[] = [];
  subscriptionsCatalog: PlatformCatalogItem[] = [];
  originalAssociatedPlatformIds = new Set<number>();
  pendingAssociatePlatformIds = new Set<number>();
  pendingDisassociatePlatformIds = new Set<number>();
  savingSubscriptionsChanges = false;
  isLoadingSubscriptionsEditor = false;
  subscriptionsEditorError: string | null = null;
  subscriptionsInfoMessage: string | null = null;
  editErrorMessage: string | null = null;
  placeholderMessage: string | null = null;
  financialResponsibleSearchTerm = '';
  financialResponsibleSearchResults: SubscriberResponse[] = [];
  financialResponsibleSearchLoading = false;
  financialResponsibleSearchError: string | null = null;
  selectedFinancialResponsibleSubscriber: SubscriberResponse | null = null;
  readonly editProfileForm: FormGroup<{
    name: FormControl<string>;
    email: FormControl<string>;
  }>;
  readonly billingStatusIcons: Record<string, LucideIconData> = {
    PAID: CircleCheck,
    PENDING: Clock3,
    UNPAID: CircleX,
  };
  readonly subscriberIcon = CircleUser;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly subscribersService: SubscribersService,
    private readonly platformsService: PlatformsService,
    private readonly subscriberBillingService: SubscriberBillingService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly ngZone: NgZone,
    private readonly i18nService: I18nService,
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

  trackPlatformId(_: number, platform: SubscriberPlatform): number {
    return platform.id;
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
    this.resetFinancialResponsibleSearchState();
    if (
      subscriber.financialResponsibleSubscriberId &&
      subscriber.financialResponsibleSubscriberId !== subscriber.id
    ) {
      this.selectedFinancialResponsibleSubscriber = {
        id: subscriber.financialResponsibleSubscriberId,
        name: subscriber.financialResponsibleSubscriberName ?? 'Responsável atual',
        email: '',
        associatedPlatforms: [],
      };
      this.financialResponsibleSearchTerm = this.selectedFinancialResponsibleSubscriber.name;
    }
    this.editProfileForm.setValue({
      name: subscriber.name,
      email: subscriber.email,
    });
  }

  openCreate(): void {
    this.editingSubscriberId = this.createSentinelId;
    this.editErrorMessage = null;
    this.resetFinancialResponsibleSearchState();
    this.editProfileForm.reset({
      name: '',
      email: '',
    });
  }

  cancelEdit(): void {
    this.editingSubscriberId = null;
    this.editErrorMessage = null;
    this.resetFinancialResponsibleSearchState();
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
    if (this.selectedFinancialResponsibleSubscriber) {
      payload.financialResponsibleSubscriberId = this.selectedFinancialResponsibleSubscriber.id;
    }

    if (this.isCreateMode) {
      this.subscribersService.create(payload).subscribe({
        next: (createdSubscriber) => {
          this.runInZone(() => {
            const normalizedSubscriber = this.normalizeSubscriberResponse(createdSubscriber);
            this.subscribers = [...this.subscribers, normalizedSubscriber];
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
          const normalizedSubscriber = this.normalizeSubscriberResponse(updatedSubscriber);
          this.subscribers = this.subscribers.map((subscriber) =>
            subscriber.id === editingId ? normalizedSubscriber : subscriber,
          );
          this.subscribersPage = {
            ...this.subscribersPage,
            content: this.subscribers,
          };
          if (this.selectedSubscriber?.id === editingId) {
            this.selectedSubscriber = normalizedSubscriber;
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

  onFinancialResponsibleSearch(term: string): void {
    this.financialResponsibleSearchTerm = term;
    this.financialResponsibleSearchError = null;
    this.selectedFinancialResponsibleSubscriber = null;
    this.financialResponsibleSearchResults = [];

    const normalizedTerm = term.trim();
    if (normalizedTerm.length < 3) {
      this.financialResponsibleSearchLoading = false;
      return;
    }

    const requestId = ++this.financialResponsibleSearchRequestId;
    this.financialResponsibleSearchLoading = true;
    this.syncView();

    this.subscribersService.list(0, 10, normalizedTerm).subscribe({
      next: (response) => {
        this.runInZone(() => {
          if (requestId !== this.financialResponsibleSearchRequestId) {
            return;
          }

          this.financialResponsibleSearchLoading = false;
          this.financialResponsibleSearchResults = response.content;
          this.financialResponsibleSearchError = null;
          this.syncView();
        });
      },
      error: () => {
        this.runInZone(() => {
          if (requestId !== this.financialResponsibleSearchRequestId) {
            return;
          }

          this.financialResponsibleSearchLoading = false;
          this.financialResponsibleSearchResults = [];
          this.financialResponsibleSearchError = 'Não foi possível buscar assinantes.';
          this.syncView();
        });
      },
    });
  }

  selectFinancialResponsible(subscriber: SubscriberResponse): void {
    this.selectedFinancialResponsibleSubscriber = { ...subscriber };
    this.financialResponsibleSearchTerm = subscriber.name;
    this.financialResponsibleSearchResults = [];
    this.financialResponsibleSearchError = null;
  }

  clearFinancialResponsible(): void {
    this.selectedFinancialResponsibleSubscriber = null;
    this.financialResponsibleSearchTerm = '';
    this.financialResponsibleSearchResults = [];
    this.financialResponsibleSearchError = null;
    this.financialResponsibleSearchLoading = false;
  }

  chooseEditSubscriptions(): void {
    const subscriber = this.editOptionsSubscriber;
    this.closeEditOptions();

    if (!subscriber) {
      return;
    }

    this.openSubscriptionsEditor(subscriber.id);
  }

  closeSubscriptionsEditor(): void {
    this.editingSubscriptionsSubscriber = null;
    this.subscriptionsAssociatedPlatforms = [];
    this.subscriptionsAvailablePlatforms = [];
    this.subscriptionsCatalog = [];
    this.originalAssociatedPlatformIds = new Set<number>();
    this.pendingAssociatePlatformIds = new Set<number>();
    this.pendingDisassociatePlatformIds = new Set<number>();
    this.savingSubscriptionsChanges = false;
    this.isLoadingSubscriptionsEditor = false;
    this.subscriptionsEditorError = null;
    this.subscriptionsInfoMessage = null;
  }

  get hasPendingSubscriptionChanges(): boolean {
    return this.pendingAssociatePlatformIds.size > 0 || this.pendingDisassociatePlatformIds.size > 0;
  }

  subscriptionsTotalPerMonth(): number {
    return this.subscriptionsAssociatedPlatforms.reduce((total, platform) => total + platform.individualPrice, 0);
  }

  associatePlatform(platform: SubscriberPlatform): void {
    if (!this.editingSubscriptionsSubscriber || this.savingSubscriptionsChanges) {
      return;
    }

    if (this.subscriptionsAssociatedPlatforms.some((item) => item.id === platform.id)) {
      return;
    }

    this.subscriptionsAssociatedPlatforms = [...this.subscriptionsAssociatedPlatforms, { ...platform }];
    this.updatePendingChangesForAssociation(platform.id);
    this.recalculateSubscriptionLists();
    this.syncEditedSubscriberPlatforms();
    this.subscriptionsInfoMessage = `${platform.name} associada ao assinante.`;
  }

  removePlatform(platform: SubscriberPlatform): void {
    if (!this.editingSubscriptionsSubscriber || this.savingSubscriptionsChanges) {
      return;
    }

    if (!this.subscriptionsAssociatedPlatforms.some((item) => item.id === platform.id)) {
      return;
    }

    this.subscriptionsAssociatedPlatforms = this.subscriptionsAssociatedPlatforms.filter(
      (item) => item.id !== platform.id,
    );
    this.updatePendingChangesForDisassociation(platform.id);
    this.recalculateSubscriptionLists();
    this.syncEditedSubscriberPlatforms();
    this.subscriptionsInfoMessage = `${platform.name} removida do assinante.`;
  }

  saveSubscriptionsChanges(): void {
    const subscriber = this.editingSubscriptionsSubscriber;
    if (!subscriber || this.savingSubscriptionsChanges) {
      return;
    }

    const toAssociate = Array.from(this.pendingAssociatePlatformIds);
    const toDisassociate = Array.from(this.pendingDisassociatePlatformIds);

    if (toAssociate.length === 0 && toDisassociate.length === 0) {
      this.subscriptionsInfoMessage = 'Nenhuma alteração pendente para salvar.';
      return;
    }

    this.savingSubscriptionsChanges = true;
    this.subscriptionsInfoMessage = null;
    this.syncView();

    const associateRequest =
      toAssociate.length > 0
        ? this.subscribersService.associatePlatforms(subscriber.id, toAssociate)
        : of(void 0);
    const disassociateRequest =
      toDisassociate.length > 0
        ? this.subscribersService.disassociatePlatforms(subscriber.id, toDisassociate)
        : of(void 0);

    forkJoin([associateRequest, disassociateRequest]).subscribe({
      next: () => {
        this.runInZone(() => {
          this.originalAssociatedPlatformIds = new Set(this.subscriptionsAssociatedPlatforms.map((item) => item.id));
          this.pendingAssociatePlatformIds = new Set<number>();
          this.pendingDisassociatePlatformIds = new Set<number>();
          this.savingSubscriptionsChanges = false;
          this.subscriptionsInfoMessage = 'Assinaturas atualizadas com sucesso.';
          this.syncView();
        });
      },
      error: () => {
        this.runInZone(() => {
          this.savingSubscriptionsChanges = false;
          this.subscriptionsInfoMessage = 'Não foi possível salvar as alterações de assinaturas.';
          this.syncView();
        });
      },
    });
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

  formatCurrency(value: number, currency = 'BRL'): string {
    return new Intl.NumberFormat(this.i18nService.localeForIntl(), { style: 'currency', currency }).format(value);
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

  loadPreviousBillingMonth(): void {
    this.changeBillingMonth(this.shiftMonth(this.billingReferenceMonth, -1));
  }

  loadNextBillingMonth(): void {
    this.changeBillingMonth(this.shiftMonth(this.billingReferenceMonth, 1));
  }

  trackBillingItem(_: number, item: SubscriberBillingItem): number {
    return item.serviceId;
  }

  billingCycleLabel(cycle: string): string {
    if (cycle === 'MONTHLY') {
      return this.i18nService.translate('status.monthly');
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

  private resetFinancialResponsibleSearchState(): void {
    this.financialResponsibleSearchRequestId += 1;
    this.financialResponsibleSearchTerm = '';
    this.financialResponsibleSearchResults = [];
    this.financialResponsibleSearchLoading = false;
    this.financialResponsibleSearchError = null;
    this.selectedFinancialResponsibleSubscriber = null;
  }

  private shiftMonth(referenceMonth: string, offset: number): string {
    const [year, month] = referenceMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + offset, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  private openSubscriptionsEditor(subscriberId: number): void {
    this.runInZone(() => {
      this.editingSubscriptionsSubscriber =
        this.subscribers.find((subscriber) => subscriber.id === subscriberId) ?? null;
      this.subscriptionsAssociatedPlatforms = [];
      this.subscriptionsAvailablePlatforms = [];
      this.subscriptionsCatalog = [];
      this.isLoadingSubscriptionsEditor = true;
      this.subscriptionsEditorError = null;
      this.subscriptionsInfoMessage = null;
      this.syncView();
    });

    forkJoin({
      subscriber: this.subscribersService.details(subscriberId),
      subscriberSubscriptions: this.subscribersService.subscriptions(subscriberId),
      platformsPage: this.platformsService.list(0, 500),
    }).subscribe({
      next: ({ subscriber, subscriberSubscriptions, platformsPage }) => {
        this.runInZone(() => {
          this.editingSubscriptionsSubscriber = this.normalizeSubscriberResponse(subscriber);
          this.subscriptionsCatalog = platformsPage.content.map((platform) =>
            this.mapPlatformFromCatalog(platform),
          );

          const platformById = new Map(this.subscriptionsCatalog.map((platform) => [platform.id, platform]));
          this.subscriptionsAssociatedPlatforms = this.normalizeAssociatedPlatforms(
            subscriberSubscriptions,
            platformById,
          );
          this.originalAssociatedPlatformIds = new Set(
            this.subscriptionsAssociatedPlatforms.map((platform) => platform.id),
          );
          this.pendingAssociatePlatformIds = new Set<number>();
          this.pendingDisassociatePlatformIds = new Set<number>();
          this.savingSubscriptionsChanges = false;
          this.recalculateSubscriptionLists();
          this.syncEditedSubscriberPlatforms();
          this.isLoadingSubscriptionsEditor = false;
          this.subscriptionsEditorError = null;
          this.syncView();
        });
      },
      error: () => {
        this.runInZone(() => {
          this.isLoadingSubscriptionsEditor = false;
          this.subscriptionsEditorError = 'Não foi possível carregar as assinaturas do assinante.';
          this.syncView();
        });
      },
    });
  }

  private recalculateSubscriptionLists(): void {
    const associatedIds = new Set(this.subscriptionsAssociatedPlatforms.map((platform) => platform.id));
    this.subscriptionsAvailablePlatforms = this.subscriptionsCatalog
      .filter((platform) => {
        if (associatedIds.has(platform.id)) {
          return false;
        }

        return platform.availableSlots > 0 || this.originalAssociatedPlatformIds.has(platform.id);
      })
      .map((platform) => ({
        id: platform.id,
        name: platform.name,
        monthlyPrice: platform.monthlyPrice,
        individualPrice: platform.individualPrice,
        currency: platform.currency,
      }));

    this.subscriptionsAssociatedPlatforms = [...this.subscriptionsAssociatedPlatforms].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    this.subscriptionsAvailablePlatforms = [...this.subscriptionsAvailablePlatforms].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }

  private updatePendingChangesForAssociation(platformId: number): void {
    if (this.originalAssociatedPlatformIds.has(platformId)) {
      this.pendingDisassociatePlatformIds.delete(platformId);
      return;
    }

    this.pendingAssociatePlatformIds.add(platformId);
    this.pendingDisassociatePlatformIds.delete(platformId);
  }

  private updatePendingChangesForDisassociation(platformId: number): void {
    if (this.originalAssociatedPlatformIds.has(platformId)) {
      this.pendingDisassociatePlatformIds.add(platformId);
      this.pendingAssociatePlatformIds.delete(platformId);
      return;
    }

    this.pendingAssociatePlatformIds.delete(platformId);
    this.pendingDisassociatePlatformIds.delete(platformId);
  }

  private syncEditedSubscriberPlatforms(): void {
    if (!this.editingSubscriptionsSubscriber) {
      return;
    }

    const subscriberId = this.editingSubscriptionsSubscriber.id;
    const updatedAssociatedPlatforms = this.subscriptionsAssociatedPlatforms.map((platform) => ({ ...platform }));

    this.editingSubscriptionsSubscriber = {
      ...this.editingSubscriptionsSubscriber,
      associatedPlatforms: updatedAssociatedPlatforms,
    };

    this.subscribers = this.subscribers.map((subscriber) =>
      subscriber.id === subscriberId
        ? {
            ...subscriber,
            associatedPlatforms: updatedAssociatedPlatforms,
          }
        : subscriber,
    );
    this.subscribersPage = {
      ...this.subscribersPage,
      content: this.subscribers,
    };

    if (this.selectedSubscriber?.id === subscriberId) {
      this.selectedSubscriber = {
        ...this.selectedSubscriber,
        associatedPlatforms: updatedAssociatedPlatforms,
      };
    }

    if (this.editOptionsSubscriber?.id === subscriberId) {
      this.editOptionsSubscriber = {
        ...this.editOptionsSubscriber,
        associatedPlatforms: updatedAssociatedPlatforms,
      };
    }
  }

  private mapPlatformFromCatalog(platform: PlatformResponse): PlatformCatalogItem {
    const monthlyPrice = this.numberOrDefault(platform.price, 0);
    return {
      id: platform.id,
      name: platform.name,
      monthlyPrice,
      individualPrice: monthlyPrice,
      currency: platform.currency,
      availableSlots: this.numberOrDefault(platform.availableSlots, 0),
    };
  }

  private normalizeAssociatedPlatforms(
    response: unknown,
    catalogById: Map<number, PlatformCatalogItem>,
  ): SubscriberPlatform[] {
    const list = this.extractSubscriptionsList(response);
    const associated: SubscriberPlatform[] = [];

    for (const item of list) {
      const source = this.asRecord(item);
      const id = this.resolvePlatformId(item, source);
      if (id === null) {
        continue;
      }

      const fromCatalog = catalogById.get(id);
      const monthlyPrice = this.numberOrDefault(
        this.pickField(source, ['monthlyPrice', 'price', 'userMonthlyAmount']),
        fromCatalog?.monthlyPrice ?? 0,
      );
      const individualPrice = this.numberOrDefault(
        this.pickField(source, ['individualPrice', 'userMonthlyShare']),
        fromCatalog?.individualPrice ?? monthlyPrice,
      );
      const nameFromPayload = this.stringOrNull(this.pickField(source, ['name', 'platformName', 'serviceName']));
      const currencyFromPayload = this.stringOrNull(this.pickField(source, ['currency', 'serviceCurrency']));
      const name = nameFromPayload ?? fromCatalog?.name ?? `Plataforma #${id}`;
      const currency = currencyFromPayload ?? fromCatalog?.currency ?? 'BRL';

      associated.push({
        id,
        name,
        monthlyPrice,
        individualPrice,
        currency,
      });
    }

    return associated;
  }

  private extractSubscriptionsList(response: unknown): unknown[] {
    if (Array.isArray(response)) {
      return response;
    }

    const source = this.asRecord(response);
    if (!source) {
      return [];
    }

    const candidates = [source['content'], source['items'], source['data'], source['subscriptions']];
    const list = candidates.find((candidate) => Array.isArray(candidate));
    return Array.isArray(list) ? list : [];
  }

  private resolvePlatformId(item: unknown, source: Record<string, unknown> | null): number | null {
    if (typeof item === 'number' && Number.isFinite(item)) {
      return item;
    }

    if (typeof item === 'string' && item.trim() !== '') {
      const parsed = Number(item);
      return Number.isFinite(parsed) ? parsed : null;
    }

    const platform = this.asRecord(source?.['platform']);
    const candidates: unknown[] = [
      platform?.['id'],
      platform?.['platformId'],
      source?.['platformId'],
      source?.['serviceId'],
      source?.['subscriptionPlatformId'],
      source?.['id'],
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'number' && Number.isFinite(candidate)) {
        return candidate;
      }
      if (typeof candidate === 'string' && candidate.trim() !== '') {
        const parsed = Number(candidate);
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
    }

    return null;
  }

  private pickField(source: Record<string, unknown> | null, fields: string[]): unknown {
    if (!source) {
      return null;
    }

    const platform = this.asRecord(source['platform']);
    for (const field of fields) {
      if (platform && platform[field] !== undefined && platform[field] !== null) {
        return platform[field];
      }
      if (source[field] !== undefined && source[field] !== null) {
        return source[field];
      }
    }

    return null;
  }

  private stringOrNull(value: unknown): string | null {
    return typeof value === 'string' && value.trim() !== '' ? value : null;
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object') {
      return null;
    }
    return value as Record<string, unknown>;
  }

  private numberOrDefault(value: unknown, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  }

  private normalizeSubscriberResponse(subscriber: SubscriberResponse): SubscriberResponse {
    const associatedPlatforms = Array.isArray(subscriber?.associatedPlatforms)
      ? subscriber.associatedPlatforms.map((platform) => ({ ...platform }))
      : [];
    return {
      ...subscriber,
      associatedPlatforms,
    };
  }

  private hydrateSubscribersPlatforms(subscribers: SubscriberResponse[]): void {
    if (subscribers.length === 0) {
      return;
    }

    const requests = subscribers.map((subscriber) =>
      this.subscribersService.subscriptions(subscriber.id).pipe(
        map((response) => ({
          id: subscriber.id,
          associatedPlatforms: this.normalizeAssociatedPlatforms(response, new Map<number, PlatformCatalogItem>()),
        })),
      ),
    );

    forkJoin(requests).subscribe({
      next: (results) => {
        this.runInZone(() => {
          const platformsBySubscriberId = new Map<number, SubscriberPlatform[]>(
            results.map((item: SubscriberPlatformsItem) => [item.id, item.associatedPlatforms]),
          );

          this.subscribers = this.subscribers.map((subscriber) => ({
            ...subscriber,
            associatedPlatforms: platformsBySubscriberId.get(subscriber.id) ?? [],
          }));
          this.subscribersPage = {
            ...this.subscribersPage,
            content: this.subscribers,
          };
          this.syncView();
        });
      },
      error: () => {
        this.runInZone(() => {
          this.subscribers = this.subscribers.map((subscriber) => ({
            ...subscriber,
            associatedPlatforms: [],
          }));
          this.subscribersPage = {
            ...this.subscribersPage,
            content: this.subscribers,
          };
          this.syncView();
        });
      },
    });
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
        const list = response.content.map((subscriber) => this.normalizeSubscriberResponse(subscriber));
        this.runInZone(() => {
          this.subscribersPage = { ...response, content: list };
          this.subscribers = list;
          this.isLoadingSubscribers = false;
          this.subscribersError = null;
          this.hasLoadedSubscribers = true;
          this.syncView();
        });
        this.hydrateSubscribersPlatforms(list);
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
