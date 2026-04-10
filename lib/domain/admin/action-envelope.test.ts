import {
  hasAdminActionReason,
  parseAdminActionEnvelope,
} from './action-envelope';

describe('admin action envelope helpers', () => {
  const allowedActions = ['suspend_tenant', 'activate_tenant'] as const;

  it('parses a valid action payload and normalizes metadata', () => {
    const result = parseAdminActionEnvelope(
      {
        action: 'suspend_tenant',
        reason: 'Fraud review',
      },
      allowedActions
    );

    expect(result).toEqual({
      success: true,
      data: {
        action: 'suspend_tenant',
        reason: 'Fraud review',
        metadata: {},
      },
    });
  });

  it('rejects unsupported actions', () => {
    expect(
      parseAdminActionEnvelope(
        {
          action: 'delete_tenant',
        },
        allowedActions
      )
    ).toEqual({
      success: false,
      error: 'Unsupported action: delete_tenant',
    });
  });

  it('detects whether an action reason is present', () => {
    expect(hasAdminActionReason('Support escalation')).toBe(true);
    expect(hasAdminActionReason('   ')).toBe(false);
    expect(hasAdminActionReason(undefined)).toBe(false);
  });
});
