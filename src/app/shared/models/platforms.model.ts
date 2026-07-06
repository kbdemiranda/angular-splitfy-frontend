export type PlatformCurrency = 'BRL' | 'USD' | 'EUR';

export type PlatformServiceType =
  | 'Video Streaming'
  | 'Music Streaming'
  | 'Software'
  | 'Games'
  | 'News'
  | 'Cloud Storage'
  | 'Fitness';

export type PlatformBillingCycle = 'MONTHLY' | 'SEMI_ANNUAL' | 'ANNUAL';

export interface PlatformResponse {
  id: number;
  name: string;
  price: number;
  currency: PlatformCurrency;
  url: string;
  serviceType: PlatformServiceType;
  totalSlots: number;
  availableSlots: number;
  billingCycle: PlatformBillingCycle;
  billingDay: string | null;
}

export interface PlatformRequest {
  name: string;
  price: number;
  currency: PlatformCurrency;
  url: string;
  serviceType: PlatformServiceType;
  totalSlots: number;
  availableSlots: number;
  billingCycle: PlatformBillingCycle;
  billingDay: string | null;
}

export interface PlatformPageResponse {
  content: PlatformResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface PlatformParticipantItem {
  subscriberId: number;
  subscriberName: string;
  subscriberEmail: string;
  subscribedAt: string;
  individualShare: number;
  individualShareOriginal: number | null;
  totalPaid: number;
  totalPaidOriginal: number | null;
  totalIfSubscribedAlone: number;
  totalIfSubscribedAloneOriginal: number | null;
}

export interface PlatformParticipantsResponse {
  platformId: number;
  platformName: string;
  price: number;
  currency: PlatformCurrency;
  priceInBrl: number;
  participantsCount: number;
  individualShare: number;
  individualShareOriginal: number | null;
  participants: PlatformParticipantItem[];
}
