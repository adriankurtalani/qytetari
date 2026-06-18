'use client';

import { useEffect, useState } from 'react';
import { Pin, PinOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface ReportWeeklyPinButtonProps {
  reportId: string;
  isPinned: boolean;
  onToggle?: (pinned: boolean) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function ReportWeeklyPinButton({
  reportId,
  isPinned,
  onToggle,
  size = 'sm',
  className,
}: ReportWeeklyPinButtonProps) {
  const [pinned, setPinned] = useState(isPinned);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPinned(isPinned);
  }, [isPinned]);

  async function togglePin() {
    const nextPinned = !pinned;
    setLoading(true);

    const res = await fetch('/api/admin/reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId, weeklySpotlight: nextPinned }),
    });

    setLoading(false);

    if (!res.ok) return;

    setPinned(nextPinned);
    onToggle?.(nextPinned);
  }

  return (
    <Button
      type="button"
      size={size}
      variant={pinned ? 'primary' : 'outline'}
      className={cn('gap-1.5', pinned && 'bg-amber-500 hover:bg-amber-600 border-amber-500', className)}
      onClick={togglePin}
      disabled={loading}
    >
      {pinned ? (
        <>
          <PinOff className="h-3.5 w-3.5" />
          {loading ? 'Duke hequr...' : 'Hiq Pinin'}
        </>
      ) : (
        <>
          <Pin className="h-3.5 w-3.5" />
          {loading ? 'Duke vendosur...' : 'Pin Report'}
        </>
      )}
    </Button>
  );
}
