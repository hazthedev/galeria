'use client';

import { useSearchParams } from 'next/navigation';
import { OrganizerPhotoModerationSkeleton } from '@/components/events/admin-tab-skeletons';

export default function Loading() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status');

  const activeStatus =
    status === 'pending' || status === 'approved' || status === 'rejected'
      ? status
      : 'all';

  return <OrganizerPhotoModerationSkeleton activeStatus={activeStatus} />;
}
