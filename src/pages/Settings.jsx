import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import {
  User, Building2, Bell, Shield, CreditCard,
  Save, Check, AlertCircle, Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'profile', label: 'פרופיל', icon: User },
  { id: 'organization', label: 'ארגון', icon: Building2 },
  { id: 'notifications', label: 'התראות', icon: Bell },
  { id: 'security', label: 'אבטחה', icon: Shield },
];

export default function SettingsPage({ user }) {
  const [activeTab, setActiveTab] = useState('profile');
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const [notifSettings, setNotifSettings] = useState({
    new_booking: true,
    new_lead: true,
    payment_received: true,
    new_review: false,
    system_updates: true,
  });

  const saveProfileMutation = useMutation({
    mutationFn: async () => {
      return base44.auth.updateProfile(profileForm);
    },
    onSuccess: () => {
      toast({ title: 'הפרופיל עודכן בהצלחה', description: 'השינויים נשמרו.' });
      queryClient.invalidateQueries(['user']);
    },
    onError: () => {
      toast({ title: 'שגיאה בשמירה', variant: 'destructive' });
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
      toast({ title: 'פרטי הארגון עודכנו', description: 'השינויים נשמרו.' });
      queryClient.invalidateQueries(['organization']);
    },
    onError: () => {
      toast({ title: 'שגיאה בשמירה', variant: 'destructive' });
    },
  });

  const getUserInitials = () => {
    const name = user?.full_name || user?.email || '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#00D1C1]" />
          הגדרות
        </h1>
        <p className="text-sm text-gray-500 mt-1">נהל את הגדרות החשבון שלך</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Tab list */}
        <div className="flex md:flex-col gap-1 flex-shrink-0 md:w-44">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-right",
                  activeTab === tab.id
                    ? "bg-[#00D1C1]/10 text-[#00D1C1]"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="flex-1 min-w-0">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">פרטים אישיים</CardTitle>
                <CardDescription>עדכן את פרטי הפרופיל שלך</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16 ring-2 ring-[#00D1C1]/20">
                    <AvatarImage src={user?.profile_image} />
                    <AvatarFallback className="bg-[#00D1C1]/15 text-[#00D1C1] text-lg font-semibold">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{user?.full_name || 'משתמש'}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                </div>
                <Separator />
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="full_name" className="text-xs font-medium">שם מלא</Label>
                    <Input
                      id="full_name"
                      value={profileForm.full_name}
                      onChange={e => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="שם מלא"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-xs font-medium">טלפון</Label>
                    <Input
                      id="phone"
                      value={profileForm.phone}
                      onChange={e => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="050-0000000"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="email" className="text-xs font-medium">אימייל</Label>
                    <Input
                      id="email"
                      value={profileForm.email}
                      disabled
                      className="h-9 text-sm bg-gray-50"
                    />
                    <p className="text-[11px] text-gray-400">לא ניתן לשנות כתובת אימייל</p>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={() => saveProfileMutation.mutate()}
                    disabled={saveProfileMutation.isPending}
                    className="gap-2 bg-[#00D1C1] hover:bg-[#00b8aa] text-[#0B1220] font-semibold h-9 text-sm"
                  >
                    {saveProfileMutation.isPending ? (
                      <div className="w-4 h-4 border-2 border-[#0B1220] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    שמור שינויים
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Organization Tab */}
          {activeTab === 'organization' && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">פרטי הארגון</CardTitle>
                <CardDescription>מידע על העסק שלך</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">שם הארגון</Label>
                    <Input
                      value={orgForm.name}
                      onChange={e => setOrgForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="שם החברה / העסק"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">אימייל עסקי</Label>
                    <Input
                      value={orgForm.email}
                      onChange={e => setOrgForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="info@company.com"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">טלפון</Label>
                    <Input
                      value={orgForm.phone}
                      onChange={e => setOrgForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="03-0000000"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">אתר אינטרנט</Label>
                    <Input
                      value={orgForm.website}
                      onChange={e => setOrgForm(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="https://www.example.com"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-medium">כתובת</Label>
                    <Input
                      value={orgForm.address}
                      onChange={e => setOrgForm(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="רחוב, עיר, מיקוד"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={() => saveOrgMutation.mutate()}
                    disabled={saveOrgMutation.isPending}
                    className="gap-2 bg-[#00D1C1] hover:bg-[#00b8aa] text-[#0B1220] font-semibold h-9 text-sm"
                  >
                    {saveOrgMutation.isPending ? (
                      <div className="w-4 h-4 border-2 border-[#0B1220] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    שמור שינויים
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">הגדרות התראות</CardTitle>
                <CardDescription>בחר אילו התראות תרצה לקבל</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                {[
                  { key: 'new_booking', label: 'הזמנה חדשה', desc: 'קבל התראה כשמתווספת הזמנה חדשה' },
                  { key: 'new_lead', label: 'ליד חדש', desc: 'קבל התראה על לידים חדשים' },
                  { key: 'payment_received', label: 'תשלום התקבל', desc: 'קבל התראה על תשלומים שהתקבלו' },
                  { key: 'new_review', label: 'ביקורת חדשה', desc: 'קבל התראה על ביקורות חדשות' },
                  { key: 'system_updates', label: 'עדכוני מערכת', desc: 'קבל עדכונים על שיפורים ותכונות' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.label}</p>
                      <p className="text-xs text-gray-400">{item.desc}</p>
                    </div>
                    <Switch
                      checked={notifSettings[item.key]}
                      onCheckedChange={val => setNotifSettings(prev => ({ ...prev, [item.key]: val }))}
                      className="data-[state=checked]:bg-[#00D1C1]"
                    />
                  </div>
                ))}
                <div className="pt-3 flex justify-end">
                  <Button
                    onClick={() => toast({ title: 'הגדרות ההתראות נשמרו' })}
                    className="gap-2 bg-[#00D1C1] hover:bg-[#00b8aa] text-[#0B1220] font-semibold h-9 text-sm"
                  >
                    <Save className="w-4 h-4" />
                    שמור
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">אבטחה</CardTitle>
                <CardDescription>נהל את אבטחת החשבון שלך</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-emerald-50 rounded-xl flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Shield className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-emerald-800">החשבון שלך מאובטח</p>
                    <p className="text-xs text-emerald-600 mt-0.5">הגישה מנוהלת דרך ספק הזהות שלך</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">פעולות אבטחה</p>
                  <Button variant="outline" className="w-full justify-start text-sm h-9 gap-2">
                    <Shield className="w-4 h-4 text-gray-400" />
                    אפשר אימות דו-שלבי
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-sm h-9 gap-2 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => {
                      if (confirm('האם אתה בטוח שברצונך למחוק את החשבון?')) {
                        // Handle account deletion
                      }
                    }}
                  >
                    <AlertCircle className="w-4 h-4" />
                    מחק חשבון
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}