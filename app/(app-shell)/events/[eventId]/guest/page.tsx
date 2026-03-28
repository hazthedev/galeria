// ============================================
// Galeria - Guest Event Page (Shareable Link)
// ============================================

import { headers } from 'next/headers';
import { getTenantDb } from '@/lib/infrastructure/database/db';
import { resolveOptionalAuth, resolveTenantId } from '@/lib/api-request-context';
import GuestEventPageClient from './_components/GuestEventPageClient';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface PageProps {
  params: Promise<{ eventId: string }>;
}

export default async function GuestEventPage({ params }: PageProps) {
  const { eventId } = await params;
  let resolvedEventId: string | undefined;

  // If not a UUID, resolve short code server-side to avoid client round trip
  if (!UUID_REGEX.test(eventId)) {
    try {
      const reqHeaders = await headers();
      const auth = await resolveOptionalAuth(reqHeaders);
      const tenantId = resolveTenantId(reqHeaders, auth);
      const db = getTenantDb(tenantId);

      let event = await db.findOne('events', { short_code: eventId });
      if (!event) {
        event = await db.findOne('events', { slug: eventId });
      }
      if (event) {
        resolvedEventId = event.id as string;
      }
    } catch {
      // Fall back to client-side resolution
    }
  } else {
    resolvedEventId = eventId;
  }

  return (
    <GuestEventPageClient
      eventId={eventId}
      resolvedEventId={resolvedEventId}
    />
  );
}
