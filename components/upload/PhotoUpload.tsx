// ============================================
// MOMENTIQUE - Drag & Drop Photo Upload Component
// ============================================

'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import { validateImageFile, formatFileSize } from '@/lib/utils';
import { getClientFingerprint } from '@/lib/fingerprint';
import { useSocket } from '@/lib/websocket/client';

// ============================================
// TYPES
// ============================================

interface PhotoUploadProps {
  eventId: string;
  onSuccess?: (photo: any) => void;
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

// ============================================
// COMPONENT
// ============================================

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
  const inputRef = useRef<HTMLInputElement>(null);
  const { socket } = useSocket();

  const remainingSlots = maxFiles - files.filter(f => f.status !== 'error').length;

  // ============================================
  // DRAG & DROP HANDLERS
  // ============================================

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled || isUploading) return;

      const droppedFiles = Array.from(e.dataTransfer.files);
      addFiles(droppedFiles);
    },
    [disabled, isUploading, files.length, maxFiles]
  );

  // ============================================
  // FILE INPUT HANDLERS
  // ============================================

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []);
      addFiles(selectedFiles);

      // Reset input
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    [disabled, isUploading, files.length, maxFiles]
  );

  // ============================================
  // ADD FILES TO QUEUE
  // ============================================

  const addFiles = useCallback(
    (newFiles: File[]) => {
      const validFiles: UploadFile[] = [];
      const errors: string[] = [];

      newFiles.forEach((file) => {
        // Check if we have room
        if (validFiles.length + files.filter(f => f.status !== 'error').length >= maxFiles) {
          errors.push(`${file.name}: Maximum ${maxFiles} files allowed`);
          return;
        }

        // Validate file
        const validation = validateImageFile(file);
        if (!validation.valid) {
          errors.push(`${file.name}: ${validation.error}`);
          return;
        }

        // Create preview
        const preview = URL.createObjectURL(file);

        validFiles.push({
          file,
          id: Math.random().toString(36).substring(7),
          preview,
          progress: 0,
          status: 'pending',
        });
      });

      if (errors.length > 0) {
        onError?.(errors.join('\n'));
      }

      setFiles((prev) => [...prev, ...validFiles]);
    },
    [files.length, maxFiles, onError]
  );

  // ============================================
  // REMOVE FILE FROM QUEUE
  // ============================================

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  // ============================================
  // UPLOAD FILES
  // ============================================

  const uploadFiles = useCallback(async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setIsUploading(true);

    for (const fileData of pendingFiles) {
      try {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileData.id ? { ...f, status: 'uploading', progress: 0 } : f
          )
        );

        const formData = new FormData();
        formData.append('file', fileData.file);

        // Upload with progress tracking
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileData.id ? { ...f, progress } : f
              )
            );
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText);
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileData.id ? { ...f, status: 'success', progress: 100 } : f
              )
            );
            const payload = response.data;
            const uploaded = Array.isArray(payload) ? payload : payload ? [payload] : [];
            uploaded.forEach((photo) => {
              onSuccess?.(photo);
              socket?.emit('upload_photo', {
                event_id: eventId,
                photo_data: photo,
              });
            });
          } else {
            const error = JSON.parse(xhr.responseText);
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileData.id ? { ...f, status: 'error', error: error.error || 'Upload failed' } : f
              )
            );
          }
        };

        xhr.onerror = () => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileData.id ? { ...f, status: 'error', error: 'Upload failed' } : f
            )
          );
        };

        xhr.open('POST', `/api/events/${eventId}/photos`);
        const fingerprint = getClientFingerprint();
        if (fingerprint) {
          xhr.setRequestHeader('x-fingerprint', fingerprint);
        }
        xhr.send(formData);
      } catch (error) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileData.id ? { ...f, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' } : f
          )
        );
      }
    }

    setIsUploading(false);
  }, [files, eventId, onSuccess]);

  // ============================================
  // CLEAR COMPLETED FILES
  // ============================================

  const clearCompleted = useCallback(() => {
    setFiles((prev) => prev.filter((f) => f.status !== 'success'));
  }, []);

  // ============================================
  // CLEAR ALL FILES
  // ============================================

  const clearAll = useCallback(() => {
    files.forEach((f) => URL.revokeObjectURL(f.preview));
    setFiles([]);
  }, [files]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className={className}>
      {/* Drag & Drop Zone */}
      {!disabled && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors duration-200
            ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : 'border-gray-300 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-600'}
            ${isUploading ? 'pointer-events-none opacity-50' : ''}
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/heic,image/webp"
            multiple
            max={maxFiles}
            onChange={handleFileInput}
            className="hidden"
            disabled={disabled || isUploading}
          />

          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />

          <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            Drop photos here or click to upload
          </p>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            {remainingSlots > 0
              ? `${remainingSlots} file${remainingSlots > 1 ? 's' : ''} remaining (max ${maxFiles})`
              : 'Maximum files reached'}
          </p>

          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            JPEG, PNG, HEIC, WebP • Max 10MB
          </p>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-3">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800"
            >
              {/* Thumbnail */}
              <div className="relative w-16 h-16 flex-shrink-0">
                {file.preview ? (
                  <img
                    src={file.preview}
                    alt={file.file.name}
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 dark:bg-gray-800 rounded flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}

                {/* Status Icon */}
                {file.status === 'success' && (
                  <div className="absolute inset-0 bg-green-500/20 rounded flex items-center justify-center">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">✓</span>
                    </div>
                  </div>
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {file.file.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(file.file.size)}
                </p>

                {/* Progress Bar */}
                {file.status === 'uploading' && (
                  <div className="mt-1">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {file.progress}%
                    </p>
                  </div>
                )}

                {/* Error Message */}
                {file.status === 'error' && file.error && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {file.error}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {file.status === 'uploading' && (
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                )}

                {(file.status === 'pending' || file.status === 'error') && (
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded transition-colors"
                    disabled={isUploading}
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            {files.some((f) => f.status === 'pending') && (
              <button
                onClick={uploadFiles}
                disabled={isUploading || disabled}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload Photos
                  </>
                )}
              </button>
            )}

            {files.some((f) => f.status === 'success') && (
              <button
                onClick={clearCompleted}
                disabled={isUploading}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
              >
                Clear Completed
              </button>
            )}

            {files.length > 0 && (
              <button
                onClick={clearAll}
                disabled={isUploading}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
