// ============================================
// Galeria - Drag & Drop Photo Upload Component
// ============================================

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { getImageDimensions } from '@/lib/utils';
import { getClientFingerprint } from '@/lib/rate-limit';
import { usePhotoGallery } from '@/lib/realtime/client';
import type { IPhoto } from '@/lib/types';
import { PhotoUploadDropzone } from './PhotoUploadDropzone';
import { PhotoUploadQueue } from './PhotoUploadQueue';
import {
  DEFAULT_UPLOAD_SETTINGS,
  formatUploadConstraintLabel,
  getUploadAcceptValue,
  normalizeUploadSettings,
  validateFileAgainstUploadSettings,
  type UploadSettingsSummary,
} from '@/lib/shared/upload-settings';

interface PhotoUploadProps {
  eventId: string;
  onSuccess?: (photo: IPhoto) => void;
  onError?: (error: string) => void;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
}

interface UploadFile {
  file: File;
  id: string;
  preview: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

const BROWSER_DIRECT_UPLOAD_ENABLED = process.env.NEXT_PUBLIC_R2_DIRECT_UPLOAD_ENABLED !== 'false';

async function uploadFileToPresignedUrl(uploadUrl: string, file: File, onProgress: (progress: number) => void) {
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error('Upload failed'));
      }
    };

    xhr.onerror = () => reject(new Error('Upload failed'));

    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.send(file);
  });
}

