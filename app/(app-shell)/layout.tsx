import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth-context";
import { RealtimeProvider } from "@/lib/realtime/client";
import { Toaster } from "sonner";

export default function AppShellLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AuthProvider>
      <RealtimeProvider>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </RealtimeProvider>
    </AuthProvider>
  );
}
