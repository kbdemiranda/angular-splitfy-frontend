import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { finalize, timeout } from 'rxjs';
import { UsersService } from '../../core/services/users.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { AppLanguage, LANGUAGE_OPTIONS, LanguageOption } from '../../core/i18n/translations';
import { UserCreateRequest, UserResponse, UserUpdateRequest } from '../../shared/models/users.model';
import { ThemeMode, ThemePalette, ThemeService } from '../../core/services/theme.service';

interface ThemeModeOption {
  readonly value: ThemeMode;
  readonly label: string;
}

interface ThemePaletteOption {
  readonly value: ThemePalette;
  readonly label: string;
  readonly description: string;
  readonly preview: readonly [string, string, string];
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings-component.html',
  styleUrl: './settings-component.scss',
  standalone: false,
})
export class SettingsComponent implements OnInit {
  readonly languageOptions: readonly LanguageOption[] = LANGUAGE_OPTIONS;
  readonly themeModeOptions: readonly ThemeModeOption[] = [
    { value: 'dark', label: 'Escuro' },
    { value: 'light', label: 'Claro' },
  ];
  readonly themePaletteOptions: readonly ThemePaletteOption[] = [
    {
      value: 'default',
      label: 'Default',
      description: 'Azul/ciano clássico do Splitfy.',
      preview: ['#0ea5e9', '#22d3ee', '#0f172a'],
    },
    {
      value: 'dracula',
      label: 'Dracula',
      description: 'Violeta com contraste alto.',
      preview: ['#bd93f9', '#ff79c6', '#282a36'],
    },
    {
      value: 'indigo',
      label: 'Indigo',
      description: 'Indigo elegante com toque corporativo.',
      preview: ['#6366f1', '#818cf8', '#1f2a44'],
    },
    {
      value: 'emerald',
      label: 'Emerald',
      description: 'Verde moderno e limpo.',
      preview: ['#10b981', '#34d399', '#112b24'],
    },
    {
      value: 'sunset',
      label: 'Sunset',
      description: 'Laranja quente para destaque visual.',
      preview: ['#f97316', '#fb923c', '#2b1810'],
    },
    {
      value: 'graphite',
      label: 'Graphite',
      description: 'Cinza técnico com azul discreto.',
      preview: ['#64748b', '#94a3b8', '#111827'],
    },
  ];
  selectedLanguage: AppLanguage = 'pt-BR';
  selectedThemeMode: ThemeMode = 'dark';
  selectedThemePalette: ThemePalette = 'default';
  systemFeedback: string | null = null;
  users: UserResponse[] = [];
  usersLoading = false;
  usersLoaded = false;
  initialUsersLoaded = false;
  usersError: string | null = null;
  dashboardEmailError: string | null = null;
  dashboardEmailSuccess: string | null = null;
  dashboardEmailUpdatingUserId: number | string | null = null;
  dashboardEmailUpdatingValue: boolean | null = null;
  selectedUserToReplaceDashboardRecipient: UserResponse | null = null;
  dashboardEmailConflictMessage: string | null = null;
  private hasRetriedInitialLoad = false;
  isCreateModalOpen = false;
  isEditModalOpen = false;
  creatingUser = false;
  editingUser = false;
  deletingUser = false;
  createUserError: string | null = null;
  editUserError: string | null = null;
  selectedUserToEdit: UserResponse | null = null;
  selectedUserToDelete: UserResponse | null = null;
  readonly createUserForm: FormGroup<{
    name: FormControl<string>;
    email: FormControl<string>;
    password: FormControl<string>;
  }>;
  readonly editUserForm: FormGroup<{
    name: FormControl<string>;
    email: FormControl<string>;
    password: FormControl<string>;
  }>;

  constructor(
    private readonly usersService: UsersService,
    private readonly formBuilder: FormBuilder,
    private readonly i18nService: I18nService,
    private readonly themeService: ThemeService,
    private readonly ngZone: NgZone,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.createUserForm = this.formBuilder.group({
      name: this.formBuilder.nonNullable.control('', [Validators.required, Validators.minLength(3)]),
      email: this.formBuilder.nonNullable.control('', [Validators.required, Validators.email]),
      password: this.formBuilder.nonNullable.control('', [Validators.required, Validators.minLength(8)]),
    });
    this.editUserForm = this.formBuilder.group({
      name: this.formBuilder.nonNullable.control('', [Validators.required, Validators.minLength(3)]),
      email: this.formBuilder.nonNullable.control('', [Validators.required, Validators.email]),
      password: this.formBuilder.nonNullable.control('', [Validators.minLength(8)]),
    });
  }

