import {
  buildRedrawPrizeDescription,
  filterEligibleLuckyDrawEntries,
  filterEligibleRedrawEntries,
  sortPrizeTiers,
} from './lucky-draw';

describe('lucky draw helper logic', () => {
  test('sortPrizeTiers keeps grand prize ahead of other tiers', () => {
    const sorted = sortPrizeTiers([
      { tier: 'third', name: 'Third Prize', count: 1 },
      { tier: 'grand', name: 'Grand Prize', count: 1 },
      { tier: 'first', name: 'First Prize', count: 1 },
      { tier: 'consolation', name: 'Consolation Prize', count: 2 },
    ]);

    expect(sorted.map((tier) => tier.tier)).toEqual([
      'grand',
      'first',
      'third',
      'consolation',
    ]);
  });

  test('filterEligibleLuckyDrawEntries excludes non-approved photo entries', () => {
    const entries = filterEligibleLuckyDrawEntries([
      { id: 'manual', photoId: null, photoStatus: null },
      { id: 'approved', photoId: 'photo-approved', photoStatus: 'approved' as const },
      { id: 'pending', photoId: 'photo-pending', photoStatus: 'pending' as const },
      { id: 'rejected', photoId: 'photo-rejected', photoStatus: 'rejected' as const },
    ]);

    expect(entries.map((entry) => entry.id)).toEqual(['manual', 'approved']);
  });

  test('filterEligibleRedrawEntries excludes the replaced winner and blocked fingerprints', () => {
    const entries = filterEligibleRedrawEntries(
      [
        { id: 'winner-entry', userFingerprint: 'winner-1', photoId: 'photo-1', photoStatus: 'approved' as const },
        { id: 'same-person-other-entry', userFingerprint: 'winner-1', photoId: 'photo-2', photoStatus: 'approved' as const },
        { id: 'blocked-fingerprint', userFingerprint: 'winner-2', photoId: 'photo-3', photoStatus: 'approved' as const },
        { id: 'pending-photo', userFingerprint: 'winner-3', photoId: 'photo-4', photoStatus: 'pending' as const },
        { id: 'eligible', userFingerprint: 'winner-4', photoId: 'photo-5', photoStatus: 'approved' as const },
      ],
      new Set(['winner-1', 'winner-2']),
      new Set(['winner-entry'])
    );

    expect(entries.map((entry) => entry.id)).toEqual(['eligible']);
  });

  test('buildRedrawPrizeDescription preserves the base description and redraw reason', () => {
    expect(buildRedrawPrizeDescription('iPad Mini', 'Guest left early')).toBe(
      'iPad Mini [REDRAW: Guest left early]'
    );
    expect(buildRedrawPrizeDescription('', undefined)).toBe('[REDRAW]');
  });
});
