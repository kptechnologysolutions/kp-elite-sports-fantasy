import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ThemeManager, availableThemes, modernTheme, darkTheme, tecmoTheme } from '@/lib/theme/themeSystem';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock document
const mockDocument = {
  documentElement: {
    style: {
      setProperty: vi.fn()
    },
    className: '',
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn()
    }
  }
};

Object.defineProperty(global, 'document', {
  value: mockDocument
});

describe('ThemeSystem', () => {
  let themeManager: ThemeManager;

  beforeEach(() => {
    vi.clearAllMocks();
    themeManager = new ThemeManager();
    mockDocument.documentElement.className = '';
  });

  describe('ThemeManager', () => {
    describe('setTheme', () => {
      it('should set theme correctly', () => {
        themeManager.setTheme('dark');

        expect(mockDocument.documentElement.style.setProperty).toHaveBeenCalledWith(
          '--color-primary',
          darkTheme.colors.primary
        );
        expect(mockDocument.documentElement.classList.add).toHaveBeenCalledWith('theme-dark');
        expect(mockDocument.documentElement.classList.add).toHaveBeenCalledWith('dark');
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('fantasy-football-theme', 'dark');
      });

      it('should handle retro theme correctly', () => {
        themeManager.setTheme('tecmo');

        expect(mockDocument.documentElement.classList.add).toHaveBeenCalledWith('theme-tecmo');
        expect(mockDocument.documentElement.classList.add).toHaveBeenCalledWith('retro');
        expect(mockDocument.documentElement.classList.add).toHaveBeenCalledWith('dark');
      });

      it('should ignore invalid theme ID', () => {
        const currentTheme = themeManager.getCurrentTheme();
        themeManager.setTheme('invalid-theme');

        expect(themeManager.getCurrentTheme()).toEqual(currentTheme);
      });

      it('should apply effect classes correctly', () => {
        themeManager.setTheme('modern');

        expect(mockDocument.documentElement.classList.add).toHaveBeenCalledWith('effect-shadows');
        expect(mockDocument.documentElement.classList.add).toHaveBeenCalledWith('effect-animations');
        expect(mockDocument.documentElement.classList.add).toHaveBeenCalledWith('effect-gradients');
      });
    });

    describe('getCurrentTheme', () => {
      it('should return current theme', () => {
        const theme = themeManager.getCurrentTheme();
        expect(theme).toEqual(modernTheme);
      });

      it('should update after setting new theme', () => {
        themeManager.setTheme('dark');
        const theme = themeManager.getCurrentTheme();
        expect(theme.id).toBe('dark');
      });
    });

    describe('loadThemePreference', () => {
      it('should load saved theme from localStorage', () => {
        mockLocalStorage.getItem.mockReturnValue('dark');
        themeManager.loadThemePreference();

        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('fantasy-football-theme');
        expect(themeManager.getCurrentTheme().id).toBe('dark');
      });

      it('should handle no saved theme', () => {
        mockLocalStorage.getItem.mockReturnValue(null);
        const initialTheme = themeManager.getCurrentTheme();
        themeManager.loadThemePreference();

        expect(themeManager.getCurrentTheme()).toEqual(initialTheme);
      });
    });

    describe('createCustomTheme', () => {
      it('should create custom theme with modifications', () => {
        const customizations = {
          name: 'My Custom Theme',
          colors: {
            primary: '#ff0000'
          },
          effects: {
            shadows: false
          }
        };

        const customTheme = themeManager.createCustomTheme(modernTheme, customizations);

        expect(customTheme.name).toBe('My Custom Theme');
        expect(customTheme.colors.primary).toBe('#ff0000');
        expect(customTheme.colors.secondary).toBe(modernTheme.colors.secondary); // Should inherit
        expect(customTheme.effects.shadows).toBe(false);
        expect(customTheme.effects.animations).toBe(modernTheme.effects.animations); // Should inherit
        expect(customTheme.id).toMatch(/^custom-\d+$/);
      });
    });

    describe('exportTheme', () => {
      it('should export theme as JSON string', () => {
        const jsonString = themeManager.exportTheme(modernTheme);
        const parsed = JSON.parse(jsonString);

        expect(parsed.id).toBe(modernTheme.id);
        expect(parsed.name).toBe(modernTheme.name);
        expect(parsed.colors).toEqual(modernTheme.colors);
        expect(parsed.effects).toEqual(modernTheme.effects);
      });
    });

    describe('importTheme', () => {
      it('should import valid theme JSON', () => {
        const themeJson = JSON.stringify(darkTheme);
        const importedTheme = themeManager.importTheme(themeJson);

        expect(importedTheme).toEqual(darkTheme);
      });

      it('should return null for invalid JSON', () => {
        const invalidJson = '{ invalid json }';
        const result = themeManager.importTheme(invalidJson);

        expect(result).toBeNull();
      });

      it('should return null for incomplete theme', () => {
        const incompleteTheme = JSON.stringify({ id: 'test', name: 'Test' });
        const result = themeManager.importTheme(incompleteTheme);

        expect(result).toBeNull();
      });
    });
  });

  describe('Available Themes', () => {
    it('should include all expected themes', () => {
      expect(availableThemes).toContain(modernTheme);
      expect(availableThemes).toContain(darkTheme);
      expect(availableThemes).toContain(tecmoTheme);
      expect(availableThemes.length).toBeGreaterThanOrEqual(3);
    });

    it('should have unique theme IDs', () => {
      const ids = availableThemes.map(theme => theme.id);
      const uniqueIds = [...new Set(ids)];
      expect(ids.length).toBe(uniqueIds.length);
    });

    it('should have valid color properties', () => {
      availableThemes.forEach(theme => {
        expect(theme.colors.primary).toBeDefined();
        expect(theme.colors.background).toBeDefined();
        expect(theme.colors.text).toBeDefined();
        expect(theme.colors.border).toBeDefined();
      });
    });

    it('should have valid effect properties', () => {
      availableThemes.forEach(theme => {
        expect(typeof theme.effects.shadows).toBe('boolean');
        expect(typeof theme.effects.animations).toBe('boolean');
        expect(['none', 'small', 'medium', 'large']).toContain(theme.effects.roundedCorners);
        expect(['fast', 'normal', 'slow']).toContain(theme.effects.transitions);
      });
    });
  });

  describe('Theme Properties', () => {
    describe('Modern Theme', () => {
      it('should be light theme', () => {
        expect(modernTheme.isDark).toBe(false);
        expect(modernTheme.isRetro).toBe(false);
      });

      it('should have modern effects enabled', () => {
        expect(modernTheme.effects.shadows).toBe(true);
        expect(modernTheme.effects.animations).toBe(true);
        expect(modernTheme.effects.gradients).toBe(true);
      });
    });

    describe('Dark Theme', () => {
      it('should be dark theme', () => {
        expect(darkTheme.isDark).toBe(true);
        expect(darkTheme.isRetro).toBe(false);
      });

      it('should have glassmorphism enabled', () => {
        expect(darkTheme.effects.glassmorphism).toBe(true);
      });
    });

    describe('Tecmo Theme', () => {
      it('should be retro and dark theme', () => {
        expect(tecmoTheme.isDark).toBe(true);
        expect(tecmoTheme.isRetro).toBe(true);
      });

      it('should have retro styling', () => {
        expect(tecmoTheme.effects.roundedCorners).toBe('none');
        expect(tecmoTheme.effects.shadows).toBe(false);
        expect(tecmoTheme.fontFamily).toContain('monospace');
      });

      it('should have retro colors', () => {
        expect(tecmoTheme.colors.primary).toBe('#00ff00');
        expect(tecmoTheme.colors.background).toBe('#000033');
      });
    });
  });
});