import { BrandMark } from "@/components/landing/BrandMark";

export function LandingFooter() {
  return (
    <footer className="border-t border-[#e8ddcf] bg-[#efe7dc]/60 py-12 dark:border-gray-800/50 dark:bg-gray-900/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <BrandMark size={28} gradientId="gm-bg-footer" />
            <span className="font-semibold text-gray-900 dark:text-white">Galeria</span>
          </div>
          <p className="text-sm text-stone-500 dark:text-gray-500">
            &copy; {new Date().getFullYear()} Galeria. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
