import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PLATFORM_CATALOG, SubscriberCard, SubscriberPlatform } from './subscribers-data';
import { SubscribersStateService } from './subscribers-state.service';

@Component({
  selector: 'app-subscriber-subscriptions',
  templateUrl: './subscriber-subscriptions-component.html',
  styleUrl: './subscriber-subscriptions-component.scss',
  standalone: false,
})
export class SubscriberSubscriptionsComponent implements OnInit {
  subscriber: SubscriberCard | null = null;
  associatedPlatforms: SubscriberPlatform[] = [];
  availablePlatforms: SubscriberPlatform[] = [];
  infoMessage: string | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly subscribersState: SubscribersStateService,
  ) {}

  ngOnInit(): void {
    const routeId = Number(this.route.snapshot.paramMap.get('id'));
    this.subscriber = this.subscribersState.getSubscriberById(routeId);

    if (!this.subscriber) {
      void this.router.navigate(['/users']);
      return;
    }

    this.associatedPlatforms = this.subscriber.associatedPlatforms.map((platform) => ({ ...platform }));
    this.recalculateLists();
  }

  backToSubscribers(): void {
    void this.router.navigate(['/users']);
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
    this.availablePlatforms = PLATFORM_CATALOG.filter((platform) => !associatedIds.has(platform.id)).map(
      (platform) => ({ ...platform }),
    );

    this.associatedPlatforms = [...this.associatedPlatforms].sort((a, b) => a.name.localeCompare(b.name));
    this.availablePlatforms = [...this.availablePlatforms].sort((a, b) => a.name.localeCompare(b.name));
  }

  private persistAssociatedPlatforms(): void {
    if (!this.subscriber) {
      return;
    }

    this.subscribersState.updateSubscriberPlatforms(this.subscriber.id, this.associatedPlatforms);
    this.subscriber = this.subscribersState.getSubscriberById(this.subscriber.id);
  }
}
