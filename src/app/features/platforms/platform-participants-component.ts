import { ChangeDetectorRef, Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Search, LucideIconData } from 'lucide-angular';
import { PlatformsService } from '../../core/services/platforms.service';
import { PlatformParticipantItem, PlatformParticipantsResponse } from '../../shared/models/platforms.model';

@Component({
  selector: 'app-platform-participants',
  templateUrl: './platform-participants-component.html',
  styleUrl: './platform-participants-component.scss',
  standalone: false,
})
export class PlatformParticipantsComponent implements OnInit {
  readonly searchIcon: LucideIconData = Search;

  platform: PlatformParticipantsResponse | null = null;
  isLoading = false;
  errorMessage: string | null = null;
  hasLoadedData = false;
  searchTerm = '';
  isSearchOpen = false;
  @ViewChild('searchInput') private readonly searchInputRef?: ElementRef<HTMLInputElement>;
  private readonly selectedParticipantIds = new Set<number>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly platformsService: PlatformsService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly ngZone: NgZone,
  ) {}

  ngOnInit(): void {
    const platformId = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(platformId)) {
      void this.router.navigate(['/platforms']);
      return;
    }

    this.runInZone(() => {
      this.isLoading = true;
      this.errorMessage = null;
      this.hasLoadedData = false;
      this.platform = null;
      this.syncView();
    });

    this.platformsService.participants(platformId).subscribe({
      next: (response) => {
        this.runInZone(() => {
          this.platform = response;
          this.isLoading = false;
          this.hasLoadedData = true;
          this.syncView();
        });
      },
      error: () => {
        this.runInZone(() => {
          this.isLoading = false;
          this.hasLoadedData = false;
          this.errorMessage = 'Não foi possível carregar os participantes da plataforma.';
          this.syncView();
        });
      },
    });
  }

  backToPlatforms(): void {
    void this.router.navigate(['/platforms']);
  }

  get filteredParticipants(): PlatformParticipantItem[] {
    const participants = this.platform?.participants ?? [];
    if (this.selectedParticipantIds.size === 0) {
      return participants;
    }

    return participants.filter((participant) => this.selectedParticipantIds.has(participant.subscriberId));
  }

  get selectedParticipants(): PlatformParticipantItem[] {
    const participants = this.platform?.participants ?? [];
    return participants.filter((participant) => this.selectedParticipantIds.has(participant.subscriberId));
  }

  get searchSuggestions(): PlatformParticipantItem[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (term.length < 2) {
      return [];
    }

    const participants = this.platform?.participants ?? [];
    return participants
      .filter(
        (participant) =>
          !this.selectedParticipantIds.has(participant.subscriberId) &&
          participant.subscriberName.toLowerCase().includes(term),
      )
      .slice(0, 6);
  }

  toggleSearch(): void {
    this.isSearchOpen = !this.isSearchOpen;

    if (this.isSearchOpen) {
      setTimeout(() => this.searchInputRef?.nativeElement.focus());
    } else {
      this.searchTerm = '';
    }
  }

  onSearchInput(value: string): void {
    this.searchTerm = value;
  }

  selectSuggestion(participant: PlatformParticipantItem): void {
    this.selectedParticipantIds.add(participant.subscriberId);
    this.searchTerm = '';
  }

  removeParticipantFilter(subscriberId: number): void {
    this.selectedParticipantIds.delete(subscriberId);
  }

  clearParticipantFilter(): void {
    this.selectedParticipantIds.clear();
    this.searchTerm = '';
  }

  formatCurrency(value: number, currency = 'BRL'): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);
  }

  formatDate(value: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(parsed);
  }

  private runInZone(action: () => void): void {
    this.ngZone.run(action);
  }

  private syncView(): void {
    this.changeDetectorRef.markForCheck();
    this.changeDetectorRef.detectChanges();
  }
}
