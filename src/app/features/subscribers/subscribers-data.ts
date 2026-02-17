export interface SubscriberPlatform {
  id: number;
  name: string;
  monthlyPrice: number;
  individualPrice: number;
  currency: string;
}

export interface SubscriberCard {
  id: number;
  name: string;
  email: string;
  associatedPlatforms: SubscriberPlatform[];
}

export const PLATFORM_CATALOG: SubscriberPlatform[] = [
  { id: 1, name: 'Netflix', monthlyPrice: 24.9, individualPrice: 12.45, currency: 'BRL' },
  { id: 2, name: 'Spotify', monthlyPrice: 34.9, individualPrice: 6.98, currency: 'BRL' },
  { id: 3, name: 'Disney+', monthlyPrice: 27.9, individualPrice: 13.95, currency: 'BRL' },
  { id: 4, name: 'Prime Video', monthlyPrice: 19.9, individualPrice: 9.95, currency: 'BRL' },
  { id: 5, name: 'Apple TV+', monthlyPrice: 21.9, individualPrice: 10.95, currency: 'BRL' },
  { id: 6, name: 'YouTube Premium', monthlyPrice: 26.9, individualPrice: 26.9, currency: 'BRL' },
  { id: 7, name: 'HBO Max', monthlyPrice: 39.9, individualPrice: 9.98, currency: 'BRL' },
  { id: 8, name: 'Microsoft 365 Family', monthlyPrice: 49.9, individualPrice: 9.98, currency: 'BRL' },
];

export const SUBSCRIBERS_MOCK: SubscriberCard[] = [
  {
    id: 1,
    name: 'Ana Luiza Costa',
    email: 'ana.luiza@email.com',
    associatedPlatforms: [PLATFORM_CATALOG[0], PLATFORM_CATALOG[1]],
  },
  {
    id: 2,
    name: 'Bruno Almeida',
    email: 'bruno.almeida@email.com',
    associatedPlatforms: [PLATFORM_CATALOG[2], PLATFORM_CATALOG[3], PLATFORM_CATALOG[4]],
  },
  {
    id: 3,
    name: 'Carla Ferreira',
    email: 'carla.ferreira@email.com',
    associatedPlatforms: [PLATFORM_CATALOG[5]],
  },
];

export function cloneSubscribers(): SubscriberCard[] {
  return SUBSCRIBERS_MOCK.map((subscriber) => ({
    ...subscriber,
    associatedPlatforms: subscriber.associatedPlatforms.map((platform) => ({ ...platform })),
  }));
}
