// ============================================
// MOMENTIQUE - Lucky Draw Admin Tab
// ============================================
// Main admin panel for lucky draw configuration and management

'use client';

import { useState, useEffect, type FormEvent } from 'react';
import {
  Settings,
  Users,
  Trophy,
  Play,
  History,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
} from 'lucide-react';
import clsx from 'clsx';
import type { AnimationStyle, LuckyDrawConfig, LuckyDrawEntry, Winner } from '@/lib/types';
import { DrawAnimation } from '@/components/lucky-draw/DrawAnimation';

// ============================================
// TYPES
// ============================================

type SubTab = 'config' | 'entries' | 'participants' | 'draw' | 'history';

interface LuckyDrawAdminTabProps {
  eventId: string;
}

interface LuckyDrawHistoryItem {
  configId: string;
  status: LuckyDrawConfig['status'];
  prizeTiers: LuckyDrawConfig['prizeTiers'];
  totalEntries: LuckyDrawConfig['totalEntries'];
  createdAt: LuckyDrawConfig['createdAt'];
  completedAt: LuckyDrawConfig['completedAt'];
  winners: Winner[];
  winnerCount: number;
}

interface LuckyDrawParticipant {
  userFingerprint: string;
  participantName?: string | null;
  entryCount: number;
  isWinner: boolean;
  prizeTier: LuckyDrawConfig['prizeTiers'][number]['tier'] | null;
  firstEntryAt: string | null;
  lastEntryAt: string | null;
}

interface ParticipantsSummary {
  total: number;
  uniqueParticipants: number;
  totalEntries: number;
}

type PrizeTierForm = {
  tier: LuckyDrawConfig['prizeTiers'][number]['tier'];
  name: string;
  count: number;
  description: string;
};

type ConfigFormState = {
  prizeTiers: PrizeTierForm[];
  maxEntriesPerUser: number;
  requirePhotoUpload: boolean;
  preventDuplicateWinners: boolean;
  animationStyle: AnimationStyle;
  animationDuration: number;
  showSelfie: boolean;
  showFullName: boolean;
  playSound: boolean;
  confettiAnimation: boolean;
};

// ============================================
// SUB-COMPONENTS
// ============================================

// Entry Card Component
function EntryCard({ entry }: { entry: LuckyDrawEntry }) {
  const date = new Date(entry.createdAt).toLocaleDateString();
  const time = new Date(entry.createdAt).toLocaleTimeString();
  const participantName = entry.participantName?.trim();
  const entryLabel = `Entry: ${entry.id.slice(0, 8)}...`;

  return (
    <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
      {/* Photo thumbnail */}
      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-100 to-pink-100 dark:from-violet-900/30 dark:to-pink-900/30 flex items-center justify-center overflow-hidden">
        <span className="text-xs text-violet-600 dark:text-violet-400">
          📷
        </span>
      </div>

      {/* Entry info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {participantName || entryLabel}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {participantName ? `${entryLabel} · ${date} at ${time}` : `${date} at ${time}`}
        </p>
      </div>

      {/* Winner badge */}
      {entry.isWinner && (
        <span className="flex-shrink-0 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-2.5 py-0.5 text-xs font-medium text-white">
          🏆 Winner
        </span>
      )}
    </div>
  );
}

type DrawHistoryConfig = Pick<
  LuckyDrawConfig,
  'id' | 'status' | 'prizeTiers' | 'totalEntries' | 'createdAt' | 'completedAt'
>;

