// ============================================
// Galeria - Admin Confirmation Dialog
// ============================================
// Reusable confirmation dialog for critical admin actions
// Provides proper UX for destructive or sensitive operations

'use client';

import { ReactNode } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string | ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  variant?: 'danger' | 'warning' | 'info' | 'primary';
  isPending?: boolean;
  confirmDisabled?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  variant = 'danger',
  isPending = false,
  confirmDisabled = false,
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    if (confirmDisabled) {
      return;
    }
    await onConfirm();
    if (!isPending) {
      onOpenChange(false);
    }
  };

  if (!open) return null;

  const variantStyles = {
    danger: {
      confirm: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
      cancel: 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700',
    },
    warning: {
      confirm: 'bg-orange-600 hover:bg-orange-700 text-white focus:ring-orange-500',
      cancel: 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700',
    },
    info: {
      confirm: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
      cancel: 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700',
    },
    primary: {
      confirm: 'bg-violet-600 hover:bg-violet-700 text-white focus:ring-violet-500',
      cancel: 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="p-6 pb-4">
          <h2
            id="confirm-dialog-title"
            className="text-xl font-semibold text-gray-900 dark:text-white"
          >
            {title}
          </h2>
        </div>

        {/* Description */}
        <div className="px-6 pb-6">
          <div
            id="confirm-dialog-description"
            className="text-gray-600 dark:text-gray-400"
          >
            {description}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 px-6 pb-6 pt-0">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className={`inline-flex min-h-11 items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:focus-visible:ring-offset-gray-800 ${styles.cancel}`}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending || confirmDisabled}
            className={`inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:focus-visible:ring-offset-gray-800 ${styles.confirm}`}
          >
            {isPending ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>

        {/* Close button for keyboard users */}
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          disabled={isPending}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 disabled:opacity-50"
          aria-label="Close dialog"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

/**
 * Hook for managing confirmation dialog state
 * @example
 * const confirm = useConfirmDialog();
 *
 * <ConfirmDialog {...confirm.dialog} />
 *
 * <button onClick={() => confirm.show({
 *   title: 'Delete User?',
 *   description: 'This action cannot be undone.',
 *   onConfirm: async () => { await deleteUser(); }
 * })}>
 *   Delete
 * </button>
 */
export function useConfirmDialog() {
  const [dialog, setDialog] = React.useState<{
    open: boolean;
    title: string;
    description: string | ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void | Promise<void>;
    variant?: 'danger' | 'warning' | 'info' | 'primary';
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: async () => {},
  });

  const [isPending, setIsPending] = React.useState(false);

  const show = (options: {
    title: string;
    description: string | ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void | Promise<void>;
    variant?: 'danger' | 'warning' | 'info' | 'primary';
  }) => {
    setDialog({
      open: true,
      ...options,
    });
  };

  const hide = () => {
    setDialog((prev) => ({ ...prev, open: false }));
    setIsPending(false);
  };

  const handleConfirm = async () => {
    setIsPending(true);
    try {
      await dialog.onConfirm();
      hide();
    } catch (error) {
      setIsPending(false);
      throw error;
    }
  };

  return {
    dialog: {
      ...dialog,
      isPending,
      onOpenChange: (open: boolean) => {
        if (!open) hide();
        setDialog((prev) => ({ ...prev, open }));
      },
      onConfirm: handleConfirm,
    },
    show,
    hide,
  };
}

// Import React for the hook
import React from 'react';
