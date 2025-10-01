'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

interface TecmoBowlContextType {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  playSound: (sound: 'select' | 'move' | 'touchdown' | 'powerup' | 'coin') => void;
}

const TecmoBowlContext = createContext<TecmoBowlContextType>({
  soundEnabled: true,
  setSoundEnabled: () => {},
  playSound: () => {},
});

export const useTecmoBowl = () => useContext(TecmoBowlContext);

export function TecmoBowlProvider({ children }: { children: ReactNode }) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();
  
  useEffect(() => {
    setIsClient(true);
    
    // Apply Tecmo theme globally
    document.documentElement.classList.add('tecmo-theme');
    
    // Add retro font
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    // Add VT323 font for better readability
    const link2 = document.createElement('link');
    link2.href = 'https://fonts.googleapis.com/css2?family=VT323&display=swap';
    link2.rel = 'stylesheet';
    document.head.appendChild(link2);
    
    // Create startup animation
    const startupDiv = document.createElement('div');
    startupDiv.className = 'tecmo-startup';
    startupDiv.innerHTML = `
      <div class="startup-screen">
        <div class="startup-logo">
          <div class="logo-text-top">TECMO</div>
          <div class="logo-text-bottom">FANTASY BOWL</div>
          <div class="logo-year">2024</div>
        </div>
        <div class="startup-loading">
          <div class="loading-bar"></div>
        </div>
        <div class="startup-text blink">PRESS START</div>
      </div>
    `;
    document.body.appendChild(startupDiv);
    
    // Remove startup screen after animation
    setTimeout(() => {
      startupDiv.classList.add('fade-out');
      setTimeout(() => {
        document.body.removeChild(startupDiv);
      }, 500);
    }, 2000);
    
    return () => {
      document.documentElement.classList.remove('tecmo-theme');
    };
  }, []);
  
  // Page transition animation
  useEffect(() => {
    if (!isClient) return;
    
    const transitionDiv = document.createElement('div');
    transitionDiv.className = 'page-transition';
    document.body.appendChild(transitionDiv);
    
    setTimeout(() => {
      transitionDiv.classList.add('active');
    }, 10);
    
    setTimeout(() => {
      document.body.removeChild(transitionDiv);
    }, 300);
  }, [pathname, isClient]);
  
  const playSound = (sound: 'select' | 'move' | 'touchdown' | 'powerup' | 'coin') => {
    if (!soundEnabled || !isClient) return;
    
    // Sound URLs (we'll use placeholder sounds for now)
    const sounds = {
      select: 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAABAAs=',
      move: 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAABAAk=',
      touchdown: 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAABAA0=',
      powerup: 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAABAA8=',
      coin: 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAABABI='
    };
    
    try {
      const audio = new Audio(sounds[sound]);
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (e) {
      // Ignore audio errors
    }
  };
  
  return (
    <TecmoBowlContext.Provider value={{ soundEnabled, setSoundEnabled, playSound }}>
      <div className="tecmo-wrapper">
        {/* Scanlines effect */}
        <div className="scanlines" />
        
        {/* CRT effect */}
        <div className="crt-effect" />
        
        {/* Pixel grid overlay */}
        <div className="pixel-grid" />
        
        {children}
      </div>
    </TecmoBowlContext.Provider>
  );
}