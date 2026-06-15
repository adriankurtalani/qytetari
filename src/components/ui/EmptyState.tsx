import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, children, className }: EmptyStateProps) {
  return (
    <div className={cn('card rounded-2xl p-12 text-center', className)}>
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 mb-4">
        <Icon className="h-7 w-7 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">{description}</p>
      )}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
