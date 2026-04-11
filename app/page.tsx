import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { LandingCtaSection } from "@/components/landing/LandingCtaSection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { UseCasesSection } from "@/components/landing/UseCasesSection";

export default function HomePage() {
  return (
    <div className="landing-shell relative isolate min-h-screen overflow-hidden">
      <div className="landing-grid absolute inset-0 -z-30" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-20 h-[40rem] bg-[radial-gradient(circle_at_top,rgba(177,140,255,0.18),transparent_42%),radial-gradient(circle_at_82%_18%,rgba(102,223,212,0.16),transparent_24%)]" />
      <LandingNav />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <UseCasesSection />
        <LandingCtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
