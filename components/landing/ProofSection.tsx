import {
  BadgeCheck,
  Download,
  QrCode,
  Shield,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react";

type ProofCard = {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
  accentClassName: string;
  iconClassName: string;
};

const PROOF_CARDS: ProofCard[] = [
  {
    icon: Shield,
    eyebrow: "Organizer Control",
    title: "Run the event your way",
    description:
      "Galeria includes the controls organizers actually need during a live event, not just a pretty gallery.",
    points: [
      "Manual photo moderation before images go public",
      "Custom event branding, colors, and themes",
      "Guest-friendly uploads without an app install",
    ],
    accentClassName: "from-sky-50 to-white",
    iconClassName: "bg-sky-100 text-sky-700",
  },
  {
    icon: Trophy,
    eyebrow: "Guest Engagement",
    title: "Turn uploads into participation",
    description:
      "The product already supports the mechanics that keep guests involved instead of treating uploads like a dead-end action.",
    points: [
      "Lucky draw entry flows with tiered prizes",
      "Photo challenges with claim and verification steps",
      "Photo reactions to keep the gallery active during the event",
    ],
    accentClassName: "from-violet-50 to-white",
    iconClassName: "bg-violet-100 text-violet-700",
  },
  {
    icon: Download,
    eyebrow: "After the Event",
    title: "Leave with usable results",
    description:
      "When the event is over, organizers still need operational follow-through. Galeria already covers that workflow.",
    points: [
      "Attendance tracking with QR-based check-ins",
      "Bulk photo export and direct download paths",
      "Organizer visibility into gallery and event activity",
    ],
    accentClassName: "from-emerald-50 to-white",
    iconClassName: "bg-emerald-100 text-emerald-700",
  },
];

const PROOF_CHIPS = [
  { icon: Sparkles, label: "Custom branding" },
  { icon: QrCode, label: "QR guest flows" },
  { icon: Shield, label: "Manual moderation" },
  { icon: Trophy, label: "Lucky draw + challenges" },
  { icon: Download, label: "Export-ready data" },
  { icon: BadgeCheck, label: "Organizer-friendly controls" },
];

export function ProofSection() {
  return (
    <section id="proof" className="relative py-24 sm:py-36">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white via-violet-50/50 to-white" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-600">
            Product proof
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Built for real event operations
          </h2>
          <p className="mt-5 text-lg text-gray-500">
            Everything here maps to capabilities that already exist in the app today:
            moderation, attendance, lucky draw, photo challenges, exports, and branded guest
            experiences.
          </p>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {PROOF_CARDS.map((card) => (
            <article
              key={card.title}
              className={`rounded-3xl border border-gray-200/70 bg-gradient-to-b ${card.accentClassName} p-8 shadow-sm`}
            >
              <div
                className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${card.iconClassName}`}
              >
                <card.icon className="h-6 w-6" />
              </div>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">
                {card.eyebrow}
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-gray-900">{card.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-gray-600">
                {card.description}
              </p>
              <div className="mt-6 space-y-3">
                {card.points.map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <BadgeCheck className="mt-0.5 h-4.5 w-4.5 shrink-0 text-violet-500" />
                    <span className="text-sm text-gray-700">{point}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {PROOF_CHIPS.map((chip) => (
            <div
              key={chip.label}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/90 px-4 py-2 text-sm text-gray-700 shadow-sm"
            >
              <chip.icon className="h-4 w-4 text-violet-500" />
              <span>{chip.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
