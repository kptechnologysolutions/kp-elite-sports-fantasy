'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Palette,
  Monitor,
  Moon,
  Sun,
  Gamepad2,
  Briefcase,
  Waves,
  Download,
  Upload,
  RotateCcw,
  Check,
  Settings,
  Sparkles,
  Eye
} from 'lucide-react';
import { 
  availableThemes, 
  themeManager, 
  Theme, 
  ThemeEffects 
} from '@/lib/theme/themeSystem';
import { cn } from '@/lib/utils';

export function ThemeCustomizer() {
  const [currentTheme, setCurrentTheme] = useState<Theme>(themeManager.getCurrentTheme());
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customTheme, setCustomTheme] = useState<Theme>(currentTheme);
  const [previewMode, setPreviewMode] = useState(false);
  
  useEffect(() => {
    themeManager.loadThemePreference();
    setCurrentTheme(themeManager.getCurrentTheme());
  }, []);
  
  const handleThemeChange = (themeId: string) => {
    const theme = availableThemes.find(t => t.id === themeId);
    if (theme) {
      themeManager.setTheme(themeId);
      setCurrentTheme(theme);
      setCustomTheme(theme);
    }
  };
  
  const handleEffectChange = (effect: keyof ThemeEffects, value: any) => {
    const newTheme = {
      ...customTheme,
      effects: {
        ...customTheme.effects,
        [effect]: value
      }
    };
    setCustomTheme(newTheme);
    
    if (previewMode) {
      applyPreviewTheme(newTheme);
    }
  };
  
  const handleColorChange = (colorKey: string, value: string) => {
    const newTheme = {
      ...customTheme,
      colors: {
        ...customTheme.colors,
        [colorKey]: value
      }
    };
    setCustomTheme(newTheme);
    
    if (previewMode) {
      applyPreviewTheme(newTheme);
    }
  };
  
  const applyPreviewTheme = (theme: Theme) => {
    const customizedTheme = themeManager.createCustomTheme(theme, {});
    themeManager.setTheme(customizedTheme.id);
  };
  
  const applyCustomizations = () => {
    const finalTheme = themeManager.createCustomTheme(customTheme, {});
    themeManager.setTheme(finalTheme.id);
    setCurrentTheme(finalTheme);
    setIsCustomizing(false);
    setPreviewMode(false);
  };
  
  const resetToDefault = () => {
    setCustomTheme(currentTheme);
    if (previewMode) {
      themeManager.setTheme(currentTheme.id);
    }
  };
  
  const exportTheme = () => {
    const themeJson = themeManager.exportTheme(customTheme);
    const blob = new Blob([themeJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${customTheme.name.toLowerCase().replace(/\s+/g, '-')}-theme.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const importTheme = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const importedTheme = themeManager.importTheme(content);
        if (importedTheme) {
          setCustomTheme(importedTheme);
          if (previewMode) {
            applyPreviewTheme(importedTheme);
          }
        }
      };
      reader.readAsText(file);
    }
  };
  
  const getThemeIcon = (themeId: string) => {
    switch (themeId) {
      case 'modern': return Monitor;
      case 'dark': return Moon;
      case 'light': return Sun;
      case 'tecmo': return Gamepad2;
      case 'gaming': return Gamepad2;
      case 'professional': return Briefcase;
      case 'ocean': return Waves;
      default: return Palette;
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Theme Customizer
            </CardTitle>
            <CardDescription>
              Customize the appearance and feel of your dashboard
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
            >
              <Eye className="h-4 w-4 mr-1" />
              {previewMode ? 'Exit Preview' : 'Preview'}
            </Button>
            
            {isCustomizing && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetToDefault}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset
                </Button>
                
                <Button
                  size="sm"
                  onClick={applyCustomizations}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Apply
                </Button>
              </>
            )}
          </div>
        </div>
        
        {previewMode && (
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertDescription>
              Preview mode active - changes are applied temporarily
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="themes" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="themes">Themes</TabsTrigger>
            <TabsTrigger value="effects">Effects</TabsTrigger>
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="export">Export/Import</TabsTrigger>
          </TabsList>
          
          <TabsContent value="themes" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableThemes.map((theme) => {
                const Icon = getThemeIcon(theme.id);
                const isSelected = currentTheme.id === theme.id;
                
                return (
                  <div
                    key={theme.id}
                    className={cn(
                      "p-4 rounded-lg border-2 cursor-pointer transition-all",
                      isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    )}
                    onClick={() => handleThemeChange(theme.id)}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Icon className="h-5 w-5" />
                      <div>
                        <div className="font-medium">{theme.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {theme.description}
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary ml-auto" />
                      )}
                    </div>
                    
                    {/* Theme Preview */}
                    <div className="space-y-2">
                      <div className="flex gap-1">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: theme.colors.primary }}
                        />
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: theme.colors.secondary }}
                        />
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: theme.colors.accent }}
                        />
                      </div>
                      
                      <div className="flex gap-1">
                        {theme.isDark && <Badge variant="secondary" className="text-xs">Dark</Badge>}
                        {theme.isRetro && <Badge variant="outline" className="text-xs">Retro</Badge>}
                        {theme.effects.animations && <Badge variant="outline" className="text-xs">Animated</Badge>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              onClick={() => setIsCustomizing(true)}
              className="w-full"
            >
              <Settings className="h-4 w-4 mr-2" />
              Customize Current Theme
            </Button>
          </TabsContent>
          
          <TabsContent value="effects" className="space-y-6">
            <div className="grid gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Shadows</Label>
                  <p className="text-sm text-muted-foreground">Add depth with drop shadows</p>
                </div>
                <Switch
                  checked={customTheme.effects.shadows}
                  onCheckedChange={(checked) => handleEffectChange('shadows', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Animations</Label>
                  <p className="text-sm text-muted-foreground">Enable smooth transitions and animations</p>
                </div>
                <Switch
                  checked={customTheme.effects.animations}
                  onCheckedChange={(checked) => handleEffectChange('animations', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Glassmorphism</Label>
                  <p className="text-sm text-muted-foreground">Frosted glass effect on surfaces</p>
                </div>
                <Switch
                  checked={customTheme.effects.glassmorphism}
                  onCheckedChange={(checked) => handleEffectChange('glassmorphism', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Gradients</Label>
                  <p className="text-sm text-muted-foreground">Use gradient backgrounds</p>
                </div>
                <Switch
                  checked={customTheme.effects.gradients}
                  onCheckedChange={(checked) => handleEffectChange('gradients', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Particles</Label>
                  <p className="text-sm text-muted-foreground">Animated background particles</p>
                </div>
                <Switch
                  checked={customTheme.effects.particles}
                  onCheckedChange={(checked) => handleEffectChange('particles', checked)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Corner Radius</Label>
                <div className="grid grid-cols-4 gap-2">
                  {(['none', 'small', 'medium', 'large'] as const).map((size) => (
                    <Button
                      key={size}
                      variant={customTheme.effects.roundedCorners === size ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleEffectChange('roundedCorners', size)}
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Transition Speed</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['fast', 'normal', 'slow'] as const).map((speed) => (
                    <Button
                      key={speed}
                      variant={customTheme.effects.transitions === speed ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleEffectChange('transitions', speed)}
                    >
                      {speed}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="colors" className="space-y-4">
            <div className="grid gap-4">
              {Object.entries(customTheme.colors).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded border"
                      style={{ backgroundColor: value }}
                    />
                    <div>
                      <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                      <p className="text-sm text-muted-foreground">{value}</p>
                    </div>
                  </div>
                  
                  <input
                    type="color"
                    value={value.startsWith('#') ? value : '#000000'}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    className="w-12 h-8 border rounded cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="export" className="space-y-4">
            <div className="grid gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export Theme
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Save your current theme configuration as a JSON file
                </p>
                <Button onClick={exportTheme} variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download Theme
                </Button>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Import Theme
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Load a theme configuration from a JSON file
                </p>
                <label className="block">
                  <input
                    type="file"
                    accept=".json"
                    onChange={importTheme}
                    className="hidden"
                  />
                  <Button variant="outline" className="w-full cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Select Theme File
                  </Button>
                </label>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}