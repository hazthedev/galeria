'use client';

import type { ChangeEvent, DragEvent, RefObject } from 'react';
import { Camera, Image as ImageIcon } from 'lucide-react';

interface PhotoUploadDropzoneProps {
  acceptValue: string;
  cameraInputRef: RefObject<HTMLInputElement | null>;
  disabled: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  isDragging: boolean;
  isUploading: boolean;
  maxFiles: number;
  remainingSlots: number;
  uploadConstraintLabel: string;
  onDragLeave: (event: DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onFileInput: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function PhotoUploadDropzone({
  acceptValue,
  cameraInputRef,
  disabled,
  inputRef,
  isDragging,
  isUploading,
  maxFiles,
  remainingSlots,
  uploadConstraintLabel,
  onDragLeave,
  onDragOver,
  onDrop,
  onFileInput,
}: PhotoUploadDropzoneProps) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`
        relative rounded-lg border-2 border-dashed p-6 text-center
        transition-colors duration-200
        ${isDragging ? 'border-violet-500 bg-violet-50 dark:bg-violet-950' : 'border-gray-300 dark:border-gray-700'}
        ${isUploading ? 'pointer-events-none opacity-50' : ''}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept={acceptValue}
        multiple
        max={maxFiles}
        onChange={onFileInput}
        className="hidden"
        disabled={disabled || isUploading}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept={acceptValue}
        capture="environment"
        onChange={onFileInput}
        className="hidden"
        disabled={disabled || isUploading}
      />

      <div className="mb-4 flex flex-col justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={isUploading || remainingSlots <= 0}
          className="
            flex items-center gap-2 rounded-lg border-2 border-transparent bg-gradient-to-br from-violet-500 to-pink-500 px-4 py-3
            text-white shadow-md transition-all hover:from-violet-600 hover:to-pink-600 hover:shadow-lg
            disabled:cursor-not-allowed disabled:opacity-50
          "
        >
          <Camera className="h-5 w-5" />
          <span className="font-medium">Take Photo</span>
        </button>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading || remainingSlots <= 0}
          className="
            flex items-center gap-2 rounded-lg border-2 border-gray-300 bg-white px-4 py-3
            text-gray-900 transition-all hover:border-violet-400 hover:bg-gray-50
            disabled:cursor-not-allowed disabled:opacity-50
            dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700
          "
        >
          <ImageIcon className="h-5 w-5 text-violet-600" />
          <span className="font-medium">Choose Files</span>
        </button>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        {isDragging ? 'Drop photos here' : 'Or drag and drop files'}
      </p>

      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
        {remainingSlots > 0
          ? `${remainingSlots} file${remainingSlots > 1 ? 's' : ''} remaining (max ${maxFiles})`
          : 'Maximum files reached'}
      </p>

      <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
        {uploadConstraintLabel}
      </p>
    </div>
  );
}
