import { ChangeDetectorRef, NgZone } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { SubscribersComponent } from './subscribers-component';
import { SubscribersService } from '../../core/services/subscribers.service';
import { PlatformsService } from '../../core/services/platforms.service';
import { SubscriberBillingService } from '../../core/services/subscriber-billing.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { SubscriberResponse } from '../../shared/models/subscribers.model';

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
    } as unknown as PlatformsService;

    const subscriberBillingService = {
      getBilling: jest.fn().mockReturnValue(
        of({ userId: 1, referenceMonth: '2026-04', items: [], totalMonthlyDue: 0, currency: 'BRL' }),
      ),
    } as unknown as SubscriberBillingService;

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

    return { component, subscribersService };
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
});
