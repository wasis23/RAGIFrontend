interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  breadcrumb?: React.ReactNode;
}

export function PageHeader({ title, description, action, breadcrumb }: PageHeaderProps) {
  return (
    <div className="page-header flex items-center justify-between gap-4 flex-wrap mb-6 w-full">
      <div className="flex-1 min-w-[260px]">
        {breadcrumb && <div className="mb-2">{breadcrumb}</div>}
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {action && <div className="page-actions ml-auto flex items-center justify-end gap-2 flex-wrap shrink-0">{action}</div>}
    </div>
  );
}