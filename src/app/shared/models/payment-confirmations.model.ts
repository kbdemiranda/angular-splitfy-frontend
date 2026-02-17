export interface PaymentConfirmationItemRequest {
  subscriberId: number;
  platformIds: number[];
}

export interface PaymentConfirmationBatchRequest {
  referenceMonth: string;
  confirmations: PaymentConfirmationItemRequest[];
}

export interface PaymentConfirmationResponse {
  id: number;
  subscriberId: number;
  platformId: number;
  referenceMonth: string;
  status: 'PENDING' | 'CONFIRMED';
  requestedByEmail: string;
  requestedAt: string;
  validatedByEmail: string | null;
  validatedAt: string | null;
}

export interface PendingPaymentPlatform {
  id: number;
  name: string;
  serviceType: string;
  currency: string;
  price: number;
}

export interface PendingPaymentSubscriber {
  id: number;
  name: string;
  email: string;
}

export interface PendingPaymentApprovalResponse {
  confirmationId: number;
  referenceMonth: string;
  status: 'PENDING' | 'CONFIRMED';
  requestedByEmail: string;
  requestedAt: string;
  subscriber: PendingPaymentSubscriber;
  platform: PendingPaymentPlatform;
}
