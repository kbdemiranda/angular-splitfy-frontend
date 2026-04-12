import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.dataset.themeMode = '';
    document.documentElement.dataset.themePalette = '';
    service = new ThemeService();
  });

  it('returns fallback theme when storage is empty or invalid', () => {
    expect(service.current).toEqual({ mode: 'dark', palette: 'default' });

    localStorage.setItem('splitfy.app.theme', '{bad-json');
    expect(service.current).toEqual({ mode: 'dark', palette: 'default' });
  });

  it('applies and persists theme', () => {
    service.setTheme({ mode: 'light', palette: 'emerald' });

    expect(service.current).toEqual({ mode: 'light', palette: 'emerald' });
    expect(document.documentElement.dataset.themeMode).toBe('light');
    expect(document.documentElement.dataset.themePalette).toBe('emerald');
    expect(document.documentElement.style.colorScheme).toBe('light');

    service.init();
    expect(document.documentElement.dataset.themeMode).toBe('light');
  });

  it('normalizes unsupported palette to default', () => {
    localStorage.setItem('splitfy.app.theme', JSON.stringify({ mode: 'light', palette: 'unknown' }));
    expect(service.current).toEqual({ mode: 'light', palette: 'default' });
  });
});