  ngOnInit(): void {
    this.selectedLanguage = this.i18nService.currentLanguage;
    const theme = this.themeService.current;
    this.selectedThemeMode = theme.mode;
    this.selectedThemePalette = theme.palette;
    this.loadUsers();
  }

  saveSystemSettings(): void {
    this.i18nService.setLanguage(this.selectedLanguage);
    this.themeService.setTheme({
      mode: this.selectedThemeMode,
      palette: this.selectedThemePalette,
    });
    this.systemFeedback = 'Configurações visuais atualizadas com sucesso.';
  }

  selectPalette(palette: ThemePalette): void {
    this.selectedThemePalette = palette;
  }

  openCreateUserModal(): void {
    this.isCreateModalOpen = true;
    this.createUserError = null;
    this.createUserForm.reset({
      name: '',
      email: '',
      password: '',
    });
  }

  closeCreateUserModal(): void {
    this.isCreateModalOpen = false;
    this.createUserError = null;
  }

  submitCreateUser(): void {
    if (this.createUserForm.invalid || this.creatingUser) {
      this.createUserForm.markAllAsTouched();
      return;
    }

    const { name, email, password } = this.createUserForm.getRawValue();
    const payload: UserCreateRequest = {
      name: name.trim(),
      email: email.trim(),
      password,
      profileName: 'USER',
      enabled: true,
    };

    this.creatingUser = true;
    this.createUserError = null;
    this.usersService
      .create(payload)
      .pipe(finalize(() => (this.creatingUser = false)))
      .subscribe({
        next: () => {
          this.closeCreateUserModal();
          this.loadUsers();
        },
        error: () => {
          this.createUserError = 'Não foi possível criar o usuário.';
        },
      });
  }

  openEditUserModal(user: UserResponse): void {
    this.selectedUserToEdit = user;
    this.isEditModalOpen = true;
    this.editUserError = null;
    this.editUserForm.reset({
      name: user.name,
      email: user.email,
      password: '',
    });
  }

  closeEditUserModal(): void {
    this.isEditModalOpen = false;
    this.editUserError = null;
    this.selectedUserToEdit = null;
  }

  submitEditUser(): void {
    if (!this.selectedUserToEdit || this.editUserForm.invalid || this.editingUser) {
      this.editUserForm.markAllAsTouched();
      return;
    }

    const { name, email, password } = this.editUserForm.getRawValue();
    const payload: UserUpdateRequest = {
      name: name.trim(),
      email: email.trim(),
      profileName: this.selectedUserToEdit.profileName || 'USER',
      enabled: this.selectedUserToEdit.active,
    };

    const sanitizedPassword = password.trim();
    if (sanitizedPassword.length > 0) {
      payload.password = sanitizedPassword;
    }

    this.editingUser = true;
    this.editUserError = null;
    this.usersService
      .update(this.selectedUserToEdit.id, payload)
      .pipe(finalize(() => (this.editingUser = false)))
      .subscribe({
        next: () => {
          this.closeEditUserModal();
          this.loadUsers();
        },
        error: () => {
          this.editUserError = 'Não foi possível atualizar o usuário.';
        },
      });
  }

  askDeleteUser(user: UserResponse): void {
    this.selectedUserToDelete = user;
  }

  cancelDeleteUser(): void {
    this.selectedUserToDelete = null;
  }

  confirmDeleteUser(): void {
    if (!this.selectedUserToDelete || this.deletingUser) {
      return;
    }

    this.deletingUser = true;
    this.usersService
      .delete(this.selectedUserToDelete.id)
      .pipe(finalize(() => (this.deletingUser = false)))
      .subscribe({
        next: () => {
          this.selectedUserToDelete = null;
          this.loadUsers();
        },
        error: () => {
          this.usersError = 'Não foi possível excluir o usuário.';
        },
      });
  }

  toggleDashboardEmailRecipient(user: UserResponse): void {
    if (this.isDashboardEmailActionDisabled(user)) {
      return;
    }

    this.updateDashboardEmailPreference(user, !user.receivesDashboardEmail, false);
  }

