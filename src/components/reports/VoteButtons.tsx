'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { generateAnonymousId } from '@/lib/utils';
import type { VoteType } from '@/lib/types';

interface VoteButtonsProps {
  reportId: string;
  supportCount: number;
  disagreeCount: number;
  userVote?: VoteType | null;
  isLoggedIn: boolean;
}

export function VoteButtons({
  reportId,
  supportCount,
  disagreeCount,
  userVote,
  isLoggedIn,
}: VoteButtonsProps) {
  const [support, setSupport] = useState(supportCount);
  const [disagree, setDisagree] = useState(disagreeCount);
  const [currentVote, setCurrentVote] = useState<VoteType | null>(userVote || null);
  const [loading, setLoading] = useState(false);

  async function handleVote(voteType: VoteType) {
    setLoading(true);
    try {
      const body: Record<string, string> = { vote_type: voteType };
      if (!isLoggedIn) {
        body.anonymous_id = generateAnonymousId();
      }

      const res = await fetch(`/api/reports/${reportId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        setSupport(data.support_count);
        setDisagree(data.disagree_count);
        setCurrentVote(data.user_vote);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full">
      <Button
        variant={currentVote === 'support' ? 'primary' : 'outline'}
        size="sm"
        onClick={() => handleVote('support')}
        loading={loading}
        className="gap-2 flex-1 sm:flex-none min-h-[44px]"
      >
        <ThumbsUp className="h-4 w-4" />
        Mbështet ({support})
      </Button>
      <Button
        variant={currentVote === 'disagree' ? 'danger' : 'outline'}
        size="sm"
        onClick={() => handleVote('disagree')}
        loading={loading}
        className="gap-2 flex-1 sm:flex-none min-h-[44px]"
      >
        <ThumbsDown className="h-4 w-4" />
        Nuk pajtohem ({disagree})
      </Button>
    </div>
  );
}
