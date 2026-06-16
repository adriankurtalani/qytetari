'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { BackLink } from '@/components/ui/BackLink';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';
import { KOSOVO_CITIES } from '@/lib/constants';
import type { Profile, UserRole } from '@/lib/types';
import { getCitizenTrustDisplay, renderTrustStars } from '@/lib/citizen-trust';

const cityOptions = [
  { value: '', label: '— Pa qytet —' },
  ...KOSOVO_CITIES.map((c) => ({ value: c, label: c })),
];

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/admin/users');
      if (res.status === 403) {
        router.push('/');
        return;
      }
      if (res.ok) setUsers(await res.json());
      setLoading(false);
    }
    load();
  }, [router]);

  async function updateUser(
    userId: string,
    updates: { role?: UserRole; is_verified?: boolean; city?: string }
  ) {
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...updates }),
    });
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, ...updates } : u))
    );
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-container py-6 sm:py-10 max-w-6xl animate-fade-in">
      <BackLink href="/admin" label="Kthehu te paneli" />

      <PageHeader
        badge="Administrim"
        title="Menaxhimi i Përdoruesve"
        description={`${users.length} përdorues të regjistruar në platformë.`}
      >
        <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-indigo-50">
          <Users className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
        </div>
      </PageHeader>

      {users.length === 0 ? (
        <EmptyState icon={Users} title="Nuk ka përdorues" className="mt-8" />
      ) : (
        <>
          {/* Mobile card layout */}
          <div className="mt-6 sm:mt-8 space-y-3 md:hidden">
            {users.map((user) => (
              <Card key={user.id} padding="md" className="min-w-0">
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-600 shrink-0">
                    {(user.full_name?.[0] || user.username?.[0] || '?').toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900 truncate">
                      {user.full_name && user.full_name !== 'User'
                        ? user.full_name
                        : user.email?.split('@')[0] || user.username}
                    </p>
                    <p className="text-slate-400 text-xs truncate">@{user.username}</p>
                    <p className="text-slate-500 text-xs mt-1 truncate break-all">{user.email || '-'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex flex-col gap-2">
                    <span className="text-slate-500 shrink-0 text-xs">Qyteti / Rajoni</span>
                    <Select
                      options={cityOptions}
                      value={user.city || ''}
                      onChange={(e) => updateUser(user.id, { city: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500 shrink-0">Roli</span>
                    <Select
                      options={[
                        { value: 'citizen', label: 'Qytetar' },
                        { value: 'business', label: 'Biznes' },
                        { value: 'municipality', label: 'Komunë' },
                        { value: 'admin', label: 'Admin' },
                      ]}
                      value={user.role}
                      onChange={(e) => updateUser(user.id, { role: e.target.value as UserRole })}
                      className="w-full max-w-[160px]"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500 shrink-0">Citizen Score</span>
                    {user.role === 'citizen' ? (
                      <span className="text-xs font-medium text-amber-800">
                        {renderTrustStars(getCitizenTrustDisplay({ citizen_score: user.citizen_score ?? 50 }).stars)}{' '}
                        {user.citizen_score ?? 50}/100
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500">Verifikuar</span>
                    <Button
                      size="sm"
                      variant={user.is_verified ? 'primary' : 'outline'}
                      onClick={() => updateUser(user.id, { is_verified: !user.is_verified })}
                      className="min-w-[52px] min-h-[40px]"
                    >
                      {user.is_verified ? 'Po' : 'Jo'}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-xs text-slate-400 pt-1 border-t border-slate-100">
                    <span>Regjistruar</span>
                    <span>{formatDate(user.created_at)}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop table */}
          <Card padding="none" className="mt-8 overflow-hidden hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left p-4 font-semibold text-slate-600">Përdoruesi</th>
                    <th className="text-left p-4 font-semibold text-slate-600">Email</th>
                    <th className="text-left p-4 font-semibold text-slate-600">Qyteti</th>
                    <th className="text-left p-4 font-semibold text-slate-600">Roli</th>
                    <th className="text-left p-4 font-semibold text-slate-600">Citizen Score</th>
                    <th className="text-left p-4 font-semibold text-slate-600">Verifikuar</th>
                    <th className="text-left p-4 font-semibold text-slate-600">Regjistruar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-600 shrink-0">
                            {(user.full_name?.[0] || user.username?.[0] || '?').toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate">
                              {user.full_name && user.full_name !== 'User'
                                ? user.full_name
                                : user.email?.split('@')[0] || user.username}
                            </p>
                            <p className="text-slate-400 text-xs truncate">@{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-600 max-w-[200px] truncate">{user.email || '-'}</td>
                      <td className="p-4">
                        <Select
                          options={cityOptions}
                          value={user.city || ''}
                          onChange={(e) => updateUser(user.id, { city: e.target.value })}
                          className="w-40"
                        />
                      </td>
                      <td className="p-4">
                        <Select
                          options={[
                            { value: 'citizen', label: 'Qytetar' },
                            { value: 'business', label: 'Biznes' },
                            { value: 'municipality', label: 'Komunë' },
                            { value: 'admin', label: 'Admin' },
                          ]}
                          value={user.role}
                          onChange={(e) => updateUser(user.id, { role: e.target.value as UserRole })}
                          className="w-36"
                        />
                      </td>
                      <td className="p-4">
                        {user.role === 'citizen' ? (
                          <span className="text-xs font-medium text-amber-800 whitespace-nowrap">
                            {renderTrustStars(getCitizenTrustDisplay({ citizen_score: user.citizen_score ?? 50 }).stars)}{' '}
                            {user.citizen_score ?? 50}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="p-4">
                        <Button
                          size="sm"
                          variant={user.is_verified ? 'primary' : 'outline'}
                          onClick={() => updateUser(user.id, { is_verified: !user.is_verified })}
                          className="min-w-[52px]"
                        >
                          {user.is_verified ? 'Po' : 'Jo'}
                        </Button>
                      </td>
                      <td className="p-4 text-slate-400 text-xs whitespace-nowrap">
                        {formatDate(user.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
