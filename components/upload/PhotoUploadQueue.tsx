'use client';

import { AlertCircle, Image as ImageIcon, Loader2, Upload, X } from 'lucide-react';
import { formatFileSize } from '@/lib/utils';
import { isHeicLikeFile } from '@/lib/shared/upload-settings';

interface QueueFile {
  file: File;
  id: string;
  preview: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface PhotoUploadQueueProps {
  disabled: boolean;
  files: QueueFile[];
  isUploading: boolean;
  onClearAll: () => void;
  onClearCompleted: () => void;
  onRemoveFile: (id: string) => void;
  onRetryFile: (id: string) => void;
  onUploadFiles: () => void;
}

export function PhotoUploadQueue({
  disabled,
  files,
  isUploading,
  onClearAll,
  onClearCompleted,
  onRemoveFile,
  onRetryFile,
  onUploadFiles,
}: PhotoUploadQueueProps) {
  if (files.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 space-y-3">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="relative h-16 w-16 flex-shrink-0">
            {file.preview ? (
              isHeicLikeFile(file.file) ? (
                <div className="flex h-full w-full flex-col items-center justify-center rounded bg-gray-200 px-1 text-center dark:bg-gray-800">
                  <ImageIcon className="h-6 w-6 text-gray-400" />
                  <p className="mt-1 text-[9px] font-medium leading-tight text-gray-600 dark:text-gray-300">
                    Preview not available
                  </p>
                </div>
              ) : (
                <img
                  src={file.preview}
                  alt={file.file.name}
                  className="h-full w-full rounded object-cover"
                />
              )
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded bg-gray-200 dark:bg-gray-800">
                <ImageIcon className="h-8 w-8 text-gray-400" />
              </div>
            )}

            {file.status === 'success' && (
              <div className="absolute inset-0 flex items-center justify-center rounded bg-green-500/20">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-sm text-white">
                  OK
                </div>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
              {file.file.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatFileSize(file.file.size)}
            </p>

            {file.status === 'uploading' && (
              <div className="mt-1">
                <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-1.5 rounded-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${file.progress}%` }}
                  />
                </div>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {file.progress}%
                </p>
              </div>
            )}

            {file.status === 'error' && file.error && (
              <div className="mt-1 flex items-center gap-2">
                <p className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                  <AlertCircle className="h-3 w-3" />
                  {file.error}
                </p>
                <button
                  type="button"
                  onClick={() => onRetryFile(file.id)}
                  disabled={isUploading}
                  className="text-xs font-medium text-violet-600 hover:text-violet-700 disabled:opacity-50 dark:text-violet-400"
                >
                  Retry
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {file.status === 'uploading' && (
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            )}

            {(file.status === 'pending' || file.status === 'error') && (
              <button
                type="button"
                onClick={() => onRemoveFile(file.id)}
                className="rounded p-1.5 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950"
                disabled={isUploading}
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      ))}

      <div className="flex gap-3 pt-2">
        {files.some((file) => file.status === 'pending') && (
          <button
            type="button"
            onClick={onUploadFiles}
            disabled={isUploading || disabled}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload Photos
              </>
            )}
          </button>
        )}

        {files.some((file) => file.status === 'success') && (
          <button
            type="button"
            onClick={onClearCompleted}
            disabled={isUploading}
            className="rounded-lg bg-gray-200 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Clear Completed
          </button>
        )}

        <button
          type="button"
          onClick={onClearAll}
          disabled={isUploading}
          className="rounded-lg bg-gray-200 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Clear All
        </button>
      </div>
    </div>
  );
}
