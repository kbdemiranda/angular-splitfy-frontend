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
}

export interface SubscriberRequest {
  name: string;
  email: string;
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
