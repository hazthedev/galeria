import type { CSSProperties, ReactNode } from 'react';
import type { Metadata } from 'next';
import { getGuestThemeStyleVars } from './_lib/guest-theme';
import { resolveGuestEventForRequest, resolveGuestThemeForRequest } from './_lib/guest-theme.server';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventId: string }>;
}): Promise<Metadata> {
  const { eventId } = await params;
  const event = await resolveGuestEventForRequest(eventId);

  if (!event) {
    return {
      title: 'Galeria',
      description: 'Capture Moments, Together',
    };
  }

  const title = `${event.name} | Galeria`;
  const description = `Join ${event.name} on Galeria to view and share photos.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function GuestLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const theme = await resolveGuestThemeForRequest(eventId);
  const style = theme ? (getGuestThemeStyleVars(theme) as CSSProperties) : undefined;

  return <div style={style}>{children}</div>;
}
