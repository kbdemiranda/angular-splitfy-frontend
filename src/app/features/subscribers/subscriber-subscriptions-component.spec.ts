import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { SubscribersService } from '../../core/services/subscribers.service';
import { PlatformsService } from '../../core/services/platforms.service';
import { SubscriberSubscriptionsComponent } from './subscriber-subscriptions-component';

describe('SubscriberSubscriptionsComponent', () => {
  const setup = (id = '1') => {
    const route = {
      snapshot: {
        paramMap: { get: jest.fn().mockReturnValue(id) },
      },
    } as unknown as ActivatedRoute;

    const router = { navigate: jest.fn().mockResolvedValue(true) } as unknown as Router;
    const subscribersService = {
      details: jest.fn().mockReturnValue(of({ id: 1, name: 'Alice', email: 'a@a.com', associatedPlatforms: [] })),
      subscriptions: jest.fn().mockReturnValue(of([{ serviceId: 10, platformName: 'Netflix', userMonthlyShare: 20 }])),
    } as unknown as jest.Mocked<SubscribersService>;

    const platformsService = {
      list: jest.fn().mockReturnValue(
        of({
          content: [
            {
              id: 10,
              name: 'Netflix',
              price: 59.9,
              currency: 'BRL',
              url: 'x',
              serviceType: 'Video Streaming',
              totalSlots: 5,
              availableSlots: 2,
              billingCycle: 'MONTHLY',
              billingDay: null,
            },
            {
              id: 11,
              name: 'Spotify',
              price: 19.9,
              currency: 'BRL',
              url: 'y',
              serviceType: 'Music Streaming',
              totalSlots: 5,
              availableSlots: 5,
              billingCycle: 'MONTHLY',
              billingDay: null,
            },
          ],
          page: 0,
          size: 2,
          totalElements: 2,
          totalPages: 1,
        }),
      ),
    } as unknown as jest.Mocked<PlatformsService>;

    const component = new SubscriberSubscriptionsComponent(route, router, subscribersService, platformsService);
    return { component, subscribersService, platformsService, router };
  };

  it('redirects when route id is invalid', () => {
    const { component, router } = setup('invalid');
    component.ngOnInit();
    expect(router.navigate).toHaveBeenCalledWith(['/subscriber']);
  });

  it('loads subscriptions data and recalculates lists', () => {
    const { component } = setup('1');
    component.ngOnInit();

    expect(component.subscriber?.id).toBe(1);
    expect(component.hasLoadedSubscriptionsData).toBe(true);
    expect(component.associatedPlatforms.length).toBe(1);
    expect(component.availablePlatforms.length).toBe(1);
  });

  it('associates and removes platform with info messages', () => {
    const { component } = setup('1');
    component.ngOnInit();

    const platform = component.availablePlatforms[0];
    component.associatePlatform(platform);
    expect(component.infoMessage).toContain('associada');

    component.removePlatform(platform);
    expect(component.infoMessage).toContain('removida');
  });

  it('handles loading error', () => {
    const { component, subscribersService } = setup('1');
    (subscribersService.details as jest.Mock).mockReturnValue(throwError(() => new Error('boom')));

    component.ngOnInit();

    expect(component.hasLoadedSubscriptionsData).toBe(false);
    expect(component.subscriberError).toContain('Não foi possível carregar');
    expect(component.isLoadingSubscriber).toBe(false);
  });

  it('covers helper methods and no-op association branches', () => {
    const { component, router } = setup('1');
    component.ngOnInit();

    expect(component.formatCurrency(10)).toContain('R$');
    expect(component.totalPerMonth()).toBeGreaterThanOrEqual(0);

    const associated = component.associatedPlatforms[0];
    component.associatePlatform(associated);
    expect(component.associatedPlatforms.filter((p) => p.id === associated.id).length).toBe(1);

    component.removePlatform({ id: 999, name: 'X', monthlyPrice: 1, individualPrice: 1, currency: 'BRL' });
    expect(component.associatedPlatforms.some((p) => p.id === associated.id)).toBe(true);

    component.backToSubscribers();
    expect(router.navigate).toHaveBeenCalledWith(['/subscriber']);
  });

  it('covers private parsing helpers', () => {
    const { component } = setup('1');
    const anyComponent = component as any;

    expect(anyComponent.extractSubscriptionsList([1])).toEqual([1]);
    expect(anyComponent.extractSubscriptionsList({ content: [2] })).toEqual([2]);
    expect(anyComponent.extractSubscriptionsList(null)).toEqual([]);

    expect(anyComponent.resolvePlatformId(1, null)).toBe(1);
    expect(anyComponent.resolvePlatformId('2', null)).toBe(2);
    expect(anyComponent.resolvePlatformId('x', null)).toBeNull();
    expect(anyComponent.resolvePlatformId({}, { platformId: '3' })).toBe(3);

    expect(anyComponent.pickField({ platform: { a: 1 } }, ['a'])).toBe(1);
    expect(anyComponent.pickField({ b: 2 }, ['a', 'b'])).toBe(2);
    expect(anyComponent.pickField(null, ['a'])).toBeNull();

    expect(anyComponent.stringOrNull('ok')).toBe('ok');
    expect(anyComponent.stringOrNull('')).toBeNull();
    expect(anyComponent.asRecord({})).toEqual({});
    expect(anyComponent.asRecord(undefined)).toBeNull();
    expect(anyComponent.numberOrDefault(1, 2)).toBe(1);
    expect(anyComponent.numberOrDefault('x', 2)).toBe(2);
  });
});
