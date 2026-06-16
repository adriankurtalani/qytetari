'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { WORKFLOW_STATUSES, REPORT_STATUS_LABELS } from '@/lib/constants';
import type { ReportStatus } from '@/lib/types';

interface ReportStatusAdminProps {
  reportId: string;
  currentStatus: ReportStatus;
}

export function ReportStatusAdmin({ reportId, currentStatus }: ReportStatusAdminProps) {
  const router = useRouter();
  const [status, setStatus] = useState<ReportStatus>(currentStatus);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleUpdate() {
    if (status === currentStatus) return;

    setLoading(true);
    setMessage(null);

    const res = await fetch('/api/reports/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId, status }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || 'Gabim gjatë përditësimit');
      setLoading(false);
      return;
    }

    setMessage('Statusi u përditësua');
    router.refresh();
    setLoading(false);
  }

  return (
    <Card padding="md" className="border-blue-200 bg-blue-50/30">
      <div className="flex items-center gap-2 mb-4">
        <GitBranch className="h-5 w-5 text-blue-600" />
        <h3 className="font-bold text-slate-900 text-sm">Menaxho Statusin e Raportimit</h3>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Select
          label="Statusi i ri"
          className="flex-1"
          options={WORKFLOW_STATUSES.map((s) => ({
            value: s,
            label: REPORT_STATUS_LABELS[s],
          }))}
          value={status}
          onChange={(e) => setStatus(e.target.value as ReportStatus)}
        />
        <div className="flex items-end">
          <Button
            onClick={handleUpdate}
            disabled={loading || status === currentStatus}
            className="w-full sm:w-auto min-h-[42px]"
          >
            {loading ? 'Duke ruajtur...' : 'Përditëso'}
          </Button>
        </div>
      </div>

      {message && (
        <p className={`text-sm mt-3 ${message.includes('Gabim') ? 'text-red-600' : 'text-emerald-600'}`}>
          {message}
        </p>
      )}
    </Card>
  );
}
