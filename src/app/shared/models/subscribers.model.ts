export interface SubscriberPlatform {
  id: number;
  name: string;
  monthlyPrice: number;
  individualPrice: number;
  currency: string;
}

export interface SubscriberResponse {
  id: number;
  name: string;
  email: string;
  associatedPlatforms: SubscriberPlatform[];
  financialResponsibleSubscriberId?: number;
  financialResponsibleSubscriberName?: string;
}

export interface SubscriberRequest {
  name: string;
  email: string;
  financialResponsibleSubscriberId?: number;
}

export type SubscriberUpdateRequest = SubscriberRequest;

export interface SubscriberPageResponse {
  content: SubscriberResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface SubscriberPlatformsBatchPayloadItem {
  platformIds: number[];
}
