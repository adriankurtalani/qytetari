'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, CheckCheck, FileText, MessageSquare, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatRelativeDate } from '@/lib/utils';
import type { Notification, NotificationType } from '@/lib/types';

const TYPE_ICONS: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  report_approved: FileText,
  report_rejected: FileText,
  new_comment: MessageSquare,
  status_changed: FileText,
  business_response: Building2,
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/notifications');
      if (res.status === 401) {
        router.push('/auth/login');
        return;
      }
      if (res.ok) setNotifications(await res.json());
      setLoading(false);
    }
    load();
  }, [router]);

  async function markAsRead(id: string) {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  }

  async function markAllRead() {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mark_all_read: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-container-narrow py-6 sm:py-10 animate-fade-in">
      <PageHeader
        badge="Njoftime"
        title="Njoftimet"
        description={
          unreadCount > 0
            ? `${unreadCount} njoftime të palexuara`
            : 'Të gjitha njoftimet janë lexuar'
        }
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 relative">
          <Bell className="h-6 w-6 text-blue-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </div>
      </PageHeader>

      {unreadCount > 0 && (
        <div className="mt-6">
          <Button variant="outline" size="sm" onClick={markAllRead} className="gap-1.5">
            <CheckCheck className="h-4 w-4" /> Shëno të gjitha si të lexuara
          </Button>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="Nuk keni njoftime"
            description="Do të njoftoheni kur ndodh diçka e rëndësishme."
          />
        ) : (
          notifications.map((notification) => {
            const Icon = TYPE_ICONS[notification.type] || Bell;
            const content = (
              <Card
                padding="md"
                className={`card-hover transition-all ${
                  !notification.is_read ? 'border-blue-200 bg-blue-50/30' : ''
                }`}
              >
                <div className="flex gap-4">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      !notification.is_read ? 'bg-blue-100' : 'bg-slate-100'
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${
                        !notification.is_read ? 'text-blue-600' : 'text-slate-400'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`text-sm ${
                        !notification.is_read
                          ? 'font-semibold text-slate-900'
                          : 'font-medium text-slate-700'
                      }`}
                    >
                      {notification.title}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                      {notification.message}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      {formatRelativeDate(notification.created_at)}
                    </p>
                    {notification.link && (
                      <span className="text-sm text-blue-600 font-medium mt-2 inline-block">
                        Shiko detajet →
                      </span>
                    )}
                  </div>
                  {!notification.is_read && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium shrink-0"
                    >
                      Lexo
                    </button>
                  )}
                </div>
              </Card>
            );

            if (notification.link) {
              return (
                <Link
                  key={notification.id}
                  href={notification.link}
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                >
                  {content}
                </Link>
              );
            }

            return <div key={notification.id}>{content}</div>;
          })
        )}
      </div>
    </div>
  );
}
