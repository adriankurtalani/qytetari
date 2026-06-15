'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { formatRelativeDate } from '@/lib/utils';
import type { Comment, Profile } from '@/lib/types';

interface CommentSectionProps {
  reportId: string;
  comments: Comment[];
  isVerified: boolean;
  currentUserId?: string;
}

export function CommentSection({
  reportId,
  comments: initialComments,
  isVerified,
  currentUserId,
}: CommentSectionProps) {
  const [comments, setComments] = useState(initialComments);
  const [content, setContent] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !isVerified) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/reports/${reportId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, parent_id: replyTo }),
      });

      if (res.ok) {
        const newComment = await res.json();
        if (replyTo) {
          setComments((prev) =>
            prev.map((c) =>
              c.id === replyTo
                ? { ...c, replies: [...(c.replies || []), newComment] }
                : c
            )
          );
        } else {
          setComments((prev) => [...prev, newComment]);
        }
        setContent('');
        setReplyTo(null);
      }
    } finally {
      setLoading(false);
    }
  }

  function renderComment(comment: Comment, isReply = false) {
    const author = comment.profile?.anonymous_mode
      ? 'Anonim'
      : comment.profile?.username || 'Përdorues';

    return (
      <div key={comment.id} className={isReply ? 'ml-3 sm:ml-8 mt-3' : 'mt-4'}>
        <div className="rounded-lg bg-gray-50 p-3 sm:p-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-2">
            <span className="text-sm font-medium text-gray-900 break-words">{author}</span>
            <span className="text-xs text-gray-500">
              {formatRelativeDate(comment.created_at)}
            </span>
          </div>
          <p className="text-sm text-gray-700 break-words">{comment.content}</p>
          {isVerified && !isReply && (
            <button
              onClick={() => setReplyTo(comment.id)}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800"
            >
              Përgjigju
            </button>
          )}
        </div>
        {comment.replies?.map((reply) => renderComment(reply, true))}
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Komentet ({comments.length})
      </h3>

      {isVerified ? (
        <form onSubmit={handleSubmit} className="mb-6">
          {replyTo && (
            <p className="text-sm text-gray-500 mb-2">
              Duke përgjigjur...{' '}
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="text-blue-600"
              >
                Anulo
              </button>
            </p>
          )}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Shkruani komentin tuaj..."
            className="w-full min-w-0 rounded-lg border border-gray-300 p-3 text-base sm:text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows={3}
          />
          <Button type="submit" className="mt-2 w-full sm:w-auto min-h-[44px]" loading={loading} disabled={!content.trim()}>
            Posto Komentin
          </Button>
        </form>
      ) : (
        <p className="text-sm text-gray-500 mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          Vetëm përdoruesit e verifikuar që janë të kyçur mund të komentojnë dhe përgjigjen.
        </p>
      )}

      <div>{comments.map((c) => renderComment(c))}</div>
    </div>
  );
}
