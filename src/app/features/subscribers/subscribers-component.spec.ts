import { ChangeDetectorRef, NgZone } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Subject, of, throwError } from 'rxjs';
import { SubscribersComponent } from './subscribers-component';
import { SubscribersService } from '../../core/services/subscribers.service';
import { PlatformsService } from '../../core/services/platforms.service';
import { SubscriberBillingService } from '../../core/services/subscriber-billing.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { SubscriberResponse } from '../../shared/models/subscribers.model';
import { PlatformResponse } from '../../shared/models/platforms.model';

describe('SubscribersComponent', () => {
  const createComponent = () => {
    const subscribersService = {
      list: jest.fn().mockReturnValue(of({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 })),
      create: jest.fn(),
      updateProfile: jest.fn(),
      delete: jest.fn(),
      associatePlatforms: jest.fn().mockReturnValue(of(void 0)),
      disassociatePlatforms: jest.fn().mockReturnValue(of(void 0)),
      details: jest.fn().mockReturnValue(of({ id: 1, name: 'A', email: 'a@a.com', associatedPlatforms: [] })),
      subscriptions: jest.fn().mockReturnValue(of([])),
    } as unknown as jest.Mocked<SubscribersService>;

    const platformsService = {
      list: jest.fn().mockReturnValue(of({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 })),
    } as unknown as jest.Mocked<PlatformsService>;

    const subscriberBillingService = {
      getBilling: jest.fn().mockReturnValue(
        of({ userId: 1, referenceMonth: '2026-04', items: [], totalMonthlyDue: 0, currency: 'BRL' }),
      ),
    } as unknown as jest.Mocked<SubscriberBillingService>;

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

    const component = new SubscribersComponent(
      new FormBuilder(),
      subscribersService,
      platformsService,
      subscriberBillingService,
      cdr,
      ngZone,
      i18nService,
    );

    return { component, subscribersService, platformsService, subscriberBillingService };
  };

  it('builds avatar initials with edge-case names', () => {
    const { component } = createComponent();

    expect(component.avatarInitials('')).toBe('??');
    expect(component.avatarInitials('Ana')).toBe('AN');
    expect(component.avatarInitials('Ana Beatriz')).toBe('AB');
  });

  it('does not search financial responsible for short terms', () => {
    const { component, subscribersService } = createComponent();

    component.onFinancialResponsibleSearch('ab');

    expect(component.financialResponsibleSearchLoading).toBe(false);
    expect(subscribersService.list).not.toHaveBeenCalled();
  });

  it('creates subscriber in create mode and updates page state', () => {
    const { component, subscribersService } = createComponent();

    const createdSubscriber: SubscriberResponse = {
      id: 22,
      name: 'Maria Silva',
      email: 'maria@splitfy.com',
      associatedPlatforms: [],
    };

    (subscribersService.create as jest.Mock).mockReturnValue(of(createdSubscriber));

    component.subscribers = [];
    component.subscribersPage = { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 };
    component.openCreate();
    component.editProfileForm.patchValue({ name: 'Maria Silva', email: 'maria@splitfy.com' });

    component.saveEdit();

    expect(subscribersService.create).toHaveBeenCalledWith({
      name: 'Maria Silva',
      email: 'maria@splitfy.com',
    });
    expect(component.subscribers).toHaveLength(1);
    expect(component.placeholderMessage).toBe('Assinante criado com sucesso.');
    expect(component.editingSubscriberId).toBeNull();
  });

  it('keeps subscriptions unchanged when there are no pending changes', () => {
    const { component, subscribersService } = createComponent();

    component.editingSubscriptionsSubscriber = {
      id: 3,
      name: 'Bob',
      email: 'bob@example.com',
      associatedPlatforms: [],
    };

    component.saveSubscriptionsChanges();

    expect(component.subscriptionsInfoMessage).toBe('Nenhuma alteração pendente para salvar.');
    expect(subscribersService.associatePlatforms).not.toHaveBeenCalled();
    expect(subscribersService.disassociatePlatforms).not.toHaveBeenCalled();
  });

  it('loads subscribers on init and handles load error', () => {
    const { component, subscribersService } = createComponent();
    const payload: SubscriberResponse[] = [{ id: 1, name: 'Alice', email: 'a@a.com', associatedPlatforms: [] }];
    (subscribersService.list as jest.Mock).mockReturnValueOnce(
      of({ content: payload, page: 0, size: 20, totalElements: 1, totalPages: 1 }),
    );
    (subscribersService.subscriptions as jest.Mock).mockReturnValue(of([]));

    component.ngOnInit();
    expect(component.hasLoadedSubscribers).toBe(true);
    expect(component.subscribers).toHaveLength(1);

    (subscribersService.list as jest.Mock).mockReturnValueOnce(throwError(() => new Error('boom')));
    component.ngOnInit();
    expect(component.subscribersError).toContain('Falha ao carregar assinantes.');
  });

  it('opens details and handles billing error', () => {
    const { component, subscriberBillingService } = createComponent();
    const s: SubscriberResponse = { id: 1, name: 'Alice', email: 'a@a.com', associatedPlatforms: [] };
    component.openDetails(s);
    expect(component.selectedSubscriber?.id).toBe(1);
    expect(component.billingLoading).toBe(false);

    (subscriberBillingService.getBilling as jest.Mock).mockReturnValueOnce(throwError(() => new Error('boom')));
    component.openDetails(s);
    expect(component.billingError).toContain('Não foi possível carregar as pendências');
  });

  it('updates subscriber profile and handles update error', () => {
    const { component, subscribersService } = createComponent();
    const original: SubscriberResponse = { id: 9, name: 'Bob', email: 'b@a.com', associatedPlatforms: [] };
    component.subscribers = [original];
    component.subscribersPage = { content: [original], page: 0, size: 20, totalElements: 1, totalPages: 1 };
    component.editingSubscriberId = 9;
    component.editProfileForm.patchValue({ name: 'Bob Changed', email: 'bob@a.com' });
    (subscribersService.updateProfile as jest.Mock).mockReturnValueOnce(
      of({ ...original, name: 'Bob Changed', email: 'bob@a.com' }),
    );

    component.saveEdit();
    expect(component.subscribers[0].name).toBe('Bob Changed');
    expect(component.placeholderMessage).toContain('atualizado com sucesso');

    component.editingSubscriberId = 9;
    component.editProfileForm.patchValue({ name: 'Bob Changed', email: 'bob@a.com' });
    (subscribersService.updateProfile as jest.Mock).mockReturnValueOnce(throwError(() => new Error('boom')));
    component.saveEdit();
    expect(component.editErrorMessage).toContain('Falha ao atualizar');
  });

  it('searches and selects financial responsible subscriber', () => {
    const { component, subscribersService } = createComponent();
    const result = [{ id: 2, name: 'Responsável', email: 'r@a.com', associatedPlatforms: [] }];
    (subscribersService.list as jest.Mock).mockReturnValueOnce(
      of({ content: result, page: 0, size: 10, totalElements: 1, totalPages: 1 }),
    );

    component.onFinancialResponsibleSearch('Resp');
    expect(component.financialResponsibleSearchResults).toEqual(result);

    component.selectFinancialResponsible(result[0]);
    expect(component.selectedFinancialResponsibleSubscriber?.id).toBe(2);
    component.clearFinancialResponsible();
    expect(component.selectedFinancialResponsibleSubscriber).toBeNull();
  });

  it('opens subscriptions editor and persists association changes', () => {
    const { component, subscribersService, platformsService } = createComponent();
    const subscriber: SubscriberResponse = { id: 4, name: 'C', email: 'c@a.com', associatedPlatforms: [] };
    const platforms: PlatformResponse[] = [
      {
        id: 10,
        name: 'Netflix',
        price: 40,
        currency: 'BRL',
        url: 'x',
        serviceType: 'Video Streaming',
        totalSlots: 4,
        availableSlots: 2,
        billingCycle: 'MONTHLY',
        billingDay: null,
      },
      {
        id: 11,
        name: 'Spotify',
        price: 20,
        currency: 'BRL',
        url: 'y',
        serviceType: 'Music Streaming',
        totalSlots: 4,
        availableSlots: 2,
        billingCycle: 'MONTHLY',
        billingDay: null,
      },
    ];

    component.subscribers = [subscriber];
    (subscribersService.details as jest.Mock).mockReturnValueOnce(of(subscriber));
    (subscribersService.subscriptions as jest.Mock).mockReturnValueOnce(of([{ serviceId: 10, platformName: 'Netflix' }]));
    (platformsService.list as jest.Mock).mockReturnValueOnce(
      of({ content: platforms, page: 0, size: 20, totalElements: 2, totalPages: 1 }),
    );

    component.openEditOptions(subscriber);
    component.chooseEditSubscriptions();
    expect(component.editingSubscriptionsSubscriber?.id).toBe(4);

    const spotify = component.subscriptionsAvailablePlatforms.find((p) => p.id === 11);
    expect(spotify).toBeDefined();
    component.associatePlatform(spotify!);
    expect(component.hasPendingSubscriptionChanges).toBe(true);
    component.saveSubscriptionsChanges();
    expect(subscribersService.associatePlatforms).toHaveBeenCalled();
  });

  it('handles subscriptions save error and delete flows', () => {
    const { component, subscribersService } = createComponent();
    component.editingSubscriptionsSubscriber = { id: 5, name: 'D', email: 'd@a.com', associatedPlatforms: [] };
    component.pendingAssociatePlatformIds = new Set([1]);
    (subscribersService.associatePlatforms as jest.Mock).mockReturnValueOnce(throwError(() => new Error('boom')));
    component.saveSubscriptionsChanges();
    expect(component.subscriptionsInfoMessage).toContain('Não foi possível salvar');

    const target: SubscriberResponse = { id: 5, name: 'D', email: 'd@a.com', associatedPlatforms: [] };
    component.subscribers = [target];
    component.subscribersPage = { content: [target], page: 0, size: 20, totalElements: 1, totalPages: 1 };
    component.askDelete(target);
    (subscribersService.delete as jest.Mock).mockReturnValueOnce(of(void 0));
    component.confirmDelete();
    expect(component.placeholderMessage).toContain('excluído com sucesso');

    component.subscribers = [target];
    component.subscribersPage = { content: [target], page: 0, size: 20, totalElements: 1, totalPages: 1 };
    component.askDelete(target);
    (subscribersService.delete as jest.Mock).mockReturnValueOnce(throwError(() => new Error('boom')));
    component.confirmDelete();
    expect(component.placeholderMessage).toContain('Falha ao excluir');
  });

  it('covers helper labels and currency/month flows', () => {
    const { component } = createComponent();
    expect(component.billingCycleLabel('MONTHLY')).toBe('status.monthly');
    expect(component.paymentStatusLabel('UNPAID')).toBe('status.unpaid');
    expect(component.paymentStatusClass('PAID')).toBe('paid');
    expect(component.paymentStatusClass('OTHER')).toBe('neutral');
    expect(component.formatCurrency(10)).toContain('R$');

    const current = component.billingReferenceMonth;
    component.changeBillingMonth(current);
    component.loadPreviousBillingMonth();
    component.loadNextBillingMonth();
  });

  it('covers no-op and guard branches in edit/search flows', () => {
    const { component, subscribersService } = createComponent();
    component.openEditOptions(null);
    component.chooseEditSubscriber();
    component.chooseEditSubscriptions();
    component.closeEditOptions();
    component.askDelete(null);
    component.confirmDelete();
    component.cancelDelete();

    component.editingSubscriberId = null;
    component.saveEdit();
    expect(component.editingSubscriberId).toBeNull();

    (subscribersService.list as jest.Mock).mockReturnValueOnce(throwError(() => new Error('boom')));
    component.onFinancialResponsibleSearch('Valid Name');
    expect(component.financialResponsibleSearchError).toContain('Não foi possível buscar assinantes.');
  });

  it('handles subscription editor loading error and close/reset', () => {
    const { component, subscribersService } = createComponent();
    const subscriber: SubscriberResponse = { id: 6, name: 'F', email: 'f@a.com', associatedPlatforms: [] };
    component.subscribers = [subscriber];
    component.openEditOptions(subscriber);

    (subscribersService.details as jest.Mock).mockReturnValueOnce(throwError(() => new Error('boom')));
    component.chooseEditSubscriptions();
    expect(component.subscriptionsEditorError).toContain('Não foi possível carregar');

    component.closeSubscriptionsEditor();
    expect(component.editingSubscriptionsSubscriber).toBeNull();
    expect(component.hasPendingSubscriptionChanges).toBe(false);
  });

  it('covers private normalization helpers and pending-change rules', () => {
    const { component } = createComponent();
    const anyComponent = component as any;

    expect(anyComponent.extractSubscriptionsList([1, 2])).toEqual([1, 2]);
    expect(anyComponent.extractSubscriptionsList(null)).toEqual([]);
    expect(anyComponent.extractSubscriptionsList({ subscriptions: [3] })).toEqual([3]);

    expect(anyComponent.resolvePlatformId(10, null)).toBe(10);
    expect(anyComponent.resolvePlatformId('11', null)).toBe(11);
    expect(anyComponent.resolvePlatformId('x', null)).toBeNull();
    expect(
      anyComponent.resolvePlatformId(
        {},
        { platform: { id: 99 }, platformId: '100', serviceId: null, subscriptionPlatformId: null, id: null },
      ),
    ).toBe(99);

    expect(anyComponent.pickField(null, ['x'])).toBeNull();
    expect(anyComponent.pickField({ platform: { x: 1 } }, ['x'])).toBe(1);
    expect(anyComponent.pickField({ y: 2 }, ['x', 'y'])).toBe(2);

    expect(anyComponent.stringOrNull(' value ')).toBe(' value ');
    expect(anyComponent.stringOrNull('')).toBeNull();
    expect(anyComponent.asRecord({ a: 1 })).toEqual({ a: 1 });
    expect(anyComponent.asRecord(null)).toBeNull();
    expect(anyComponent.numberOrDefault(10, 1)).toBe(10);
    expect(anyComponent.numberOrDefault('x', 1)).toBe(1);

    const normalized = anyComponent.normalizeAssociatedPlatforms(
      [
        { serviceId: 1, platformName: 'A', userMonthlyShare: 10, serviceCurrency: 'BRL' },
        '2',
        {},
      ],
      new Map([[2, { id: 2, name: 'B', monthlyPrice: 20, individualPrice: 20, currency: 'USD', availableSlots: 1 }]]),
    );
    expect(normalized.length).toBe(2);

    anyComponent.originalAssociatedPlatformIds = new Set([1]);
    anyComponent.pendingAssociatePlatformIds = new Set<number>();
    anyComponent.pendingDisassociatePlatformIds = new Set<number>();
    anyComponent.updatePendingChangesForAssociation(1);
    expect(anyComponent.pendingDisassociatePlatformIds.has(1)).toBe(false);
    anyComponent.updatePendingChangesForAssociation(2);
    expect(anyComponent.pendingAssociatePlatformIds.has(2)).toBe(true);
    anyComponent.updatePendingChangesForDisassociation(1);
    expect(anyComponent.pendingDisassociatePlatformIds.has(1)).toBe(true);
    anyComponent.updatePendingChangesForDisassociation(2);
    expect(anyComponent.pendingAssociatePlatformIds.has(2)).toBe(false);

    anyComponent.editingSubscriptionsSubscriber = { id: 1, name: 'X', email: 'x@a.com', associatedPlatforms: [] };
    anyComponent.subscribers = [{ id: 1, name: 'X', email: 'x@a.com', associatedPlatforms: [] }];
    anyComponent.subscribersPage = { content: anyComponent.subscribers, page: 0, size: 20, totalElements: 1, totalPages: 1 };
    anyComponent.selectedSubscriber = { id: 1, name: 'X', email: 'x@a.com', associatedPlatforms: [] };
    anyComponent.editOptionsSubscriber = { id: 1, name: 'X', email: 'x@a.com', associatedPlatforms: [] };
    anyComponent.subscriptionsAssociatedPlatforms = [{ id: 7, name: 'P', monthlyPrice: 1, individualPrice: 1, currency: 'BRL' }];
    anyComponent.syncEditedSubscriberPlatforms();
    expect(anyComponent.subscribers[0].associatedPlatforms).toHaveLength(1);
  });

  it('covers aggregate getters and edit option branches', () => {
    const { component } = createComponent();
    component.subscribers = [
      { id: 1, name: 'A', email: 'a@a.com', associatedPlatforms: [] },
      {
        id: 2,
        name: 'B',
        email: 'b@a.com',
        associatedPlatforms: [{ id: 10, name: 'P', monthlyPrice: 1, individualPrice: 1, currency: 'BRL' }],
      },
    ];

    expect(component.totalSubscribersCount).toBe(2);
    expect(component.subscribersWithPlatformsCount).toBe(1);
    expect(component.subscribersWithoutPlatformsCount).toBe(1);
    expect(component.totalAssociatedPlatformsCount).toBe(1);
    expect(component.trackById(0, component.subscribers[0])).toBe(1);
    expect(component.trackPlatformId(0, component.subscribers[1].associatedPlatforms[0])).toBe(10);
  });

  it('covers openDetails guard and status icon fallback', () => {
    const { component } = createComponent();
    component.openingDetailsSubscriberId = 1;
    component.openDetails({ id: 1, name: 'A', email: 'a@a.com', associatedPlatforms: [] });
    expect(component.selectedSubscriber).toBeNull();

    expect(component.paymentStatusIcon('PAID')).toBeDefined();
    expect(component.paymentStatusIcon('UNKNOWN')).toBeDefined();
    expect(component.paymentStatusLabel('X')).toBe('X');
    expect(component.billingCycleLabel('X')).toBe('X');
  });

  it('covers edit option with financial responsible and cancel/reset', () => {
    const { component } = createComponent();
    const target: SubscriberResponse = {
      id: 9,
      name: 'Target',
      email: 't@a.com',
      associatedPlatforms: [],
      financialResponsibleSubscriberId: 2,
      financialResponsibleSubscriberName: 'Resp',
    };

    component.openEditOptions(target);
    component.chooseEditSubscriber();
    expect(component.selectedFinancialResponsibleSubscriber?.id).toBe(2);
    expect(component.financialResponsibleSearchTerm).toBe('Resp');
    component.cancelEdit();
    expect(component.selectedFinancialResponsibleSubscriber).toBeNull();
    expect(component.editingSubscriberId).toBeNull();
  });

  it('covers association/removal guard branches and close details', () => {
    const { component } = createComponent();
    const platform = { id: 1, name: 'P', monthlyPrice: 1, individualPrice: 1, currency: 'BRL' };

    component.associatePlatform(platform);
    component.removePlatform(platform);

    component.editingSubscriptionsSubscriber = { id: 1, name: 'A', email: 'a@a.com', associatedPlatforms: [] };
    component.savingSubscriptionsChanges = true;
    component.associatePlatform(platform);
    component.removePlatform(platform);

    component.savingSubscriptionsChanges = false;
    component.subscriptionsAssociatedPlatforms = [];
    component.removePlatform(platform);

    component.closeDetails();
    expect(component.selectedSubscriber).toBeNull();
  });

  it('covers save subscriptions success with both associate and disassociate', () => {
    const { component, subscribersService } = createComponent();
    component.editingSubscriptionsSubscriber = { id: 12, name: 'A', email: 'a@a.com', associatedPlatforms: [] };
    component.pendingAssociatePlatformIds = new Set([1]);
    component.pendingDisassociatePlatformIds = new Set([2]);
    component.subscriptionsAssociatedPlatforms = [
      { id: 1, name: 'N', monthlyPrice: 1, individualPrice: 1, currency: 'BRL' },
    ];

    component.saveSubscriptionsChanges();
    expect(subscribersService.associatePlatforms).toHaveBeenCalledWith(12, [1]);
    expect(subscribersService.disassociatePlatforms).toHaveBeenCalledWith(12, [2]);
    expect(component.subscriptionsInfoMessage).toContain('atualizadas com sucesso');
  });

  it('covers confirmDelete branch that closes selected details', () => {
    const { component, subscribersService } = createComponent();
    const target: SubscriberResponse = { id: 77, name: 'Z', email: 'z@a.com', associatedPlatforms: [] };
    component.subscribers = [target];
    component.subscribersPage = { content: [target], page: 0, size: 20, totalElements: 1, totalPages: 1 };
    component.selectedSubscriber = target;
    component.askDelete(target);
    (subscribersService.delete as jest.Mock).mockReturnValueOnce(of(void 0));
    component.confirmDelete();
    expect(component.selectedSubscriber).toBeNull();
    component.closePlaceholderMessage();
    expect(component.placeholderMessage).toBeNull();
  });

  it('marks form touched when trying to save with invalid edit form', () => {
    const { component } = createComponent();
    component.editingSubscriberId = 1;
    component.editProfileForm.patchValue({ name: '', email: 'invalid' });

    component.saveEdit();

    expect(component.editProfileForm.touched).toBe(true);
  });

  it('handles create error and includes financial responsible id on payload', () => {
    const { component, subscribersService } = createComponent();
    component.openCreate();
    component.selectedFinancialResponsibleSubscriber = {
      id: 99,
      name: 'Resp',
      email: 'resp@a.com',
      associatedPlatforms: [],
    };
    component.editProfileForm.patchValue({ name: 'Novo', email: 'novo@a.com' });
    (subscribersService.create as jest.Mock).mockReturnValueOnce(throwError(() => new Error('boom')));

    component.saveEdit();

    expect(subscribersService.create).toHaveBeenCalledWith({
      name: 'Novo',
      email: 'novo@a.com',
      financialResponsibleSubscriberId: 99,
    });
    expect(component.editErrorMessage).toContain('Falha ao criar assinante.');
  });

  it('updates selected subscriber when editing the same id', () => {
    const { component, subscribersService } = createComponent();
    const original: SubscriberResponse = { id: 12, name: 'Old', email: 'old@a.com', associatedPlatforms: [] };
    component.subscribers = [original];
    component.subscribersPage = { content: [original], page: 0, size: 20, totalElements: 1, totalPages: 1 };
    component.selectedSubscriber = original;
    component.editingSubscriberId = 12;
    component.editProfileForm.patchValue({ name: 'New', email: 'new@a.com' });
    (subscribersService.updateProfile as jest.Mock).mockReturnValueOnce(
      of({ id: 12, name: 'New', email: 'new@a.com', associatedPlatforms: [] }),
    );

    component.saveEdit();

    expect(component.selectedSubscriber?.name).toBe('New');
  });

  it('ignores stale financial-responsible search responses', () => {
    const { component, subscribersService } = createComponent();
    const first$ = new Subject<any>();
    const second$ = new Subject<any>();
    (subscribersService.list as jest.Mock)
      .mockReturnValueOnce(first$.asObservable())
      .mockReturnValueOnce(second$.asObservable());

    component.onFinancialResponsibleSearch('Alice');
    component.onFinancialResponsibleSearch('Bob');

    first$.next({ content: [{ id: 1, name: 'Alice', email: 'a@a.com', associatedPlatforms: [] }] });
    first$.complete();
    expect(component.financialResponsibleSearchResults).toEqual([]);

    second$.next({ content: [{ id: 2, name: 'Bob', email: 'b@a.com', associatedPlatforms: [] }] });
    second$.complete();
    expect(component.financialResponsibleSearchResults[0].name).toBe('Bob');
  });

  it('ignores stale search errors and keeps latest request state', () => {
    const { component, subscribersService } = createComponent();
    const first$ = new Subject<any>();
    const second$ = new Subject<any>();
    (subscribersService.list as jest.Mock)
      .mockReturnValueOnce(first$.asObservable())
      .mockReturnValueOnce(second$.asObservable());

    component.onFinancialResponsibleSearch('Alice');
    component.onFinancialResponsibleSearch('Bob');

    first$.error(new Error('stale'));
    expect(component.financialResponsibleSearchError).toBeNull();

    second$.error(new Error('active'));
    expect(component.financialResponsibleSearchError).toContain('Não foi possível buscar assinantes.');
  });

  it('covers billing/status helper branches and tracking', () => {
    const { component } = createComponent();
    expect(component.subscriptionsTotalPerMonth()).toBe(0);
    expect(component.changeBillingMonth('')).toBeUndefined();
    expect(component.trackBillingItem(0, { serviceId: 8 } as any)).toBe(8);
    expect(component.billingCycleLabel('ANNUAL')).toBe('status.annual');
    expect(component.paymentStatusLabel('PAID')).toBe('status.paid');
    expect(component.paymentStatusLabel('PENDING')).toBe('status.pending');
    expect(component.paymentStatusClass('PENDING')).toBe('pending');
    expect(component.paymentStatusClass('UNPAID')).toBe('unpaid');
  });

  it('covers association/removal duplicate guards and save guard when already saving', () => {
    const { component, subscribersService } = createComponent();
    component.editingSubscriptionsSubscriber = { id: 1, name: 'A', email: 'a@a.com', associatedPlatforms: [] };
    component.subscriptionsAssociatedPlatforms = [{ id: 7, name: 'P', monthlyPrice: 1, individualPrice: 1, currency: 'BRL' }];
    const duplicate = { id: 7, name: 'P', monthlyPrice: 1, individualPrice: 1, currency: 'BRL' };

    component.associatePlatform(duplicate);
    expect(component.subscriptionsAssociatedPlatforms).toHaveLength(1);

    component.removePlatform({ id: 999, name: 'X', monthlyPrice: 1, individualPrice: 1, currency: 'BRL' });
    expect(component.subscriptionsAssociatedPlatforms).toHaveLength(1);

    component.savingSubscriptionsChanges = true;
    component.saveSubscriptionsChanges();
    expect(subscribersService.associatePlatforms).not.toHaveBeenCalled();
  });

  it('covers recalculate/sync branches with selected/edit options absent', () => {
    const { component } = createComponent();
    const anyComponent = component as any;

    anyComponent.subscriptionsCatalog = [
      { id: 1, name: 'A', monthlyPrice: 1, individualPrice: 1, currency: 'BRL', availableSlots: 0 },
      { id: 2, name: 'B', monthlyPrice: 2, individualPrice: 2, currency: 'BRL', availableSlots: 2 },
    ];
    anyComponent.originalAssociatedPlatformIds = new Set([1]);
    anyComponent.subscriptionsAssociatedPlatforms = [{ id: 1, name: 'A', monthlyPrice: 1, individualPrice: 1, currency: 'BRL' }];
    anyComponent.recalculateSubscriptionLists();
    expect(anyComponent.subscriptionsAvailablePlatforms.some((p: any) => p.id === 2)).toBe(true);

    anyComponent.editingSubscriptionsSubscriber = null;
    anyComponent.syncEditedSubscriberPlatforms();
    expect(anyComponent.subscribers).toEqual([]);
  });

  it('covers resolvePlatformId candidate parsing and normalizeSubscriberResponse fallback', () => {
    const { component } = createComponent();
    const anyComponent = component as any;

    expect(anyComponent.resolvePlatformId({}, { id: '15' })).toBe(15);
    expect(anyComponent.resolvePlatformId({}, { serviceId: '16' })).toBe(16);
    expect(anyComponent.resolvePlatformId({}, { subscriptionPlatformId: '17' })).toBe(17);

    expect(
      anyComponent.normalizeSubscriberResponse({
        id: 1,
        name: 'A',
        email: 'a@a.com',
        associatedPlatforms: undefined,
      }),
    ).toEqual({
      id: 1,
      name: 'A',
      email: 'a@a.com',
      associatedPlatforms: [],
    });
  });

  it('covers hydrateSubscribersPlatforms early return and error branch', () => {
    const { component, subscribersService } = createComponent();
    const anyComponent = component as any;

    anyComponent.hydrateSubscribersPlatforms([]);
    expect(component.subscribers).toEqual([]);

    component.subscribers = [{ id: 3, name: 'A', email: 'a@a.com', associatedPlatforms: [{ id: 1, name: 'P', monthlyPrice: 1, individualPrice: 1, currency: 'BRL' }] }];
    component.subscribersPage = { content: component.subscribers, page: 0, size: 20, totalElements: 1, totalPages: 1 };
    (subscribersService.subscriptions as jest.Mock).mockReturnValueOnce(throwError(() => new Error('boom')));
    anyComponent.hydrateSubscribersPlatforms(component.subscribers);
    expect(component.subscribers[0].associatedPlatforms).toEqual([]);
  });

  it('covers loadSubscriberBilling branches for keepCurrentData and error', () => {
    const { component, subscriberBillingService } = createComponent();
    const anyComponent = component as any;
    component.selectedSubscriberBilling = {
      userId: 1,
      referenceMonth: '2026-04',
      items: [{ serviceId: 1 } as any],
      totalMonthlyDue: 10,
      currency: 'BRL',
    };

    anyComponent.loadSubscriberBilling(1, '2026-04', true);
    expect(component.selectedSubscriberBilling).not.toBeNull();

    (subscriberBillingService.getBilling as jest.Mock).mockReturnValueOnce(throwError(() => new Error('boom')));
    anyComponent.loadSubscriberBilling(1, '2026-04', false);
    expect(component.billingError).toContain('Não foi possível carregar as pendências');
  });
});
