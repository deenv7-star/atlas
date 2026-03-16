import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Globe, Copy, Share2, Wifi, Clock, Home, MapPin, QrCode, Eye, ExternalLink, Plus } from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_HOUSE_RULES = `• אין עישון בתוך הדירה
• שקט אחרי 22:00
• אין מסיבות או אירועים
• להחזיר מפתחות במקום שנקבע`;

const DEFAULT_RECOMMENDATIONS = [
  { id: 1, name: 'מסעדת הדגים', type: 'מסעדה', note: '5 דקות הליכה' },
  { id: 2, name: 'חוף הים הצפוני', type: 'חוף', note: '10 דקות נסיעה' },
  { id: 3, name: 'שוק הפשפשים', type: 'אטרקציה', note: 'ימי שישי' },
];

const DEFAULT_ARRIVAL_INSTRUCTIONS = `הגעה: נכנסים לחניון, עולים לקומה 2.
המפתחות נמצאים בקופסת מפתחות ליד הדלת — הקוד נשלח בהודעה נפרדת.
במקרה חירום: 050-1234567`;

export default function GuestPortal() {
  const [checkIn, setCheckIn] = useState('15:00');
  const [checkOut, setCheckOut] = useState('11:00');
  const [wifiName, setWifiName] = useState('Villa_Guest_5G');
  const [wifiPassword, setWifiPassword] = useState('guest2024');
  const [houseRules, setHouseRules] = useState(DEFAULT_HOUSE_RULES);
  const [recommendations, setRecommendations] = useState(DEFAULT_RECOMMENDATIONS);
  const [arrivalInstructions, setArrivalInstructions] = useState(DEFAULT_ARRIVAL_INSTRUCTIONS);
  const [propertyName] = useState('וילה ים תיכונית - תל אביב');

  const portalLink = 'https://atlas.portal/guest/abc123xyz';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(portalLink);
    toast.success('הלינק הועתק ללוח');
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`שלום! זה הלינק לפורטל האורחים שלך:\n${portalLink}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const addRecommendation = () => {
    const id = Math.max(0, ...recommendations.map(r => r.id)) + 1;
    setRecommendations([...recommendations, { id, name: '', type: '', note: '' }]);
  };

  const removeRecommendation = (id) => {
    setRecommendations(recommendations.filter(r => r.id !== id));
  };

  const updateRecommendation = (id, field, value) => {
    setRecommendations(recommendations.map(r =>
      r.id === id ? { ...r, [field]: value } : r
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50/50" dir="rtl">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-50/80 to-white rounded-2xl border border-indigo-100/50 p-5 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Globe className="w-5 h-5 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">פורטל אורחים</h1>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed mr-[3.25rem]">צור פורטל דיגיטלי ממותג לאורחים שלך. הוראות צ׳ק-אין, חוקי בית, המלצות מקומיות וקוד WiFi — הכל במקום אחד שהאורח מקבל בלינק.</p>
          <p className="text-indigo-500 text-xs mt-1 mr-[3.25rem]">💡 טיפ: שלח את הלינק לאורח יום לפני הגעה — זה חוסך עשרות שאלות</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Preview mockup - phone frame */}
          <div className="lg:col-span-1 flex justify-center lg:justify-start">
            <div className="relative">
              <div className="w-[280px] rounded-[2.5rem] border-[10px] border-gray-800 bg-gray-800 p-2 shadow-2xl">
                <div className="rounded-[1.5rem] overflow-hidden bg-white aspect-[9/19]">
                  <div className="p-4 h-full overflow-y-auto bg-gray-50">
                    <div className="text-center mb-4">
                      <h2 className="font-bold text-lg text-gray-900">{propertyName}</h2>
                      <p className="text-xs text-gray-500 mt-1">פורטל אורחים</p>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">צ׳ק-אין / צ׳ק-אאוט</span>
                        </div>
                        <p className="text-gray-800">{checkIn} — {checkOut}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                          <Wifi className="w-4 h-4" />
                          <span className="font-medium">WiFi</span>
                        </div>
                        <p className="text-gray-800 font-mono text-xs">{wifiName}</p>
                        <p className="text-gray-600 text-xs">••••••••</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                          <Home className="w-4 h-4" />
                          <span className="font-medium">חוקי בית</span>
                        </div>
                        <p className="text-gray-700 text-xs whitespace-pre-line line-clamp-3">{houseRules}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                          <MapPin className="w-4 h-4" />
                          <span className="font-medium">המלצות מקומיות</span>
                        </div>
                        <ul className="text-xs text-gray-700 space-y-1">
                          {recommendations.slice(0, 2).map(r => (
                            <li key={r.id}>• {r.name}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-24 h-5 rounded-b-xl bg-gray-800" />
            </div>
          </div>

          {/* Settings cards */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Check-in / Check-out */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-semibold text-gray-900">צ׳ק-אין / צ׳ק-אאוט</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="checkIn">צ׳ק-אין</Label>
                      <Input
                        id="checkIn"
                        type="time"
                        value={checkIn}
                        onChange={(e) => setCheckIn(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="checkOut">צ׳ק-אאוט</Label>
                      <Input
                        id="checkOut"
                        type="time"
                        value={checkOut}
                        onChange={(e) => setCheckOut(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* WiFi */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Wifi className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-semibold text-gray-900">קוד WiFi</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="wifiName">שם הרשת</Label>
                      <Input
                        id="wifiName"
                        value={wifiName}
                        onChange={(e) => setWifiName(e.target.value)}
                        placeholder="שם הרשת"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="wifiPassword">סיסמה</Label>
                      <Input
                        id="wifiPassword"
                        type="password"
                        value={wifiPassword}
                        onChange={(e) => setWifiPassword(e.target.value)}
                        placeholder="סיסמה"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* House rules */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Home className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-semibold text-gray-900">חוקי בית</h3>
                </div>
                <Textarea
                  value={houseRules}
                  onChange={(e) => setHouseRules(e.target.value)}
                  placeholder="הוסף חוקי בית..."
                  rows={5}
                  className="resize-none"
                />
              </CardContent>
            </Card>

            {/* Local recommendations */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-semibold text-gray-900">המלצות מקומיות</h3>
                  </div>
                  <Button variant="outline" size="sm" onClick={addRecommendation}>
                    <Plus className="w-4 h-4 ml-1" />
                    הוסף
                  </Button>
                </div>
                <div className="space-y-3">
                  {recommendations.map((rec) => (
                    <div key={rec.id} className="flex gap-2 items-start">
                      <Input
                        value={rec.name}
                        onChange={(e) => updateRecommendation(rec.id, 'name', e.target.value)}
                        placeholder="שם המקום"
                        className="flex-1"
                      />
                      <Input
                        value={rec.type}
                        onChange={(e) => updateRecommendation(rec.id, 'type', e.target.value)}
                        placeholder="סוג"
                        className="w-24"
                      />
                      <Input
                        value={rec.note}
                        onChange={(e) => updateRecommendation(rec.id, 'note', e.target.value)}
                        placeholder="הערה"
                        className="w-28"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRecommendation(rec.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Arrival instructions */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <ExternalLink className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-semibold text-gray-900">הוראות הגעה</h3>
                </div>
                <Textarea
                  value={arrivalInstructions}
                  onChange={(e) => setArrivalInstructions(e.target.value)}
                  placeholder="הוראות הגעה לאורח..."
                  rows={5}
                  className="resize-none"
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Share section */}
        <Card className="border-indigo-100 bg-indigo-50/30">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-indigo-600" />
              שתף את הפורטל
            </h3>
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <div className="flex-1 flex gap-2">
                <Input
                  readOnly
                  value={portalLink}
                  className="bg-white font-mono text-sm"
                />
                <Button onClick={handleCopyLink} variant="secondary">
                  <Copy className="w-4 h-4 ml-1" />
                  העתק
                </Button>
              </div>
              <div className="flex gap-2">
                <div className="w-16 h-16 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                  <QrCode className="w-8 h-8 text-gray-400" />
                </div>
                <Button onClick={handleWhatsAppShare} className="bg-[#25D366] hover:bg-[#20bd5a] text-white">
                  <Share2 className="w-4 h-4 ml-1" />
                  WhatsApp
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1.5">
            <Eye className="w-4 h-4" />
            צפיות בפורטל: 47
          </span>
          <span>|</span>
          <span>ממוצע זמן שהייה: 2:30 דקות</span>
        </div>
      </div>
    </div>
  );
}
