import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

export function PageHeader({ title, description, action, breadcrumb, breadcrumbs }: PageHeaderProps) {
  return (
    <div className="page-header flex items-center justify-between gap-4 flex-wrap mb-6 w-full">
      <div className="flex-1 min-w-[260px]">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-2 font-medium">
            {breadcrumbs.map((b, idx) => (
              <span key={idx} className="flex items-center gap-1.5">
                {idx > 0 && <ChevronRight size={12} className="text-slate-400" />}
                {b.href ? (
                  <Link href={b.href} className="hover:text-primary-600 transition">
                    {b.label}
                  </Link>
                ) : (
                  <span className="text-slate-900 font-semibold">{b.label}</span>
                )}
              </span>
            ))}
          </nav>
        ) : breadcrumb ? (
          <div className="mb-2">{breadcrumb}</div>
        ) : null}
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {action && <div className="page-actions ml-auto flex items-center justify-end gap-2 flex-wrap shrink-0">{action}</div>}
    </div>
  );
}