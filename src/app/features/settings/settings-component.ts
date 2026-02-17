import { Component } from '@angular/core';

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
export class SettingsComponent {
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

  selectSection(section: SettingsSectionKey): void {
    this.activeSection = section;
  }

  isSectionActive(section: SettingsSectionKey): boolean {
    return this.activeSection === section;
  }
}
