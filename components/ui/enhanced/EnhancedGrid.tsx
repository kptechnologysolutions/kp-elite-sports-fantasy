'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface GridProps {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Grid({ children, cols = 3, gap = 'lg', className }: GridProps) {
  const getGridCols = () => {
    switch (cols) {
      case 1: return 'grid-cols-1';
      case 2: return 'grid-cols-1 md:grid-cols-2';
      case 3: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 4: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
      case 5: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5';
      case 6: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6';
      default: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    }
  };

  const getGap = () => {
    switch (gap) {
      case 'sm': return 'gap-4';
      case 'md': return 'gap-6';
      case 'lg': return 'gap-8';
      case 'xl': return 'gap-10';
      default: return 'gap-6';
    }
  };

  return (
    <div className={cn(
      'grid',
      getGridCols(),
      getGap(),
      className
    )}>
      {children}
    </div>
  );
}

interface ContainerProps {
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function Container({ children, className, size = 'xl' }: ContainerProps) {
  const getMaxWidth = () => {
    switch (size) {
      case 'sm': return 'max-w-3xl';
      case 'md': return 'max-w-5xl';
      case 'lg': return 'max-w-6xl';
      case 'xl': return 'max-w-7xl';
      case 'full': return 'max-w-none';
      default: return 'max-w-7xl';
    }
  };

  return (
    <div className={cn(
      'mx-auto px-4 sm:px-6 lg:px-8',
      getMaxWidth(),
      className
    )}>
      {children}
    </div>
  );
}

interface SectionProps {
  children: ReactNode;
  className?: string;
  spacing?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Section({ children, className, spacing = 'lg' }: SectionProps) {
  const getSpacing = () => {
    switch (spacing) {
      case 'sm': return 'space-y-4';
      case 'md': return 'space-y-6';
      case 'lg': return 'space-y-8';
      case 'xl': return 'space-y-12';
      default: return 'space-y-8';
    }
  };

  return (
    <section className={cn(getSpacing(), className)}>
      {children}
    </section>
  );
}