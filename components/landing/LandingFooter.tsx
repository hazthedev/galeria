import Link from "next/link";
import { BrandMark } from "@/components/landing/BrandMark";

export function LandingFooter() {
  return (
    <footer className="border-t border-white/8 bg-[#040914] py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <BrandMark size={30} gradientId="gm-bg-footer" variant="midnight" />
            <div>
              <span className="landing-display block text-2xl leading-none text-[#f6f1ea]">Galeria</span>
              <span className="pt-1 text-xs uppercase tracking-[0.34em] text-[var(--landing-text-muted)]">
                Public event operating layer
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-sm text-[var(--landing-text-muted)]">
            <Link href="/auth/login" className="landing-utility-link">
              Login
            </Link>
            <Link href="/auth/admin/login" className="landing-utility-link">
              Admin
            </Link>
            <span>&copy; {new Date().getFullYear()} Galeria</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
