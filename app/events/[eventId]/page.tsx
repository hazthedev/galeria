// ============================================
// MOMENTIQUE - Event Detail Page
// ============================================

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Share2,
  Settings,
  Upload,
  Loader2,
  Image as ImageIcon,
  Heart,
  ThumbsUp,
  Smile,
  Star,
} from 'lucide-react';
import clsx from 'clsx';
import type { IEvent, IPhoto } from '@/lib/types';
import { useSocket } from '@/lib/websocket/client';
import { getClientFingerprint } from '@/lib/fingerprint';

interface ReactionButtonsProps {
  photo: IPhoto;
  onReaction: (photoId: string, type: 'heart' | 'clap' | 'laugh' | 'wow') => void;
}

function ReactionButtons({ photo, onReaction }: ReactionButtonsProps) {
  const reactions = [
    { type: 'heart' as const, icon: Heart, label: 'Love' },
    { type: 'clap' as const, icon: ThumbsUp, label: 'Like' },
    { type: 'laugh' as const, icon: Smile, label: 'Smile' },
    { type: 'wow' as const, icon: Star, label: 'Amazing' },
  ];

  const totalReactions =
    (photo.reactions.heart || 0) +
    (photo.reactions.clap || 0) +
    (photo.reactions.laugh || 0) +
    (photo.reactions.wow || 0);

  return (
    <div className="flex items-center gap-1">
      {reactions.map(reaction => {
        const Icon = reaction.icon;
        const count = photo.reactions[reaction.type] || 0;
        return (
          <button
            key={reaction.type}
            onClick={() => onReaction(photo.id, reaction.type)}
            className={clsx(
              'flex items-center gap-1 rounded-full px-2 py-1 text-xs transition-colors',
              count > 0
                ? 'bg-pink-100 text-pink-700 hover:bg-pink-200 dark:bg-pink-900/30 dark:text-pink-400'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400'
            )}
          >
            <Icon className="h-3 w-3" />
            {count > 0 && <span>{count}</span>}
          </button>
        );
      })}
      {totalReactions === 0 && (
        <span className="text-xs text-gray-500 dark:text-gray-500">React</span>
      )}
    </div>
  );
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<IEvent | null>(null);
  const [photos, setPhotos] = useState<IPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<IPhoto | null>(null);
  const { socket, connected } = useSocket();
  const fingerprint = useMemo(() => getClientFingerprint(), []);

  const fetchEvent = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const [eventRes, photosRes] = await Promise.all([
        fetch(`/api/events/${eventId}`, { headers }),
        fetch(`/api/events/${eventId}/photos`, { headers }),
      ]);

      const eventData = await eventRes.json();
      const photosData = await photosRes.json();

      if (!eventRes.ok) {
        throw new Error(eventData.error || 'Failed to load event');
      }

      setEvent(eventData.data);
      setPhotos(photosData.data || []);
      setError(null);
    } catch (err) {
      console.error('[EVENT_DETAIL] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load event');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  useEffect(() => {
    if (!socket || !connected) return;

    socket.emit('join_event', { event_id: eventId, fingerprint: fingerprint || undefined });

    const handleNewPhoto = (photo: IPhoto) => {
      if (event?.settings?.features?.moderation_required && photo.status !== 'approved') {
        return;
      }
      setPhotos((prev) => {
        if (prev.some((p) => p.id === photo.id)) {
          return prev;
        }
        return [photo, ...prev];
      });
    };

    const handlePhotoUpdated = (data: { photo_id: string; status: string }) => {
      setPhotos((prev) => {
        const updated = prev.map((photo) =>
          photo.id === data.photo_id
            ? { ...photo, status: data.status as IPhoto['status'] }
            : photo
        );

        if (event?.settings?.features?.moderation_required && data.status !== 'approved') {
          return updated.filter((photo) => photo.status === 'approved');
        }

        return updated;
      });
    };

    socket.on('new_photo', handleNewPhoto);
    socket.on('photo_updated', handlePhotoUpdated);

    return () => {
      socket.emit('leave_event', { event_id: eventId });
      socket.off('new_photo', handleNewPhoto);
      socket.off('photo_updated', handlePhotoUpdated);
    };
  }, [socket, connected, eventId, fingerprint, event]);

  const handleReaction = async (photoId: string, type: 'heart' | 'clap' | 'laugh' | 'wow') => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/photos/${photoId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...(fingerprint ? { 'x-fingerprint': fingerprint } : {}),
        },
        body: JSON.stringify({ type }),
      });

      if (response.ok) {
        const data = await response.json();
        setPhotos(prev =>
          prev.map(p => {
            if (p.id === photoId) {
              return {
                ...p,
                reactions: {
                  ...p.reactions,
                  [type]: data.data?.count ?? (p.reactions[type] || 0),
                },
              };
            }
            return p;
          })
        );
      }
    } catch (err) {
      console.error('[EVENT_DETAIL] Reaction error:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error || 'Event not found'}</p>
          <Link
            href="/events"
            className="mt-4 inline-block text-violet-600 hover:text-violet-700 dark:text-violet-400"
          >
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  const eventDate = new Date(event.event_date);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="relative h-64 overflow-hidden bg-gradient-to-br from-violet-600 to-pink-600 sm:h-80">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-3xl font-bold sm:text-4xl lg:text-5xl">{event.name}</h1>
            {event.custom_hashtag && (
              <p className="mt-2 text-xl opacity-90">#{event.custom_hashtag}</p>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          href="/events"
          className="mb-6 inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Events
        </Link>

        {/* Event Info */}
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Event Details</h2>
              {event.description && (
                <p className="mt-2 text-gray-600 dark:text-gray-400">{event.description}</p>
              )}

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>{formattedDate}</span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="h-4 w-4" />
                    <span>{event.location}</span>
                  </div>
                )}
                {event.expected_guests && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Users className="h-4 w-4" />
                    <span>{event.expected_guests} expected guests</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Link
                href={`/events/${event.id}/upload`}
                className="inline-flex items-center rounded-lg bg-gradient-to-r from-violet-600 to-pink-600 px-4 py-2 text-sm font-medium text-white hover:from-violet-700 hover:to-pink-700"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Photos
              </Link>
              <Link
                href={`/events/${event.id}/admin`}
                className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Settings className="mr-2 h-4 w-4" />
                Admin
              </Link>
            </div>
          </div>
        </div>

        {/* Photos Section */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Photos ({photos.length})
            </h2>
          </div>

          {photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <ImageIcon className="mb-4 h-16 w-16 text-gray-400" />
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100">No photos yet</p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Be the first to share a moment!
              </p>
              <Link
                href={`/events/${event.id}/upload`}
                className="mt-4 inline-flex items-center rounded-lg bg-gradient-to-r from-violet-600 to-pink-600 px-4 py-2 text-sm font-medium text-white hover:from-violet-700 hover:to-pink-700"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Photos
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {photos.map(photo => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo)}
                  className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100"
                >
                  <Image
                    src={photo.images.medium_url}
                    alt={photo.caption || 'Event photo'}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                  />
                  {photo.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="truncate text-xs text-white">{photo.caption}</p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Photo Lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-h-full max-w-full" onClick={e => e.stopPropagation()}>
            <Image
              src={selectedPhoto.images.full_url}
              alt={selectedPhoto.caption || 'Event photo'}
              width={selectedPhoto.images.width}
              height={selectedPhoto.images.height}
              className="max-h-[90vh] max-w-[90vw] object-contain"
            />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -right-12 top-0 text-white hover:text-gray-300"
            >
              ✕
            </button>
          </div>
          <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-4 text-white">
            {selectedPhoto.caption && (
              <p className="text-lg">{selectedPhoto.caption}</p>
            )}
            {!selectedPhoto.is_anonymous && selectedPhoto.contributor_name && (
              <p className="text-sm opacity-75">by {selectedPhoto.contributor_name}</p>
            )}
            <ReactionButtons photo={selectedPhoto} onReaction={handleReaction} />
          </div>
        </div>
      )}
    </div>
  );
}
