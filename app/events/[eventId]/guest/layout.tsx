import type { CSSProperties, ReactNode } from 'react';
import { getGuestThemeStyleVars } from './_lib/guest-theme';
import { resolveGuestThemeForRequest } from './_lib/guest-theme.server';

export const dynamic = 'force-dynamic';

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
