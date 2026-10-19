import { Page, PageHeader } from '@/components/ds';
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import {
  User, Building2, Bell, Shield,
  Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';
import { Wand2, Compass } from 'lucide-react';
import HelpHint from '@/components/help/HelpHint';
import { startTour } from '@/lib/tour/tourState';
import SecuritySettings from '@/components/settings/SecuritySettings';
import { readOrgSettings, writeOrgSettings } from '@/lib/onboarding/orgSettings';

const tabs = [
  { id: 'profile', label: 'פרופיל', icon: User },
  { id: 'organization', label: 'העסק', icon: Building2 },
  { id: 'notifications', label: 'התראות', icon: Bell },
  { id: 'security', label: 'אבטחה', icon: Shield },
];

export default function SettingsPage({ user }) {
  // Deep links (?tab=organization) — used by the help bot's in-app links.
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const t = new URLSearchParams(window.location.search).get('tab');
      return tabs.some((x) => x.id === t) ? t : 'profile';
    } catch { return 'profile'; }
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { logout } = useAuth();

  const { data: org } = useQuery({
    queryKey: ['organization'],
    queryFn: () => base44.entities.Organization.list().then(orgs => orgs[0] || null),
    enabled: !!user,
  });

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  // Org form state
  const [orgForm, setOrgForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    website: '',
  });

  useEffect(() => {
    if (org) {
      setOrgForm({
        name: org.name || '',
        email: org.email || '',
        phone: org.phone || '',
        address: org.address || '',
        website: org.website || '',
      });
    }
  }, [org]);

  // Saved in organizations.settings (migration 010), not just a toast.
  const [notifSettings, setNotifSettings] = useState(() => ({
    new_booking: true,
    new_lead: true,
    payment_received: true,
    new_review: false,
    system_updates: true,
    ...(readOrgSettings(user?.organization_id)?.notification_prefs || {}),
  }));
  const [savingNotif, setSavingNotif] = useState(false);
  const saveNotif = async () => {
    setSavingNotif(true);
    try {
      await writeOrgSettings(user?.organization_id, { notification_prefs: notifSettings });
      toast({ title: 'העדפות ההתראות נשמרו' });
    } catch {
      toast({ title: 'לא הצלחנו לשמור. נסו שוב.', variant: 'destructive' });
    } finally {
      setSavingNotif(false);
    }
  };

  const saveProfileMutation = useMutation({
    mutationFn: async () => {
      return base44.auth.updateMe(profileForm);
    },
    onSuccess: () => {
      toast({ title: 'הפרטים נשמרו', description: 'השינויים כבר בתוקף.' });
      queryClient.invalidateQueries(['user']);
    },
    onError: () => {
      toast({ title: 'לא הצלחנו לשמור. בדקו את החיבור ונסו שוב.', variant: 'destructive' });
    },
  });

  const saveOrgMutation = useMutation({
    mutationFn: async () => {
      if (org?.id) {
        return base44.entities.Organization.update(org.id, orgForm);
      } else {
        return base44.entities.Organization.create(orgForm);
      }
    },
    onSuccess: () => {
      toast({ title: 'פרטי העסק נשמרו', description: 'השינויים כבר בתוקף.' });
      queryClient.invalidateQueries(['organization']);
    },
    onError: () => {
      toast({ title: 'לא הצלחנו לשמור. בדקו את החיבור ונסו שוב.', variant: 'destructive' });
    },
  });

  const getUserInitials = () => {
    const name = user?.full_name || user?.email || '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  return (
    <Page className="max-w-[1000px]">
      <PageHeader title="הגדרות" help="settings.page" subtitle="הפרטים שלכם, פרטי העסק, ההתראות והאבטחה." />

      <div data-tour="settings-tour" className="v7-card mb-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-brand-50 text-brand-600" aria-hidden><Compass className="h-5 w-5" strokeWidth={1.75} /></span>
          <div className="min-w-0">
            <p className="flex items-center gap-0.5 text-[16px] font-bold text-navy-900">סיור מודרך<HelpHint id="settings.tour" /></p>
            <p className="mt-0.5 text-[14px] text-ink-600">דקה אחת על המסכים העיקריים, עם הסבר קולי אם רוצים.</p>
          </div>
        </div>
        <Button variant="outline" className="h-11 shrink-0 rounded-full px-5" onClick={() => startTour(0)}>התחלת הסיור</Button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Tab list */}
        <div className="v7-strip -mx-5 flex gap-1.5 overflow-x-auto px-5 pb-1 md:mx-0 md:w-56 md:flex-col md:px-0 flex-shrink-0">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "press flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full px-4 text-[15px] text-right min-h-[44px]",
                  activeTab === tab.id
                    ? "bg-navy-900 font-semibold text-white shadow-[0_6px_14px_-6px_rgba(27,38,86,0.5)]"
                    : "bg-white font-medium text-ink-600 ring-1 ring-inset ring-[#E8EAF2] hover:text-navy-900 md:bg-transparent md:ring-0 md:hover:bg-white"
                )}
              >
                <Icon className={cn("h-[18px] w-[18px] flex-shrink-0", activeTab === tab.id ? "text-white" : "text-ink-400")} strokeWidth={1.6} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="flex-1 min-w-0">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-[18px] font-bold">פרטים אישיים</CardTitle>
                <CardDescription>השם והטלפון שלכם</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16 ring-4 ring-white shadow-card">
                    <AvatarImage src={user?.profile_image} />
                    <AvatarFallback className="bg-[#E7E5FE] text-brand-600 text-lg font-bold">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-navy-900">{user?.full_name || 'החשבון שלי'}</p>
                    <p className="text-xs text-ink-600">{user?.email}</p>
                  </div>
                </div>
                <Separator />
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="full_name" className="text-[14px] font-medium text-navy-900">שם מלא</Label>
                    <Input
                      id="full_name"
                      value={profileForm.full_name}
                      onChange={e => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="שם מלא"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-[14px] font-medium text-navy-900">טלפון</Label>
                    <Input
                      id="phone"
                      value={profileForm.phone}
                      onChange={e => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="050-0000000"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="email" className="text-[14px] font-medium text-navy-900">אימייל</Label>
                    <Input
                      id="email"
                      value={profileForm.email}
                      disabled
                      className="bg-canvas"
                    />
                    <p className="text-[12px] text-ink-400">את המייל אי אפשר לשנות כאן. צריכים? כתבו לנו.</p>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={() => saveProfileMutation.mutate()}
                    disabled={saveProfileMutation.isPending}
                    className="gap-2"
                  >
                    {saveProfileMutation.isPending ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    שמירה
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Organization Tab */}
          {activeTab === 'organization' && (
            <>
            <div className="v7-card mb-5 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-brand-50 text-brand-600" aria-hidden><Wand2 className="h-5 w-5" strokeWidth={1.75} /></span>
                <div>
                  <p className="flex items-center gap-0.5 text-[16px] font-bold text-navy-900">הגדרת העסק<HelpHint id="settings.setup" /></p>
                  <p className="mt-0.5 text-[14px] text-ink-600">השם, היחידות, שעות הכניסה, וואטסאפ והערוצים, במסלול הקצר.</p>
                </div>
              </div>
              <Button asChild variant="outline" className="h-11 shrink-0 rounded-full px-5">
                <Link to="/onboarding?again=1">פתיחת ההגדרה</Link>
              </Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-[18px] font-bold">פרטי העסק</CardTitle>
                <CardDescription>השם, הטלפון והכתובת של העסק</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[14px] font-medium text-navy-900">שם העסק</Label>
                    <Input
                      value={orgForm.name}
                      onChange={e => setOrgForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="למשל: צימרי הגליל"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[14px] font-medium text-navy-900">אימייל עסקי</Label>
                    <Input
                      value={orgForm.email}
                      onChange={e => setOrgForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="info@company.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[14px] font-medium text-navy-900">טלפון</Label>
                    <Input
                      value={orgForm.phone}
                      onChange={e => setOrgForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="03-0000000"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[14px] font-medium text-navy-900">אתר אינטרנט</Label>
                    <Input
                      value={orgForm.website}
                      onChange={e => setOrgForm(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="https://www.example.com"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-[14px] font-medium text-navy-900">כתובת</Label>
                    <Input
                      value={orgForm.address}
                      onChange={e => setOrgForm(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="רחוב, עיר, מיקוד"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={() => saveOrgMutation.mutate()}
                    disabled={saveOrgMutation.isPending}
                    className="gap-2"
                  >
                    {saveOrgMutation.isPending ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    שמירה
                  </Button>
                </div>
              </CardContent>
            </Card>
            </>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-[18px] font-bold">הגדרות התראות</CardTitle>
                <CardDescription>בחרו על מה תרצו לקבל התראות</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                {[
                  { key: 'new_booking', label: 'הזמנה חדשה', desc: 'כשנכנסת הזמנה חדשה' },
                  { key: 'new_lead', label: 'ליד חדש', desc: 'כשמגיעה פנייה חדשה' },
                  { key: 'payment_received', label: 'תשלום התקבל', desc: 'כשמתקבל תשלום' },
                  { key: 'new_review', label: 'ביקורת חדשה', desc: 'כשנכתבת ביקורת חדשה' },
                  { key: 'system_updates', label: 'חידושים', desc: 'כשמשהו חדש מגיע' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between py-3 border-b border-line last:border-0">
                    <div>
                      <p className="text-sm font-medium text-navy-900">{item.label}</p>
                      <p className="text-xs text-ink-400">{item.desc}</p>
                    </div>
                    <Switch
                      checked={notifSettings[item.key]}
                      onCheckedChange={val => setNotifSettings(prev => ({ ...prev, [item.key]: val }))}
                      className="data-[state=checked]:bg-brand-600"
                    />
                  </div>
                ))}
                <div className="pt-3 flex justify-end">
                  <Button
                    onClick={saveNotif}
                    disabled={savingNotif}
                    className="gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {savingNotif ? 'שומרים…' : 'שמירה'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <SecuritySettings
              user={user}
              onDeleted={async () => {
                try { await logout(false); } catch { /* session is already gone */ }
                window.location.href = '/login?success=' + encodeURIComponent('החשבון נמחק. תודה שהייתם איתנו.');
              }}
            />
          )}
        </div>
      </div>
    </Page>
  );
}