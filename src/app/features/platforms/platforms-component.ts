import { ChangeDetectorRef, Component, HostListener, NgZone, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Cloud, LucideIconData } from 'lucide-angular';
import { PlatformsService } from '../../core/services/platforms.service';
import {
  PlatformBillingCycle,
  PlatformCurrency,
  PlatformPageResponse,
  PlatformRequest,
  PlatformResponse,
  PlatformServiceType,
} from '../../shared/models/platforms.model';

type Currency = PlatformCurrency;
type ServiceType = PlatformServiceType;
type BillingCycle = PlatformBillingCycle;
type Platform = PlatformResponse;
type Page<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

@Component({
  selector: 'app-platforms',
  templateUrl: './platforms-component.html',
  styleUrl: './platforms-component.scss',
  standalone: false,
})
export class PlatformsComponent implements OnInit {
  readonly cloudIcon: LucideIconData = Cloud;
  private readonly createSentinelId = -1;
  private readonly currentYear = new Date().getFullYear();
  priceInputValue = '';
  isLoading = false;
  errorMessage?: string;
  hasLoadedData = false;

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
  private readonly serviceTypeLabels: Record<ServiceType, string> = {
    'Video Streaming': 'Streaming de vídeo',
    'Music Streaming': 'Streaming de música',
    Software: 'Software',
    Games: 'Jogos',
    News: 'Notícias',
    'Cloud Storage': 'Armazenamento em nuvem',
    Fitness: 'Fitness',
  };
  readonly billingCycleOptions: BillingCycle[] = ['MONTHLY', 'SEMI_ANNUAL', 'ANNUAL'];
  private readonly billingCycleLabels: Record<BillingCycle, string> = {
    MONTHLY: 'Mensal',
    SEMI_ANNUAL: 'Semestral',
    ANNUAL: 'Anual',
  };

