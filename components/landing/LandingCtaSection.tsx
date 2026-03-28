import Link from "next/link";
import { ArrowRight, CheckCircle2, Star } from "lucide-react";

const INCLUDED_FEATURES = [
  "Flexible plans from starter events to enterprise scale",
  "Manual photo moderation",
  "Custom event branding & themes",
  "Lucky draw with multiple prize tiers",
  "Photo challenges with prize claims",
  "QR code attendance tracking",
  "Photo reactions & comments",
  "Bulk photo export & download",
  "Real-time photo gallery",
  "Mobile-optimized guest experience",
];

const REVIEW_BADGES = [
  "bg-violet-500",
  "bg-purple-500",
  "bg-fuchsia-500",
  "bg-indigo-500",
];

export function LandingCtaSection() {
  return (
    <section className="py-24 sm:py-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-violet-600">
              All inclusive
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Everything included
            </h2>
            <p className="mt-5 text-lg text-gray-500">
              No hidden fees. No surprises. Just powerful features to make your event a
              success.
            </p>

            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {INCLUDED_FEATURES.map((feature) => (
                <div key={feature} className="flex items-start gap-3 rounded-xl p-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-violet-500" />
                  <span className="text-[15px] text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 -z-10 rounded-[32px] bg-gradient-to-br from-violet-200/50 via-purple-200/30 to-fuchsia-200/30 blur-2xl" />
            <div className="rounded-3xl border border-gray-200/80 bg-white p-10 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {REVIEW_BADGES.map((color, index) => (
                    <div
                      key={`${color}-${index}`}
                      className={`h-8 w-8 rounded-full ${color} ring-2 ring-white`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      className="h-4 w-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
              </div>
              <h3 className="mt-6 text-2xl font-bold text-gray-900">Ready to get started?</h3>
              <p className="mt-2 text-gray-500">
                Launch your gallery, share the QR code, and start collecting memories in
                minutes.
              </p>

              <div className="mt-8 space-y-3">
                <Link
                  href="/auth/register"
                  className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-4 font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/30"
                >
                  Get Started Free
                  <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/auth/login"
                  className="flex w-full items-center justify-center rounded-2xl border-2 border-gray-200 px-6 py-4 font-semibold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50"
                >
                  Sign In to Existing Account
                </Link>
              </div>

              <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-400">
                <Link
                  href="/auth/admin/login"
                  className="transition-colors hover:text-gray-600"
                >
                  Admin Login
                </Link>
                <span className="h-3 w-px bg-gray-200" />
                <span>No credit card required</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
