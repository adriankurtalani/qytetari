'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Newspaper, Plus, Trash2, Eye, EyeOff, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { BackLink } from '@/components/ui/BackLink';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Toast } from '@/components/ui/Toast';
import { REPORT_STATUS_LABELS, REPORT_STATUS_COLORS } from '@/lib/constants';
import { getReportPublicPath, formatReportLabel } from '@/lib/report-url';
import { getStoryEffectiveStatus } from '@/lib/story-status';
import { formatRelativeDate, cn } from '@/lib/utils';
import type { Report, ReportStory } from '@/lib/types';

export default function AdminStoriesPage() {
  const router = useRouter();
  const [stories, setStories] = useState<ReportStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lookupNumber, setLookupNumber] = useState('');
  const [linkedReport, setLinkedReport] = useState<Report | null>(null);
  const [form, setForm] = useState({ title: '', content: '' });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', content: '' });

  const loadStories = useCallback(async () => {
    const res = await fetch('/api/admin/stories');
    if (res.status === 403) {
      router.push('/');
      return;
    }
    if (res.ok) setStories(await res.json());
    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  async function lookupReport() {
    if (!lookupNumber.trim()) return;
    const res = await fetch(`/api/admin/stories?reportNumber=${lookupNumber.trim()}`);
    const data = await res.json();
    if (!res.ok) {
      setToast({ message: data.error || 'Raporti nuk u gjet', type: 'error' });
      setLinkedReport(null);
      return;
    }
    setLinkedReport(data.report);
    setForm((prev) => ({
      ...prev,
      title: prev.title || data.report.title,
    }));
  }

  async function createStory(publish: boolean) {
    if (!linkedReport || !form.title.trim() || !form.content.trim()) {
      setToast({ message: 'Plotësoni të gjitha fushat dhe lidhni një raport', type: 'error' });
      return;
    }

    setSaving(true);
    const res = await fetch('/api/admin/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportNumber: linkedReport.report_number,
        title: form.title,
        content: form.content,
        publish,
      }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setToast({ message: data.error || 'Gabim', type: 'error' });
      return;
    }

    setStories((prev) => [data, ...prev]);
    setForm({ title: '', content: '' });
    setLinkedReport(null);
    setLookupNumber('');
    setToast({
      message: publish ? 'Lajmi u publikua' : 'Drafti u ruajt',
      type: 'success',
    });
  }

  async function updateStory(
    storyId: string,
    action: 'publish' | 'unpublish' | 'save' | 'refresh' | 'delete'
  ) {
    if (action === 'delete') {
      if (!window.confirm('Jeni i sigurt që doni ta fshini këtë lajm?')) return;
      const res = await fetch('/api/admin/stories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setToast({ message: data.error || 'Gabim', type: 'error' });
        return;
      }
      setStories((prev) => prev.filter((s) => s.id !== storyId));
      setToast({ message: 'Lajmi u fshi', type: 'success' });
      return;
    }

    const body: Record<string, unknown> = { storyId };
    if (action === 'publish') body.publish = true;
    if (action === 'unpublish') body.unpublish = true;
    if (action === 'refresh') body.refreshStatus = true;
    if (action === 'save') {
      body.title = editForm.title;
      body.content = editForm.content;
    }

    const res = await fetch('/api/admin/stories', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (!res.ok) {
      setToast({ message: data.error || 'Gabim', type: 'error' });
      return;
    }

    setStories((prev) => prev.map((s) => (s.id === storyId ? data : s)));
    setEditingId(null);
    setToast({ message: 'U përditësua', type: 'success' });
  }

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <div className="page-container py-6 sm:py-10 max-w-4xl animate-fade-in">
        <BackLink href="/admin" label="Kthehu te paneli" />

        <PageHeader
          badge="Administrim"
          title="Lajmet e Raportimeve"
          description="Lidhni një raport dhe publikoni përditësimin — vetëm admini menaxhon postimet."
        >
          <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-indigo-50">
            <Newspaper className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
          </div>
        </PageHeader>

        <Card padding="lg" className="mt-6 sm:mt-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-600" />
            Krijo lajm të ri
          </h2>

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <Input
              label="Numri i raportit"
              placeholder="p.sh. 142"
              value={lookupNumber}
              onChange={(e) => setLookupNumber(e.target.value)}
              className="flex-1"
            />
            <div className="flex items-end">
              <Button type="button" variant="outline" className="gap-1.5 w-full sm:w-auto" onClick={lookupReport}>
                <Search className="h-4 w-4" />
                Lidh raportin
              </Button>
            </div>
          </div>

          {linkedReport && (
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 mb-4 text-sm">
              <p className="font-semibold text-blue-900">
                {formatReportLabel(linkedReport.report_number)} · {linkedReport.title}
              </p>
              <p className="text-blue-700 mt-1">
                Statusi aktual: {REPORT_STATUS_LABELS[linkedReport.status]}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Titulli i lajmit"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="p.sh. U zgjidh problemi i gropës në rrugën X"
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Përmbajtja (shpjegimi i adminit)
              </label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={5}
                placeholder="Shpjegoni çfarë ndodhi, pse u zgjidh ose pse ende nuk është zgjidhur..."
                className="input-field resize-none text-base sm:text-sm w-full"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-5">
            <Button onClick={() => createStory(true)} loading={saving} className="gap-1.5">
              <Eye className="h-4 w-4" />
              Publiko
            </Button>
            <Button variant="outline" onClick={() => createStory(false)} loading={saving}>
              Ruaj si draft
            </Button>
          </div>
        </Card>

        <div className="mt-8 space-y-4">
          <h2 className="text-lg font-bold text-slate-900">
            Të gjitha lajmet ({stories.length})
          </h2>

          {stories.length === 0 ? (
            <EmptyState icon={Newspaper} title="Nuk ka lajme ende" />
          ) : (
            stories.map((story) => {
              const isEditing = editingId === story.id;
              const status = getStoryEffectiveStatus(story);
              return (
                <Card key={story.id} padding="md">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Badge className={cn(REPORT_STATUS_COLORS[status])}>
                      {REPORT_STATUS_LABELS[status]}
                    </Badge>
                    <Badge className={story.is_published ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}>
                      {story.is_published ? 'Publikuar' : 'Draft'}
                    </Badge>
                    {story.report && (
                      <span className="text-xs text-slate-500">
                        {formatReportLabel(story.report.report_number)}
                      </span>
                    )}
                    <span className="text-xs text-slate-400 ml-auto">
                      {story.like_count} pëlqime
                    </span>
                  </div>

                  {isEditing ? (
                    <div className="space-y-3 mb-4">
                      <Input
                        label="Titulli"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      />
                      <textarea
                        value={editForm.content}
                        onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                        rows={4}
                        className="input-field resize-none w-full text-sm"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => updateStory(story.id, 'save')}>
                          Ruaj
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                          Anulo
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-semibold text-slate-900">{story.title}</h3>
                      <p className="text-sm text-slate-600 mt-2 line-clamp-3 whitespace-pre-wrap">
                        {story.content}
                      </p>
                    </>
                  )}

                  <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-100">
                    {!isEditing && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(story.id);
                          setEditForm({ title: story.title, content: story.content });
                        }}
                      >
                        Ndrysho
                      </Button>
                    )}
                    {!story.is_published ? (
                      <Button size="sm" className="gap-1" onClick={() => updateStory(story.id, 'publish')}>
                        <Eye className="h-3.5 w-3.5" /> Publiko
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => updateStory(story.id, 'unpublish')}>
                        <EyeOff className="h-3.5 w-3.5" /> Ç'publiko
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => updateStory(story.id, 'refresh')}>
                      Rifresko statusin
                    </Button>
                    {story.report && (
                      <Link href={getReportPublicPath(story.report.report_number)}>
                        <Button size="sm" variant="ghost">Shiko raportin</Button>
                      </Link>
                    )}
                    <Button size="sm" variant="danger" className="gap-1" onClick={() => updateStory(story.id, 'delete')}>
                      <Trash2 className="h-3.5 w-3.5" /> Fshi
                    </Button>
                  </div>
                  {story.published_at && (
                    <p className="text-xs text-slate-400 mt-2">
                      Publikuar {formatRelativeDate(story.published_at)}
                    </p>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