  confirmReplaceDashboardRecipient(): void {
    if (!this.selectedUserToReplaceDashboardRecipient) {
      return;
    }

    this.updateDashboardEmailPreference(this.selectedUserToReplaceDashboardRecipient, true, true);
  }

  cancelReplaceDashboardRecipient(): void {
    this.selectedUserToReplaceDashboardRecipient = null;
    this.dashboardEmailConflictMessage = null;
  }

  isDashboardEmailActionDisabled(user: UserResponse): boolean {
    if (this.dashboardEmailUpdatingUserId !== null) {
      return true;
    }

    return !user.active && !user.receivesDashboardEmail;
  }

  dashboardEmailActionLabel(user: UserResponse): string {
    if (this.dashboardEmailUpdatingUserId === user.id) {
      return this.dashboardEmailUpdatingValue ? 'Marcando...' : 'Desmarcando...';
    }

    if (!user.active && !user.receivesDashboardEmail) {
      return 'Indisponível';
    }

    return user.receivesDashboardEmail ? 'Desmarcar' : 'Marcar';
  }

  retryLoadUsers(): void {
    this.hasRetriedInitialLoad = false;
    this.loadUsers();
  }

  private loadUsers(): void {
    this.runInAngular(() => {
      this.usersLoading = true;
      this.usersLoaded = false;
      this.usersError = null;
    });

    this.usersService
      .list()
      .pipe(timeout(12000))
      .subscribe({
        next: (response) => {
          this.runInAngular(() => {
            this.users = response.content;
            this.usersLoaded = true;
            this.usersLoading = false;
            this.initialUsersLoaded = true;
            this.hasRetriedInitialLoad = false;
          });
        },
        error: () => {
          this.runInAngular(() => {
            this.usersLoading = false;
          });

          if (!this.initialUsersLoaded && !this.hasRetriedInitialLoad) {
            this.hasRetriedInitialLoad = true;
            this.loadUsers();
            return;
          }

          this.runInAngular(() => {
            this.usersError = 'Não foi possível carregar os usuários.';
          });
        },
      });
  }

  private updateDashboardEmailPreference(user: UserResponse, receivesDashboardEmail: boolean, force: boolean): void {
    this.dashboardEmailError = null;
    this.dashboardEmailSuccess = null;
    this.dashboardEmailUpdatingUserId = user.id;
    this.dashboardEmailUpdatingValue = receivesDashboardEmail;

    this.usersService
      .updateDashboardEmailPreference(user.id, {
        receivesDashboardEmail,
        force,
      })
      .pipe(
        finalize(() => {
          this.dashboardEmailUpdatingUserId = null;
          this.dashboardEmailUpdatingValue = null;
        }),
      )
      .subscribe({
        next: () => {
          this.selectedUserToReplaceDashboardRecipient = null;
          this.dashboardEmailConflictMessage = null;
          this.dashboardEmailSuccess = receivesDashboardEmail
            ? `${user.name} agora recebe o e-mail agendado do dashboard.`
            : `${user.name} não recebe mais o e-mail agendado do dashboard.`;
          this.loadUsers();
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 409 && receivesDashboardEmail && !force) {
            this.selectedUserToReplaceDashboardRecipient = user;
            this.dashboardEmailConflictMessage =
              this.extractErrorMessage(error) ??
              'Já existe outro usuário configurado para receber o e-mail do dashboard.';
            return;
          }

          this.dashboardEmailError =
            this.extractErrorMessage(error) ??
            'Não foi possível atualizar o destinatário do e-mail agendado do dashboard.';
        },
      });
  }

  private extractErrorMessage(error: HttpErrorResponse): string | null {
    const payload = error.error;

    if (typeof payload === 'string' && payload.trim().length > 0) {
      return payload;
    }

    if (payload && typeof payload === 'object') {
      const source = payload as Record<string, unknown>;
      const message = source['message'] ?? source['error'] ?? source['detail'];
      if (typeof message === 'string' && message.trim().length > 0) {
        return message;
      }
    }

    return null;
  }

  private runInAngular(callback: () => void): void {
    this.ngZone.run(() => {
      callback();
      this.cdr.detectChanges();
    });
  }
}
