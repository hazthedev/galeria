// ============================================
// GALERIA - Landing Page
// ============================================
// Modern SaaS landing page showcasing event photo gallery platform

import Link from 'next/link';
import {
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
  Zap,
  Image,
  Users,
  Star,
  Play,
} from 'lucide-react';

/** Inline brand mark matching the Galeria icon set — dark navy bg with purple "G" */
function BrandMark({ size = 36, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" className={className}>
      <defs>
        <linearGradient id="gm-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#131A2E"/>
          <stop offset="100%" stopColor="#0C1220"/>
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill="url(#gm-bg)"/>
      <text x="256" y="310" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontSize="280" fontWeight="700" fill="#8B5CF6">G</text>
    </svg>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-gray-100/80 bg-white/70 backdrop-blur-xl dark:border-gray-800/50 dark:bg-gray-950/70">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <BrandMark size={36} />
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Galeria
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="hidden sm:inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              Login
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            >
              Get Started
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 sm:pt-44 sm:pb-36">
        {/* Background gradient mesh */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/3 h-[800px] w-[800px] rounded-full bg-gradient-to-br from-violet-200/50 via-purple-100/40 to-transparent blur-3xl dark:from-violet-900/25 dark:via-purple-900/15" />
          <div className="absolute top-20 right-0 h-[400px] w-[400px] rounded-full bg-gradient-to-bl from-purple-100/50 to-transparent blur-3xl dark:from-purple-900/15" />
          <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-violet-100/40 to-transparent blur-3xl dark:from-violet-900/15" />
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,.015)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,.015)_1px,transparent_1px)] bg-[size:72px_72px] dark:bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)]" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-violet-50/80 px-4 py-1.5 text-sm font-medium text-violet-700 backdrop-blur-sm dark:border-violet-800/40 dark:bg-violet-950/50 dark:text-violet-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Event Photo Gallery Platform</span>
            </div>

            {/* Heading */}
            <h1 className="mt-8 text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-7xl sm:leading-[1.1]">
              Capture Moments,{' '}
              <span className="relative">
                <span className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
                  Together
                </span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 8.5C50 2.5 100 2 150 5.5C200 9 250 4 298 7" stroke="url(#paint)" strokeWidth="3" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="paint" x1="2" y1="6" x2="298" y2="6">
                      <stop stopColor="#8B5CF6" />
                      <stop offset="0.5" stopColor="#7C3AED" />
                      <stop offset="1" stopColor="#A855F7" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </h1>

            {/* Subheading */}
            <p className="mt-8 mx-auto max-w-2xl text-lg leading-relaxed text-gray-500 dark:text-gray-400 sm:text-xl">
              The all-in-one event photo gallery platform. Let guests upload photos instantly,
              run exciting lucky draws, and keep everyone engaged with photo challenges.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/register"
                className="group relative inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-violet-500/25 transition-all hover:shadow-2xl hover:shadow-violet-500/30 hover:-translate-y-0.5"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1" />
                {/* Shimmer effect */}
                <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 blur-xl opacity-40 transition-opacity group-hover:opacity-60" />
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 rounded-2xl border-2 border-gray-200 bg-white/80 px-8 py-4 text-base font-semibold text-gray-700 backdrop-blur-sm transition-all hover:border-gray-300 hover:bg-white dark:border-gray-700 dark:bg-gray-900/80 dark:text-gray-300 dark:hover:border-gray-600"
              >
                Sign In
              </Link>
            </div>

            {/* Trust signals */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-400 dark:text-gray-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-violet-500" />
                No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-violet-500" />
                Free tier available
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-violet-500" />
                Cancel anytime
              </span>
            </div>
          </div>

          {/* Hero visual / stats bar */}
          <div className="mt-20 mx-auto max-w-4xl">
            <div className="relative rounded-3xl border border-gray-200/80 bg-gradient-to-b from-gray-50 to-white p-1 shadow-2xl shadow-gray-200/50 dark:border-gray-800/80 dark:from-gray-900 dark:to-gray-950 dark:shadow-none">
              <div className="rounded-[20px] border border-gray-100 bg-white p-8 dark:border-gray-800 dark:bg-gray-900/50">
                <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                  <div className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-900/30">
                      <Image className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                    </div>
                    <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">Real-time</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Photo Gallery</p>
                  </div>
                  <div className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-900/30">
                      <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">Instant</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">QR Upload</p>
                  </div>
                  <div className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-100 dark:bg-fuchsia-900/30">
                      <Heart className="h-6 w-6 text-fuchsia-600 dark:text-fuchsia-400" />
                    </div>
                    <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">Photo</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Reactions</p>
                  </div>
                  <div className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-900/30">
                      <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">Multi</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Tenant SaaS</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24 sm:py-36">
        <div className="absolute inset-0 -z-10 bg-gray-50 dark:bg-gray-900/50" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-sm font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">Features</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
              Everything you need to engage your guests
            </h2>
            <p className="mt-5 text-lg text-gray-500 dark:text-gray-400">
              A complete platform for event photo sharing, guest engagement, and attendance tracking.
            </p>
          </div>

          <div className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Camera,
                title: 'Instant Photo Sharing',
                desc: 'Guests upload photos via QR code. No app download required. All photos appear in a beautiful, branded gallery in real-time.',
                bg: 'bg-violet-50 dark:bg-violet-950/30',
                iconColor: 'text-violet-600 dark:text-violet-400',
              },
              {
                icon: Gift,
                title: 'Lucky Draw System',
                desc: 'Automatically enter guests who upload photos. Run exciting draws with multiple prize tiers, animations, and winner tracking.',
                bg: 'bg-orange-50 dark:bg-orange-950/30',
                iconColor: 'text-orange-600 dark:text-orange-400',
              },
              {
                icon: Trophy,
                title: 'Photo Challenges',
                desc: 'Encourage more uploads with goal-based challenges. Guests who reach the photo goal earn prizes with QR-verified claims.',
                bg: 'bg-purple-50 dark:bg-purple-950/30',
                iconColor: 'text-purple-600 dark:text-purple-400',
              },
              {
                icon: Shield,
                title: 'Photo Moderation',
                desc: 'Keep your gallery appropriate with manual photo approval. Review, approve, or reject uploads before they appear in the gallery.',
                bg: 'bg-blue-50 dark:bg-blue-950/30',
                iconColor: 'text-blue-600 dark:text-blue-400',
              },
              {
                icon: QrCode,
                title: 'Attendance Tracking',
                desc: 'QR code check-ins with real-time stats. Track guest attendance and export reports for post-event analysis.',
                bg: 'bg-purple-50 dark:bg-purple-950/30',
                iconColor: 'text-purple-600 dark:text-purple-400',
              },
              {
                icon: Sparkles,
                title: 'Custom Branding',
                desc: 'Match your event theme with custom colors, logos, and backgrounds. Create a cohesive experience for your guests.',
                bg: 'bg-pink-50 dark:bg-pink-950/30',
                iconColor: 'text-pink-600 dark:text-pink-400',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group relative rounded-3xl border border-gray-200/80 bg-white p-8 transition-all duration-300 hover:border-gray-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700 dark:hover:shadow-none"
              >
                <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${feature.bg}`}>
                  <feature.icon className={`h-7 w-7 ${feature.iconColor}`} />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-gray-500 dark:text-gray-400">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 sm:py-36">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-sm font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">How it works</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
              Get started in 3 simple steps
            </h2>
            <p className="mt-5 text-lg text-gray-500 dark:text-gray-400">
              Get your event gallery live in under 2 minutes
            </p>
          </div>

          <div className="mt-20 grid gap-8 lg:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Create Event',
                desc: 'Set up your event with custom branding, upload rules, and optional features like lucky draw or photo challenges.',
                icon: Sparkles,
                color: 'from-violet-500 to-purple-500',
              },
              {
                step: '02',
                title: 'Share QR Code',
                desc: 'Display the unique QR code at your venue. Guests scan it to access the gallery and start uploading photos instantly.',
                icon: QrCode,
                color: 'from-purple-500 to-fuchsia-500',
              },
              {
                step: '03',
                title: 'Engage & Enjoy',
                desc: 'Watch photos stream in live. Moderate content, run lucky draws, and download all photos after the event.',
                icon: Play,
                color: 'from-fuchsia-500 to-pink-500',
              },
            ].map((item, i) => (
              <div key={item.step} className="relative">
                {/* Connector line */}
                {i < 2 && (
                  <div className="absolute top-16 left-[calc(50%+60px)] hidden h-px w-[calc(100%-120px)] lg:block">
                    <div className="h-full w-full border-t-2 border-dashed border-gray-200 dark:border-gray-800" />
                  </div>
                )}
                <div className="relative flex flex-col items-center text-center">
                  <div className={`relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br ${item.color} text-white shadow-lg`}>
                    <item.icon className="h-9 w-9" />
                    <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-bold text-gray-900 shadow-md ring-2 ring-gray-100 dark:bg-gray-800 dark:text-white dark:ring-gray-700">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-gray-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-gray-500 dark:text-gray-400">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="relative py-24 sm:py-36">
        <div className="absolute inset-0 -z-10 bg-gray-50 dark:bg-gray-900/50" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-sm font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">Use cases</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
              Perfect for any event
            </h2>
            <p className="mt-5 text-lg text-gray-500 dark:text-gray-400">
              From intimate gatherings to large corporate functions
            </p>
          </div>

          <div className="mt-20 grid gap-8 sm:grid-cols-3">
            {[
              {
                icon: PartyPopper,
                title: 'Birthday Parties',
                desc: 'Kids love the lucky draw. Parents love seeing all the memories.',
                gradient: 'from-pink-500 to-rose-500',
                bg: 'from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20',
              },
              {
                icon: Heart,
                title: 'Weddings & Receptions',
                desc: 'Collect candid moments from every guest. Beautiful galleries for the couple.',
                gradient: 'from-violet-500 to-purple-500',
                bg: 'from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20',
              },
              {
                icon: Building2,
                title: 'Corporate Events',
                desc: 'Professional branding, attendance tracking, and secure photo galleries.',
                gradient: 'from-indigo-500 to-violet-500',
                bg: 'from-indigo-50 to-violet-50 dark:from-indigo-950/20 dark:to-violet-950/20',
              },
            ].map((item) => (
              <div
                key={item.title}
                className={`group relative overflow-hidden rounded-3xl bg-gradient-to-b ${item.bg} border border-gray-200/50 p-10 text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 dark:border-gray-800/50`}
              >
                <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br ${item.gradient} text-white shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                  <item.icon className="h-9 w-9" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-gray-500 dark:text-gray-400">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Checklist + CTA */}
      <section className="py-24 sm:py-36">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">All inclusive</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                Everything included
              </h2>
              <p className="mt-5 text-lg text-gray-500 dark:text-gray-400">
                No hidden fees. No surprises. Just powerful features to make your event a
                success.
              </p>

              <div className="mt-10 grid gap-3 sm:grid-cols-2">
                {[
                  'Unlimited events on all plans',
                  'Manual photo moderation',
                  'Custom event branding & themes',
                  'Lucky draw with multiple prize tiers',
                  'Photo challenges with prize claims',
                  'QR code attendance tracking',
                  'Photo reactions & comments',
                  'Bulk photo export & download',
                  'Real-time photo gallery',
                  'Mobile-optimized guest experience',
                ].map((feature) => (
                  <div key={feature} className="flex items-start gap-3 rounded-xl p-2">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-violet-500 dark:text-violet-400" />
                    <span className="text-[15px] text-gray-700 dark:text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Card */}
            <div className="relative">
              {/* Decorative blur behind card */}
              <div className="absolute -inset-4 -z-10 rounded-[32px] bg-gradient-to-br from-violet-200/50 via-purple-200/30 to-fuchsia-200/30 blur-2xl dark:from-violet-900/20 dark:via-purple-900/10 dark:to-fuchsia-900/10" />
              <div className="rounded-3xl border border-gray-200/80 bg-white p-10 shadow-xl dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {[
                      'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-indigo-500',
                    ].map((color, i) => (
                      <div
                        key={i}
                        className={`h-8 w-8 rounded-full ${color} ring-2 ring-white dark:ring-gray-900`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
                <h3 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">
                  Ready to get started?
                </h3>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                  Join thousands of event organizers creating memorable experiences.
                </p>

                <div className="mt-8 space-y-3">
                  <Link
                    href="/auth/register"
                    className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-4 font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:shadow-violet-500/30 hover:-translate-y-0.5"
                  >
                    Start Free Trial
                    <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="/auth/login"
                    className="flex w-full items-center justify-center rounded-2xl border-2 border-gray-200 px-6 py-4 font-semibold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-800"
                  >
                    Sign In to Existing Account
                  </Link>
                </div>

                <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-400 dark:text-gray-500">
                  <Link href="/auth/admin/login" className="transition-colors hover:text-gray-600 dark:hover:text-gray-400">
                    Admin Login
                  </Link>
                  <span className="h-3 w-px bg-gray-200 dark:bg-gray-700" />
                  <span>No credit card required</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-gray-50/50 py-12 dark:border-gray-800/50 dark:bg-gray-900/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <BrandMark size={28} />
              <span className="font-semibold text-gray-900 dark:text-white">Galeria</span>
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              &copy; {new Date().getFullYear()} Galeria. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
