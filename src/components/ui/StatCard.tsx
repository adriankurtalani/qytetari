import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  color?: string;
  bg?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  color = 'text-blue-600',
  bg = 'bg-blue-50',
}: StatCardProps) {
  return (
    <div className="card rounded-2xl p-4 sm:p-5 card-hover min-w-0">
      <div className={cn('inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl mb-2.5 sm:mb-3', bg)}>
        <Icon className={cn('h-4 w-4 sm:h-5 sm:w-5', color)} />
      </div>
      <p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
      <p className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-snug">{label}</p>
    </div>
  );
}
