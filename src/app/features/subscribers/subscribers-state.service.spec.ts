import { SubscribersStateService } from './subscribers-state.service';

describe('SubscribersStateService', () => {
  let service: SubscribersStateService;

  beforeEach(() => {
    service = new SubscribersStateService();
  });

  it('returns deep-cloned subscribers and finds by id', () => {
    const all = service.getSubscribers();
    expect(all.length).toBeGreaterThan(0);

    const first = all[0];
    const byId = service.getSubscriberById(first.id);
    expect(byId?.id).toBe(first.id);

    if (byId) {
      byId.name = 'Changed';
      expect(service.getSubscriberById(first.id)?.name).not.toBe('Changed');
    }
  });

  it('updates profile, platforms and deletes subscriber', () => {
    const first = service.getSubscribers()[0];

    service.updateSubscriberProfile(first.id, 'Novo Nome', 'novo@splitfy.com');
    expect(service.getSubscriberById(first.id)).toMatchObject({ name: 'Novo Nome', email: 'novo@splitfy.com' });

    service.updateSubscriberPlatforms(first.id, [
      { id: 99, name: 'X', monthlyPrice: 10, individualPrice: 10, currency: 'BRL' },
    ]);
    expect(service.getSubscriberById(first.id)?.associatedPlatforms).toHaveLength(1);

    service.deleteSubscriber(first.id);
    expect(service.getSubscriberById(first.id)).toBeNull();
  });
});
