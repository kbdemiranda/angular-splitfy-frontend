import { ChangeDetectorRef, NgZone } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
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
});
