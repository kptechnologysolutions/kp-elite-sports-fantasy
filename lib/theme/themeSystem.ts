// Enhanced Theme System with Multiple Options
export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  gradient: string;
}

export interface ThemeEffects {
  shadows: boolean;
  animations: boolean;
  glassmorphism: boolean;
  gradients: boolean;
  roundedCorners: 'none' | 'small' | 'medium' | 'large';
  particles: boolean;
  transitions: 'fast' | 'normal' | 'slow';
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: ThemeColors;
  effects: ThemeEffects;
  fontFamily: string;
  isDark: boolean;
  isRetro: boolean;
}

// Modern Theme (Default)
export const modernTheme: Theme = {
  id: 'modern',
  name: 'Modern',
  description: 'Clean and contemporary design',
  colors: {
    primary: 'oklch(0.635 0.237 30.81)',
    secondary: 'oklch(0.95 0 0)',
    accent: 'oklch(0.635 0.237 30.81)',
    background: 'oklch(0.98 0 0)',
    surface: 'oklch(1 0 0)',
    text: 'oklch(0.15 0 0)',
    textSecondary: 'oklch(0.5 0 0)',
    border: 'oklch(0.9 0 0)',
    success: 'oklch(0.748 0.213 142.495)',
    warning: 'oklch(0.816 0.162 91.545)',
    error: 'oklch(0.577 0.245 27.325)',
    gradient: 'linear-gradient(135deg, oklch(0.635 0.237 30.81) 0%, oklch(0.635 0.237 60.81) 100%)'
  },
  effects: {
    shadows: true,
    animations: true,
    glassmorphism: false,
    gradients: true,
    roundedCorners: 'medium',
    particles: false,
    transitions: 'normal'
  },
  fontFamily: 'Inter, sans-serif',
  isDark: false,
  isRetro: false
};

// Dark Theme
export const darkTheme: Theme = {
  id: 'dark',
  name: 'Dark Mode',
  description: 'Sleek dark interface',
  colors: {
    primary: 'oklch(0.635 0.237 30.81)',
    secondary: 'oklch(0.1 0 0)',
    accent: 'oklch(0.635 0.237 30.81)',
    background: 'oklch(0.05 0 0)',
    surface: 'oklch(0.08 0 0)',
    text: 'oklch(0.95 0 0)',
    textSecondary: 'oklch(0.6 0 0)',
    border: 'oklch(0.2 0 0)',
    success: 'oklch(0.748 0.213 142.495)',
    warning: 'oklch(0.816 0.162 91.545)',
    error: 'oklch(0.577 0.245 27.325)',
    gradient: 'linear-gradient(135deg, oklch(0.635 0.237 30.81) 0%, oklch(0.635 0.237 60.81) 100%)'
  },
  effects: {
    shadows: true,
    animations: true,
    glassmorphism: true,
    gradients: true,
    roundedCorners: 'medium',
    particles: false,
    transitions: 'normal'
  },
  fontFamily: 'Inter, sans-serif',
  isDark: true,
  isRetro: false
};

// Tecmo Bowl Retro Theme
export const tecmoTheme: Theme = {
  id: 'tecmo',
  name: 'Tecmo Bowl',
  description: 'Classic 8-bit football nostalgia',
  colors: {
    primary: 'oklch(0.8 0.4 120)',      // Bright green
    secondary: 'oklch(0.6 0.3 240)',    // Blue
    accent: 'oklch(0.9 0.3 85)',        // Yellow
    background: 'oklch(0.1 0.1 240)',   // Dark blue
    surface: 'oklch(0.15 0.1 240)',     // Slightly lighter blue
    text: 'oklch(0.95 0 0)',            // Near white
    textSecondary: 'oklch(0.8 0.1 240)', // Light blue
    border: 'oklch(0.8 0.4 180)',       // Cyan
    success: 'oklch(0.8 0.4 120)',      // Green
    warning: 'oklch(0.9 0.3 85)',       // Yellow
    error: 'oklch(0.7 0.4 0)',          // Red
    gradient: 'linear-gradient(135deg, oklch(0.6 0.3 240) 0%, oklch(0.8 0.4 120) 100%)'
  },
  effects: {
    shadows: false,
    animations: true,
    glassmorphism: false,
    gradients: false,
    roundedCorners: 'none',
    particles: true,
    transitions: 'fast'
  },
  fontFamily: '"Courier New", monospace',
  isDark: true,
  isRetro: true
};

// Gaming Theme
export const gamingTheme: Theme = {
  id: 'gaming',
  name: 'Gaming',
  description: 'High-energy gaming aesthetic',
  colors: {
    primary: '#ff0080',
    secondary: '#8000ff',
    accent: '#00ff80',
    background: '#0a0a0a',
    surface: '#1a1a1a',
    text: '#ffffff',
    textSecondary: '#cccccc',
    border: '#ff0080',
    success: '#00ff80',
    warning: '#ffff00',
    error: '#ff4040',
    gradient: 'linear-gradient(135deg, #ff0080 0%, #8000ff 50%, #00ff80 100%)'
  },
  effects: {
    shadows: true,
    animations: true,
    glassmorphism: true,
    gradients: true,
    roundedCorners: 'large',
    particles: true,
    transitions: 'fast'
  },
  fontFamily: 'Orbitron, monospace',
  isDark: true,
  isRetro: false
};

