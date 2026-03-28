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
    <div className="min-h-screen overflow-hidden bg-white text-slate-900 [color-scheme:light]">
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
