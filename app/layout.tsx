import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const metadataBase = new URL(appUrl.endsWith("/") ? appUrl : `${appUrl}/`);

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const themeInitScript = `
  (() => {
    try {
      const storageKey = "galeria-theme";
      const storedTheme = window.localStorage.getItem(storageKey);
      const theme = storedTheme === "light" || storedTheme === "dark"
        ? storedTheme
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      const root = document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(theme);
      root.style.colorScheme = theme;
    } catch {
      document.documentElement.classList.add("light");
      document.documentElement.style.colorScheme = "light";
    }
  })();
`;

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: "Galeria",
    template: "%s | Galeria",
  },
  description: "Branded event photo galleries with guest uploads, lucky draws, photo challenges, and QR attendance tracking.",
  applicationName: "Galeria",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/icon",
    shortcut: "/icon",
    apple: "/apple-icon",
  },
  openGraph: {
    title: "Galeria",
    description: "Branded event photo galleries with guest uploads, lucky draws, photo challenges, and QR attendance tracking.",
    siteName: "Galeria",
    type: "website",
    url: "/",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Galeria event photo gallery platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Galeria",
    description: "Branded event photo galleries with guest uploads, lucky draws, photo challenges, and QR attendance tracking.",
    images: ["/twitter-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        {children}
      </body>
    </html>
  );
}
