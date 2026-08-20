import { ReactNode } from 'react';

interface SectionHeaderProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function SectionHeader({ icon, title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 mb-4">
      <div className="flex items-center gap-2.5">
        {icon && <div className="p-1.5 bg-primary-50 text-primary-600 rounded-lg">{icon}</div>}
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="self-start sm:self-auto">{action}</div>}
    </div>
  );
}
