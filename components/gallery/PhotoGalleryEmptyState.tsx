'use client';

export function PhotoGalleryEmptyState() {
  return (
    <div className="py-12 text-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="mx-auto mb-4 h-16 w-16 text-gray-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3v12" />
        <path d="M7 8l5-5 5 5" />
        <rect x="4" y="15" width="16" height="6" rx="2" />
      </svg>
      <p className="text-gray-500">No photos yet</p>
      <p className="text-sm text-gray-400">Be the first to share a moment!</p>
    </div>
  );
}
