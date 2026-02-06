import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Building2,
  User,
  Plus,
  Settings as SettingsIcon,
  Trash2,
  Edit,
  Save,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';

export default function Settings({ user, selectedPropertyId, orgId, properties }) {
  const [activeTab, setActiveTab] = useState('properties');
  const [isPropertyDialogOpen, setIsPropertyDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const queryClient = useQueryClient();

  const [newProperty, setNewProperty] = useState({
    name: '',
    city: '',
    address: '',
    checkin_time: '15:00',
    checkout_time: '11:00'
  });

  const [userSettings, setUserSettings] = useState({
    language: 'he',
    phone: ''
  });

  // Load user settings
  useEffect(() => {
    if (user) {
      setUserSettings({
        language: user.language || 'he',
        phone: user.phone || ''
      });
    }
  }, [user]);

  // Fetch organization
  const { data: organization } = useQuery({
    queryKey: ['organization', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const orgs = await base44.entities.Organization.filter({ id: orgId });
      return orgs[0] || null;
    },
    enabled: !!orgId
  });

  // Create property mutation
  const createPropertyMutation = useMutation({
    mutationFn: (data) => base44.entities.Property.create({
      ...data,
      org_id: orgId,
      timezone: 'Asia/Jerusalem'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      setIsPropertyDialogOpen(false);
      resetPropertyForm();
      toast.success('הנכס נוצר בהצלחה');
    }
  });

  // Update property mutation
  const updatePropertyMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Property.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      setIsPropertyDialogOpen(false);
      resetPropertyForm();
      toast.success('הנכס עודכן בהצלחה');
    }
  });

  // Delete property mutation
  const deletePropertyMutation = useMutation({
    mutationFn: (id) => base44.entities.Property.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('הנכס נמחק בהצלחה');
    }
  });

  // Update user settings mutation
  const updateUserMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      toast.success('ההגדרות נשמרו בהצלחה');
    }
  });

  // Delete account states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const resetPropertyForm = () => {
    setNewProperty({
      name: '',
      city: '',
      address: '',
      checkin_time: '15:00',
      checkout_time: '11:00'
    });
    setEditingProperty(null);
  };

  const handleEditProperty = (property) => {
    setEditingProperty(property);
    setNewProperty({
      name: property.name,
      city: property.city || '',
      address: property.address || '',
      checkin_time: property.checkin_time || '15:00',
      checkout_time: property.checkout_time || '11:00'
    });
    setIsPropertyDialogOpen(true);
  };

  const handleSaveProperty = () => {
    if (editingProperty) {
      updatePropertyMutation.mutate({ id: editingProperty.id, data: newProperty });
    } else {
      createPropertyMutation.mutate(newProperty);
    }
  };

  const handleSaveUserSettings = () => {
    updateUserMutation.mutate(userSettings);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0B1220]">הגדרות</h1>
        <p className="text-gray-500">ניהול נכסים, משתמשים והעדפות</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="rounded-xl">
          <TabsTrigger value="properties" className="rounded-lg gap-2">
            <Building2 className="h-4 w-4" />
            נכסים
          </TabsTrigger>
          <TabsTrigger value="account" className="rounded-lg gap-2">
            <User className="h-4 w-4" />
            חשבון
          </TabsTrigger>
          <TabsTrigger value="preferences" className="rounded-lg gap-2">
            <SettingsIcon className="h-4 w-4" />
            העדפות
          </TabsTrigger>
        </TabsList>

        {/* Properties Tab */}
        <TabsContent value="properties" className="mt-6">
          <div className="flex justify-end mb-4">
            <Button 
              onClick={() => {
                resetPropertyForm();
                setIsPropertyDialogOpen(true);
              }}
              className="bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220] rounded-xl gap-2"
            >
              <Plus className="h-4 w-4" />
              נכס חדש
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                אין נכסים עדיין. הוסף את הנכס הראשון שלך!
              </div>
            ) : (
              properties.map(property => (
                <Card key={property.id} className="border-0 shadow-sm rounded-2xl hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#00D1C1]/10 rounded-xl flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-[#00D1C1]" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-[#0B1220]">{property.name}</h3>
                          <p className="text-sm text-gray-500">{property.city || '-'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1 mb-4">
                      <p>צ׳ק-אין: {property.checkin_time || '15:00'}</p>
                      <p>צ׳ק-אאוט: {property.checkout_time || '11:00'}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="rounded-lg flex-1"
                        onClick={() => handleEditProperty(property)}
                      >
                        <Edit className="h-3 w-3 ml-1" />
                        ערוך
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="rounded-lg text-red-600 hover:bg-red-50"
                        onClick={() => {
                          if (window.confirm('האם אתה בטוח שברצונך למחוק את הנכס?')) {
                            deletePropertyMutation.mutate(property.id);
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="mt-6">
          <Card className="border-0 shadow-sm rounded-2xl max-w-lg">
            <CardHeader>
              <CardTitle>פרטי חשבון</CardTitle>
              <CardDescription>פרטים אישיים ומידע על החשבון</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>שם מלא</Label>
                <Input 
                  value={user?.full_name || ''}
                  disabled
                  className="mt-1 rounded-xl bg-gray-50"
                />
              </div>
              <div>
                <Label>אימייל</Label>
                <Input 
                  value={user?.email || ''}
                  disabled
                  className="mt-1 rounded-xl bg-gray-50"
                  dir="ltr"
                />
              </div>
              <div>
                <Label>טלפון</Label>
                <Input 
                  value={userSettings.phone}
                  onChange={(e) => setUserSettings({ ...userSettings, phone: e.target.value })}
                  className="mt-1 rounded-xl"
                  placeholder="050-000-0000"
                  dir="ltr"
                />
              </div>
              <div>
                <Label>תפקיד</Label>
                <Input 
                  value={user?.app_role === 'OWNER' ? 'בעלים' : user?.app_role === 'MANAGER' ? 'מנהל' : 'צוות ניקיון'}
                  disabled
                  className="mt-1 rounded-xl bg-gray-50"
                />
              </div>
              <Button 
                onClick={handleSaveUserSettings}
                disabled={updateUserMutation.isPending}
                className="w-full bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220] rounded-xl gap-2"
              >
                <Save className="h-4 w-4" />
                {updateUserMutation.isPending ? 'שומר...' : 'שמור שינויים'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="mt-6">
          <Card className="border-0 shadow-sm rounded-2xl max-w-lg">
            <CardHeader>
              <CardTitle>העדפות</CardTitle>
              <CardDescription>התאמה אישית של המערכת</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  שפה
                </Label>
                <Select 
                  value={userSettings.language} 
                  onValueChange={(value) => setUserSettings({ ...userSettings, language: value })}
                >
                  <SelectTrigger className="mt-1 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="he">עברית</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleSaveUserSettings}
                disabled={updateUserMutation.isPending}
                className="w-full bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220] rounded-xl gap-2"
              >
                <Save className="h-4 w-4" />
                {updateUserMutation.isPending ? 'שומר...' : 'שמור שינויים'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Account Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">מחיקת חשבון</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-800 font-medium mb-2">אזהרה: פעולה בלתי הפיכה</p>
              <p className="text-xs text-red-600">
                מחיקת החשבון תמחק את כל הנתונים שלך לצמיתות, כולל נכסים, הזמנות, לידים ותשלומים.
              </p>
            </div>

            <div>
              <Label>הקלד "מחק את החשבון שלי" לאישור</Label>
              <Input 
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="mt-1 rounded-xl"
                placeholder="מחק את החשבון שלי"
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setDeleteConfirmText('');
              }} 
              className="rounded-xl"
            >
              ביטול
            </Button>
            <Button 
              disabled={deleteConfirmText !== 'מחק את החשבון שלי'}
              onClick={() => {
                toast.error('פונקציונליות זו תתווסף בקרוב');
                setIsDeleteDialogOpen(false);
                setDeleteConfirmText('');
              }}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
            >
              מחק חשבון לצמיתות
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Property Dialog */}
      <Dialog open={isPropertyDialogOpen} onOpenChange={setIsPropertyDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{editingProperty ? 'ערוך נכס' : 'נכס חדש'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>שם הנכס</Label>
              <Input 
                value={newProperty.name}
                onChange={(e) => setNewProperty({ ...newProperty, name: e.target.value })}
                className="mt-1 rounded-xl"
                placeholder="לדוגמה: וילה בכפר ורדים"
              />
            </div>
            <div>
              <Label>עיר</Label>
              <Input 
                value={newProperty.city}
                onChange={(e) => setNewProperty({ ...newProperty, city: e.target.value })}
                className="mt-1 rounded-xl"
                placeholder="לדוגמה: כפר ורדים"
              />
            </div>
            <div>
              <Label>כתובת</Label>
              <Input 
                value={newProperty.address}
                onChange={(e) => setNewProperty({ ...newProperty, address: e.target.value })}
                className="mt-1 rounded-xl"
                placeholder="כתובת מלאה"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>שעת צ׳ק-אין</Label>
                <Input 
                  type="time"
                  value={newProperty.checkin_time}
                  onChange={(e) => setNewProperty({ ...newProperty, checkin_time: e.target.value })}
                  className="mt-1 rounded-xl"
                />
              </div>
              <div>
                <Label>שעת צ׳ק-אאוט</Label>
                <Input 
                  type="time"
                  value={newProperty.checkout_time}
                  onChange={(e) => setNewProperty({ ...newProperty, checkout_time: e.target.value })}
                  className="mt-1 rounded-xl"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPropertyDialogOpen(false)} className="rounded-xl">
              ביטול
            </Button>
            <Button 
              onClick={handleSaveProperty}
              disabled={!newProperty.name || createPropertyMutation.isPending || updatePropertyMutation.isPending}
              className="bg-[#00D1C1] hover:bg-[#00B8A9] text-[#0B1220] rounded-xl"
            >
              {(createPropertyMutation.isPending || updatePropertyMutation.isPending) ? 'שומר...' : 'שמור'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}