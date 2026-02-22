import { ChangeDetectorRef, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { Subscription } from 'rxjs';
import { I18nService } from './i18n.service';

@Pipe({
  name: 't',
  standalone: false,
  pure: false,
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private readonly subscription: Subscription;

  constructor(
    private readonly i18nService: I18nService,
    private readonly changeDetectorRef: ChangeDetectorRef,
  ) {
    this.subscription = this.i18nService.language$.subscribe(() => {
      this.changeDetectorRef.markForCheck();
    });
  }

  transform(key: string, params?: Record<string, string | number>): string {
    return this.i18nService.translate(key, params);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
