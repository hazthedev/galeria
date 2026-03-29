import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { LandingCtaSection } from "@/components/landing/LandingCtaSection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { ProofSection } from "@/components/landing/ProofSection";
import { UseCasesSection } from "@/components/landing/UseCasesSection";

export default function HomePage() {
  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-[#f6f1ea] text-slate-900 dark:bg-gray-950 dark:text-gray-100">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(0,0,0,.012)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,.012)_1px,transparent_1px)] bg-[size:72px_72px] dark:bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)]" />
      <LandingNav />
      <HeroSection />
      <FeaturesSection />
      <ProofSection />
      <HowItWorksSection />
      <UseCasesSection />
      <LandingCtaSection />
      <LandingFooter />
    </div>
  );
}
