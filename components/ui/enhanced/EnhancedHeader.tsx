'use client';

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  className?: string;
  variant?: 'default' | 'centered';
}

export function PageHeader({ 
  title, 
  subtitle, 
  description, 
  icon: Icon, 
  actions, 
  className,
  variant = 'default'
}: PageHeaderProps) {
  const isCentered = variant === 'centered';

  return (
    <div className={cn(
      'pb-8 border-b border-border/50',
      isCentered ? 'text-center' : 'flex items-start justify-between',
      className
    )}>
      <div className={cn(
        'space-y-4',
        isCentered ? 'mx-auto max-w-2xl' : 'flex-1 min-w-0'
      )}>
        {/* Icon and Title */}
        <div className={cn(
          'flex items-center gap-3',
          isCentered && 'justify-center'
        )}>
          {Icon && (
            <div className="rounded-xl bg-primary/10 p-3">
              <Icon className="h-6 w-6 text-primary" />
            </div>
          )}
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            {subtitle && (
              <p className="text-lg font-medium text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        {description && (
          <p className="text-muted-foreground leading-relaxed max-w-3xl">
            {description}
          </p>
        )}
      </div>

      {/* Actions */}
      {actions && !isCentered && (
        <div className="flex items-center gap-2 mt-2">
          {actions}
        </div>
      )}

      {actions && isCentered && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {actions}
        </div>
      )}
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

export function SectionHeader({ title, subtitle, actions, className }: SectionHeaderProps) {
  return (
    <div className={cn(
      'flex items-center justify-between',
      className
    )}>
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}