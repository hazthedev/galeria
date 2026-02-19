import type { IEvent } from '@/lib/types';
import type { DEFAULT_UPLOAD_RATE_LIMITS } from './constants';

export type SettingsSubTab = 'basic' | 'theme' | 'features' | 'security' | 'advanced';

export type UploadRateLimits = typeof DEFAULT_UPLOAD_RATE_LIMITS;

export type EventStatus = IEvent['status'];
