import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
  className?: string;
  trend?: 'up' | 'down' | 'neutral';
  interactive?: boolean;
}

export function StatCard({ 
  title, 
  value, 
  change, 
  changeLabel,
  icon, 
  className,
  trend,
  interactive = false
}: StatCardProps) {
  const getTrendIcon = () => {
    if (change === undefined) return null;
    
    if (trend === 'up' || (trend === undefined && change > 0)) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (trend === 'down' || (trend === undefined && change < 0)) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    } else {
      return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendColor = () => {
    if (change === undefined) return 'text-muted-foreground';
    
    if (trend === 'up' || (trend === undefined && change > 0)) {
      return 'text-green-600 dark:text-green-400';
    } else if (trend === 'down' || (trend === undefined && change < 0)) {
      return 'text-red-600 dark:text-red-400';
    } else {
      return 'text-muted-foreground';
    }
  };

  return (
    <div className={cn(
      "p-6 rounded-xl border bg-card transition-all duration-200",
      interactive && "hover:shadow-lg hover:scale-105 cursor-pointer",
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            {title}
          </p>
          <div className="flex items-baseline space-x-2">
            <p className="text-2xl font-bold">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {change !== undefined && (
              <div className={cn("flex items-center space-x-1 text-sm", getTrendColor())}>
                {getTrendIcon()}
                <span>
                  {Math.abs(change)}{changeLabel ? ` ${changeLabel}` : '%'}
                </span>
              </div>
            )}
          </div>
        </div>
        {icon && (
          <div className="p-3 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

interface StatGridProps {
  children: ReactNode;
  className?: string;
  cols?: 2 | 3 | 4;
}

export function StatGrid({ children, className, cols = 4 }: StatGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <div className={cn(
      "grid gap-4",
      gridCols[cols],
      className
    )}>
      {children}
    </div>
  );
}