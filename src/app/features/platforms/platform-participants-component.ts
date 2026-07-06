import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlatformsService } from '../../core/services/platforms.service';
import { PlatformParticipantsResponse } from '../../shared/models/platforms.model';

@Component({
  selector: 'app-platform-participants',
  templateUrl: './platform-participants-component.html',
  styleUrl: './platform-participants-component.scss',
  standalone: false,
})
export class PlatformParticipantsComponent implements OnInit {
  platform: PlatformParticipantsResponse | null = null;
  isLoading = false;
  errorMessage: string | null = null;
  hasLoadedData = false;

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
