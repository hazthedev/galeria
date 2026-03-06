// ============================================
// Galeria - Short Guest Link Alias
// ============================================
// Supports share links like /e/:shortCode by redirecting to the
// canonical guest page route at /events/:eventId/guest.

import { redirect } from 'next/navigation';

type PageProps = {
  params: Promise<{ eventId: string }>;
};

export default async function ShortGuestLinkPage({ params }: PageProps) {
  const { eventId } = await params;
  redirect(`/events/${encodeURIComponent(eventId)}/guest`);
}
