import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ModernCardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  glass?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  actions?: ReactNode;
}

export function ModernCard({ 
  title, 
  description, 
  children, 
  className,
  interactive = false,
  glass = false,
  loading = false,
  icon,
  actions
}: ModernCardProps) {
  if (loading) {
    return (
      <Card className={cn(
        "animate-pulse",
        glass && "glass",
        className
      )}>
        <CardHeader>
          <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
            <div className="h-4 bg-muted rounded w-4/6"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "transition-all duration-300",
      interactive && "card-interactive cursor-pointer",
      glass && "glass",
      className
    )}>
      {(title || description || icon || actions) && (
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              {title && (
                <div className="flex items-center gap-2">
                  {icon && <div className="text-primary">{icon}</div>}
                  <CardTitle className="text-xl">{title}</CardTitle>
                </div>
              )}
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </CardHeader>
      )}
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}