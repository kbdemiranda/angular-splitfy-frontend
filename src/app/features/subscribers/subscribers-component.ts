import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SubscriberCard } from './subscribers-data';
import { SubscribersStateService } from './subscribers-state.service';

@Component({
  selector: 'app-subscribers',
  templateUrl: './subscribers-component.html',
  styleUrl: './subscribers-component.scss',
  standalone: false,
})
export class SubscribersComponent implements OnInit {
  subscribers: SubscriberCard[] = [];

  selectedSubscriber: SubscriberCard | null = null;
  subscriberToDelete: SubscriberCard | null = null;
  editOptionsSubscriber: SubscriberCard | null = null;
  editingSubscriberId: number | null = null;
  readonly editProfileForm: FormGroup<{
    name: FormControl<string>;
    email: FormControl<string>;
  }>;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly router: Router,
    private readonly subscribersState: SubscribersStateService,
  ) {
    this.editProfileForm = this.formBuilder.group({
      name: this.formBuilder.nonNullable.control('', [Validators.required, Validators.minLength(3)]),
      email: this.formBuilder.nonNullable.control('', [Validators.required, Validators.email]),
    });
  }

  ngOnInit(): void {
    this.refreshSubscribers();
  }

  trackById(_: number, subscriber: SubscriberCard): number {
    return subscriber.id;
  }

  openDetails(subscriber: SubscriberCard): void {
    this.selectedSubscriber = subscriber;
  }

  closeDetails(): void {
    this.selectedSubscriber = null;
  }

  openEditOptions(subscriber: SubscriberCard | null): void {
    if (!subscriber) {
      return;
    }

    this.editOptionsSubscriber = subscriber;
  }

  closeEditOptions(): void {
    this.editOptionsSubscriber = null;
  }

  chooseEditSubscriber(): void {
    const subscriber = this.editOptionsSubscriber;
    this.closeEditOptions();

    if (!subscriber) {
      return;
    }

    this.editingSubscriberId = subscriber.id;
    this.editProfileForm.setValue({
      name: subscriber.name,
      email: subscriber.email,
    });
  }

  cancelEdit(): void {
    this.editingSubscriberId = null;
    this.editProfileForm.reset({
      name: '',
      email: '',
    });
  }

  saveEdit(): void {
    if (this.editingSubscriberId === null) {
      return;
    }

    if (this.editProfileForm.invalid) {
      this.editProfileForm.markAllAsTouched();
      return;
    }

    const { name, email } = this.editProfileForm.getRawValue();
    this.subscribersState.updateSubscriberProfile(this.editingSubscriberId, name.trim(), email.trim());
    this.refreshSubscribers();

    if (this.selectedSubscriber?.id === this.editingSubscriberId) {
      this.selectedSubscriber = this.subscribers.find(
        (subscriber) => subscriber.id === this.editingSubscriberId,
      ) ?? null;
    }

    this.cancelEdit();
  }

  chooseEditSubscriptions(): void {
    const subscriber = this.editOptionsSubscriber;
    this.closeEditOptions();

    if (!subscriber) {
      return;
    }

    void this.router.navigate(['/users', subscriber.id, 'subscriptions']);
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
    this.subscribersState.deleteSubscriber(deletedId);
    this.refreshSubscribers();
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

  private refreshSubscribers(): void {
    this.subscribers = this.subscribersState.getSubscribers();
  }
}
