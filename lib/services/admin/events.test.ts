import { getAdminEventLegacyTextEventIdMatchSql } from '@/lib/services/admin/events';

describe('getAdminEventLegacyTextEventIdMatchSql', () => {
  it('casts both sides to text so legacy text event ids can be compared to uuid event ids', () => {
    expect(getAdminEventLegacyTextEventIdMatchSql('pc')).toBe('pc.event_id::text = e.id::text');
  });

  it('supports a custom event alias', () => {
    expect(getAdminEventLegacyTextEventIdMatchSql('gpp', 'evt')).toBe(
      'gpp.event_id::text = evt.id::text'
    );
  });
});
