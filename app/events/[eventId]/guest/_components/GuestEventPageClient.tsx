'use client';

import { useGuestEventPageController } from '../_hooks/useGuestEventPageController';
import { GuestEventPageView } from './GuestEventPageView';

interface GuestEventPageClientProps {
  eventId: string;
  resolvedEventId?: string;
}

export default function GuestEventPageClient({ eventId, resolvedEventId }: GuestEventPageClientProps) {
  const controller = useGuestEventPageController(eventId, resolvedEventId);

  return <GuestEventPageView controller={controller} />;
}
