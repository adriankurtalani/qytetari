'use client';

import { useEffect, useState } from 'react';
import { Share2, Link2, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import {
  buildReportShareMessage,
  formatReportShareText,
  getReportPublicPath,
} from '@/lib/report-url';

interface ReportShareButtonsProps {
  title: string;
  reportNumber: number;
  className?: string;
}

export function ReportShareButtons({ title, reportNumber, className }: ReportShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && 'share' in navigator);
  }, []);

  const shareText = formatReportShareText(reportNumber, title);

  function getShareUrl(): string {
    const path = getReportPublicPath(reportNumber);
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${path}`;
    }
    return path;
  }

  function handleWhatsApp() {
    const message = buildReportShareMessage(reportNumber, title, window.location.origin);
    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer'
    );
  }

  async function handleCopy() {
    const message = buildReportShareMessage(reportNumber, title, window.location.origin);
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Kopjo linkun:', getShareUrl());
    }
  }

  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareText,
          text: shareText,
          url: getShareUrl(),
        });
      } catch {
        // user cancelled
      }
    }
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="gap-1.5"
        onClick={handleWhatsApp}
      >
        <Share2 className="h-3.5 w-3.5" />
        WhatsApp
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="gap-1.5"
        onClick={handleCopy}
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-emerald-600" />
            U kopjua
          </>
        ) : (
          <>
            <Link2 className="h-3.5 w-3.5" />
            Kopjo linkun
          </>
        )}
      </Button>
      {canNativeShare && (
        <Button type="button" size="sm" variant="ghost" className="gap-1.5" onClick={handleNativeShare}>
          <Share2 className="h-3.5 w-3.5" />
          Shpërnda
        </Button>
      )}
    </div>
  );
}
