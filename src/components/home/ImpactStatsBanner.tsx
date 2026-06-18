import { BarChart3, CheckCircle2, Clock } from 'lucide-react';
import { LAUNCH_CITY } from '@/lib/constants';
import type { WeeklyImpactStats } from '@/lib/impact-stats';

interface ImpactStatsBannerProps {
  stats: WeeklyImpactStats;
  city?: string;
}

export function ImpactStatsBanner({ stats, city = LAUNCH_CITY }: ImpactStatsBannerProps) {
  const items = [
    {
      icon: BarChart3,
      value: stats.approvedThisWeek,
      label: 'Raporte të reja këtë javë',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      icon: CheckCircle2,
      value: stats.resolvedThisWeek,
      label: 'U zgjidhën këtë javë',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      icon: Clock,
      value: stats.stillPending,
      label: 'Ende në pritje',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ];

  return (
    <section className="bg-white border-b border-slate-100">
      <div className="page-container py-6 sm:py-8">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
            Faza 2 · Ndikim publik
          </p>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
            Numrat e javës në {city}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Transparencë publike — çdo raport numërohet dhe ndjeket deri në zgjidhje.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {items.map(({ icon: Icon, value, label, color, bg }) => (
            <div
              key={label}
              className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 sm:p-5"
            >
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div className="min-w-0">
                <p className={`text-2xl sm:text-3xl font-bold tabular-nums ${color}`}>{value}</p>
                <p className="text-xs sm:text-sm text-slate-600 leading-snug">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
