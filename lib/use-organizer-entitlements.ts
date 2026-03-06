'use client';

import { useEffect, useState } from 'react';
import type { ITenantFeatures, ITenantLimits, SubscriptionTier } from '@/lib/types';

interface OrganizerEntitlementsState {
  tier: SubscriptionTier | null;
  features: ITenantFeatures | null;
  limits: ITenantLimits | null;
  isLoading: boolean;
  error: string | null;
}

const INITIAL_STATE: OrganizerEntitlementsState = {
  tier: null,
  features: null,
  limits: null,
  isLoading: true,
  error: null,
};

export function useOrganizerEntitlements() {
  const [state, setState] = useState<OrganizerEntitlementsState>(INITIAL_STATE);

  useEffect(() => {
    let isCancelled = false;

    const fetchEntitlements = async () => {
      try {
        const response = await fetch('/api/organizer/usage', {
          credentials: 'include',
        });
        const payload = await response.json();

        if (isCancelled) {
          return;
        }

        if (!response.ok) {
          setState({
            tier: null,
            features: null,
            limits: null,
            isLoading: false,
            error: payload.error || 'Failed to load organizer entitlements',
          });
          return;
        }

        setState({
          tier: (payload.data?.tier || null) as SubscriptionTier | null,
          features: (payload.data?.features || null) as ITenantFeatures | null,
          limits: (payload.data?.limits || null) as ITenantLimits | null,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setState({
          tier: null,
          features: null,
          limits: null,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load organizer entitlements',
        });
      }
    };

    fetchEntitlements();

    return () => {
      isCancelled = true;
    };
  }, []);

  return state;
}
