'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { generateAnonymousId } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface StoryLikeButtonProps {
  storyId: string;
  initialCount: number;
  initialLiked: boolean;
  isLoggedIn: boolean;
}

export function StoryLikeButton({
  storyId,
  initialCount,
  initialLiked,
  isLoggedIn,
}: StoryLikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  async function toggleLike() {
    setLoading(true);
    try {
      const body: Record<string, string> = {};
      if (!isLoggedIn) {
        body.anonymous_id = generateAnonymousId();
      }

      const res = await fetch(`/api/stories/${storyId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setCount(data.like_count);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      variant={liked ? 'primary' : 'outline'}
      className={cn('gap-1.5', liked && 'bg-rose-500 hover:bg-rose-600 border-rose-500')}
      onClick={toggleLike}
      loading={loading}
    >
      <Heart className={cn('h-4 w-4', liked && 'fill-current')} />
      {liked ? 'E pëlqyer' : 'Pëlqe'} ({count})
    </Button>
  );
}
