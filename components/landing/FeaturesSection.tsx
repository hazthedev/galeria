import {
  Camera,
  Gift,
  QrCode,
  Shield,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react";

type Feature = {
  icon: LucideIcon;
  title: string;
  desc: string;
  bgClassName: string;
  iconClassName: string;
};

const FEATURES: Feature[] = [
  {
    icon: Camera,
    title: "Instant Photo Sharing",
    desc: "Guests upload photos via QR code. No app download required. All photos appear in a beautiful, branded gallery in real-time.",
    bgClassName: "bg-violet-50",
    iconClassName: "text-violet-600",
  },
  {
    icon: Gift,
    title: "Lucky Draw System",
    desc: "Automatically enter guests who upload photos. Run exciting draws with multiple prize tiers, animations, and winner tracking.",
    bgClassName: "bg-orange-50",
    iconClassName: "text-orange-600",
  },
  {
    icon: Trophy,
    title: "Photo Challenges",
    desc: "Encourage more uploads with goal-based challenges. Guests who reach the photo goal earn prizes with QR-verified claims.",
    bgClassName: "bg-purple-50",
    iconClassName: "text-purple-600",
  },
  {
    icon: Shield,
    title: "Photo Moderation",
    desc: "Keep your gallery appropriate with manual photo approval. Review, approve, or reject uploads before they appear in the gallery.",
    bgClassName: "bg-blue-50",
    iconClassName: "text-blue-600",
  },
  {
    icon: QrCode,
    title: "Attendance Tracking",
    desc: "QR code check-ins with real-time stats. Track guest attendance and export reports for post-event analysis.",
    bgClassName: "bg-purple-50",
    iconClassName: "text-purple-600",
  },
  {
    icon: Sparkles,
    title: "Custom Branding",
    desc: "Match your event theme with custom colors, logos, and backgrounds. Create a cohesive experience for your guests.",
    bgClassName: "bg-pink-50",
    iconClassName: "text-pink-600",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 sm:py-36">
      <div className="absolute inset-0 -z-10 bg-gray-50" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-600">
            Features
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Everything you need to engage your guests
          </h2>
          <p className="mt-5 text-lg text-gray-500">
            A complete platform for event photo sharing, guest engagement, and attendance
            tracking.
          </p>
        </div>

        <div className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group relative rounded-3xl border border-gray-200/80 bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:border-gray-300 hover:shadow-xl hover:shadow-gray-200/50"
            >
              <div
                className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${feature.bgClassName}`}
              >
                <feature.icon className={`h-7 w-7 ${feature.iconClassName}`} />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-gray-900">{feature.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-gray-500">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
