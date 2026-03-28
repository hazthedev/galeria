'use client';

import { useMemo } from 'react';
import type { IEvent } from '@/lib/types';
import { buildGuestTheme, type GuestTheme } from '../_lib/guest-theme';

export type { GuestTheme } from '../_lib/guest-theme';

export function useGuestTheme(event: IEvent | null): GuestTheme {
  return useMemo(() => buildGuestTheme(event), [event]);
}
