import { ChangeDetectorRef } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TranslatePipe } from './translate.pipe';
import { I18nService } from './i18n.service';

describe('TranslatePipe', () => {
  it('delegates translations and marks for check on language change', () => {
    const language$ = new BehaviorSubject<'pt-BR' | 'en' | 'es-419'>('pt-BR');
    const i18nService = {
      language$: language$.asObservable(),
      translate: jest.fn().mockReturnValue('texto'),
    } as unknown as I18nService;
    const cdr = { markForCheck: jest.fn() } as unknown as ChangeDetectorRef;

    const pipe = new TranslatePipe(i18nService, cdr);

    expect(pipe.transform('common.save')).toBe('texto');
    expect(i18nService.translate).toHaveBeenCalledWith('common.save', undefined);

    language$.next('en');
    expect(cdr.markForCheck).toHaveBeenCalled();

    pipe.ngOnDestroy();
  });
});
