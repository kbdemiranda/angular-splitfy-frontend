import { ChangeDetectorRef, Component, HostListener, NgZone, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { finalize, timeout } from 'rxjs';
import { UsersService } from '../../core/services/users.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { AppLanguage, LANGUAGE_OPTIONS, LanguageOption } from '../../core/i18n/translations';
import { UserCreateRequest, UserResponse, UserUpdateRequest } from '../../shared/models/users.model';

type SettingsSectionKey = 'users' | 'system';

interface SettingsSection {
  readonly key: SettingsSectionKey;
  readonly anchor: string;
  readonly labelKey: string;
  readonly descriptionKey: string;
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings-component.html',
  styleUrl: './settings-component.scss',
  standalone: false,
})
export class SettingsComponent implements OnInit {
  readonly sections: SettingsSection[] = [
    {
      key: 'users',
      anchor: 'usuarios',
      labelKey: 'settings.section_users',
      descriptionKey: 'settings.section_users_desc',
    },
    {
      key: 'system',
      anchor: 'sistema',
      labelKey: 'settings.section_system',
      descriptionKey: 'settings.section_system_desc',
    },
  ];

  readonly languageOptions: readonly LanguageOption[] = LANGUAGE_OPTIONS;
  activeSection: SettingsSectionKey = 'users';
  selectedLanguage: AppLanguage = 'pt-BR';
  systemFeedback: string | null = null;
  users: UserResponse[] = [];
  usersLoading = false;
  usersLoaded = false;
  initialUsersLoaded = false;
  usersError: string | null = null;
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
    this.loadUsers();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (!this.usersLoaded) {
      return;
    }

    const threshold = 140;
    const currentSection = this.sections
      .filter((section) => {
        const target = document.getElementById(section.anchor);
        return !!target && target.getBoundingClientRect().top - threshold <= 0;
      })
      .at(-1);

    if (currentSection) {
      this.activeSection = currentSection.key;
    }
  }

  isSectionActive(section: SettingsSectionKey): boolean {
    return this.activeSection === section;
  }

  goToSection(event: Event, section: SettingsSection): void {
    event.preventDefault();

    const target = document.getElementById(section.anchor);
    if (!target) {
      return;
    }

    this.activeSection = section.key;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  saveSystemSettings(): void {
    this.i18nService.setLanguage(this.selectedLanguage);
    this.systemFeedback = 'settings.saved';
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

  private runInAngular(callback: () => void): void {
    this.ngZone.run(() => {
      callback();
      this.cdr.detectChanges();
    });
  }
}
