import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import UpgradeModal from '@/components/common/UpgradeModal';

const PLAN_LIMITS = {
  starter: { properties: 2 },
  pro: { properties: 10 },
  scale: { properties: Infinity }
};

/**
 * SubscriptionGuard - HOC/Hook to check subscription limits
 *
 * Usage:
 * const { checkLimit, UpgradeModalComponent } = useSubscriptionGuard();
 *
 * const handleAddProperty = () => {
 *   if (!checkLimit('property')) return; // Shows upgrade modal if limit reached
 *   // Proceed with adding property
 * };
 */
export function useSubscriptionGuard() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [limitContext, setLimitContext] = useState({ currentCount: 0, entity: 'property' });

  const { user } = useAuth();

  const { data: properties = [] } = useQuery({
    queryKey: ['properties', user?.organization_id],
    queryFn: () => base44.entities.Property.filter({ org_id: user?.organization_id }),
    enabled: !!user?.organization_id
  });

  const currentPlan = user?.subscription_plan || 'starter';
  const propertyLimit = PLAN_LIMITS[currentPlan]?.properties || 2;

  const checkLimit = (entity = 'property') => {
    if (entity === 'property') {
      const canAdd = properties.length < propertyLimit;
      if (!canAdd) {
        setLimitContext({ currentCount: properties.length, entity: 'property' });
        setShowUpgradeModal(true);
      }
      return canAdd;
    }
    return true; // Allow other entities by default
  };

  const UpgradeModalComponent = (
    <UpgradeModal
      open={showUpgradeModal}
      onClose={() => setShowUpgradeModal(false)}
      currentPlan={currentPlan}
      currentCount={limitContext.currentCount}
      entity={limitContext.entity}
    />
  );

  return {
    checkLimit,
    canAddProperty: properties.length < propertyLimit,
    currentPlan,
    propertyLimit,
    propertyCount: properties.length,
    UpgradeModalComponent
  };
}

export default useSubscriptionGuard;