// Draw History Item
function DrawHistoryItem({ config, winnerCount }: { config: DrawHistoryConfig; winnerCount: number }) {
  const createdAt = new Date(config.createdAt).toLocaleDateString();
  const completedAt = config.completedAt
    ? new Date(config.completedAt).toLocaleString()
    : null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Draw: {createdAt}
          </span>
        </div>

        <span className={clsx(
          'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
          config.status === 'completed'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
          config.status === 'cancelled'
            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        )}>
          {config.status === 'completed' && '✓'}
          {config.status === 'cancelled' && '✗'}
          {config.status === 'scheduled' && '⏳'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600 dark:text-gray-400">Total Prizes:</span>
          <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
            {config.prizeTiers.reduce((sum, tier) => sum + tier.count, 0)}
          </span>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Winners:</span>
          <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
            {winnerCount}
          </span>
        </div>
        {completedAt && (
          <div>
            <span className="text-gray-600 dark:text-gray-400">Completed:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
              {completedAt}
            </span>
          </div>
        )}
      </div>

      {/* Prize tiers preview */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Prizes:</p>
        <div className="flex flex-wrap gap-1">
          {config.prizeTiers.map((tier, idx) => (
            <span
              key={idx}
              className="inline-flex items-center rounded bg-violet-100 px-2 py-0.5 text-xs text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
            >
              {tier.count}× {tier.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const prizeTierOptions: Array<{ value: PrizeTierForm['tier']; label: string }> = [
  { value: 'grand', label: 'Grand Prize' },
  { value: 'first', label: 'First Prize' },
  { value: 'second', label: 'Second Prize' },
  { value: 'third', label: 'Third Prize' },
  { value: 'consolation', label: 'Consolation' },
];

const animationStyleOptions: Array<{ value: AnimationStyle; label: string }> = [
  { value: 'spinning_wheel', label: 'Spinning Wheel' },
  { value: 'slot_machine', label: 'Slot Machine' },
  { value: 'card_shuffle', label: 'Card Shuffle' },
  { value: 'drum_roll', label: 'Drum Roll' },
  { value: 'random_fade', label: 'Random Fade' },
];

const defaultTierName: Record<PrizeTierForm['tier'], string> = {
  grand: 'Grand Prize',
  first: 'First Prize',
  second: 'Second Prize',
  third: 'Third Prize',
  consolation: 'Consolation Prize',
};

const buildConfigForm = (config: LuckyDrawConfig | null): ConfigFormState => ({
  prizeTiers: config?.prizeTiers?.length
    ? config.prizeTiers.map((tier) => ({
        tier: tier.tier,
        name: tier.name || defaultTierName[tier.tier],
        count: tier.count || 1,
        description: tier.description || '',
      }))
    : [{
        tier: 'grand',
        name: defaultTierName.grand,
        count: 1,
        description: '',
      }],
  maxEntriesPerUser: config?.maxEntriesPerUser ?? 1,
  requirePhotoUpload: config?.requirePhotoUpload ?? true,
  preventDuplicateWinners: config?.preventDuplicateWinners ?? true,
  animationStyle: config?.animationStyle ?? 'spinning_wheel',
  animationDuration: config?.animationDuration ?? 8,
  showSelfie: config?.showSelfie ?? true,
  showFullName: config?.showFullName ?? true,
  playSound: config?.playSound ?? true,
  confettiAnimation: config?.confettiAnimation ?? true,
});

const createPrizeTier = (existing: PrizeTierForm[]): PrizeTierForm => {
  const used = new Set(existing.map((tier) => tier.tier));
  const nextTier = prizeTierOptions.find((option) => !used.has(option.value))?.value || 'consolation';

  return {
    tier: nextTier,
    name: defaultTierName[nextTier],
    count: 1,
    description: '',
  };
};

// ============================================
// MAIN COMPONENT
// ============================================

export function LuckyDrawAdminTab({ eventId }: LuckyDrawAdminTabProps) {
  // Sub-tab state
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('config');

  // Data state
  const [config, setConfig] = useState<LuckyDrawConfig | null>(null);
  const [entries, setEntries] = useState<LuckyDrawEntry[]>([]);
  const [entriesTotal, setEntriesTotal] = useState(0);
  const [drawHistory, setDrawHistory] = useState<LuckyDrawHistoryItem[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [participants, setParticipants] = useState<LuckyDrawParticipant[]>([]);
  const [participantsSummary, setParticipantsSummary] = useState<ParticipantsSummary>({
    total: 0,
    uniqueParticipants: 0,
    totalEntries: 0,
  });

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [drawInProgress, setDrawInProgress] = useState(false);
  const [drawError, setDrawError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [configForm, setConfigForm] = useState<ConfigFormState>(() => buildConfigForm(null));
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configSaveError, setConfigSaveError] = useState<string | null>(null);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [participantsError, setParticipantsError] = useState<string | null>(null);

  const [manualEntryName, setManualEntryName] = useState('');
  const [manualEntryFingerprint, setManualEntryFingerprint] = useState('');
  const [manualEntryPhotoId, setManualEntryPhotoId] = useState('');
  const [manualEntryCount, setManualEntryCount] = useState(1);
  const [manualEntrySubmitting, setManualEntrySubmitting] = useState(false);
  const [manualEntryError, setManualEntryError] = useState<string | null>(null);
  const [manualEntrySuccess, setManualEntrySuccess] = useState<string | null>(null);

  // Pagination state for entries
  const [entriesPage, setEntriesPage] = useState(0);
  const entriesPageSize = 20;

  // Fetch user info
  const [userRole, setUserRole] = useState<string | null>(null);

  // Fetch all data on mount
  useEffect(() => {
    fetchAllData();
  }, [eventId]);

  useEffect(() => {
    fetchEntries();
  }, [eventId, entriesPage]);

  useEffect(() => {
    if (activeSubTab === 'participants') {
      fetchParticipants();
    }
  }, [activeSubTab, eventId]);

  useEffect(() => {
    if (!config) {
      setConfigForm(buildConfigForm(null));
      setIsEditingConfig(true);
      return;
    }

    if (!isEditingConfig) {
      setConfigForm(buildConfigForm(config));
    }
  }, [config, isEditingConfig]);

  // Poll for updates every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      // Only poll if tab is active (user is viewing)
      fetchEntries();
      fetchDraws();
    }, 30000);

    return () => clearInterval(interval);
  }, [eventId]);

  // Clear success messages after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (manualEntrySuccess) {
      const timer = setTimeout(() => setManualEntrySuccess(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [manualEntrySuccess]);

  // ============================================
  // DATA FETCHING FUNCTIONS
  // ============================================

  const fetchUserinfo = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setUserRole(null);
        return;
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserRole(data.data?.role || null);
      }
    } catch (err) {
      console.error('[LUCKY_DRAW_ADMIN] Failed to fetch user info:', err);
    }
  };

  const fetchConfig = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/events/${eventId}/lucky-draw/config`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data.data || null);
      } else if (response.status !== 404) {
        const data = await response.json();
        setError(data.error || 'Failed to fetch config');
      }
    } catch (err) {
      console.error('[LUCKY_DRAW_ADMIN] Failed to fetch config:', err);
      setError('Failed to load configuration');
    }
  };

  const fetchEntries = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `/api/events/${eventId}/lucky-draw/entries?limit=${entriesPageSize}&offset=${entriesPage * entriesPageSize}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (response.ok) {
        const data = await response.json();
        setEntries(data.data || []);
        setEntriesTotal(data.pagination?.total || 0);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to fetch entries');
      }
    } catch (err) {
      console.error('[LUCKY_DRAW_ADMIN] Failed to fetch entries:', err);
      setError('Failed to load entries');
    }
  };

  const fetchDraws = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/events/${eventId}/lucky-draw/history`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok) {
        const data = await response.json();
        setDrawHistory(data.data || []);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to fetch draw history');
      }
    } catch (err) {
      console.error('[LUCKY_DRAW_ADMIN] Failed to fetch draws:', err);
      setError('Failed to load draw history');
    }
  };

  const fetchParticipants = async () => {
    setParticipantsLoading(true);
    setParticipantsError(null);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/events/${eventId}/lucky-draw/participants`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok) {
        const data = await response.json();
        setParticipants(data.data || []);
        setParticipantsSummary({
          total: data.pagination?.total || 0,
          uniqueParticipants: data.pagination?.uniqueParticipants || 0,
          totalEntries: data.pagination?.totalEntries || 0,
        });
      } else {
        const data = await response.json();
        setParticipantsError(data.error || 'Failed to fetch participants');
      }
    } catch (err) {
      console.error('[LUCKY_DRAW_ADMIN] Failed to fetch participants:', err);
      setParticipantsError('Failed to load participants');
    } finally {
      setParticipantsLoading(false);
    }
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    setError(null);
    await Promise.all([
      fetchUserinfo(),
      fetchConfig(),
      fetchEntries(),
      fetchDraws(),
    ]);
    setIsLoading(false);
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    setError(null);
    await Promise.all([fetchConfig(), fetchEntries(), fetchDraws()]);
    setIsRefreshing(false);
  };

  const updatePrizeTier = (index: number, updates: Partial<PrizeTierForm>) => {
    setConfigForm((prev) => {
      const prizeTiers = [...prev.prizeTiers];
      prizeTiers[index] = { ...prizeTiers[index], ...updates };
      return { ...prev, prizeTiers };
    });
  };

  const addPrizeTier = () => {
    setConfigForm((prev) => ({
      ...prev,
      prizeTiers: [...prev.prizeTiers, createPrizeTier(prev.prizeTiers)],
    }));
  };

  const removePrizeTier = (index: number) => {
    setConfigForm((prev) => {
      if (prev.prizeTiers.length <= 1) {
        return prev;
      }
      return {
        ...prev,
        prizeTiers: prev.prizeTiers.filter((_, tierIndex) => tierIndex !== index),
      };
    });
  };

  const handleEditConfig = () => {
    setConfigSaveError(null);
    setConfigForm(buildConfigForm(config));
    setIsEditingConfig(true);
  };

  const handleCancelEdit = () => {
    if (!config) {
      return;
    }
    setConfigSaveError(null);
    setConfigForm(buildConfigForm(config));
    setIsEditingConfig(false);
  };

  const handleConfigSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setConfigSaveError(null);

    const trimmedTiers = configForm.prizeTiers.map((tier) => ({
      ...tier,
      name: tier.name.trim(),
      description: tier.description.trim(),
    }));

    if (trimmedTiers.length === 0) {
      setConfigSaveError('Add at least one prize tier.');
      return;
    }

    for (const tier of trimmedTiers) {
      if (!tier.name) {
        setConfigSaveError('Each prize tier needs a name.');
        return;
      }
      if (tier.count < 1) {
        setConfigSaveError('Prize counts must be at least 1.');
        return;
      }
    }

    if (configForm.maxEntriesPerUser < 1) {
      setConfigSaveError('Max entries per user must be at least 1.');
      return;
    }

    setIsSavingConfig(true);

    try {
      const token = localStorage.getItem('access_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api/events/${eventId}/lucky-draw/config`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prizeTiers: trimmedTiers.map((tier) => ({
            ...tier,
            description: tier.description || undefined,
          })),
          maxEntriesPerUser: configForm.maxEntriesPerUser,
          requirePhotoUpload: configForm.requirePhotoUpload,
          preventDuplicateWinners: configForm.preventDuplicateWinners,
          animationStyle: configForm.animationStyle,
          animationDuration: configForm.animationDuration,
          showSelfie: configForm.showSelfie,
          showFullName: configForm.showFullName,
          playSound: configForm.playSound,
          confettiAnimation: configForm.confettiAnimation,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setConfigSaveError(data.error || 'Failed to save configuration.');
        return;
      }

      setConfig(data.data || null);
      setIsEditingConfig(false);
      setSuccessMessage('Draw configuration saved.');
    } catch (err) {
      console.error('[LUCKY_DRAW_ADMIN] Failed to save config:', err);
      setConfigSaveError('Failed to save configuration.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  // ============================================
  // DRAW EXECUTION
  // ============================================

  const handleExecuteDraw = async () => {
    if (!config) {
      setDrawError('Please create a draw configuration first');
      return;
    }

    const entryCount = entriesTotal;
    if (entryCount === 0) {
      setDrawError('No entries available. Users must upload photos to enter the draw.');
      return;
    }

    if (config.status !== 'scheduled') {
      setDrawError(`Draw is ${config.status}. Cannot execute.`);
      return;
    }

    setDrawInProgress(true);
    setDrawError(null);
    setSuccessMessage(null);

    try {
      const token = localStorage.getItem('access_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api/events/${eventId}/lucky-draw/draw`, {
        method: 'POST',
        headers,
      });

      const data = await response.json();

      if (response.ok) {
        // Set winners and show modal
        setWinners(data.data.winners);
        setShowWinnerModal(true);

        // Refresh data to update status
        await fetchAllData();

        setSuccessMessage(`Successfully selected ${data.data.winners.length} winner(s)!`);
      } else {
        setDrawError(data.error || 'Failed to execute draw');
      }
    } catch (err) {
      console.error('[LUCKY_DRAW_ADMIN] Failed to execute draw:', err);
      setDrawError('Failed to execute draw. Please try again.');
    } finally {
      setDrawInProgress(false);
    }
  };

  const handleManualEntrySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setManualEntryError(null);
    setManualEntrySuccess(null);

    const participantName = manualEntryName.trim();
    const participantFingerprint = manualEntryFingerprint.trim();
    const photoId = manualEntryPhotoId.trim();
    const entryCount = Number.isFinite(manualEntryCount) && manualEntryCount > 0 ? manualEntryCount : 1;

    if (!participantName) {
      setManualEntryError('Participant name is required.');
      return;
    }

    if (config?.requirePhotoUpload && !photoId) {
      setManualEntryError('Photo ID is required for this draw configuration.');
      return;
    }

    setManualEntrySubmitting(true);

    try {
      const token = localStorage.getItem('access_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api/events/${eventId}/lucky-draw/entries`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          participantName,
          participantFingerprint: participantFingerprint || undefined,
          photoId: photoId || undefined,
          entryCount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setManualEntryError(data.error || 'Failed to add manual entry.');
        return;
      }

      const createdCount = data.data?.entries?.length || 0;
      const fingerprint = data.data?.userFingerprint;

      setManualEntrySuccess(
        `Added ${createdCount} manual ${createdCount === 1 ? 'entry' : 'entries'}.${fingerprint ? ` Participant ID: ${fingerprint}` : ''}`
      );
      setManualEntryName('');
      setManualEntryFingerprint('');
      setManualEntryPhotoId('');
      setManualEntryCount(1);

      await Promise.all([fetchEntries(), fetchParticipants()]);
    } catch (err) {
      console.error('[LUCKY_DRAW_ADMIN] Failed to add manual entry:', err);
      setManualEntryError('Failed to add manual entry.');
    } finally {
      setManualEntrySubmitting(false);
    }
  };

  // ============================================
  // CONFIG SUB-TAB CONTENT
  // ============================================

  const renderConfigForm = () => (
    <form onSubmit={handleConfigSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {config ? 'Edit Configuration' : 'Create Configuration'}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Configure prize tiers, entry rules, and draw presentation settings.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Prize Tiers
          </h4>
          <button
            type="button"
            onClick={addPrizeTier}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
          >
            Add Tier
          </button>
        </div>

        <div className="space-y-4">
          {configForm.prizeTiers.map((tier, index) => (
            <div
              key={`${tier.tier}-${index}`}
              className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/30"
            >
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Tier
                  </label>
                  <select
                    value={tier.tier}
                    onChange={(event) => {
                      const nextTier = event.target.value as PrizeTierForm['tier'];
                      const shouldUpdateName = tier.name.trim() === defaultTierName[tier.tier];
                      updatePrizeTier(index, {
                        tier: nextTier,
                        name: shouldUpdateName ? defaultTierName[nextTier] : tier.name,
                      });
                    }}
                    className="w-full rounded-md border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-violet-500 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  >
                    {prizeTierOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Prize Name
                  </label>
                  <input
                    value={tier.name}
                    onChange={(event) => updatePrizeTier(index, { name: event.target.value })}
                    className="w-full rounded-md border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-violet-500 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    placeholder="Grand Prize"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Winners
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={tier.count}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      updatePrizeTier(index, { count: Number.isFinite(value) && value > 0 ? value : 1 });
                    }}
                    className="w-full rounded-md border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-violet-500 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Description (optional)
                  </label>
                  <input
                    value={tier.description}
                    onChange={(event) => updatePrizeTier(index, { description: event.target.value })}
                    className="w-full rounded-md border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-violet-500 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    placeholder="Example: iPad Mini"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removePrizeTier(index)}
                    disabled={configForm.prizeTiers.length <= 1}
                    className={clsx(
                      'inline-flex items-center justify-center rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                      configForm.prizeTiers.length <= 1
                        ? 'border-gray-200 text-gray-300 dark:border-gray-700 dark:text-gray-600'
                        : 'border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-500/10'
                    )}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Entry Rules
        </h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Max entries per user
            </label>
            <input
              type="number"
              min={1}
              value={configForm.maxEntriesPerUser}
              onChange={(event) => {
                const value = Number(event.target.value);
                setConfigForm((prev) => ({
                  ...prev,
                  maxEntriesPerUser: Number.isFinite(value) && value > 0 ? value : 1,
                }));
              }}
              className="w-full rounded-md border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-violet-500 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={configForm.requirePhotoUpload}
              onChange={(event) => setConfigForm((prev) => ({
                ...prev,
                requirePhotoUpload: event.target.checked,
              }))}
              className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
            />
            Require photo upload for entry
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={configForm.preventDuplicateWinners}
              onChange={(event) => setConfigForm((prev) => ({
                ...prev,
                preventDuplicateWinners: event.target.checked,
              }))}
              className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
            />
            Prevent duplicate winners across tiers
          </label>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Animation
        </h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Style
            </label>
            <select
              value={configForm.animationStyle}
              onChange={(event) => setConfigForm((prev) => ({
                ...prev,
                animationStyle: event.target.value as AnimationStyle,
              }))}
              className="w-full rounded-md border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-violet-500 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              {animationStyleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Duration (seconds)
            </label>
            <input
              type="number"
              min={3}
              max={30}
              value={configForm.animationDuration}
              onChange={(event) => {
                const value = Number(event.target.value);
                setConfigForm((prev) => ({
                  ...prev,
                  animationDuration: Number.isFinite(value) && value > 0 ? value : 8,
                }));
              }}
              className="w-full rounded-md border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-violet-500 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Display Options
        </h4>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={configForm.showSelfie}
              onChange={(event) => setConfigForm((prev) => ({
                ...prev,
                showSelfie: event.target.checked,
              }))}
              className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
            />
            Show selfie with winner announcement
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={configForm.showFullName}
              onChange={(event) => setConfigForm((prev) => ({
                ...prev,
                showFullName: event.target.checked,
              }))}
              className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
            />
            Show full name of winner
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={configForm.playSound}
              onChange={(event) => setConfigForm((prev) => ({
                ...prev,
                playSound: event.target.checked,
              }))}
              className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
            />
            Play sound during draw
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={configForm.confettiAnimation}
              onChange={(event) => setConfigForm((prev) => ({
                ...prev,
                confettiAnimation: event.target.checked,
              }))}
              className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
            />
            Confetti animation on winner
          </label>
        </div>
      </div>

      {configSaveError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
          {configSaveError}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSavingConfig}
          className={clsx(
            'inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-colors',
            'bg-gradient-to-r from-violet-600 to-pink-600',
            'hover:from-violet-700 hover:to-pink-700',
            isSavingConfig && 'opacity-70 cursor-not-allowed'
          )}
        >
          {isSavingConfig ? 'Saving...' : 'Save Configuration'}
        </button>
        {config && (
          <button
            type="button"
            onClick={handleCancelEdit}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );

  const renderConfigTab = () => {
    const isEditing = isEditingConfig || !config;

    return (
      <div className="space-y-6">
        {successMessage && (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 dark:bg-green-900/20">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <p className="text-sm text-green-800 dark:text-green-300">{successMessage}</p>
          </div>
        )}

        {isEditing ? (
          renderConfigForm()
        ) : config ? (
          <>
            <DrawConfigSummary config={config} />
            <DrawConfigCard config={config} onEdit={handleEditConfig} />
          </>
        ) : null}
      </div>
    );
  };

  // ============================================
  // ENTRIES SUB-TAB CONTENT
  // ============================================

  const renderEntriesTab = () => {
    const hasEntries = entriesTotal > 0;
    const totalPages = Math.max(1, Math.ceil(entriesTotal / entriesPageSize));
    const hasNextPage = (entriesPage + 1) * entriesPageSize < entriesTotal;
    const hasPrevPage = entriesPage > 0;
    const isAdmin = userRole === 'admin' || userRole === 'super_admin' || userRole === 'organizer';

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Draw Entries
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {entriesTotal} total {entriesTotal === 1 ? 'entry' : 'entries'}
            </p>
          </div>
          <button
            onClick={refreshData}
            disabled={isRefreshing}
            className={clsx(
              'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
              'hover:bg-gray-50 dark:hover:bg-gray-800',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <RefreshCw className={clsx('h-4 w-4', isRefreshing && 'animate-spin')} />
            Refresh
          </button>
        </div>

        {isAdmin && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Manual Entry
            </h4>
            <form onSubmit={handleManualEntrySubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Participant name
                  </label>
                  <input
                    type="text"
                    value={manualEntryName}
                    onChange={(event) => setManualEntryName(event.target.value)}
                    className="w-full rounded-md border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-violet-500 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    placeholder="Alex Tan"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Entries to add
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={manualEntryCount}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      setManualEntryCount(Number.isFinite(value) && value > 0 ? Math.floor(value) : 1);
                    }}
                    className="w-full rounded-md border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-violet-500 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Participant ID (optional)
                  </label>
                  <input
                    type="text"
                    value={manualEntryFingerprint}
                    onChange={(event) => setManualEntryFingerprint(event.target.value)}
                    className="w-full rounded-md border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-violet-500 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    placeholder="manual_..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Photo ID {config?.requirePhotoUpload ? '(required)' : '(optional)'}
                  </label>
                  <input
                    type="text"
                    value={manualEntryPhotoId}
                    onChange={(event) => setManualEntryPhotoId(event.target.value)}
                    className="w-full rounded-md border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-violet-500 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    placeholder="Photo UUID"
                  />
                </div>
              </div>

              {manualEntryError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
                  {manualEntryError}
                </div>
              )}

              {manualEntrySuccess && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700 dark:border-green-500/40 dark:bg-green-500/10 dark:text-green-200">
                  {manualEntrySuccess}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={manualEntrySubmitting || !config}
                  className={clsx(
                    'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors',
                    'bg-gradient-to-r from-violet-600 to-pink-600',
                    'hover:from-violet-700 hover:to-pink-700',
                    (manualEntrySubmitting || !config) && 'opacity-70 cursor-not-allowed'
                  )}
                >
                  {manualEntrySubmitting ? 'Adding...' : 'Add Manual Entry'}
                </button>
                {!config && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Create a draw configuration before adding entries.
                  </span>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Entries List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          </div>
        ) : !hasEntries ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No Entries Yet
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Entries will be created automatically when users upload photos to this event.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {entries.map((entry) => (
                <EntryCard key={entry.id} entry={entry} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setEntriesPage((p) => Math.max(0, p - 1))}
                  disabled={!hasPrevPage}
                  className={clsx(
                    'inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                    'hover:bg-gray-50 dark:hover:bg-gray-800',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {entriesPage + 1} of {totalPages}
                </span>

                <button
                  onClick={() => setEntriesPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={!hasNextPage}
                  className={clsx(
                    'inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                    'hover:bg-gray-50 dark:hover:bg-gray-800',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // ============================================
  // PARTICIPANTS SUB-TAB CONTENT
  // ============================================

  const renderParticipantsTab = () => {
    const hasParticipants = participants.length > 0;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Participants
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {participantsSummary.uniqueParticipants} participant
              {participantsSummary.uniqueParticipants === 1 ? '' : 's'} · {participantsSummary.totalEntries} entries
            </p>
          </div>
          <button
            onClick={fetchParticipants}
            disabled={participantsLoading}
            className={clsx(
              'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
              'hover:bg-gray-50 dark:hover:bg-gray-800',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <RefreshCw className={clsx('h-4 w-4', participantsLoading && 'animate-spin')} />
            Refresh
          </button>
        </div>

        {participantsError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
            {participantsError}
          </div>
        )}

        {participantsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          </div>
        ) : !hasParticipants ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No Participants Yet
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Participants will appear once entries are created.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {participants.map((participant) => {
              const name = participant.participantName?.trim()
                || `Participant ${participant.userFingerprint.slice(0, 8)}`;
              const firstEntry = participant.firstEntryAt
                ? new Date(participant.firstEntryAt).toLocaleDateString()
                : 'Unknown';
              const lastEntry = participant.lastEntryAt
                ? new Date(participant.lastEntryAt).toLocaleDateString()
                : 'Unknown';

              return (
                <div
                  key={participant.userFingerprint}
                  className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      ID: {participant.userFingerprint}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      First entry: {firstEntry} · Last entry: {lastEntry}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {participant.entryCount} {participant.entryCount === 1 ? 'entry' : 'entries'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {participant.isWinner ? 'Winner' : 'Participant'}
                      </p>
                    </div>
                    {participant.isWinner && (
                      <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-semibold text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                        Winner
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ============================================
  // DRAW EXECUTION SUB-TAB CONTENT
  // ============================================

  const renderDrawTab = () => {
    const totalPrizes = config?.prizeTiers.reduce((sum, tier) => sum + tier.count, 0) || 0;
    const canExecute = !!config && config.status === 'scheduled' && entriesTotal > 0;
    const isAdmin = userRole === 'admin' || userRole === 'super_admin' || userRole === 'organizer';

    return (
      <div className="space-y-6">
        {successMessage && (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 dark:bg-green-900/20">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <p className="text-sm text-green-800 dark:text-green-300">{successMessage}</p>
          </div>
        )}

        {!config ? (
          <div className="text-center py-12">
            <Trophy className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No Draw Configuration
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Configure a draw before you can execute it.
            </p>
            <button
              onClick={() => setActiveSubTab('config')}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <Settings className="h-4 w-4" />
              Go to Configuration
            </button>
          </div>
        ) : (
          <>
            <DrawStatsCard
              config={config}
              entryCount={entriesTotal}
              isAdmin={isAdmin}
              canExecute={canExecute}
            />

            {canExecute && isAdmin && (
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Execute Draw
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Once you execute the draw, winners will be selected randomly and cannot be undone.
                </p>
                {entriesTotal < totalPrizes && (
                  <p className="text-sm text-orange-600 dark:text-orange-400 mb-4">
                    ⚠️ Warning: Only {entriesTotal} entries available for {totalPrizes} prizes
                  </p>
                )}
                <button
                  onClick={handleExecuteDraw}
                  disabled={drawInProgress || !canExecute}
                  className={clsx(
                    'w-full flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-base font-semibold transition-colors',
                    'bg-gradient-to-r from-violet-600 to-pink-600 text-white',
                    'hover:from-violet-700 hover:to-pink-700',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {drawInProgress ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Executing Draw...
                    </>
                  ) : (
                    <>
                      <Trophy className="h-5 w-5" />
                      Execute Lucky Draw
                    </>
                  )}
                </button>
                {drawError && (
                  <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                    {drawError}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // ============================================
  // HISTORY SUB-TAB CONTENT
  // ============================================

  const renderHistoryTab = () => {
    const completedDraws = drawHistory.filter((d) => d.status === 'completed');
    const hasDraws = drawHistory.length > 0;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Draw History
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {completedDraws.length} completed {completedDraws.length === 1 ? 'draw' : 'draws'}
            </p>
          </div>
          <button
            onClick={refreshData}
            disabled={isRefreshing}
            className={clsx(
              'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
              'hover:bg-gray-50 dark:hover:bg-gray-800',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <RefreshCw className={clsx('h-4 w-4', isRefreshing && 'animate-spin')} />
            Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          </div>
        ) : !hasDraws ? (
          <div className="text-center py-12">
            <History className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No Draw History
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Completed draws will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {drawHistory.map((draw) => (
              <DrawHistoryItem
                key={draw.configId}
                config={{
                  id: draw.configId,
                  status: draw.status,
                  prizeTiers: draw.prizeTiers,
                  totalEntries: draw.totalEntries,
                  createdAt: draw.createdAt,
                  completedAt: draw.completedAt,
                }}
                winnerCount={draw.winnerCount}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // ============================================
  // SUB-TAB NAVIGATION
  // ============================================

  const subTabs: { id: SubTab; label: string; icon: any }[] = [
    { id: 'config', label: 'Configuration', icon: Settings },
    { id: 'entries', label: 'Entries', icon: Users },
    { id: 'participants', label: 'Participants', icon: Users },
    { id: 'draw', label: 'Execute Draw', icon: Play },
    { id: 'history', label: 'History', icon: History },
  ];

  // ============================================
  // LOADING STATE
  // ============================================

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================

  if (error && !config) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Failed to Load Lucky Draw
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={refreshData}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <div className="space-y-6">
      {/* Error banner */}
      {error && config && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 dark:bg-red-900/20">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Sub-tab navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex gap-6 overflow-x-auto">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={clsx(
                  'flex items-center gap-2 whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors',
                  activeSubTab === tab.id
                    ? 'border-violet-500 text-violet-600 dark:border-violet-400 dark:text-violet-400'
                    : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-200'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sub-tab content */}
      <div className="mt-6">
        {activeSubTab === 'config' && renderConfigTab()}
        {activeSubTab === 'entries' && renderEntriesTab()}
        {activeSubTab === 'participants' && renderParticipantsTab()}
        {activeSubTab === 'draw' && renderDrawTab()}
        {activeSubTab === 'history' && renderHistoryTab()}
      </div>

      {/* Winner Modal */}
      {showWinnerModal && (
        <WinnerModal
          winners={winners}
          animationStyle={config?.animationStyle || 'spinning_wheel'}
          animationDuration={config?.animationDuration || 8}
          showSelfie={config?.showSelfie ?? true}
          showFullName={config?.showFullName ?? true}
          confettiAnimation={config?.confettiAnimation ?? true}
          onClose={() => {
            setShowWinnerModal(false);
            setWinners([]);
          }}
        />
      )}
    </div>
  );
}

// ============================================
// SUPPORTING COMPONENTS
// ============================================

function DrawConfigSummary({ config }: { config: LuckyDrawConfig }) {
  const totalPrizes = config.prizeTiers.reduce((sum, tier) => sum + tier.count, 0);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Current Configuration
      </h3>

      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Animation Style</p>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
            {config.animationStyle.replace('_', ' ')}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Max Entries Per User</p>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {config.maxEntriesPerUser} {config.maxEntriesPerUser === 1 ? 'entry' : 'entries'}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Prizes</p>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {totalPrizes} {totalPrizes === 1 ? 'prize' : 'prizes'}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
          <span className={clsx(
            'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
            config.status === 'scheduled'
              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          )}>
            {config.status}
          </span>
        </div>

        {/* Prize tiers summary */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Prize Tiers:</p>
          <div className="space-y-2">
            {config.prizeTiers.map((tier, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2 dark:bg-gray-800/50"
              >
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {tier.name}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  ×{tier.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DrawConfigCard({ config, onEdit }: { config: LuckyDrawConfig; onEdit: () => void }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Draw Configuration
        </h3>
        <button
          onClick={onEdit}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
        >
          <Settings className="h-4 w-4" />
          Edit Configuration
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
          <span className={clsx(
            'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
            config.status === 'scheduled'
              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          )}>
            {config.status}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Total Prizes</span>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {config.prizeTiers.reduce((sum, tier) => sum + tier.count, 0)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Animation</span>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
            {config.animationStyle.replace('_', ' ')}
          </span>
        </div>
      </div>
    </div>
  );
}

function DrawStatsCard({
  config,
  entryCount,
  isAdmin,
  canExecute
}: {
  config: LuckyDrawConfig;
  entryCount: number;
  isAdmin: boolean;
  canExecute: boolean;
}) {
  const totalPrizes = config?.prizeTiers.reduce((sum, tier) => sum + tier.count, 0) || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Entry Count */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <Users className="h-8 w-8 text-violet-600 mb-2" />
        <p className="text-sm text-gray-600 dark:text-gray-400">Total Entries</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{entryCount}</p>
      </div>

      {/* Prize Count */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <Trophy className="h-8 w-8 text-violet-600 mb-2" />
        <p className="text-sm text-gray-600 dark:text-gray-400">Total Prizes</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalPrizes}</p>
      </div>

      {/* Status */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <Settings className="h-8 w-8 text-violet-600 mb-2" />
        <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
        <p className="text-lg font-bold text-gray-900 dark:text-gray-100 capitalize">
          {config?.status || 'Unknown'}
        </p>
      </div>
    </div>
  );
}

// ============================================
// WINNER MODAL
// ============================================

interface WinnerModalProps {
  winners: Winner[];
  animationStyle: 'slot_machine' | 'spinning_wheel' | 'card_shuffle' | 'drum_roll' | 'random_fade';
  animationDuration: number;
  showSelfie: boolean;
  showFullName: boolean;
  confettiAnimation: boolean;
  onClose: () => void;
}

function WinnerModal({
  winners,
  animationStyle,
  animationDuration,
  showSelfie,
  showFullName,
  confettiAnimation,
  onClose,
}: WinnerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
  const [showAllWinners, setShowAllWinners] = useState(false);

  const currentWinner = winners[currentIndex];

  const advanceToNext = () => {
    if (currentIndex < winners.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setShowWinner(false);
      setIsAnimating(true);
    } else {
      // Show all winners summary
      setIsAnimating(false);
      setShowAllWinners(true);
    }
  };

  const handleAnimationComplete = () => {
    setIsAnimating(false);
    setShowWinner(true);
  };

  const skipToEnd = () => {
    setShowAllWinners(true);
    setIsAnimating(false);
  };

  // Reset modal when reopened
  useEffect(() => {
    setCurrentIndex(0);
    setIsAnimating(false);
    setShowWinner(false);
    setShowAllWinners(false);
  }, [winners.length]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
        >
          ✕
        </button>

        {!showAllWinners ? (
          <>
            {/* Animation Phase */}
            {!isAnimating && !showWinner && (
              <div className="py-12 text-center">
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Get Ready to Reveal Winners!
                </p>
                <button
                  onClick={() => {
                    setShowWinner(false);
                    setIsAnimating(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-pink-600 px-6 py-3 text-base font-medium text-white hover:from-violet-700 hover:to-pink-700"
                >
                  <Trophy className="h-5 w-5" />
                  Start Reveal
                </button>
                <button
                  onClick={skipToEnd}
                  className="ml-4 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                >
                  Show All Winners
                </button>
              </div>
            )}

            {isAnimating && (
              <DrawAnimation
                key={`${animationStyle}-${currentIndex}`}
                style={animationStyle}
                durationSeconds={animationDuration}
                onComplete={handleAnimationComplete}
              />
            )}

            {showWinner && currentWinner && (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Winner {currentIndex + 1} of {winners.length}
                </p>
                <WinnerDisplay
                  winner={currentWinner}
                  showSelfie={showSelfie}
                  showFullName={showFullName}
                  confettiAnimation={confettiAnimation}
                />
                <button
                  onClick={advanceToNext}
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-pink-600 px-6 py-3 text-base font-medium text-white hover:from-violet-700 hover:to-pink-700"
                >
                  {currentIndex < winners.length - 1 ? 'Next Winner' : 'View All Winners'}
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </>
        ) : (
          /* All Winners Summary */
          <div className="py-6">
            <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-6">
              🎉 Draw Complete!
            </h2>

            <div className="space-y-4 mb-8">
              {winners.map((winner, idx) => (
                <WinnerCard key={winner.id} winner={winner} rank={idx + 1} />
              ))}
            </div>

            <button
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Winner Card Component
function WinnerCard({ winner, rank }: { winner: Winner; rank: number }) {
  const medals = ['🥇', '🥈', '🥉', '🏅'];
  const medal = medals[Math.min(rank - 1, medals.length - 1)];

  return (
    <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <span className="text-2xl">{medal}</span>
      <div className="flex-1">
        <p className="font-semibold text-gray-900 dark:text-gray-100">
          {winner.participantName}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {winner.prizeName}
        </p>
      </div>
    </div>
  );
}

// Winner Display (single winner with confetti)
function WinnerDisplay({
  winner,
  showSelfie,
  showFullName,
  confettiAnimation,
}: {
  winner: Winner;
  showSelfie: boolean;
  showFullName: boolean;
  confettiAnimation: boolean;
}) {
  useEffect(() => {
    // Trigger confetti on mount
    if (confettiAnimation && typeof window !== 'undefined' && 'confetti' in window) {
      window.confetti?.({
        particleCount: 200,
        spread: 0.8,
        origin: { x: 0.5, y: 0.5 },
        colors: [
          '#8B5CF6', // Purple
          '#EC4899', // Pink
          '#F59E0B', // Amber
          '#10B981', // Emerald
        ],
        disableScroll: true,
        disableReducedMotion: false,
        zIndex: 9999,
      });
    }
  }, [confettiAnimation]);

  const displayName = showFullName
    ? winner.participantName
    : winner.participantName.split(' ')[0] || winner.participantName;

  return (
    <div className="text-center">
      {showSelfie && winner.selfieUrl ? (
        <div className="mb-4 flex justify-center">
          <img
            src={winner.selfieUrl}
            alt={winner.participantName}
            className="h-24 w-24 rounded-full object-cover shadow-md"
          />
        </div>
      ) : (
        <div className="mb-4 flex justify-center">
          <Trophy className="h-16 w-16 text-yellow-500" />
        </div>
      )}
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        {displayName}
      </h2>
      <p className="text-lg text-violet-600 font-semibold mb-1">
        {winner.prizeName}
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Congratulations! 🎉
      </p>
    </div>
  );
}
