import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Building2, Users, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { isSupabaseConfigured, LOCAL_API_URL } from '@/api/supabaseClient';

const TOKEN_KEY = 'atlas_jwt_token';

function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

async function apiGet(path) {
  const base = import.meta.env.VITE_API_URL || LOCAL_API_URL;
  const res = await fetch(`${base}${path}`, {
    headers: {
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {})
    }
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
  return body;
}

export default function PlatformAdmin() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: () => apiGet('/api/platform/stats'),
    enabled: !isSupabaseConfigured && Boolean(getToken())
  });

  const { data: orgs, isLoading: orgsLoading, error } = useQuery({
    queryKey: ['platform-organizations'],
    queryFn: () => apiGet('/api/platform/organizations'),
    enabled: !isSupabaseConfigured && Boolean(getToken())
  });

  if (isSupabaseConfigured) {
    return (
      <div className="p-6 max-w-xl mx-auto" dir="rtl">
        <h1 className="text-xl font-bold text-gray-900 mb-2">ניהול פלטפורמה</h1>
        <p className="text-gray-600 text-sm leading-relaxed">
          מסך זה זמין כאשר האפליקציה מחוברת ל-API Express (הגדר <code className="bg-gray-100 px-1 rounded">VITE_API_URL</code>).
          בפרויקט Supabase-only יש להריץ שירות API נפרד או Edge Functions לפעולות מנהל מערכת.
        </p>
      </div>
    );
  }

  if (!getToken()) {
    return (
      <div className="p-6 max-w-xl mx-auto" dir="rtl">
        <p className="text-gray-600">יש להתחבר עם חשבון מנהל פלטפורמה.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-xl mx-auto flex items-start gap-3 text-red-700" dir="rtl">
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">אין גישה או שגיאת שרת</p>
          <p className="text-sm mt-1">{String(error.message)}</p>
        </div>
      </div>
    );
  }

  const list = orgs?.organizations ?? [];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ניהול פלטפורמה</h1>
        <p className="text-gray-600 text-sm mt-1">ארגונים, מנויים ונתונים ברמת המערכת (מוגבל למנהלי פלטפורמה).</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <Building2 className="w-8 h-8 text-indigo-600" />
          <div>
            <p className="text-xs text-gray-500">ארגונים</p>
            <p className="text-2xl font-bold">
              {statsLoading ? '—' : stats?.organization_count ?? 0}
            </p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <Users className="w-8 h-8 text-teal-600" />
          <div>
            <p className="text-xs text-gray-500">משתמשים</p>
            <p className="text-2xl font-bold">
              {statsLoading ? '—' : stats?.user_count ?? 0}
            </p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <Calendar className="w-8 h-8 text-amber-600" />
          <div>
            <p className="text-xs text-gray-500">הזמנות</p>
            <p className="text-2xl font-bold">
              {statsLoading ? '—' : stats?.booking_count ?? 0}
            </p>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-gray-100 font-semibold text-gray-900">ארגונים</div>
        {orgsLoading ? (
          <div className="p-12 flex justify-center text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-right text-gray-600">
                  <th className="p-3 font-medium">שם</th>
                  <th className="p-3 font-medium">תוכנית</th>
                  <th className="p-3 font-medium">משתמשים</th>
                  <th className="p-3 font-medium">מנוי</th>
                  <th className="p-3 font-medium">נוצר</th>
                </tr>
              </thead>
              <tbody>
                {list.map((o) => (
                  <tr key={o.id} className="border-t border-gray-100 hover:bg-gray-50/80">
                    <td className="p-3 font-medium text-gray-900">{o.name}</td>
                    <td className="p-3">{o.subscription_plan}</td>
                    <td className="p-3">{o.user_count}</td>
                    <td className="p-3 text-xs text-gray-600">{o.subscription_status || '—'}</td>
                    <td className="p-3 text-xs text-gray-500">
                      {o.created_at ? new Date(o.created_at).toLocaleDateString('he-IL') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {list.length === 0 && !orgsLoading && (
              <p className="p-8 text-center text-gray-500 text-sm">אין ארגונים להצגה</p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
