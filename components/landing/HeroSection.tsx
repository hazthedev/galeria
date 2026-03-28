import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Heart,
  Image,
  Sparkles,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

type HeroStat = {
  icon: LucideIcon;
  title: string;
  label: string;
  bgClassName: string;
  iconClassName: string;
};

const HERO_STATS: HeroStat[] = [
  {
    icon: Image,
    title: "Real-time",
    label: "Photo Gallery",
    bgClassName: "bg-violet-100",
    iconClassName: "text-violet-600",
  },
  {
    icon: Zap,
    title: "Instant",
    label: "QR Upload",
    bgClassName: "bg-purple-100",
    iconClassName: "text-purple-600",
  },
  {
    icon: Heart,
    title: "Photo",
    label: "Reactions",
    bgClassName: "bg-fuchsia-100",
    iconClassName: "text-fuchsia-600",
  },
  {
    icon: Users,
    title: "Multi",
    label: "Tenant SaaS",
    bgClassName: "bg-indigo-100",
    iconClassName: "text-indigo-600",
  },
];

const TRUST_SIGNALS = [
  "No credit card required",
  "Free tier available",
  "Cancel anytime",
];

export function HeroSection() {
  return (
    <section className="relative pb-24 pt-32 sm:pb-36 sm:pt-44">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-gradient-to-br from-violet-200/50 via-purple-100/40 to-transparent blur-3xl" />
        <div className="absolute right-0 top-20 h-[400px] w-[400px] rounded-full bg-gradient-to-bl from-purple-100/50 to-transparent blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-violet-100/40 to-transparent blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,.015)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,.015)_1px,transparent_1px)] bg-[size:72px_72px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-violet-50/80 px-4 py-1.5 text-sm font-medium text-violet-700 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Event Photo Gallery Platform</span>
          </div>

          <h1 className="mt-8 text-5xl font-extrabold tracking-tight text-gray-900 sm:text-7xl sm:leading-[1.1]">
            Capture Moments,{" "}
            <span className="relative">
              <span className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
                Together
              </span>
              <svg
                aria-hidden="true"
                className="absolute -bottom-2 left-0 w-full"
                fill="none"
                viewBox="0 0 300 12"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 8.5C50 2.5 100 2 150 5.5C200 9 250 4 298 7"
                  stroke="url(#paint)"
                  strokeLinecap="round"
                  strokeWidth="3"
                />
                <defs>
                  <linearGradient id="paint" x1="2" x2="298" y1="6" y2="6">
                    <stop stopColor="#8B5CF6" />
                    <stop offset="0.5" stopColor="#7C3AED" />
                    <stop offset="1" stopColor="#A855F7" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-gray-500 sm:text-xl">
            The all-in-one event photo gallery platform. Let guests upload photos
            instantly, run exciting lucky draws, and keep everyone engaged with photo
            challenges.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/auth/register"
              className="group relative inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-violet-500/30"
            >
              <span>Get Started Free</span>
              <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1" />
              <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 opacity-40 blur-xl transition-opacity group-hover:opacity-60" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 rounded-2xl border-2 border-gray-200 bg-white/80 px-8 py-4 text-base font-semibold text-gray-700 backdrop-blur-sm transition-all hover:border-gray-300 hover:bg-white"
            >
              Sign In
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-400">
            {TRUST_SIGNALS.map((signal) => (
              <span key={signal} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-violet-500" />
                {signal}
              </span>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-20 max-w-4xl">
          <div className="relative rounded-3xl border border-gray-200/80 bg-gradient-to-b from-gray-50 to-white p-1 shadow-2xl shadow-gray-200/50">
            <div className="rounded-[20px] border border-gray-100 bg-white p-8">
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                {HERO_STATS.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div
                      className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl ${stat.bgClassName}`}
                    >
                      <stat.icon className={`h-6 w-6 ${stat.iconClassName}`} />
                    </div>
                    <p className="mt-3 text-2xl font-bold text-gray-900">{stat.title}</p>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
