import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  badge?: string;
}

export function PageHeader({ title, description, children, className, badge }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0 flex-1 space-y-2">
        {badge && (
          <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
            {badge}
          </span>
        )}
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900 break-words">
          {title}
        </h1>
        {description && (
          <p className="text-slate-500 text-sm sm:text-base max-w-2xl leading-relaxed break-words">
            {description}
          </p>
        )}
      </div>
      {children && <div className="shrink-0 self-start sm:self-auto">{children}</div>}
    </div>
  );
}