// Professional Theme
export const professionalTheme: Theme = {
  id: 'professional',
  name: 'Professional',
  description: 'Clean business-oriented design',
  colors: {
    primary: '#2563eb',
    secondary: '#f8fafc',
    accent: '#3b82f6',
    background: '#ffffff',
    surface: '#f1f5f9',
    text: '#1e293b',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
    gradient: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)'
  },
  effects: {
    shadows: true,
    animations: false,
    glassmorphism: false,
    gradients: false,
    roundedCorners: 'small',
    particles: false,
    transitions: 'normal'
  },
  fontFamily: 'Inter, system-ui, sans-serif',
  isDark: false,
  isRetro: false
};

// Ocean Theme
export const oceanTheme: Theme = {
  id: 'ocean',
  name: 'Ocean',
  description: 'Calming blue ocean vibes',
  colors: {
    primary: '#0ea5e9',
    secondary: '#e0f7fa',
    accent: '#06b6d4',
    background: '#f0f9ff',
    surface: '#e0f7fa',
    text: '#0c4a6e',
    textSecondary: '#0369a1',
    border: '#7dd3fc',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    gradient: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 50%, #10b981 100%)'
  },
  effects: {
    shadows: true,
    animations: true,
    glassmorphism: true,
    gradients: true,
    roundedCorners: 'large',
    particles: false,
    transitions: 'slow'
  },
  fontFamily: 'Inter, sans-serif',
  isDark: false,
  isRetro: false
};

// All available themes
export const availableThemes: Theme[] = [
  modernTheme,
  darkTheme,
  tecmoTheme,
  gamingTheme,
  professionalTheme,
  oceanTheme
];

// Theme utility functions
export class ThemeManager {
  private currentTheme: Theme = modernTheme;
  
  setTheme(themeId: string): void {
    const theme = availableThemes.find(t => t.id === themeId);
    if (theme) {
      this.currentTheme = theme;
      this.applyTheme(theme);
      this.saveThemePreference(themeId);
    }
  }
  
  getCurrentTheme(): Theme {
    return this.currentTheme;
  }
  
  private applyTheme(theme: Theme): void {
    const root = document.documentElement;
    
    // Apply color variables using the correct CSS variable names
    const colorMapping: Record<string, string> = {
      primary: '--primary',
      secondary: '--secondary',
      accent: '--accent',
      background: '--background',
      surface: '--card',
      text: '--foreground',
      textSecondary: '--muted-foreground',
      border: '--border',
      success: '--chart-2',
      warning: '--chart-3',
      error: '--destructive'
    };
    
    Object.entries(theme.colors).forEach(([key, value]) => {
      const cssVar = colorMapping[key] || `--${key}`;
      root.style.setProperty(cssVar, value);
    });
    
    // Apply font family
    root.style.setProperty('--font-family', theme.fontFamily);
    
    // Apply effects
    root.style.setProperty('--rounded-corners', this.getRoundedValue(theme.effects.roundedCorners));
    root.style.setProperty('--transition-speed', this.getTransitionSpeed(theme.effects.transitions));
    
    // Add theme classes
    root.className = root.className.replace(/theme-\w+/g, '');
    root.classList.add(`theme-${theme.id}`);
    
    if (theme.isDark) root.classList.add('dark');
    else root.classList.remove('dark');
    
    if (theme.isRetro) root.classList.add('retro');
    else root.classList.remove('retro');
    
    // Apply effect classes
    this.toggleEffectClass('shadows', theme.effects.shadows);
    this.toggleEffectClass('animations', theme.effects.animations);
    this.toggleEffectClass('glassmorphism', theme.effects.glassmorphism);
    this.toggleEffectClass('gradients', theme.effects.gradients);
    this.toggleEffectClass('particles', theme.effects.particles);
  }
  
  private toggleEffectClass(effect: string, enabled: boolean): void {
    const root = document.documentElement;
    if (enabled) {
      root.classList.add(`effect-${effect}`);
    } else {
      root.classList.remove(`effect-${effect}`);
    }
  }
  
  private getRoundedValue(rounded: ThemeEffects['roundedCorners']): string {
    switch (rounded) {
      case 'none': return '0';
      case 'small': return '0.25rem';
      case 'medium': return '0.5rem';
      case 'large': return '1rem';
      default: return '0.5rem';
    }
  }
  
  private getTransitionSpeed(speed: ThemeEffects['transitions']): string {
    switch (speed) {
      case 'fast': return '150ms';
      case 'normal': return '250ms';
      case 'slow': return '350ms';
      default: return '250ms';
    }
  }
  
  private saveThemePreference(themeId: string): void {
    localStorage.setItem('fantasy-football-theme', themeId);
  }
  
  loadThemePreference(): void {
    const savedTheme = localStorage.getItem('fantasy-football-theme');
    if (savedTheme) {
      this.setTheme(savedTheme);
    }
  }
  
  // Create custom theme
  createCustomTheme(baseTheme: Theme, customizations: Partial<Theme>): Theme {
    return {
      ...baseTheme,
      ...customizations,
      id: `custom-${Date.now()}`,
      name: 'Custom Theme',
      colors: {
        ...baseTheme.colors,
        ...customizations.colors
      },
      effects: {
        ...baseTheme.effects,
        ...customizations.effects
      }
    };
  }
  
  // Export theme configuration
  exportTheme(theme: Theme): string {
    return JSON.stringify(theme, null, 2);
  }
  
  // Import theme configuration
  importTheme(themeJson: string): Theme | null {
    try {
      const theme = JSON.parse(themeJson) as Theme;
      // Validate theme structure
      if (theme.id && theme.name && theme.colors && theme.effects) {
        return theme;
      }
    } catch (error) {
      console.error('Invalid theme JSON:', error);
    }
    return null;
  }
}

export const themeManager = new ThemeManager();