import { Component, HostListener } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Cloud, LucideIconData } from 'lucide-angular';

type Currency = 'BRL' | 'USD' | 'EUR';
type ServiceType =
  | 'Video Streaming'
  | 'Music Streaming'
  | 'Software'
  | 'Games'
  | 'News'
  | 'Cloud Storage'
  | 'Fitness';
type BillingCycle = 'MONTHLY' | 'SEMI_ANNUAL' | 'ANNUAL';

interface PlatformCard {
  id: number;
  name: string;
  price: number;
  currency: string;
  url: string;
  serviceType: string;
  totalSlots: number;
  availableSlots: number;
  billingCycle: string;
  billingDay: string | null; // Backend format: --MM-DD
}

@Component({
  selector: 'app-platforms',
  templateUrl: './platforms-component.html',
  styleUrl: './platforms-component.scss',
  standalone: false,
})
export class PlatformsComponent {
  readonly cloudIcon: LucideIconData = Cloud;
  private readonly currentYear = new Date().getFullYear();

  readonly currencyOptions: Currency[] = ['BRL', 'USD', 'EUR'];
  readonly serviceTypeOptions: ServiceType[] = [
    'Video Streaming',
    'Music Streaming',
    'Software',
    'Games',
    'News',
    'Cloud Storage',
    'Fitness',
  ];
  readonly billingCycleOptions: BillingCycle[] = ['MONTHLY', 'SEMI_ANNUAL', 'ANNUAL'];

  platforms: PlatformCard[] = [
    {
      id: 1,
      name: 'Netflix',
      price: 21.9,
      currency: 'BRL',
      url: 'https://www.netflix.com',
      serviceType: 'Video Streaming',
      totalSlots: 6,
      availableSlots: 4,
      billingCycle: 'MONTHLY',
      billingDay: null,
    },
    {
      id: 2,
      name: 'Spotify',
      price: 34.9,
      currency: 'BRL',
      url: 'https://www.spotify.com',
      serviceType: 'Music Streaming',
      totalSlots: 6,
      availableSlots: 2,
      billingCycle: 'MONTHLY',
      billingDay: null,
    },
    {
      id: 3,
      name: 'YouTube Premium',
      price: 41.9,
      currency: 'BRL',
      url: 'https://www.youtube.com/premium',
      serviceType: 'Video Streaming',
      totalSlots: 5,
      availableSlots: 1,
      billingCycle: 'ANNUAL',
      billingDay: '--02-20',
    },
  ];

  readonly editForm: FormGroup<{
    name: FormControl<string>;
    price: FormControl<number>;
    currency: FormControl<string>;
    url: FormControl<string>;
    serviceType: FormControl<string>;
    totalSlots: FormControl<number>;
    availableSlots: FormControl<number>;
    billingCycle: FormControl<string>;
    billingDateFull: FormControl<string | null>;
  }>;

  openMenuPlatformId: number | null = null;
  platformToDelete: PlatformCard | null = null;
  viewingPlatform: PlatformCard | null = null;
  editingPlatformId: number | null = null;
  placeholderMessage: string | null = null;
  editErrorMessage: string | null = null;

  constructor(private readonly formBuilder: FormBuilder) {
    this.editForm = this.formBuilder.group({
      name: this.formBuilder.nonNullable.control('', [Validators.required]),
      price: this.formBuilder.nonNullable.control(0, [Validators.required, Validators.min(0.01)]),
      currency: this.formBuilder.nonNullable.control('BRL'),
      url: this.formBuilder.nonNullable.control('', [Validators.required]),
      serviceType: this.formBuilder.nonNullable.control('Video Streaming'),
      totalSlots: this.formBuilder.nonNullable.control(1, [Validators.required, Validators.min(1)]),
      availableSlots: this.formBuilder.nonNullable.control(0, [Validators.required, Validators.min(0)]),
      billingCycle: this.formBuilder.nonNullable.control('MONTHLY'),
      billingDateFull: this.formBuilder.control<string | null>(null),
    });

    this.applyBillingDayRules(this.editForm.controls.billingCycle.value);

    this.editForm.controls.billingCycle.valueChanges.subscribe((value) => {
      this.applyBillingDayRules(value ?? 'MONTHLY');
    });
  }

  get isAnnualBilling(): boolean {
    return this.editForm.controls.billingCycle.value === 'ANNUAL';
  }

  get billingDayPreview(): string {
    const value = this.editForm.controls.billingDateFull.value;
    if (!value) {
      return '--/--';
    }

    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      return '--/--';
    }

