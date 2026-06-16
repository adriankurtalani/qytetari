import { cn } from '@/lib/utils';
import { getCitizenTrustDisplay, renderTrustStars } from '@/lib/citizen-trust';

interface CitizenTrustBadgeProps {
  citizenScore: number;
  approvedCount?: number;
  rejectedCount?: number;
  size?: 'inline' | 'sm' | 'md' | 'lg';
  showStats?: boolean;
  className?: string;
}

export function CitizenTrustBadge({
  citizenScore,
  approvedCount,
  rejectedCount,
  size = 'md',
  showStats = false,
  className,
}: CitizenTrustBadgeProps) {
  const trust = getCitizenTrustDisplay({
    citizen_score: citizenScore,
    approved_reports_count: approvedCount,
    rejected_reports_count: rejectedCount,
  });

  const sizeClasses = {
    inline: 'text-xs gap-1 px-0 py-0 border-0 bg-transparent',
    sm: 'text-xs gap-1.5',
    md: 'text-sm gap-2',
    lg: 'text-base gap-2.5',
  };

  if (size === 'inline') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 text-xs font-medium text-amber-800',
          className
        )}
        title={`Citizen Score: ${trust.citizen_score}/100`}
      >
        <span aria-hidden>{renderTrustStars(trust.stars)}</span>
        <span>{trust.label}</span>
      </span>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex flex-col rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2',
        sizeClasses[size],
        className
      )}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span className="tracking-tight leading-none" aria-hidden>
          {renderTrustStars(trust.stars)}
        </span>
        <span className="font-semibold text-amber-900">{trust.label}</span>
        <span className="text-amber-700/80 tabular-nums font-medium">{trust.citizen_score}/100</span>
      </div>
      {showStats && (
        <p className="text-xs text-amber-800/70 mt-1">
          {trust.approved_reports_count} aprovuar · {trust.rejected_reports_count} refuzuar
        </p>
      )}
    </div>
  );
}
