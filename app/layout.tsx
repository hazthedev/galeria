import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { RealtimeProvider } from "@/lib/realtime/client";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Galeria",
  description: "Capture Moments, Together",
  applicationName: "Galeria",
  icons: {
    icon: "/icon",
    shortcut: "/icon",
    apple: "/apple-icon",
  },
  openGraph: {
    title: "Galeria",
    description: "Capture Moments, Together",
    siteName: "Galeria",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Galeria",
    description: "Capture Moments, Together",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <RealtimeProvider>
            {children}
            <Toaster position="top-right" richColors closeButton />
          </RealtimeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
