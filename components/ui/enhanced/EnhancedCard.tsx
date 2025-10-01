'use client';

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface EnhancedCardProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
  loading?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  interactive?: boolean;
}

export function EnhancedCard({ 
  title, 
  subtitle, 
  icon: Icon, 
  children, 
  className,
  loading = false,
  variant = 'default',
  interactive = false
}: EnhancedCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/30';
      case 'warning':
        return 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30';
      case 'error':
        return 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/30';
      case 'info':
        return 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30';
      default:
        return 'border-border bg-card';
    }
  };

  const getIconVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/40';
      case 'warning':
        return 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/40';
      case 'error':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/40';
      case 'info':
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/40';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  if (loading) {
    return (
      <div className={cn(
        "rounded-xl border p-6 shadow-sm transition-all duration-200",
        getVariantStyles(),
        className
      )}>
        <div className="flex items-start gap-4">
          <div className={cn(
            "rounded-lg p-2 animate-pulse",
            getIconVariantStyles()
          )}>
            <div className="h-5 w-5 bg-current opacity-20 rounded" />
          </div>
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <div className="h-5 bg-muted animate-pulse rounded w-32" />
              {subtitle && <div className="h-4 bg-muted animate-pulse rounded w-48" />}
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-muted animate-pulse rounded w-full" />
              <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
              <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-xl border p-6 shadow-sm transition-all duration-200",
      getVariantStyles(),
      interactive && "hover:shadow-md cursor-pointer hover:scale-[1.02]",
      className
    )}>
      <div className="flex items-start gap-4">
        {Icon && (
          <div className={cn(
            "rounded-lg p-2 transition-colors",
            getIconVariantStyles()
          )}>
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="space-y-2 mb-4">
            <h3 className="font-semibold text-foreground leading-none tracking-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          <div className="space-y-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: LucideIcon;
  loading?: boolean;
  className?: string;
}

export function StatCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon: Icon,
  loading = false,
  className 
}: StatCardProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'negative':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className={cn(
        "rounded-xl border bg-card p-6 shadow-sm",
        className
      )}>
        <div className="flex items-center justify-between space-y-0 pb-2">
          <div className="h-4 bg-muted animate-pulse rounded w-20" />
          {Icon && <div className="h-4 w-4 bg-muted animate-pulse rounded" />}
        </div>
        <div className="space-y-2">
          <div className="h-8 bg-muted animate-pulse rounded w-16" />
          <div className="h-3 bg-muted animate-pulse rounded w-12" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-xl border bg-card p-6 shadow-sm transition-all duration-200 hover:shadow-md",
      className
    )}>
      <div className="flex items-center justify-between space-y-0 pb-2">
        <h3 className="text-sm font-medium text-muted-foreground tracking-tight">
          {title}
        </h3>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>
      <div className="space-y-1">
        <div className="text-2xl font-bold text-foreground">
          {value}
        </div>
        {change && (
          <p className={cn("text-xs", getChangeColor())}>
            {change}
          </p>
        )}
      </div>
    </div>
  );
}