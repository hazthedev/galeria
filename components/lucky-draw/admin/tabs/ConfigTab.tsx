import type { Dispatch, FormEvent, SetStateAction } from 'react';
import clsx from 'clsx';
import { CheckCircle2, Settings } from 'lucide-react';
import type { AnimationStyle, LuckyDrawConfig } from '@/lib/types';
import { animationStyleOptions, defaultTierName, prizeTierOptions } from '../constants';
import type { ConfigFormState, PrizeTierForm } from '../types';

interface ConfigTabProps {
  config: LuckyDrawConfig | null;
  configForm: ConfigFormState;
  setConfigForm: Dispatch<SetStateAction<ConfigFormState>>;
  isEditingConfig: boolean;
  isSavingConfig: boolean;
  configSaveError: string | null;
  successMessage: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancelEdit: () => void;
  onEditConfig: () => void;
  onUpdatePrizeTier: (index: number, updates: Partial<PrizeTierForm>) => void;
  onAddPrizeTier: () => void;
  onRemovePrizeTier: (index: number) => void;
}

export function ConfigTab({
  config,
  configForm,
  setConfigForm,
  isEditingConfig,
  isSavingConfig,
  configSaveError,
  successMessage,
  onSubmit,
  onCancelEdit,
  onEditConfig,
  onUpdatePrizeTier,
  onAddPrizeTier,
  onRemovePrizeTier,
}: ConfigTabProps) {
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
        <ConfigForm
          config={config}
          configForm={configForm}
          setConfigForm={setConfigForm}
          isSavingConfig={isSavingConfig}
          configSaveError={configSaveError}
          onSubmit={onSubmit}
          onCancelEdit={onCancelEdit}
          onUpdatePrizeTier={onUpdatePrizeTier}
          onAddPrizeTier={onAddPrizeTier}
          onRemovePrizeTier={onRemovePrizeTier}
        />
      ) : config ? (
        <>
          <DrawConfigSummary config={config} />
          <DrawConfigCard config={config} onEdit={onEditConfig} />
        </>
      ) : null}
    </div>
  );
}

interface ConfigFormProps {
  config: LuckyDrawConfig | null;
  configForm: ConfigFormState;
  setConfigForm: Dispatch<SetStateAction<ConfigFormState>>;
  isSavingConfig: boolean;
  configSaveError: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancelEdit: () => void;
  onUpdatePrizeTier: (index: number, updates: Partial<PrizeTierForm>) => void;
  onAddPrizeTier: () => void;
  onRemovePrizeTier: (index: number) => void;
}

function ConfigForm({
  config,
  configForm,
  setConfigForm,
  isSavingConfig,
  configSaveError,
  onSubmit,
  onCancelEdit,
  onUpdatePrizeTier,
  onAddPrizeTier,
  onRemovePrizeTier,
}: ConfigFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
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
            onClick={onAddPrizeTier}
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
                      onUpdatePrizeTier(index, {
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
                    onChange={(event) => onUpdatePrizeTier(index, { name: event.target.value })}
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
                      onUpdatePrizeTier(index, { count: Number.isFinite(value) && value > 0 ? value : 1 });
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
                    onChange={(event) => onUpdatePrizeTier(index, { description: event.target.value })}
                    className="w-full rounded-md border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-violet-500 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    placeholder="Example: iPad Mini"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => onRemovePrizeTier(index)}
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
            onClick={onCancelEdit}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function DrawConfigSummary({ config }: { config: LuckyDrawConfig }) {
  const totalPrizes = config.prizeTiers.reduce((sum, tier) => sum + tier.count, 0);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Current Configuration
      </h3>

      <div className="space-y-4">
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
                  x{tier.count}
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
      </div>
    </div>
  );
}
