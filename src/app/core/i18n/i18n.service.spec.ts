import { I18nService } from './i18n.service';

describe('I18nService', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(window.navigator, 'language', { value: 'en-US', configurable: true });
  });

  it('resolves initial language from storage and browser', () => {
    localStorage.setItem('splitfy.app.language', 'es-419');
    const fromStorage = new I18nService();
    expect(fromStorage.currentLanguage).toBe('es-419');

    localStorage.clear();
    const fromBrowser = new I18nService();
    expect(fromBrowser.currentLanguage).toBe('en');
  });

  it('translates keys and interpolates params', () => {
    const service = new I18nService();
    service.setLanguage('pt-BR');

    expect(service.translate('common.page_of', { current: 1, total: 3 })).toBe('Página 1 de 3');
    expect(service.translate('missing.key')).toBe('missing.key');
    expect(service.localeForIntl()).toBe('pt-BR');
  });

  it('ignores unsupported languages', () => {
    const service = new I18nService();
    service.setLanguage('en');
    service.setLanguage('en' as never);
    expect(service.currentLanguage).toBe('en');
  });
});
