import { ChangeDetectorRef, NgZone } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';
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
    } as unknown as jest.Mocked<UsersService>;

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
    } as unknown as jest.Mocked<AuthService>;

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

    return { component, i18nService, themeService, emailSchedulesService, usersService, authService };
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

  it('loads users and schedule on init for admin', () => {
    const { component, usersService, emailSchedulesService } = createComponent();
    (usersService.list as jest.Mock).mockReturnValue(
      of({
        content: [{ id: 1, name: 'Admin', email: 'a@a.com', profileName: 'ADMIN', profile: 'ADMIN', active: true, receivesDashboardEmail: false }],
        page: 0,
        size: 20,
        totalElements: 1,
        totalPages: 1,
      }),
    );
    component.ngOnInit();

    expect(usersService.list).toHaveBeenCalled();
    expect(emailSchedulesService.getKpiSummarySchedule).toHaveBeenCalled();
    expect(component.usersLoaded).toBe(true);
    expect(component.scheduleLoaded).toBe(true);
  });

  it('handles create user success and error', () => {
    const { component, usersService } = createComponent();

    component.openCreateUserModal();
    component.createUserForm.patchValue({ name: 'Novo Usuário', email: 'novo@a.com', password: '12345678' });
    component.submitCreateUser();
    expect(usersService.create).toHaveBeenCalled();
    expect(component.isCreateModalOpen).toBe(false);

    (usersService.create as jest.Mock).mockReturnValue(throwError(() => new Error('boom')));
    component.openCreateUserModal();
    component.createUserForm.patchValue({ name: 'Novo Usuário', email: 'novo@a.com', password: '12345678' });
    component.submitCreateUser();
    expect(component.createUserError).toBe('Não foi possível criar o usuário.');
  });

  it('handles edit and delete user flows', () => {
    const { component, usersService } = createComponent();
    const user = {
      id: 2,
      name: 'Bob',
      email: 'bob@a.com',
      profileName: 'USER',
      profile: 'USER',
      active: true,
      receivesDashboardEmail: false,
    };

    component.openEditUserModal(user);
    component.editUserForm.patchValue({ name: ' Bob ', email: 'bob@a.com', password: '12345678' });
    component.submitEditUser();
    expect(usersService.update).toHaveBeenCalledWith(2, expect.objectContaining({ name: 'Bob', email: 'bob@a.com', password: '12345678' }));

    (usersService.update as jest.Mock).mockReturnValue(throwError(() => new Error('boom')));
    component.openEditUserModal(user);
    component.editUserForm.patchValue({ name: 'Bob', email: 'bob@a.com', password: '' });
    component.submitEditUser();
    expect(component.editUserError).toBe('Não foi possível atualizar o usuário.');

    component.askDeleteUser(user);
    component.confirmDeleteUser();
    expect(usersService.delete).toHaveBeenCalledWith(2);
    (usersService.delete as jest.Mock).mockReturnValue(throwError(() => new Error('boom')));
    component.askDeleteUser(user);
    component.confirmDeleteUser();
    expect(component.usersError).toBe('Não foi possível excluir o usuário.');
  });

  it('handles dashboard email recipient conflict and success states', () => {
    const { component, usersService } = createComponent();
    const user = {
      id: 3,
      name: 'Carol',
      email: 'carol@a.com',
      profileName: 'USER',
      profile: 'USER',
      active: true,
      receivesDashboardEmail: false,
    };

    (usersService.updateDashboardEmailPreference as jest.Mock).mockReturnValueOnce(
      throwError(() => ({ status: 409, error: { message: 'Conflito' } })),
    );
    component.toggleDashboardEmailRecipient(user);
    expect(component.selectedUserToReplaceDashboardRecipient?.id).toBe(3);
    expect(component.dashboardEmailConflictMessage).toContain('Conflito');

    (usersService.updateDashboardEmailPreference as jest.Mock).mockReturnValueOnce(of(void 0));
    component.confirmReplaceDashboardRecipient();
    expect(component.dashboardEmailSuccess).toContain('agora recebe');
    expect(component.selectedUserToReplaceDashboardRecipient).toBeNull();
  });

  it('validates schedule edge cases', () => {
    const { component } = createComponent();
    component.scheduleTimezone = '';
    component.scheduleOccurrences = [{ dayOfWeek: 1, executionTime: '08:00' }];
    component.saveKpiSummaryEmailSchedule();
    expect(component.scheduleValidationError).toContain('timezone');

    component.scheduleTimezone = 'UTC';
    component.scheduleOccurrences = [];
    component.saveKpiSummaryEmailSchedule();
    expect(component.scheduleValidationError).toContain('pelo menos um horário');

    component.scheduleOccurrences = [
      { dayOfWeek: 1, executionTime: '08:00' },
      { dayOfWeek: 1, executionTime: '08:00' },
    ];
    component.saveKpiSummaryEmailSchedule();
    expect(component.scheduleValidationError).toContain('duplicadas');
  });

  it('handles user list load retry and failure state', () => {
    const { component, usersService, authService } = createComponent();
    (authService.getSession as jest.Mock).mockReturnValue({ profile: 'USER' });
    (usersService.list as jest.Mock)
      .mockReturnValueOnce(throwError(() => new Error('first')))
      .mockReturnValueOnce(throwError(() => new Error('second')));

    component.ngOnInit();
    expect(component.usersError).toBe('Não foi possível carregar os usuários.');
    expect(component.usersLoading).toBe(false);
  });

  it('covers dashboard email action labels and disable states', () => {
    const { component } = createComponent();
    const inactiveUser = {
      id: 4,
      name: 'Inactive',
      email: 'i@a.com',
      profileName: 'USER',
      profile: 'USER',
      active: false,
      receivesDashboardEmail: false,
    };

    expect(component.isDashboardEmailActionDisabled(inactiveUser)).toBe(true);
    expect(component.dashboardEmailActionLabel(inactiveUser)).toBe('Indisponível');

    component.dashboardEmailUpdatingUserId = 4;
    component.dashboardEmailUpdatingValue = true;
    expect(component.dashboardEmailActionLabel(inactiveUser)).toBe('Marcando...');
  });

  it('covers modal and schedule utility branches', () => {
    const { component, authService, emailSchedulesService } = createComponent();
    component.addScheduleOccurrence();
    expect(component.hasScheduleOccurrences).toBe(true);
    component.onScheduleOccurrenceChange();
    component.removeScheduleOccurrence(0);
    expect(component.hasScheduleOccurrences).toBe(false);

    component.openCreateUserModal();
    expect(component.isCreateModalOpen).toBe(true);
    component.closeCreateUserModal();
    expect(component.isCreateModalOpen).toBe(false);

    component.cancelReplaceDashboardRecipient();
    expect(component.selectedUserToReplaceDashboardRecipient).toBeNull();

    (authService.getSession as jest.Mock).mockReturnValue({ profile: 'USER' });
    component.retryLoadKpiSummaryEmailSchedule();
    expect(emailSchedulesService.getKpiSummarySchedule).not.toHaveBeenCalled();
  });

  it('covers update dashboard email hard error branch', () => {
    const { component, usersService } = createComponent();
    const user = {
      id: 5,
      name: 'Err',
      email: 'err@a.com',
      profileName: 'USER',
      profile: 'USER',
      active: true,
      receivesDashboardEmail: false,
    };
    (usersService.updateDashboardEmailPreference as jest.Mock).mockReturnValueOnce(
      throwError(() => ({ status: 500, error: { message: 'Falha geral' } })),
    );

    component.toggleDashboardEmailRecipient(user);
    expect(component.dashboardEmailError).toContain('Falha geral');
  });

  it('covers private helpers for errors, sorting and day validation', () => {
    const { component } = createComponent();
    const anyComponent = component as any;

    expect(anyComponent.extractErrorMessage({ error: 'msg' })).toBe('msg');
    expect(anyComponent.extractErrorMessage({ error: { message: 'm1' } })).toBe('m1');
    expect(anyComponent.extractErrorMessage({ error: { error: 'm2' } })).toBe('m2');
    expect(anyComponent.extractErrorMessage({ error: { detail: 'm3' } })).toBe('m3');
    expect(anyComponent.extractErrorMessage({ error: {} })).toBeNull();

    expect(anyComponent.isValidDayOfWeek(1)).toBe(true);
    expect(anyComponent.isValidDayOfWeek(7)).toBe(true);
    expect(anyComponent.isValidDayOfWeek(0)).toBe(false);
    expect(anyComponent.isValidDayOfWeek(8)).toBe(false);

    const sorted = anyComponent.sortOccurrences([
      { dayOfWeek: 5, executionTime: '10:00' },
      { dayOfWeek: 1, executionTime: '12:00' },
      { dayOfWeek: 1, executionTime: '08:00' },
    ]);
    expect(sorted).toEqual([
      { dayOfWeek: 1, executionTime: '08:00' },
      { dayOfWeek: 1, executionTime: '12:00' },
      { dayOfWeek: 5, executionTime: '10:00' },
    ]);

    component.scheduleTimezone = 'UTC';
    component.scheduleOccurrences = [{ dayOfWeek: 0 as never, executionTime: '08:00' }];
    expect(anyComponent.validateSchedule()).toContain('dia da semana válido');
    component.scheduleOccurrences = [{ dayOfWeek: 1, executionTime: '99:00' }];
    expect(anyComponent.validateSchedule()).toContain('HH:mm');
  });

  it('covers additional dashboard action labels and valid schedule branch', () => {
    const { component } = createComponent();
    const user = {
      id: 7,
      name: 'U',
      email: 'u@a.com',
      profileName: 'USER',
      profile: 'USER',
      active: true,
      receivesDashboardEmail: true,
    };

    component.dashboardEmailUpdatingUserId = 7;
    component.dashboardEmailUpdatingValue = false;
    expect(component.dashboardEmailActionLabel(user)).toBe('Desmarcando...');
    component.dashboardEmailUpdatingUserId = null;
    component.dashboardEmailUpdatingValue = null;
    expect(component.dashboardEmailActionLabel(user)).toBe('Desmarcar');

    component.scheduleTimezone = 'UTC';
    component.scheduleOccurrences = [{ dayOfWeek: 1, executionTime: '08:00' }];
    expect((component as any).validateSchedule()).toBeNull();
  });
});
