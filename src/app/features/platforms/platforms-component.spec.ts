import { ChangeDetectorRef, NgZone } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { PlatformsService } from '../../core/services/platforms.service';
import { PlatformsComponent } from './platforms-component';
import { PlatformResponse } from '../../shared/models/platforms.model';

describe('PlatformsComponent', () => {
  const basePlatform: PlatformResponse = {
    id: 1,
    name: 'Netflix',
    price: 39.9,
    currency: 'BRL',
    url: 'https://netflix.com',
    serviceType: 'Video Streaming',
    totalSlots: 4,
    availableSlots: 2,
    billingCycle: 'MONTHLY',
    billingDay: null,
  };

  const createComponent = () => {
    const platformsService = {
      list: jest.fn().mockReturnValue(of({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 })),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<PlatformsService>;

    const cdr = {
      markForCheck: jest.fn(),
      detectChanges: jest.fn(),
    } as unknown as ChangeDetectorRef;

    const ngZone = {
      run: (callback: () => void) => callback(),
    } as NgZone;

    const component = new PlatformsComponent(new FormBuilder(), platformsService, cdr, ngZone);

    return { component, platformsService, cdr };
  };

  it('returns currency prefix based on selected currency', () => {
    const { component } = createComponent();

    component.editForm.controls.currency.setValue('USD');
    expect(component.currencyPrefix).toBe('$');

    component.editForm.controls.currency.setValue('EUR');
    expect(component.currencyPrefix).toBe('EUR');

    component.editForm.controls.currency.setValue('BRL');
    expect(component.currencyPrefix).toBe('R$');
  });

  it('prepares form in create mode with available slots disabled', () => {
    const { component } = createComponent();

    component.openCreate();

    expect(component.isCreateMode).toBe(true);
    expect(component.editForm.controls.availableSlots.disabled).toBe(true);
    expect(component.editForm.controls.billingCycle.value).toBe('MONTHLY');
    expect(component.editForm.controls.billingDateFull.value).toBeNull();
  });

  it('shows validation error when available slots exceed total slots', () => {
    const { component, platformsService } = createComponent();

    component.openEdit(basePlatform);
    component.editForm.patchValue({
      totalSlots: 2,
      availableSlots: 5,
    });

    component.saveEdit();

    expect(component.editErrorMessage).toBe('Vagas disponíveis não pode ser maior que o total de vagas.');
    expect(platformsService.update).not.toHaveBeenCalled();
  });

  it('creates a new platform and updates local state', () => {
    const { component, platformsService } = createComponent();

    const created: PlatformResponse = {
      ...basePlatform,
      id: 99,
      name: 'Spotify',
      availableSlots: 3,
    };

    (platformsService.create as jest.Mock).mockReturnValue(of(created));
    component.page = { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 };

    component.openCreate();
    component.editForm.patchValue({
      name: 'Spotify',
      price: 29.9,
      currency: 'BRL',
      url: 'https://spotify.com',
      serviceType: 'Music Streaming',
      totalSlots: 3,
      billingCycle: 'MONTHLY',
      billingDateFull: null,
    });

    component.saveEdit();

    expect(platformsService.create).toHaveBeenCalledTimes(1);
    expect(component.platforms).toEqual([created]);
    expect(component.placeholderMessage).toBe('Plataforma criada com sucesso.');
    expect(component.editingPlatformId).toBeNull();
  });

  it('updates an existing platform in edit mode', () => {
    const { component, platformsService } = createComponent();
    const updated: PlatformResponse = { ...basePlatform, name: 'Netflix Premium', availableSlots: 1 };
    (platformsService.update as jest.Mock).mockReturnValue(of(updated));

    component.platforms = [basePlatform];
    component.page = { content: [basePlatform], page: 0, size: 20, totalElements: 1, totalPages: 1 };
    component.openEdit(basePlatform);
    component.editForm.patchValue({ name: 'Netflix Premium', availableSlots: 1 });

    component.saveEdit();

    expect(platformsService.update).toHaveBeenCalledWith(1, expect.objectContaining({ name: 'Netflix Premium' }));
    expect(component.platforms[0].name).toBe('Netflix Premium');
    expect(component.placeholderMessage).toBe('Plataforma atualizada com sucesso.');
  });

  it('handles update and create errors', () => {
    const { component, platformsService } = createComponent();
    (platformsService.update as jest.Mock).mockReturnValue(throwError(() => new Error('boom')));
    (platformsService.create as jest.Mock).mockReturnValue(throwError(() => new Error('boom')));

    component.openEdit(basePlatform);
    component.saveEdit();
    expect(component.editErrorMessage).toBe('Falha ao atualizar plataforma.');

    component.openCreate();
    component.editForm.patchValue({
      name: 'X',
      price: 10,
      currency: 'BRL',
      url: 'https://x.com',
      serviceType: 'Software',
      totalSlots: 1,
      billingCycle: 'MONTHLY',
      billingDateFull: null,
    });
    component.saveEdit();
    expect(component.editErrorMessage).toBe('Falha ao criar plataforma.');
  });

  it('deletes platform and handles delete error', () => {
    const { component, platformsService } = createComponent();
    (platformsService.delete as jest.Mock)
      .mockReturnValueOnce(of(void 0))
      .mockReturnValueOnce(throwError(() => new Error('boom')));

    component.platforms = [basePlatform];
    component.page = { content: [basePlatform], page: 0, size: 20, totalElements: 1, totalPages: 1 };
    component.askDelete(basePlatform);
    component.confirmDelete();
    expect(component.platforms).toEqual([]);
    expect(component.placeholderMessage).toContain('excluída com sucesso');

    component.platforms = [basePlatform];
    component.page = { content: [basePlatform], page: 0, size: 20, totalElements: 1, totalPages: 1 };
    component.askDelete(basePlatform);
    component.confirmDelete();
    expect(component.placeholderMessage).toContain('Falha ao excluir');
  });

  it('formats money and billing day previews', () => {
    const { component } = createComponent();
    component.openCreate();

    component.onPriceInput('12345');
    expect(component.editForm.controls.price.value).toBe(123.45);
    expect(component.formattedPricePreview).toContain('R$');

    component.editForm.controls.billingCycle.setValue('ANNUAL');
    component.editForm.controls.billingDateFull.setValue('2026-05-20');
    expect(component.billingDayPreview).toBe('20/05');
    expect(component.backendBillingDayPreview).toBe('--05-20');
    expect(component.formatBillingDayForDisplay('--05-20')).toBe('20/05');
    expect(component.formatBillingDayForDisplay('bad')).toBe('-');
  });

  it('handles details/menu helpers and labels', () => {
    const { component } = createComponent();
    const evt = { stopPropagation: jest.fn() } as unknown as MouseEvent;

    component.toggleMenu(1, evt);
    expect(component.openMenuPlatformId).toBe(1);
    component.onDocumentClick();
    expect(component.openMenuPlatformId).toBeNull();

    component.openDetails(basePlatform);
    expect(component.viewingPlatform?.id).toBe(1);
    component.openEditFromDetails();
    expect(component.editingPlatformId).toBe(1);
    component.closeDetails();
    component.askDeleteFromDetails();

    expect(component.billingCycleLabel('MONTHLY')).toBe('Mensal');
    expect(component.serviceTypeLabel('Software')).toBe('Software');
  });

  it('covers annual billing picker and form guard branches', () => {
    const { component } = createComponent();
    const input = document.createElement('input') as HTMLInputElement & { showPicker?: () => void };

    component.openBillingDatePicker(input);
    component.editForm.controls.billingCycle.setValue('ANNUAL');
    component.openBillingDatePicker(input);

    const pickerSpy = jest.fn();
    input.showPicker = pickerSpy;
    component.openBillingDatePicker(input);
    expect(pickerSpy).toHaveBeenCalled();

    component.editingPlatformId = null;
    component.saveEdit();
    expect(component.editForm.touched).toBe(true);
  });

  it('covers misc helpers and guard branches', () => {
    const { component } = createComponent();
    component.closePlaceholderMessage();
    component.cancelDelete();
    component.cancelEdit();
    component.closeDetails();

    expect(component.billingDayPreview).toBe('--/--');
    expect(component.backendBillingDayPreview).toBe('--MM-DD');
    expect(component.calendarMinDate).toMatch(/-01-01$/);
    expect(component.calendarMaxDate).toMatch(/-12-31$/);

    component.editForm.controls.billingDateFull.setValue('invalid');
    expect(component.billingDayPreview).toBe('--/--');
    expect(component.backendBillingDayPreview).toBe('--MM-DD');

    component.onPriceBlur();
    component.onPriceFocus({ target: null } as unknown as FocusEvent);
  });

  it('covers private billing/date helpers', () => {
    const { component } = createComponent();
    const anyComponent = component as any;

    expect(anyComponent.fromBackendBillingDate(null)).toBeNull();
    expect(anyComponent.fromBackendBillingDate('bad')).toBeNull();
    expect(anyComponent.fromBackendBillingDate('--05-10')).toMatch(/-05-10$/);

    expect(anyComponent.toBackendBillingDate('bad')).toBe('--01-01');
    expect(anyComponent.toBackendBillingDate('2026-06-07')).toBe('--06-07');
    expect(anyComponent.currentDateIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    expect(anyComponent.formatMoneyInput(10.5)).toContain('10');
    anyComponent.setPriceInputFromNumber(42.1);
    expect(component.priceInputValue.length).toBeGreaterThan(0);
  });

  it('loads platforms on init and handles load error', () => {
    jest.useFakeTimers();
    const { component, platformsService } = createComponent();
    (platformsService.list as jest.Mock).mockReturnValueOnce(
      of({ content: [basePlatform], page: 0, size: 20, totalElements: 1, totalPages: 1 }),
    );

    component.ngOnInit();
    jest.runAllTimers();
    expect(component.hasLoadedData).toBe(true);
    expect(component.platforms).toHaveLength(1);

    (platformsService.list as jest.Mock).mockReturnValueOnce(throwError(() => new Error('boom')));
    component.ngOnInit();
    jest.runAllTimers();
    expect(component.errorMessage).toContain('Falha ao carregar plataformas.');
    jest.useRealTimers();
  });
});
