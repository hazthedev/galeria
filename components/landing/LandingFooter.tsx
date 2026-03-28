import { BrandMark } from "@/components/landing/BrandMark";

export function LandingFooter() {
  return (
    <footer className="border-t border-gray-100 bg-gray-50/50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <BrandMark size={28} gradientId="gm-bg-footer" />
            <span className="font-semibold text-gray-900">Galeria</span>
          </div>
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Galeria. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
