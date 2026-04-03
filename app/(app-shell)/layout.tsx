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
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            style: {
              borderRadius: '14px',
              padding: '14px 16px',
              fontSize: '14px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
            },
          }}
        />
      </RealtimeProvider>
    </AuthProvider>
  );
}
