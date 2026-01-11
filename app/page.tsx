// ============================================
// MOMENTIQUE - Landing Page
// ============================================

import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/layout/header';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-24 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Capture Event Moments
            <span className="block bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              In Real-Time
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            Create engaging photo galleries and run exciting lucky draws for your events.
            Guests upload photos instantly and see them appear live.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/events/new"
              className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-3 text-lg font-semibold text-white shadow-lg hover:from-purple-700 hover:to-pink-700"
            >
              Create Event
            </Link>
            <Link
              href="/docs"
              className="rounded-lg border border-gray-300 px-8 py-3 text-lg font-semibold text-gray-700 hover:bg-gray-50"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="py-16">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="rounded-xl border border-purple-100 bg-white p-6 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                  <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.294a9.956 9.956 0 111.414 1.414M4 20h16a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2h16a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2-2v2a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Real-Time Photo Gallery</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Guests upload photos and see them appear instantly in a beautiful masonry gallery
                </p>
              </div>

              {/* Feature 2 */}
              <div className="rounded-xl border border-purple-100 bg-white p-6 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-pink-100">
                  <svg className="h-6 w-6 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Lucky Draw</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Engage guests with exciting lucky draw animations and prize giveaways
                </p>
              </div>

              {/* Feature 3 */}
              <div className="rounded-xl border border-purple-100 bg-white p-6 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100">
                  <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Multi-Tenant</h3>
                <p className="mt-2 text-sm text-gray-600">
                  White-label solution with custom domains and branding for event organizers
                </p>
              </div>

              {/* Feature 4 */}
              <div className="rounded-xl border border-purple-100 bg-white p-6 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                  <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Photo Moderation</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Approve or reject photos before they appear in the public gallery
                </p>
              </div>

              {/* Feature 5 */}
              <div className="rounded-xl border border-purple-100 bg-white p-6 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100">
                  <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Reactions</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Guests can react to photos with hearts, claps, laughs, and wow emojis
                </p>
              </div>

              {/* Feature 6 */}
              <div className="rounded-xl border border-purple-100 bg-white p-6 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Easy Export</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Download all photos after the event with one click
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* API Section */}
        <div className="py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold text-gray-900">Developer Friendly API</h2>
            <p className="mt-4 text-gray-600">
              Built with Next.js 16, TypeScript, and modern APIs. Easy to integrate and extend.
            </p>
            <div className="mt-8 rounded-lg bg-gray-900 p-4 text-left">
              <code className="text-sm text-gray-300">
                <span className="text-purple-400">POST</span> /api/events<br />
                <span className="text-purple-400">GET</span> /api/events/[eventId]/photos<br />
                <span className="text-purple-400">POST</span> /api/events/[eventId]/lucky-draw/start
              </code>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-purple-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-600">
            © 2025 Momentique. Built with Next.js, TypeScript, and Tailwind CSS.
          </p>
        </div>
      </footer>
    </div>
  );
}
