import { StatCard } from '@/components/ui/StatCard';
import {
  MessageSquare,
  CheckCircle,
  Clock,
  Star,
} from 'lucide-react';
import { reputationScoreBg, reputationScoreColor } from '@/lib/business-reputation';
import type { BusinessReputationMetrics } from '@/lib/business-reputation';
import { cn } from '@/lib/utils';

interface BusinessReputationStatsProps {
  metrics: BusinessReputationMetrics;
}

export function BusinessReputationStats({ metrics }: BusinessReputationStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <StatCard
        icon={MessageSquare}
        label="Raportime Totale"
        value={metrics.totalReports}
      />
      <StatCard
        icon={CheckCircle}
        label="Të Zgjidhura"
        value={metrics.resolvedReports}
        color="text-emerald-600"
        bg="bg-emerald-50"
      />
      <StatCard
        icon={Clock}
        label="Koha Mes. e Përgjigjes"
        value={metrics.averageResponseTimeLabel}
        color="text-indigo-600"
        bg="bg-indigo-50"
      />
      <div
        className={cn(
          'rounded-2xl border p-4 sm:p-5 flex flex-col gap-2',
          reputationScoreBg(metrics.reputationScore)
        )}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80">
            <Star className={cn('h-5 w-5', reputationScoreColor(metrics.reputationScore))} />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Reputacioni
          </span>
        </div>
        <p className={cn('text-2xl sm:text-3xl font-bold tabular-nums', reputationScoreColor(metrics.reputationScore))}>
          {metrics.reputationScore}
          <span className="text-base font-medium text-slate-400">/100</span>
        </p>
        <p className="text-xs text-slate-500">
          {metrics.resolutionRate}% raportimesh të zgjidhura
        </p>
      </div>
    </div>
  );
}
