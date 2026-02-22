import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { ProfilesService } from '../../core/services/profiles.service';
import { UsersService } from '../../core/services/users.service';
import { ProfileCreateRequest, ProfileResponse, ProfileUpdateRequest } from '../../shared/models/profiles.model';
import { UserCreateRequest, UserResponse, UserUpdateRequest } from '../../shared/models/users.model';

type SettingsSectionKey = 'users' | 'profiles' | 'system';

interface SettingsSection {
  readonly key: SettingsSectionKey;
  readonly label: string;
  readonly description: string;
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
      label: 'Usuários',
      description: 'CRUD de usuários da aplicação.',
    },
    {
      key: 'profiles',
      label: 'Profiles',
      description: 'CRUD de perfis e níveis de acesso.',
    },
    {
      key: 'system',
      label: 'Configurações do Sistema',
      description: 'Idioma, temas e preferências globais.',
    },
  ];

  activeSection: SettingsSectionKey = 'users';
  users: UserResponse[] = [];
  usersLoading = false;
  usersLoaded = false;
  usersError: string | null = null;
  profiles: ProfileResponse[] = [];
  loadingProfiles = false;
  profilesLoaded = false;
  profilesError: string | null = null;
  profileLoadError: string | null = null;
  isCreateModalOpen = false;
  isEditModalOpen = false;
  isCreateProfileModalOpen = false;
  isEditProfileModalOpen = false;
  creatingUser = false;
  editingUser = false;
  deletingUser = false;
  creatingProfile = false;
  editingProfile = false;
  deletingProfile = false;
  createUserError: string | null = null;
  editUserError: string | null = null;
  createProfileError: string | null = null;
  editProfileError: string | null = null;
  selectedUserToEdit: UserResponse | null = null;
  selectedUserToDelete: UserResponse | null = null;
  selectedProfileToEdit: ProfileResponse | null = null;
  selectedProfileToDelete: ProfileResponse | null = null;
  readonly createUserForm: FormGroup<{
    name: FormControl<string>;
    email: FormControl<string>;
    password: FormControl<string>;
    profileName: FormControl<string>;
  }>;
  readonly editUserForm: FormGroup<{
    name: FormControl<string>;
    email: FormControl<string>;
    password: FormControl<string>;
    profileName: FormControl<string>;
  }>;
  readonly createProfileForm: FormGroup<{
    name: FormControl<string>;
  }>;
  readonly editProfileForm: FormGroup<{
    name: FormControl<string>;
  }>;

  constructor(
    private readonly usersService: UsersService,
    private readonly profilesService: ProfilesService,
    private readonly formBuilder: FormBuilder,
  ) {
    this.createUserForm = this.formBuilder.group({
      name: this.formBuilder.nonNullable.control('', [Validators.required, Validators.minLength(3)]),
      email: this.formBuilder.nonNullable.control('', [Validators.required, Validators.email]),
      password: this.formBuilder.nonNullable.control('', [Validators.required, Validators.minLength(8)]),
      profileName: this.formBuilder.nonNullable.control('', [Validators.required]),
    });
    this.editUserForm = this.formBuilder.group({
      name: this.formBuilder.nonNullable.control('', [Validators.required, Validators.minLength(3)]),
      email: this.formBuilder.nonNullable.control('', [Validators.required, Validators.email]),
      password: this.formBuilder.nonNullable.control('', [Validators.minLength(8)]),
      profileName: this.formBuilder.nonNullable.control('', [Validators.required]),
    });
    this.createProfileForm = this.formBuilder.group({
      name: this.formBuilder.nonNullable.control('', [Validators.required, Validators.minLength(2)]),
    });
    this.editProfileForm = this.formBuilder.group({
      name: this.formBuilder.nonNullable.control('', [Validators.required, Validators.minLength(2)]),
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  selectSection(section: SettingsSectionKey): void {
    this.activeSection = section;

    if (section === 'users' && this.users.length === 0 && !this.usersLoading) {
      this.loadUsers();
    }

    if (section === 'profiles' && this.profiles.length === 0 && !this.loadingProfiles) {
      this.loadProfiles();
    }
  }

  isSectionActive(section: SettingsSectionKey): boolean {
    return this.activeSection === section;
  }

  openCreateUserModal(): void {
    this.isCreateModalOpen = true;
    this.createUserError = null;
    this.createUserForm.reset({
      name: '',
      email: '',
      password: '',
      profileName: '',
    });
    this.loadProfiles();
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

    const { name, email, password, profileName } = this.createUserForm.getRawValue();
    const payload: UserCreateRequest = {
      name: name.trim(),
      email: email.trim(),
      password,
      profileName,
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
      profileName: user.profileName,
    });
    this.loadProfiles();
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

    const { name, email, password, profileName } = this.editUserForm.getRawValue();
    const payload: UserUpdateRequest = {
      name: name.trim(),
      email: email.trim(),
      profileName,
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

  openCreateProfileModal(): void {
    this.isCreateProfileModalOpen = true;
    this.createProfileError = null;
    this.createProfileForm.reset({
      name: '',
    });
  }

  closeCreateProfileModal(): void {
    this.isCreateProfileModalOpen = false;
    this.createProfileError = null;
  }

  submitCreateProfile(): void {
    if (this.createProfileForm.invalid || this.creatingProfile) {
      this.createProfileForm.markAllAsTouched();
      return;
    }

    const payload: ProfileCreateRequest = {
      name: this.createProfileForm.controls.name.value.trim(),
    };

    this.creatingProfile = true;
    this.createProfileError = null;
    this.profilesService
      .create(payload)
      .pipe(finalize(() => (this.creatingProfile = false)))
      .subscribe({
        next: () => {
          this.closeCreateProfileModal();
          this.loadProfiles();
        },
        error: () => {
          this.createProfileError = 'Não foi possível criar o profile.';
        },
      });
  }

  openEditProfileModal(profile: ProfileResponse): void {
    this.selectedProfileToEdit = profile;
    this.isEditProfileModalOpen = true;
    this.editProfileError = null;
    this.editProfileForm.reset({
      name: profile.name,
    });
  }

  closeEditProfileModal(): void {
    this.isEditProfileModalOpen = false;
    this.editProfileError = null;
    this.selectedProfileToEdit = null;
  }

  submitEditProfile(): void {
    if (!this.selectedProfileToEdit || this.editProfileForm.invalid || this.editingProfile) {
      this.editProfileForm.markAllAsTouched();
      return;
    }

    const payload: ProfileUpdateRequest = {
      name: this.editProfileForm.controls.name.value.trim(),
    };

    this.editingProfile = true;
    this.editProfileError = null;
    this.profilesService
      .update(this.selectedProfileToEdit.id, payload)
      .pipe(finalize(() => (this.editingProfile = false)))
      .subscribe({
        next: () => {
          this.closeEditProfileModal();
          this.loadProfiles();
        },
        error: () => {
          this.editProfileError = 'Não foi possível atualizar o profile.';
        },
      });
  }

  askDeleteProfile(profile: ProfileResponse): void {
    this.selectedProfileToDelete = profile;
  }

  cancelDeleteProfile(): void {
    this.selectedProfileToDelete = null;
  }

  confirmDeleteProfile(): void {
    if (!this.selectedProfileToDelete || this.deletingProfile) {
      return;
    }

    this.deletingProfile = true;
    this.profilesService
      .delete(this.selectedProfileToDelete.id)
      .pipe(finalize(() => (this.deletingProfile = false)))
      .subscribe({
        next: () => {
          this.selectedProfileToDelete = null;
          this.loadProfiles();
        },
        error: () => {
          this.profilesError = 'Não foi possível excluir o profile.';
        },
      });
  }

  private loadUsers(): void {
    this.usersLoading = true;
    this.usersLoaded = false;
    this.usersError = null;

    this.usersService
      .list()
      .pipe(finalize(() => (this.usersLoading = false)))
      .subscribe({
        next: (response) => {
          this.users = response.content;
          this.usersLoaded = true;
        },
        error: () => {
          this.usersError = 'Não foi possível carregar os usuários.';
        },
      });
  }

  private loadProfiles(): void {
    if (this.loadingProfiles) {
      return;
    }

    this.loadingProfiles = true;
    this.profilesLoaded = false;
    this.profilesError = null;
    this.profileLoadError = null;
    this.profilesService
      .list()
      .pipe(finalize(() => (this.loadingProfiles = false)))
      .subscribe({
        next: (profiles) => {
          this.profiles = profiles;
          this.profilesLoaded = true;
        },
        error: () => {
          this.profilesError = 'Não foi possível carregar os profiles.';
          this.profileLoadError = 'Não foi possível carregar os perfis.';
        },
      });
  }
}
