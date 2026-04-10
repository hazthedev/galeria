import {
  ADMIN_SEARCH_DEFAULT_LIMIT,
  ADMIN_SEARCH_ENTITY_TYPES,
  ADMIN_SEARCH_MAX_LIMIT,
  isAdminSearchQueryValid,
  normalizeAdminSearchQuery,
  parseAdminSearchLimit,
  parseAdminSearchTypes,
} from './search';

describe('admin search helpers', () => {
  it('normalizes whitespace in queries before validation', () => {
    expect(normalizeAdminSearchQuery('  gala   launch  ')).toBe('gala launch');
    expect(isAdminSearchQueryValid(' a ')).toBe(false);
    expect(isAdminSearchQueryValid('  ab  ')).toBe(true);
  });

  it('parses limits safely within the configured bounds', () => {
    expect(parseAdminSearchLimit(null)).toBe(ADMIN_SEARCH_DEFAULT_LIMIT);
    expect(parseAdminSearchLimit('not-a-number')).toBe(ADMIN_SEARCH_DEFAULT_LIMIT);
    expect(parseAdminSearchLimit('1')).toBe(1);
    expect(parseAdminSearchLimit(`${ADMIN_SEARCH_MAX_LIMIT + 10}`)).toBe(ADMIN_SEARCH_MAX_LIMIT);
  });

  it('parses valid entity types and falls back to all supported types', () => {
    expect(parseAdminSearchTypes(null)).toEqual(ADMIN_SEARCH_ENTITY_TYPES);
    expect(parseAdminSearchTypes('user,event')).toEqual(['user', 'event']);
    expect(parseAdminSearchTypes('unknown')).toEqual(ADMIN_SEARCH_ENTITY_TYPES);
  });
});
