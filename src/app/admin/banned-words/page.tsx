'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ban, Plus, Trash2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { BackLink } from '@/components/ui/BackLink';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import type { BannedWord } from '@/lib/types';

export default function BannedWordsPage() {
  const router = useRouter();
  const [words, setWords] = useState<BannedWord[]>([]);
  const [newWord, setNewWord] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/admin/banned-words');
      if (res.status === 403) {
        router.push('/');
        return;
      }
      if (res.ok) setWords(await res.json());
      setLoading(false);
    }
    load();
  }, [router]);

  async function addWord(e: React.FormEvent) {
    e.preventDefault();
    if (!newWord.trim()) return;

    const res = await fetch('/api/admin/banned-words', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word: newWord }),
    });

    if (res.ok) {
      const word = await res.json();
      setWords((prev) => [word, ...prev]);
      setNewWord('');
    }
  }

  async function removeWord(id: string) {
    await fetch('/api/admin/banned-words', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setWords((prev) => prev.filter((w) => w.id !== id));
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-container-narrow py-6 sm:py-10 animate-fade-in">
      <BackLink href="/admin" label="Kthehu te paneli" />

      <PageHeader
        badge="Moderim"
        title="Fjalët e Ndaluara"
        description="Shtoni fjalë ofenduese që bllokojnë automatikisht përmbajtjen dhe IP-në e përdoruesit."
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50">
          <Ban className="h-6 w-6 text-red-500" />
        </div>
      </PageHeader>

      <Card className="mt-8" padding="md">
        <form onSubmit={addWord} className="flex flex-col sm:flex-row gap-3">
          <Input
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            placeholder="Shto fjalë të ndaluar..."
            className="flex-1 min-w-0"
          />
          <Button type="submit" className="gap-1.5 shrink-0 w-full sm:w-auto min-h-[44px]">
            <Plus className="h-4 w-4" /> Shto
          </Button>
        </form>
      </Card>

      <div className="mt-6">
        {words.length === 0 ? (
          <EmptyState
            icon={ShieldAlert}
            title="Nuk ka fjalë të ndaluara"
            description="Shtoni fjalë ofenduese për të aktivizuar filtrimin automatik."
          />
        ) : (
          <Card padding="none" className="divide-y divide-slate-100">
            {words.map((word) => (
              <div
                key={word.id}
                className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-500 text-xs font-bold">
                    #
                  </span>
                  <span className="font-semibold text-slate-900">{word.word}</span>
                </div>
                <button
                  onClick={() => removeWord(word.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                  aria-label="Fshi"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
