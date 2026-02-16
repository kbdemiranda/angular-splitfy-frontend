import { Component, HostListener } from '@angular/core';
import { Cloud, LucideIconData } from 'lucide-angular';

interface PlatformCard {
  id: number;
  name: string;
  totalPrice: number;
  totalSlots: number;
  availableSlots: number;
}

@Component({
  selector: 'app-platforms',
  templateUrl: './platforms-component.html',
  styleUrl: './platforms-component.scss',
  standalone: false,
})
export class PlatformsComponent {
  readonly cloudIcon: LucideIconData = Cloud;

  platforms: PlatformCard[] = [
    {
      id: 1,
      name: 'Netflix',
      totalPrice: 21.9,
      totalSlots: 6,
      availableSlots: 4,
    },
    {
      id: 2,
      name: 'Spotify',
      totalPrice: 34.9,
      totalSlots: 6,
      availableSlots: 2,
    },
    {
      id: 3,
      name: 'YouTube Premium',
      totalPrice: 41.9,
      totalSlots: 5,
      availableSlots: 1,
    },
  ];

  openMenuPlatformId: number | null = null;
  platformToDelete: PlatformCard | null = null;
  placeholderMessage: string | null = null;

  @HostListener('document:click')
  onDocumentClick(): void {
    this.openMenuPlatformId = null;
  }

  toggleMenu(platformId: number, event: MouseEvent): void {
    event.stopPropagation();

    this.openMenuPlatformId = this.openMenuPlatformId === platformId ? null : platformId;
  }

  openDetails(platform: PlatformCard): void {
    this.placeholderMessage = `Detalhes de ${platform.name} será implementado em seguida.`;
    this.openMenuPlatformId = null;
  }

  openEdit(platform: PlatformCard): void {
    this.placeholderMessage = `Edição de ${platform.name} será implementada em seguida.`;
    this.openMenuPlatformId = null;
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
}
