import { ChangeDetectorRef, NgZone } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { SettingsComponent } from './settings-component';
import { UsersService } from '../../core/services/users.service';
import { EmailSchedulesService } from '../../core/services/email-schedules.service';
import { AuthService } from '../../core/services/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { ThemeService } from '../../core/services/theme.service';

describe('SettingsComponent', () => {
  const createComponent = () => {
    const usersService = {
      list: jest.fn().mockReturnValue(of({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 })),
      create: jest.fn().mockReturnValue(of(void 0)),
      update: jest.fn().mockReturnValue(of(void 0)),
      delete: jest.fn().mockReturnValue(of(void 0)),
      updateDashboardEmailPreference: jest.fn().mockReturnValue(of(void 0)),
    } as unknown as UsersService;

    const emailSchedulesService = {
      getKpiSummarySchedule: jest.fn().mockReturnValue(
        of({
          scheduleKey: 'KPI_SUMMARY',
          enabled: false,
          timezone: 'America/Sao_Paulo',
          occurrences: [],
        }),
      ),
      updateKpiSummarySchedule: jest.fn().mockReturnValue(
        of({
          scheduleKey: 'KPI_SUMMARY',
          enabled: true,
          timezone: 'UTC',
          occurrences: [{ dayOfWeek: 1 as const, executionTime: '08:00' }],
        }),
      ),
    } as unknown as jest.Mocked<EmailSchedulesService>;

    const authService = {
      getSession: jest.fn().mockReturnValue({ profile: 'ADMIN' }),
    } as unknown as AuthService;

    const i18nService = {
      currentLanguage: 'pt-BR',
      setLanguage: jest.fn(),
    } as unknown as jest.Mocked<I18nService>;

    const themeService = {
      current: { mode: 'dark' as const, palette: 'default' as const },
      setTheme: jest.fn(),
    } as unknown as jest.Mocked<ThemeService>;

    const ngZone = {
      run: (callback: () => void) => callback(),
    } as NgZone;

    const cdr = {
      detectChanges: jest.fn(),
    } as unknown as ChangeDetectorRef;

    const component = new SettingsComponent(
      usersService,
      emailSchedulesService,
      authService,
      new FormBuilder(),
      i18nService,
      themeService,
      ngZone,
      cdr,
    );

    return { component, i18nService, themeService, emailSchedulesService };
  };

  it('saves visual settings using i18n and theme services', () => {
    const { component, i18nService, themeService } = createComponent();

    component.selectedLanguage = 'en-US';
    component.selectedThemeMode = 'light';
    component.selectedThemePalette = 'graphite';

    component.saveSystemSettings();

    expect(i18nService.setLanguage).toHaveBeenCalledWith('en-US');
    expect(themeService.setTheme).toHaveBeenCalledWith({ mode: 'light', palette: 'graphite' });
    expect(component.systemFeedback).toBe('Configurações visuais atualizadas com sucesso.');
  });

  it('blocks schedule save when validation fails', () => {
    const { component, emailSchedulesService } = createComponent();

    component.scheduleTimezone = 'Invalid/Timezone';
    component.scheduleOccurrences = [{ dayOfWeek: 1, executionTime: '08:00' }];

    component.saveKpiSummaryEmailSchedule();

    expect(component.scheduleValidationError).toBe('Selecione uma timezone válida da lista.');
    expect(emailSchedulesService.updateKpiSummarySchedule).not.toHaveBeenCalled();
  });

  it('saves schedule with sorted occurrences', () => {
    const { component, emailSchedulesService } = createComponent();

    component.scheduleEnabled = true;
    component.scheduleTimezone = 'UTC';
    component.scheduleOccurrences = [
      { dayOfWeek: 5, executionTime: '09:30' },
      { dayOfWeek: 1, executionTime: '14:00' },
      { dayOfWeek: 1, executionTime: '08:00' },
    ];

    component.saveKpiSummaryEmailSchedule();

    expect(emailSchedulesService.updateKpiSummarySchedule).toHaveBeenCalledWith({
      enabled: true,
      timezone: 'UTC',
      occurrences: [
        { dayOfWeek: 1, executionTime: '08:00' },
        { dayOfWeek: 1, executionTime: '14:00' },
        { dayOfWeek: 5, executionTime: '09:30' },
      ],
    });
    expect(component.scheduleSuccess).toBe('Agendamento do e-mail de KPIs salvo com sucesso.');
    expect(component.scheduleSaving).toBe(false);
  });
});
