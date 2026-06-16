'use client';

import { cn } from '@/lib/utils';

interface BreakdownCardProps {
  title: string;
  data: Record<string, number>;
  highlightKey?: string;
  valueFormatter?: (key: string) => string;
}

export function BreakdownCard({
  title,
  data,
  highlightKey,
  valueFormatter,
}: BreakdownCardProps) {
  const sorted = Object.entries(data)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);
  const max = sorted[0]?.[1] || 1;

  return (
    <div className="card rounded-2xl p-4 sm:p-5 h-full">
      <h3 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wide">{title}</h3>
      <div className="space-y-3">
        {sorted.map(([key, count]) => {
          const label = valueFormatter ? valueFormatter(key) : key;
          const highlighted = highlightKey === key;
          return (
            <div key={key}>
              <div className="flex justify-between text-sm mb-1 gap-2">
                <span
                  className={cn(
                    'truncate pr-2',
                    highlighted ? 'text-blue-700 font-semibold' : 'text-slate-600'
                  )}
                >
                  {label}
                  {highlighted && (
                    <span className="ml-1.5 text-[10px] uppercase font-bold text-blue-500">
                      juaj
                    </span>
                  )}
                </span>
                <span className="font-semibold text-slate-900 shrink-0 tabular-nums">{count}</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    highlighted ? 'bg-blue-600' : 'bg-slate-300'
                  )}
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
        {sorted.length === 0 && <p className="text-sm text-slate-400">Nuk ka të dhëna.</p>}
      </div>
    </div>
  );
}