    return `${match[3]}/${match[2]}`;
  }

  get backendBillingDayPreview(): string {
    const value = this.editForm.controls.billingDateFull.value;
    if (!value) {
      return '--MM-DD';
    }

    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      return '--MM-DD';
    }

    return `--${match[2]}-${match[3]}`;
  }

  get calendarMinDate(): string {
    return `${this.currentYear}-01-01`;
  }

  get calendarMaxDate(): string {
    return `${this.currentYear}-12-31`;
  }

  openBillingDatePicker(input: HTMLInputElement): void {
    if (!this.isAnnualBilling) {
      return;
    }

    const pickerInput = input as HTMLInputElement & { showPicker?: () => void };
    if (pickerInput.showPicker) {
      pickerInput.showPicker();
      return;
    }

    input.focus();
    input.click();
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.openMenuPlatformId = null;
  }

  toggleMenu(platformId: number, event: MouseEvent): void {
    event.stopPropagation();
    this.openMenuPlatformId = this.openMenuPlatformId === platformId ? null : platformId;
  }

  openDetails(platform: PlatformCard): void {
    this.viewingPlatform = platform;
    this.openMenuPlatformId = null;
  }

  closeDetails(): void {
    this.viewingPlatform = null;
  }

  openEditFromDetails(): void {
    if (!this.viewingPlatform) {
      return;
    }

    const selected = this.viewingPlatform;
    this.closeDetails();
    this.openEdit(selected);
  }

  askDeleteFromDetails(): void {
    if (!this.viewingPlatform) {
      return;
    }

    const selected = this.viewingPlatform;
    this.closeDetails();
    this.askDelete(selected);
  }

  openEdit(platform: PlatformCard): void {
    this.editingPlatformId = platform.id;
    this.editErrorMessage = null;

    this.editForm.setValue({
      name: platform.name,
      price: platform.price,
      currency: platform.currency,
      url: platform.url,
      serviceType: platform.serviceType,
      totalSlots: platform.totalSlots,
      availableSlots: platform.availableSlots,
      billingCycle: platform.billingCycle,
      billingDateFull: this.fromBackendBillingDate(platform.billingDay),
    });

    this.applyBillingDayRules(platform.billingCycle);
    this.openMenuPlatformId = null;
  }

  cancelEdit(): void {
    this.editingPlatformId = null;
    this.editErrorMessage = null;
  }

  saveEdit(): void {
    if (this.editForm.invalid || this.editingPlatformId === null) {
      this.editForm.markAllAsTouched();
      return;
    }

    const value = this.editForm.getRawValue();
    if (value.availableSlots > value.totalSlots) {
      this.editErrorMessage = 'Vagas disponíveis não pode ser maior que o total de vagas.';
      return;
    }

    const billingDay =
      value.billingCycle === 'ANNUAL' && value.billingDateFull
        ? this.toBackendBillingDate(value.billingDateFull)
        : null;

    this.platforms = this.platforms.map((platform) =>
      platform.id === this.editingPlatformId
        ? {
            ...platform,
            name: value.name,
            price: value.price,
            currency: value.currency,
            url: value.url,
            serviceType: value.serviceType,
            totalSlots: value.totalSlots,
            availableSlots: value.availableSlots,
            billingCycle: value.billingCycle,
            billingDay,
          }
        : platform,
    );

    this.editingPlatformId = null;
    this.editErrorMessage = null;
    this.placeholderMessage = 'Plataforma atualizada com sucesso.';
  }

  askDelete(platform: PlatformCard): void {
    this.platformToDelete = platform;
    this.openMenuPlatformId = null;
  }

  cancelDelete(): void {
    this.platformToDelete = null;
  }

  confirmDelete(): void {
    if (!this.platformToDelete) {
      return;
    }

    const deletedName = this.platformToDelete.name;
    this.platforms = this.platforms.filter((platform) => platform.id !== this.platformToDelete?.id);
    this.platformToDelete = null;
    this.placeholderMessage = `${deletedName} excluída com sucesso.`;
  }

  closePlaceholderMessage(): void {
    this.placeholderMessage = null;
  }

  formatBillingDayForDisplay(value: string | null): string {
    if (!value) {
      return '-';
    }

    const match = value.match(/^--(\d{2})-(\d{2})$/);
    if (!match) {
      return '-';
    }

    return `${match[2]}/${match[1]}`;
  }

  private applyBillingDayRules(cycle: string): void {
    const control = this.editForm.controls.billingDateFull;

    if (cycle === 'ANNUAL') {
      control.enable({ emitEvent: false });
      control.setValidators([Validators.required]);
      if (!control.value) {
        control.setValue(this.currentDateIso(), { emitEvent: false });
      }
      control.updateValueAndValidity({ emitEvent: false });
      return;
    }

    control.setValue(null, { emitEvent: false });
    control.clearValidators();
    control.disable({ emitEvent: false });
    control.updateValueAndValidity({ emitEvent: false });
  }

  private fromBackendBillingDate(value: string | null): string | null {
    if (!value) {
      return null;
    }

    const match = value.match(/^--(\d{2})-(\d{2})$/);
    if (!match) {
      return null;
    }

    return `${this.currentYear}-${match[1]}-${match[2]}`;
  }

  private toBackendBillingDate(value: string): string {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!match) {
      return '--01-01';
    }

    return `--${match[2]}-${match[3]}`;
  }

  private currentDateIso(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${this.currentYear}-${month}-${day}`;
  }
}
