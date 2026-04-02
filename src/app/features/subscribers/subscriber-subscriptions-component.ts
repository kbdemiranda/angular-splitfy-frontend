import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SubscribersService } from '../../core/services/subscribers.service';
import { SubscriberPlatform, SubscriberResponse } from '../../shared/models/subscribers.model';
import { PlatformsService } from '../../core/services/platforms.service';
import { PlatformResponse } from '../../shared/models/platforms.model';
import { forkJoin } from 'rxjs';

type PlatformCatalogItem = SubscriberPlatform & {
  availableSlots: number;
};

@Component({
  selector: 'app-subscriber-subscriptions',
  templateUrl: './subscriber-subscriptions-component.html',
  styleUrl: './subscriber-subscriptions-component.scss',
  standalone: false,
})
export class SubscriberSubscriptionsComponent implements OnInit {
  subscriber: SubscriberResponse | null = null;
  associatedPlatforms: SubscriberPlatform[] = [];
  availablePlatforms: SubscriberPlatform[] = [];
  allPlatforms: PlatformCatalogItem[] = [];
  private originalAssociatedPlatformIds = new Set<number>();
  infoMessage: string | null = null;
  isLoadingSubscriber = false;
  subscriberError: string | null = null;
  hasLoadedSubscriptionsData = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly subscribersService: SubscribersService,
    private readonly platformsService: PlatformsService,
  ) {}

  ngOnInit(): void {
    const routeId = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(routeId)) {
      void this.router.navigate(['/subscriber']);
      return;
    }

    this.isLoadingSubscriber = true;
    this.subscriberError = null;
    this.hasLoadedSubscriptionsData = false;
    this.subscriber = null;
    this.associatedPlatforms = [];
    this.availablePlatforms = [];
    this.allPlatforms = [];
    this.originalAssociatedPlatformIds = new Set<number>();

    forkJoin({
      subscriber: this.subscribersService.details(routeId),
      subscriberSubscriptions: this.subscribersService.subscriptions(routeId),
      platformsPage: this.platformsService.list(0, 500),
    }).subscribe({
      next: ({ subscriber, subscriberSubscriptions, platformsPage }) => {
        this.subscriber = subscriber;
        this.allPlatforms = platformsPage.content.map((platform) => this.mapPlatformFromCatalog(platform));

        const platformById = new Map(this.allPlatforms.map((platform) => [platform.id, platform]));
        this.associatedPlatforms = this.normalizeAssociatedPlatforms(subscriberSubscriptions, platformById);
        this.originalAssociatedPlatformIds = new Set(this.associatedPlatforms.map((platform) => platform.id));

        this.recalculateLists();
        this.hasLoadedSubscriptionsData = true;
        this.isLoadingSubscriber = false;
      },
      error: () => {
        this.hasLoadedSubscriptionsData = false;
        this.isLoadingSubscriber = false;
        this.subscriberError = 'Não foi possível carregar os dados do assinante.';
      },
    });
  }

  backToSubscribers(): void {
    void this.router.navigate(['/subscriber']);
  }

  formatCurrency(value: number, currency = 'BRL'): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);
  }

  totalPerMonth(): number {
    return this.associatedPlatforms.reduce((total, platform) => total + platform.individualPrice, 0);
  }

  associatePlatform(platform: SubscriberPlatform): void {
    if (this.associatedPlatforms.some((item) => item.id === platform.id)) {
      return;
    }

    this.associatedPlatforms = [...this.associatedPlatforms, { ...platform }];
    this.recalculateLists();
    this.persistAssociatedPlatforms();
    this.infoMessage = `${platform.name} associada ao assinante.`;
  }

  removePlatform(platform: SubscriberPlatform): void {
    if (!this.associatedPlatforms.some((item) => item.id === platform.id)) {
      return;
    }

    this.associatedPlatforms = this.associatedPlatforms.filter((item) => item.id !== platform.id);
    this.recalculateLists();
    this.persistAssociatedPlatforms();
    this.infoMessage = `${platform.name} removida do assinante.`;
  }

  private recalculateLists(): void {
    const associatedIds = new Set(this.associatedPlatforms.map((platform) => platform.id));
    this.availablePlatforms = this.allPlatforms
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

    this.associatedPlatforms = [...this.associatedPlatforms].sort((a, b) => a.name.localeCompare(b.name));
    this.availablePlatforms = [...this.availablePlatforms].sort((a, b) => a.name.localeCompare(b.name));
  }

  private persistAssociatedPlatforms(): void {
    if (!this.subscriber) {
      return;
    }

    this.subscriber = {
      ...this.subscriber,
      associatedPlatforms: this.associatedPlatforms.map((platform) => ({ ...platform })),
    };
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

    const candidates = [source['content'], source['items'], source['data']];
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
}
