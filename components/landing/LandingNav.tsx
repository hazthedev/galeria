import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BrandMark } from "@/components/landing/BrandMark";

export function LandingNav() {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-gray-100/80 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <BrandMark size={36} gradientId="gm-bg-nav" />
          <span className="text-xl font-bold text-gray-900">Galeria</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden items-center gap-5 lg:flex">
            <Link
              href="#features"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              How It Works
            </Link>
            <Link
              href="#proof"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              Proof
            </Link>
            <Link
              href="#use-cases"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              Use Cases
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="hidden items-center rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 sm:inline-flex"
            >
              Login
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-gray-800"
            >
              Get Started
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
