import { Injectable } from '@angular/core';
import { cloneSubscribers, SubscriberCard, SubscriberPlatform } from './subscribers-data';

@Injectable({
  providedIn: 'root',
})
export class SubscribersStateService {
  private subscribers: SubscriberCard[] = cloneSubscribers();

  getSubscribers(): SubscriberCard[] {
    return this.subscribers.map((subscriber) => ({
      ...subscriber,
      associatedPlatforms: subscriber.associatedPlatforms.map((platform) => ({ ...platform })),
    }));
  }

  getSubscriberById(id: number): SubscriberCard | null {
    const subscriber = this.subscribers.find((item) => item.id === id);
    if (!subscriber) {
      return null;
    }

    return {
      ...subscriber,
      associatedPlatforms: subscriber.associatedPlatforms.map((platform) => ({ ...platform })),
    };
  }

  updateSubscriberProfile(id: number, name: string, email: string): void {
    this.subscribers = this.subscribers.map((subscriber) =>
      subscriber.id === id
        ? {
            ...subscriber,
            name,
            email,
          }
        : subscriber,
    );
  }

  updateSubscriberPlatforms(id: number, platforms: SubscriberPlatform[]): void {
    this.subscribers = this.subscribers.map((subscriber) =>
      subscriber.id === id
        ? {
            ...subscriber,
            associatedPlatforms: platforms.map((platform) => ({ ...platform })),
          }
        : subscriber,
    );
  }

  deleteSubscriber(id: number): void {
    this.subscribers = this.subscribers.filter((subscriber) => subscriber.id !== id);
  }
}
