// ============================================
// GALERIA - Landing Page
// ============================================
// Modern SaaS landing page showcasing event photo gallery platform

import Link from 'next/link';
import {
  Users,
  ShieldCheck,
  Camera,
  Gift,
  Trophy,
  Shield,
  QrCode,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  PartyPopper,
  Building2,
  Heart,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-gray-200/50 bg-white/80 backdrop-blur-md dark:border-gray-800/50 dark:bg-gray-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500" />
            <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
              Galeria
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              Login
            </Link>
            <Link
              href="/auth/register"
              className="rounded-lg bg-gradient-to-r from-violet-600 to-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:shadow-violet-500/30 hover:-translate-y-0.5"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-32">
        {/* Background Effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 h-96 w-96 -translate-y-1/2 rounded-full bg-violet-300/30 blur-3xl dark:bg-violet-900/20" />
          <div className="absolute bottom-0 right-1/4 h-96 w-96 translate-y-1/2 rounded-full bg-pink-300/30 blur-3xl dark:bg-pink-900/20" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-sm font-medium text-violet-700 dark:border-violet-800/50 dark:bg-violet-950 dark:text-violet-300">
              <Sparkles className="h-4 w-4" />
              <span>AI-Powered Photo Moderation</span>
            </div>

            {/* Heading */}
            <h1 className="mt-8 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
              Capture Moments,
              <br />
              <span className="bg-gradient-to-r from-violet-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
                Together
              </span>
            </h1>

            {/* Subheading */}
            <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400">
              The all-in-one event photo gallery platform. Let guests upload photos instantly,
              run exciting lucky draws, and keep everyone engaged with photo challenges.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/register"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:shadow-violet-500/30 hover:-translate-y-0.5"
              >
                Start Free Trial
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-200 px-8 py-3.5 text-base font-semibold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-800"
              >
                Sign In
              </Link>
            </div>

            {/* Social Proof */}
            <p className="mt-6 text-sm text-gray-500 dark:text-gray-500">
              No credit card required • Free tier available • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 sm:py-32 bg-gray-50 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Everything you need to engage your guests
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              A complete platform for event photo sharing, guest engagement, and attendance tracking.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1: Photo Sharing */}
            <div className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:border-violet-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-violet-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 text-white">
                <Camera className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                Instant Photo Sharing
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Guests upload photos via QR code. No app download required. All photos appear in
                a beautiful, branded gallery in real-time.
              </p>
            </div>

            {/* Feature 2: Lucky Draw */}
            <div className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:border-violet-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-violet-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 text-white">
                <Gift className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                Lucky Draw System
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Automatically enter guests who upload photos. Run exciting draws with multiple
                prize tiers, animations, and winner tracking.
              </p>
            </div>

            {/* Feature 3: Photo Challenges */}
            <div className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:border-violet-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-violet-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                <Trophy className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                Photo Challenges
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Encourage more uploads with goal-based challenges. Guests who reach the photo
                goal earn prizes with QR-verified claims.
              </p>
            </div>

            {/* Feature 4: AI Moderation */}
            <div className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:border-violet-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-violet-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                AI Content Moderation
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Automatic content filtering keeps your gallery appropriate. Powered by AWS
                Rekognition with configurable sensitivity.
              </p>
            </div>

            {/* Feature 5: Attendance Tracking */}
            <div className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:border-violet-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-violet-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 text-white">
                <QrCode className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                Attendance Tracking
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                QR code check-ins with real-time stats. Track guest attendance and export
                reports for post-event analysis.
              </p>
            </div>

            {/* Feature 6: Custom Branding */}
            <div className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:border-violet-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-violet-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 text-white">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                Custom Branding
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Match your event theme with custom colors, logos, and backgrounds. Create a
                cohesive experience for your guests.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              Get your event gallery live in under 2 minutes
            </p>
          </div>

          <div className="mt-16 grid gap-12 lg:grid-cols-3">
            {/* Step 1 */}
            <div className="relative">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-pink-600 text-lg font-bold text-white">
                  1
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Create Event</h3>
              </div>
              <p className="mt-4 pl-14 text-gray-600 dark:text-gray-400">
                Set up your event with custom branding, upload rules, and optional features like
                lucky draw or photo challenges.
              </p>
              <div className="absolute -bottom-6 left-5 hidden lg:block">
                <ArrowRight className="h-6 w-6 text-gray-300" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-pink-600 text-lg font-bold text-white">
                  2
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Share QR Code</h3>
              </div>
              <p className="mt-4 pl-14 text-gray-600 dark:text-gray-400">
                Display the unique QR code at your venue. Guests scan it to access the gallery
                and start uploading photos instantly.
              </p>
              <div className="absolute -bottom-6 left-5 hidden lg:block">
                <ArrowRight className="h-6 w-6 text-gray-300" />
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-pink-600 text-lg font-bold text-white">
                  3
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Engage & Enjoy</h3>
              </div>
              <p className="mt-4 pl-14 text-gray-600 dark:text-gray-400">
                Watch photos stream in live. Moderate content, run lucky draws, and download
                all photos after the event.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 sm:py-32 bg-gray-50 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Perfect for any event
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              From intimate gatherings to large corporate functions
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {/* Birthday */}
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-lg">
                <PartyPopper className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                Birthday Parties
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Kids love the lucky draw. Parents love seeing all the memories.
              </p>
            </div>

            {/* Wedding */}
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-lg">
                <Heart className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                Weddings & Receptions
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Collect candid moments from every guest. Beautiful galleries for the couple.
              </p>
            </div>

            {/* Corporate */}
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg">
                <Building2 className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                Corporate Events
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Professional branding, attendance tracking, and secure photo galleries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Checklist */}
      <section className="py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                Everything included
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                No hidden fees. No surprises. Just powerful features to make your event a
                success.
              </p>

              <ul className="mt-8 space-y-4">
                {[
                  'Unlimited events on all plans',
                  'AI-powered content moderation',
                  'Custom event branding & themes',
                  'Lucky draw with multiple prize tiers',
                  'Photo challenges with prize claims',
                  'QR code attendance tracking',
                  'Photo reactions & comments',
                  'Bulk photo export & download',
                  'Real-time photo gallery',
                  'Mobile-optimized guest experience',
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-violet-600 dark:text-violet-400 shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA Card */}
            <div className="flex items-center">
              <div className="w-full rounded-2xl border border-gray-200 bg-gradient-to-br from-violet-50 to-pink-50 p-8 dark:border-gray-800 dark:from-violet-950/50 dark:to-pink-950/50">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Ready to get started?
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Join thousands of event organizers creating memorable experiences.
                </p>

                <div className="mt-6 space-y-3">
                  <Link
                    href="/auth/register"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:shadow-violet-500/30 hover:-translate-y-0.5"
                  >
                    Start Free Trial
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link
                    href="/auth/login"
                    className="flex w-full items-center justify-center rounded-xl border-2 border-gray-300 px-6 py-3.5 font-semibold text-gray-700 transition-all hover:border-gray-400 hover:bg-white dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-900"
                  >
                    Sign In to Existing Account
                  </Link>
                </div>

                <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-500">
                  <Link href="/auth/admin/login" className="hover:text-gray-700 dark:hover:text-gray-400">
                    Admin Login
                  </Link>
                  <span>•</span>
                  <span>No credit card required</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-12 dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-gradient-to-br from-violet-500 to-pink-500" />
              <span className="font-semibold text-gray-900 dark:text-white">Galeria</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              © 2025 Galeria. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
