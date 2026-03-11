import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Zap, Crown, Rocket, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const PLAN_LIMITS = {
  starter: { properties: 2, icon: Zap },
  pro: { properties: 10, icon: Crown },
  scale: { properties: Infinity, icon: Rocket }
};

const PLAN_NAMES = {
  starter: 'Starter',
  pro: 'Pro',
  scale: 'Scale'
};

export default function UpgradeModal({ open, onClose, currentPlan = 'starter', currentCount, entity = 'property' }) {
  const navigate = useNavigate();
  const limit = PLAN_LIMITS[currentPlan]?.properties || 2;
  const CurrentIcon = PLAN_LIMITS[currentPlan]?.icon || Zap;

  const entityNames = {
    property: { singular: 'נכס', plural: 'נכסים' }
  };

  const entityName = entityNames[entity] || entityNames.property;

  const availableUpgrades = Object.entries(PLAN_LIMITS)
    .filter(([plan]) => PLAN_LIMITS[plan].properties > limit)
    .map(([plan, details]) => ({
      id: plan,
      name: PLAN_NAMES[plan],
      limit: details.properties === Infinity ? 'ללא הגבלה' : `עד ${details.properties}`,
      icon: details.icon
    }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
            <AlertCircle className="h-7 w-7 text-white" />
          </div>
          <DialogTitle className="text-center text-2xl">
            הגעת למגבלת התוכנית
          </DialogTitle>
          <DialogDescription className="text-center">
            <div className="space-y-4 mt-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CurrentIcon className="h-5 w-5 text-gray-600" />
                  <span className="font-semibold text-[#0B1220]">תוכנית {PLAN_NAMES[currentPlan]}</span>
                </div>
                <p className="text-sm text-gray-600">
                  התוכנית הנוכחית שלך תומכת בעד <span className="font-bold">{limit}</span> {entityName.plural}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  כרגע יש לך <span className="font-bold">{currentCount}</span> {entityName.plural}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-700 mb-3">
                  כדי להוסיף {entityName.plural} נוספים, שדרג לאחת מהתוכניות הבאות:
                </p>
                <div className="space-y-2">
                  {availableUpgrades.map(upgrade => {
                    const UpgradeIcon = upgrade.icon;
                    return (
                      <div key={upgrade.id} className="bg-gradient-to-r from-[#00D1C1]/10 to-[#00B8A9]/10 border border-[#00D1C1]/20 rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00D1C1] to-[#00B8A9] flex items-center justify-center">
                            <UpgradeIcon className="h-5 w-5 text-white" />
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-[#0B1220]">{upgrade.name}</p>
                            <p className="text-xs text-gray-600">{upgrade.limit} {entityName.plural}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-[#00D1C1] to-[#00B8A9] text-white hover:opacity-90"
                          onClick={() => {
                            navigate(createPageUrl('Billing'));
                            onClose();
                          }}
                        >
                          שדרג
                          <ArrowLeft className="mr-1 h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex gap-3 mt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            ביטול
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-[#00D1C1] to-[#00B8A9] text-white hover:opacity-90"
            onClick={() => {
              navigate(createPageUrl('Billing'));
              onClose();
            }}
          >
            צפה בתוכניות
            <ArrowLeft className="mr-2 h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}