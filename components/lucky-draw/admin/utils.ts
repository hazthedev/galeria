import type { LuckyDrawConfig, PrizeTier } from '@/lib/types';
import { defaultTierName, prizeTierOptions } from './constants';
import type { ConfigFormState, PrizeTierForm } from './types';

export const buildConfigForm = (config: LuckyDrawConfig | null): ConfigFormState => ({
  prizeTiers: config?.prizeTiers?.length
    ? config.prizeTiers
        // Filter out 'grand' tier if it exists (for backward compatibility)
        .filter((tier) => {
          const validTiers: PrizeTier[] = ['first', 'second', 'third', 'consolation'];
          return validTiers.includes(tier.tier as PrizeTier);
        })
        .map((tier) => ({
          tier: tier.tier as PrizeTier,
          name: tier.name || defaultTierName[tier.tier as PrizeTier],
          count: tier.count || 1,
          description: tier.description || '',
        }))
    : [{
      tier: 'first',
      name: 'First Prize',
      count: 1,
      description: '',
    }],
  maxEntriesPerUser: config?.maxEntriesPerUser ?? 1,
  requirePhotoUpload: config?.requirePhotoUpload ?? true,
  preventDuplicateWinners: config?.preventDuplicateWinners ?? true,
  animationStyle: config?.animationStyle ?? 'slot',
  animationDuration: config?.animationDuration ?? 5,
  showSelfie: config?.showSelfie ?? true,
  showFullName: config?.showFullName ?? true,
  playSound: config?.playSound ?? true,
  confettiAnimation: config?.confettiAnimation ?? true,
});

export const createPrizeTier = (existing: PrizeTierForm[]): PrizeTierForm => {
  const used = new Set(existing.map((tier) => tier.tier));
  const nextTier = prizeTierOptions.find((option) => !used.has(option.value))?.value || 'first';

  return {
    tier: nextTier,
    name: defaultTierName[nextTier],
    count: 1,
    description: '',
  };
};
