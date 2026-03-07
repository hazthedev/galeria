import 'server-only';

import { headers } from 'next/headers';
import { getTenantDb } from '@/lib/db';
import { resolveTenantId } from '@/lib/api-request-context';
import type { IEvent } from '@/lib/types';
import { buildGuestTheme, type GuestTheme } from './guest-theme';

export async function resolveGuestThemeForRequest(eventKey: string): Promise<GuestTheme | null> {
  try {
    const requestHeaders = await headers();
    const tenantId = resolveTenantId(requestHeaders);
    const db = getTenantDb(tenantId);

    let event = await db.findOne<IEvent>('events', { id: eventKey });
    if (!event) {
      event = await db.findOne<IEvent>('events', { short_code: eventKey });
    }
    if (!event) {
      event = await db.findOne<IEvent>('events', { slug: eventKey });
    }

    return event ? buildGuestTheme(event) : null;
  } catch {
    return null;
  }
}
