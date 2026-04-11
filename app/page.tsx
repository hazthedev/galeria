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
    <div className="landing-shell relative isolate min-h-screen overflow-hidden">
      <div className="landing-grid absolute inset-0 -z-30" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-20 h-[40rem] bg-[radial-gradient(circle_at_top,rgba(177,140,255,0.18),transparent_42%),radial-gradient(circle_at_82%_18%,rgba(102,223,212,0.16),transparent_24%),radial-gradient(circle_at_14%_28%,rgba(255,210,161,0.08),transparent_18%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-[28rem] -z-20 h-[48rem] bg-[radial-gradient(circle_at_20%_20%,rgba(177,140,255,0.1),transparent_26%),radial-gradient(circle_at_80%_40%,rgba(102,223,212,0.08),transparent_20%)]" />
      <LandingNav />
      <main>
        <HeroSection />
        <FeaturesSection />
        <ProofSection />
        <HowItWorksSection />
        <UseCasesSection />
        <LandingCtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