export function PhotoUpload({
  eventId,
  onSuccess,
  onError,
  maxFiles = 5,
  disabled = false,
  className,
}: PhotoUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSettings, setUploadSettings] = useState<UploadSettingsSummary>(DEFAULT_UPLOAD_SETTINGS);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { broadcastNewPhoto } = usePhotoGallery(eventId);

  const remainingSlots = maxFiles - files.filter((file) => file.status !== 'error').length;
  const acceptValue = getUploadAcceptValue(uploadSettings.allowed_types);
  const uploadConstraintLabel = formatUploadConstraintLabel(uploadSettings);

  useEffect(() => {
    const fetchUploadSettings = async () => {
      try {
        const response = await fetch('/api/upload-settings', { cache: 'no-store' });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load upload settings');
        }

        setUploadSettings(normalizeUploadSettings(data.data));
      } catch {
        setUploadSettings(DEFAULT_UPLOAD_SETTINGS);
      }
    };

    void fetchUploadSettings();
  }, []);

  const addFiles = useCallback(
    (newFiles: File[]) => {
      const validFiles: UploadFile[] = [];
      const errors: string[] = [];

      newFiles.forEach((file) => {
        if (validFiles.length + files.filter((queuedFile) => queuedFile.status !== 'error').length >= maxFiles) {
          errors.push(`${file.name}: Maximum ${maxFiles} files allowed`);
          return;
        }

        const validation = validateFileAgainstUploadSettings(file, uploadSettings);
        if (!validation.valid) {
          errors.push(`${file.name}: ${validation.error}`);
          return;
        }

        validFiles.push({
          file,
          id: Math.random().toString(36).substring(7),
          preview: URL.createObjectURL(file),
          progress: 0,
          status: 'pending',
        });
      });

      if (errors.length > 0) {
        onError?.(errors.join('\n'));
      }

      setFiles((prev) => [...prev, ...validFiles]);
    },
    [files, maxFiles, onError, uploadSettings]
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);

      if (disabled || isUploading) return;

      addFiles(Array.from(event.dataTransfer.files));
    },
    [addFiles, disabled, isUploading]
  );

  const handleFileInput = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      addFiles(Array.from(event.target.files || []));

      if (inputRef.current) {
        inputRef.current.value = '';
      }
      if (cameraInputRef.current) {
        cameraInputRef.current.value = '';
      }
    },
    [addFiles]
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const file = prev.find((queuedFile) => queuedFile.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }

      return prev.filter((queuedFile) => queuedFile.id !== id);
    });
  }, []);

  const retryFile = useCallback((id: string) => {
    setFiles((prev) =>
      prev.map((file) =>
        file.id === id
          ? { ...file, status: 'pending', progress: 0, error: undefined }
          : file
      )
    );
  }, []);

  const uploadFiles = useCallback(async () => {
    const pendingFiles = files.filter((file) => file.status === 'pending');
    if (pendingFiles.length === 0) return;

    setIsUploading(true);

    for (const fileData of pendingFiles) {
      try {
        setFiles((prev) =>
          prev.map((file) =>
            file.id === fileData.id ? { ...file, status: 'uploading', progress: 0 } : file
          )
        );

        const fingerprint = getClientFingerprint();
        const presignRes = await fetch(`/api/events/${eventId}/photos/presign`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(fingerprint ? { 'x-fingerprint': fingerprint } : {}),
          },
          body: JSON.stringify({
            filename: fileData.file.name,
            contentType: fileData.file.type,
            fileSize: fileData.file.size,
          }),
        });

        if (!presignRes.ok) {
          const err = await presignRes.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to get upload URL');
        }

        const presignData = await presignRes.json();
        const { uploadUrl, key, photoId } = presignData.data || {};

        if (!uploadUrl || !key || !photoId) {
          throw new Error('Invalid presign response');
        }

        let response: { data?: unknown };

        const fallbackToMultipartUpload = async () => {
          const formData = new FormData();
          formData.append('file', fileData.file);

          const fallbackRes = await fetch(`/api/events/${eventId}/photos`, {
            method: 'POST',
            headers: fingerprint ? { 'x-fingerprint': fingerprint } : {},
            body: formData,
          });

          if (!fallbackRes.ok) {
            const err = await fallbackRes.json().catch(() => ({}));
            throw new Error(err.error || 'Failed to upload photo');
          }

          return fallbackRes.json();
        };

        if (!BROWSER_DIRECT_UPLOAD_ENABLED) {
          response = await fallbackToMultipartUpload();
        } else {
          try {
            await uploadFileToPresignedUrl(uploadUrl, fileData.file, (progress) => {
              setFiles((prev) =>
                prev.map((file) =>
                  file.id === fileData.id ? { ...file, progress } : file
                )
              );
            });

            const dimensions = await getImageDimensions(fileData.file);
            const finalizeRes = await fetch(`/api/events/${eventId}/photos`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(fingerprint ? { 'x-fingerprint': fingerprint } : {}),
              },
              body: JSON.stringify({
                photoId,
                key,
                width: dimensions.width,
                height: dimensions.height,
                fileSize: fileData.file.size,
                caption: undefined,
                contributorName: undefined,
                isAnonymous: false,
                joinLuckyDraw: false,
              }),
            });

            if (!finalizeRes.ok) {
              const err = await finalizeRes.json().catch(() => ({}));
              throw new Error(err.error || 'Failed to finalize upload');
            }

            response = await finalizeRes.json();
          } catch (directUploadError) {
            if (!(directUploadError instanceof Error) || directUploadError.message !== 'Upload failed') {
              throw directUploadError;
            }

            response = await fallbackToMultipartUpload();
          }
        }

        setFiles((prev) =>
          prev.map((file) =>
            file.id === fileData.id ? { ...file, status: 'success', progress: 100 } : file
          )
        );

        const payload = response.data;
        const uploaded = Array.isArray(payload) ? payload : payload ? [payload] : [];
        uploaded.forEach((photo) => {
          onSuccess?.(photo as IPhoto);
          broadcastNewPhoto(photo as IPhoto);
        });
      } catch (error) {
        setFiles((prev) =>
          prev.map((file) =>
            file.id === fileData.id
              ? { ...file, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' }
              : file
          )
        );
      }
    }

    setIsUploading(false);
  }, [broadcastNewPhoto, eventId, files, onSuccess]);

  const clearCompleted = useCallback(() => {
    setFiles((prev) => prev.filter((file) => file.status !== 'success'));
  }, []);

  const clearAll = useCallback(() => {
    files.forEach((file) => URL.revokeObjectURL(file.preview));
    setFiles([]);
  }, [files]);

  return (
    <div className={className}>
      {!disabled && (
        <PhotoUploadDropzone
          acceptValue={acceptValue}
          cameraInputRef={cameraInputRef}
          disabled={disabled}
          inputRef={inputRef}
          isDragging={isDragging}
          isUploading={isUploading}
          maxFiles={maxFiles}
          remainingSlots={remainingSlots}
          uploadConstraintLabel={uploadConstraintLabel}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onFileInput={handleFileInput}
        />
      )}

      <PhotoUploadQueue
        disabled={disabled}
        files={files}
        isUploading={isUploading}
        onClearAll={clearAll}
        onClearCompleted={clearCompleted}
        onRemoveFile={removeFile}
        onRetryFile={retryFile}
        onUploadFiles={uploadFiles}
      />
    </div>
  );
}