  platforms: Platform[] = [];
  page: Page<Platform> = {
    content: [],
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
  };

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
  platformToDelete: Platform | null = null;
  viewingPlatform: Platform | null = null;
  editingPlatformId: number | null = null;
  placeholderMessage: string | null = null;
  editErrorMessage: string | null = null;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly platformsService: PlatformsService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly ngZone: NgZone,
  ) {
    this.editForm = this.formBuilder.group({
      name: this.formBuilder.nonNullable.control('', [Validators.required]),
      price: this.formBuilder.nonNullable.control(0, [Validators.required, Validators.min(0)]),
      currency: this.formBuilder.nonNullable.control('BRL'),
      url: this.formBuilder.nonNullable.control('', [Validators.required]),
      serviceType: this.formBuilder.nonNullable.control('Video Streaming'),
      totalSlots: this.formBuilder.nonNullable.control(1, [Validators.required, Validators.min(1)]),
      availableSlots: this.formBuilder.nonNullable.control(0, [Validators.required, Validators.min(0)]),
      billingCycle: this.formBuilder.nonNullable.control('MONTHLY'),
      billingDateFull: this.formBuilder.control<string | null>(null),
    });

    this.applyBillingDayRules(this.editForm.controls.billingCycle.value);
    this.setPriceInputFromNumber(0);

    this.editForm.controls.billingCycle.valueChanges.subscribe((value) => {
      this.applyBillingDayRules(value ?? 'MONTHLY');
    });

    this.editForm.controls.totalSlots.valueChanges.subscribe((value) => {
      if (this.isCreateMode) {
        this.editForm.controls.availableSlots.setValue(value, { emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    this.loadPlatforms();
  }

  get isAnnualBilling(): boolean {
    return this.editForm.controls.billingCycle.value === 'ANNUAL';
  }

  get isCreateMode(): boolean {
    return this.editingPlatformId === this.createSentinelId;
  }

  get currencyPrefix(): string {
    const currency = this.editForm.controls.currency.value;
    if (currency === 'USD') {
      return '$';
    }
    if (currency === 'EUR') {
      return 'EUR';
    }
    return 'R$';
  }

  get formattedPricePreview(): string {
    const currency = this.editForm.controls.currency.value || 'BRL';
    const value = this.editForm.controls.price.value || 0;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);
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

  openDetails(platform: Platform): void {
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

  openEdit(platform: Platform): void {
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
    this.editForm.controls.availableSlots.enable({ emitEvent: false });
    this.setPriceInputFromNumber(platform.price);

    this.applyBillingDayRules(platform.billingCycle);
    this.openMenuPlatformId = null;
  }

  openCreate(): void {
    this.editingPlatformId = this.createSentinelId;
    this.editErrorMessage = null;
    this.editForm.setValue({
      name: '',
      price: 0,
      currency: 'BRL',
      url: '',
      serviceType: 'Video Streaming',
      totalSlots: 1,
      availableSlots: 1,
      billingCycle: 'MONTHLY',
      billingDateFull: null,
    });
    this.editForm.controls.availableSlots.disable({ emitEvent: false });
    this.applyBillingDayRules('MONTHLY');
    this.setPriceInputFromNumber(0);
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
    const isCreate = this.isCreateMode;
    const availableSlots = isCreate ? value.totalSlots : value.availableSlots;

    if (availableSlots > value.totalSlots) {
      this.editErrorMessage = 'Vagas disponíveis não pode ser maior que o total de vagas.';
      return;
    }

    const payload = this.toPlatformRequest(value, availableSlots);

    const billingDay =
      value.billingCycle === 'ANNUAL' && value.billingDateFull
        ? this.toBackendBillingDate(value.billingDateFull)
        : null;

    payload.billingDay = billingDay;

    if (isCreate) {
      this.platformsService.create(payload).subscribe({
        next: (createdPlatform) => {
          this.runInZone(() => {
            this.platforms = [...this.platforms, createdPlatform];
            this.page = {
              ...this.page,
              content: this.platforms,
              totalElements: this.page.totalElements + 1,
            };
            this.editingPlatformId = null;
            this.editErrorMessage = null;
            this.placeholderMessage = 'Plataforma criada com sucesso.';
            this.syncView();
          });
        },
        error: () => {
          this.runInZone(() => {
            this.editErrorMessage = 'Falha ao criar plataforma.';
            this.syncView();
          });
        },
      });
      return;
    }

    const platformId = this.editingPlatformId;
    this.platformsService.update(platformId, payload).subscribe({
      next: (updatedPlatform) => {
        this.runInZone(() => {
          this.platforms = this.platforms.map((platform) =>
            platform.id === platformId ? updatedPlatform : platform,
          );
          this.page = {
            ...this.page,
            content: this.platforms,
          };
          this.editingPlatformId = null;
          this.editErrorMessage = null;
          this.placeholderMessage = 'Plataforma atualizada com sucesso.';
          this.syncView();
        });
      },
      error: () => {
        this.runInZone(() => {
          this.editErrorMessage = 'Falha ao atualizar plataforma.';
          this.syncView();
        });
      },
    });
  }

  askDelete(platform: Platform): void {
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
    const deletedId = this.platformToDelete.id;

    this.platformsService.delete(deletedId).subscribe({
      next: () => {
        this.runInZone(() => {
          this.platforms = this.platforms.filter((platform) => platform.id !== deletedId);
          this.page = {
            ...this.page,
            content: this.platforms,
            totalElements: Math.max(0, this.page.totalElements - 1),
          };
          this.platformToDelete = null;
          this.placeholderMessage = `${deletedName} excluída com sucesso.`;
          this.syncView();
        });
      },
      error: () => {
        this.runInZone(() => {
          this.placeholderMessage = `Falha ao excluir ${deletedName}.`;
          this.syncView();
        });
      },
    });
  }

  closePlaceholderMessage(): void {
    this.placeholderMessage = null;
  }

  onPriceInput(rawValue: string): void {
    const digitsOnly = rawValue.replace(/\D/g, '');
    const cents = digitsOnly.length > 0 ? Number.parseInt(digitsOnly, 10) : 0;
    const parsed = cents / 100;

    this.priceInputValue = this.formatMoneyInput(parsed);
    this.editForm.controls.price.markAsDirty();
    this.editForm.controls.price.setValue(parsed, { emitEvent: false });
  }

  onPriceBlur(): void {
    this.editForm.controls.price.markAsTouched();
    this.setPriceInputFromNumber(this.editForm.controls.price.value);
  }

  onPriceFocus(event: FocusEvent): void {
    const input = event.target as HTMLInputElement | null;
    if (!input) {
      return;
    }

    // Allow typing over the default value in one keystroke.
    input.select();
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

  billingCycleLabel(cycle: string): string {
    return this.billingCycleLabels[cycle as BillingCycle] ?? cycle;
  }

  serviceTypeLabel(type: string): string {
    return this.serviceTypeLabels[type as ServiceType] ?? type;
  }

  private loadPlatforms(page = 0, size = 20): void {
    this.deferStateUpdate(() => {
      this.isLoading = true;
      this.errorMessage = undefined;
      this.hasLoadedData = false;
    }, 0);

    this.platformsService.list(page, size).subscribe({
      next: (response: PlatformPageResponse) => {
        this.deferStateUpdate(() => {
          const list = [...response.content];
          this.platforms = list;
          this.page = {
            ...response,
            content: list,
          };
          this.isLoading = false;
          this.errorMessage = undefined;
          this.hasLoadedData = true;
        });
      },
      error: () => {
        this.deferStateUpdate(() => {
          this.errorMessage = 'Falha ao carregar plataformas.';
          this.isLoading = false;
          this.hasLoadedData = false;
        });
      },
    });
  }

  private runInZone(action: () => void): void {
    this.ngZone.run(action);
  }

  private syncView(): void {
    this.changeDetectorRef.markForCheck();
    this.changeDetectorRef.detectChanges();
  }

  private deferStateUpdate(action: () => void, delayMs = 50): void {
    window.setTimeout(() => {
      this.runInZone(() => {
        action();
        this.syncView();
      });
    }, delayMs);
  }

  private toPlatformRequest(
    value: {
      name: string;
      price: number;
      currency: string;
      url: string;
      serviceType: string;
      totalSlots: number;
      availableSlots: number;
      billingCycle: string;
      billingDateFull: string | null;
    },
    availableSlots: number,
  ): PlatformRequest {
    return {
      name: value.name,
      price: value.price,
      currency: value.currency as PlatformCurrency,
      url: value.url,
      serviceType: value.serviceType as PlatformServiceType,
      totalSlots: value.totalSlots,
      availableSlots,
      billingCycle: value.billingCycle as PlatformBillingCycle,
      billingDay: null,
    };
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

  private setPriceInputFromNumber(value: number): void {
    this.priceInputValue = this.formatMoneyInput(value);
  }

  private formatMoneyInput(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
}
