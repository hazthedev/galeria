import { z } from 'zod';

export const adminActionEnvelopeSchema = z.object({
  action: z.string().trim().min(1),
  reason: z.string().trim().min(1).max(500).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type AdminActionEnvelope = z.infer<typeof adminActionEnvelopeSchema>;

type ActionEnvelopeParseSuccess<TAction extends string> = {
  success: true;
  data: {
    action: TAction;
    reason?: string;
    metadata: Record<string, unknown>;
  };
};

type ActionEnvelopeParseFailure = {
  success: false;
  error: string;
};

export function parseAdminActionEnvelope<TAction extends string>(
  body: unknown,
  allowedActions: readonly TAction[]
): ActionEnvelopeParseSuccess<TAction> | ActionEnvelopeParseFailure {
  const parsed = adminActionEnvelopeSchema.safeParse(body);

  if (!parsed.success) {
    return {
      success: false,
      error: 'Invalid action payload',
    };
  }

  if (!allowedActions.includes(parsed.data.action as TAction)) {
    return {
      success: false,
      error: `Unsupported action: ${parsed.data.action}`,
    };
  }

  return {
    success: true,
    data: {
      action: parsed.data.action as TAction,
      reason: parsed.data.reason,
      metadata: parsed.data.metadata ?? {},
    },
  };
}

export function hasAdminActionReason(reason: string | undefined): boolean {
  return Boolean(reason?.trim());
}
