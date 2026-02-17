import { Component } from '@angular/core';

interface SubscriberCard {
  id: number;
  name: string;
  email: string;
  associatedPlatforms: SubscriberPlatform[];
}

interface SubscriberPlatform {
  id: number;
  name: string;
  monthlyPrice: number;
  individualPrice: number;
  currency: string;
}

@Component({
  selector: 'app-subscribers',
  templateUrl: './subscribers-component.html',
  styleUrl: './subscribers-component.scss',
  standalone: false,
})
export class SubscribersComponent {
  subscribers: SubscriberCard[] = [
    {
      id: 1,
      name: 'Ana Luiza Costa',
      email: 'ana.luiza@email.com',
      associatedPlatforms: [
        {
          id: 1,
          name: 'Netflix',
          monthlyPrice: 24.9,
          individualPrice: 12.45,
          currency: 'BRL',
        },
        {
          id: 2,
          name: 'Spotify',
          monthlyPrice: 34.9,
          individualPrice: 6.98,
          currency: 'BRL',
        },
      ],
    },
    {
      id: 2,
      name: 'Bruno Almeida',
      email: 'bruno.almeida@email.com',
      associatedPlatforms: [
        {
          id: 3,
          name: 'Disney+',
          monthlyPrice: 27.9,
          individualPrice: 13.95,
          currency: 'BRL',
        },
        {
          id: 4,
          name: 'Prime Video',
          monthlyPrice: 19.9,
          individualPrice: 9.95,
          currency: 'BRL',
        },
        {
          id: 5,
          name: 'Apple TV+',
          monthlyPrice: 21.9,
          individualPrice: 10.95,
          currency: 'BRL',
        },
      ],
    },
    {
      id: 3,
      name: 'Carla Ferreira',
      email: 'carla.ferreira@email.com',
      associatedPlatforms: [
        {
          id: 6,
          name: 'YouTube Premium',
          monthlyPrice: 26.9,
          individualPrice: 26.9,
          currency: 'BRL',
        },
      ],
    },
  ];

  selectedSubscriber: SubscriberCard | null = null;
  subscriberToDelete: SubscriberCard | null = null;

  trackById(_: number, subscriber: SubscriberCard): number {
    return subscriber.id;
  }

  openDetails(subscriber: SubscriberCard): void {
    this.selectedSubscriber = subscriber;
  }

  closeDetails(): void {
    this.selectedSubscriber = null;
  }

  openEdit(subscriber: SubscriberCard | null): void {
    if (!subscriber) {
      return;
    }
  }

  askDelete(subscriber: SubscriberCard | null): void {
    if (!subscriber) {
      return;
    }

    this.subscriberToDelete = subscriber;
  }

  cancelDelete(): void {
    this.subscriberToDelete = null;
  }

  confirmDelete(): void {
    if (!this.subscriberToDelete) {
      return;
    }

    const deletedId = this.subscriberToDelete.id;
    this.subscribers = this.subscribers.filter((subscriber) => subscriber.id !== deletedId);
    this.subscriberToDelete = null;

    if (this.selectedSubscriber?.id === deletedId) {
      this.closeDetails();
    }
  }

  initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  totalPerMonth(subscriber: SubscriberCard): number {
    return subscriber.associatedPlatforms.reduce((total, platform) => total + platform.individualPrice, 0);
  }

  formatCurrency(value: number, currency = 'BRL'): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);
  }
}
