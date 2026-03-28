import { Building2, Heart, PartyPopper, type LucideIcon } from "lucide-react";

type UseCase = {
  icon: LucideIcon;
  title: string;
  desc: string;
  gradientClassName: string;
  bgClassName: string;
};

const USE_CASES: UseCase[] = [
  {
    icon: PartyPopper,
    title: "Birthday Parties",
    desc: "Kids love the lucky draw. Parents love seeing all the memories.",
    gradientClassName: "from-pink-500 to-rose-500",
    bgClassName: "from-pink-50 to-rose-50",
  },
  {
    icon: Heart,
    title: "Weddings & Receptions",
    desc: "Collect candid moments from every guest. Beautiful galleries for the couple.",
    gradientClassName: "from-violet-500 to-purple-500",
    bgClassName: "from-violet-50 to-purple-50",
  },
  {
    icon: Building2,
    title: "Corporate Events",
    desc: "Professional branding, attendance tracking, and secure photo galleries.",
    gradientClassName: "from-indigo-500 to-violet-500",
    bgClassName: "from-indigo-50 to-violet-50",
  },
];

export function UseCasesSection() {
  return (
    <section id="use-cases" className="relative py-24 sm:py-36">
      <div className="absolute inset-0 -z-10 bg-gray-50" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-600">
            Use cases
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Perfect for any event
          </h2>
          <p className="mt-5 text-lg text-gray-500">
            From intimate gatherings to large corporate functions
          </p>
        </div>

        <div className="mt-20 grid gap-8 sm:grid-cols-3">
          {USE_CASES.map((item) => (
            <div
              key={item.title}
              className={`group relative overflow-hidden rounded-3xl border border-gray-200/50 bg-gradient-to-b ${item.bgClassName} p-10 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
            >
              <div
                className={`mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br ${item.gradientClassName} text-white shadow-lg transition-transform duration-300 group-hover:scale-110`}
              >
                <item.icon className="h-9 w-9" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">{item.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-gray-500">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
