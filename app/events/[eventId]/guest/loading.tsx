'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { GuestEventPageSkeleton } from './_components/GuestEventPageSkeleton';
import { readGuestThemeSnapshot } from './_lib/guest-theme-cache';

export default function Loading() {
  const params = useParams();
  const eventId = typeof params.eventId === 'string' ? params.eventId : '';
  const [theme] = useState(() => readGuestThemeSnapshot(eventId));

  return <GuestEventPageSkeleton theme={theme} />;
}
