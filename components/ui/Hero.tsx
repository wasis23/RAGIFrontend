import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface HeroProps {
  badge?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function Hero({
  badge,
  title,
  description,
  actions,
  children,
  className,
}: HeroProps) {
  return (
    <div className={cn('hero', className)}>
      <div className="hero-inner">
        <div>
          {badge && <div className="hero-badge">{badge}</div>}
          <h2 className="hero-title">{title}</h2>
          {description && <p className="hero-description">{description}</p>}
        </div>
        {actions && <div className="hero-actions">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
