import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type StatIconVariant =
  | 'blue'
  | 'green'
  | 'amber'
  | 'red'
  | 'indigo'
  | 'teal'
  | 'rose'
  | 'purple'
  | 'orange'
  | 'cyan'
  | 'gray';

export interface StatCardProps {
  label?: string;
  value: ReactNode;
  icon?: ReactNode;
  iconVariant?: StatIconVariant;
  footer?: ReactNode;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon,
  iconVariant,
  footer,
  className,
}: StatCardProps) {
  return (
    <div className={cn('stat-card', className)}>
      <div className="flex items-center justify-between">
        {label && <span className="stat-label">{label}</span>}
        {icon && (
          <div className={cn('stat-icon', iconVariant && `stat-icon-${iconVariant}`)}>
            {icon}
          </div>
        )}
      </div>
      <div className="stat-value">{value}</div>
      {footer && <div className="stat-footer">{footer}</div>}
    </div>
  );
}
