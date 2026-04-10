'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { Loader2, Lock, Save, Shield, User } from 'lucide-react';
import { MFASettings } from '@/components/admin/MFASettings';
import {
  AdminActionButton,
  AdminPage,
  AdminPageHeader,
  AdminPanel,
  adminInputClassName,
} from '@/components/admin/control-plane';

export default function SuperAdminProfilePage() {
  const { user, refresh } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (password && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!name && !password) {
      toast.info('No changes to save');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/profile', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name !== user?.name ? name : undefined,
          password: password || undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to update profile');

      toast.success('Profile updated successfully');
      setPassword('');
      setConfirmPassword('');
      await refresh();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Admin identity"
        title="Profile Settings"
        description="Manage your own admin identity, credentials, and verification posture without leaving the control plane."
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <AdminPanel
          title="Account details"
          description="Basic identity and password controls for the current super admin."
          className="admin-reveal admin-reveal-delay-1"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-5">
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--admin-text)]">
                  <User className="h-5 w-5 text-[var(--admin-signal)]" />
                  Basic Information
                </h2>

                <div className="mt-4 space-y-4">
                  <label className="block">
                    <span className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[var(--admin-text-muted)]">
                      Email Address
                    </span>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className={`${adminInputClassName} mt-2 cursor-not-allowed opacity-75`}
                    />
                    <span className="mt-2 block text-xs text-[var(--admin-text-muted)]">
                      Email cannot be changed here.
                    </span>
                  </label>

                  <label className="block">
                    <span className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[var(--admin-text-muted)]">
                      Full Name
                    </span>
                    <input
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className={`${adminInputClassName} mt-2`}
                      placeholder="Your name"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--admin-text)]">
                  <Lock className="h-5 w-5 text-[var(--admin-signal-2)]" />
                  Security
                </h2>

                <div className="mt-4 space-y-4">
                  <label className="block">
                    <span className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[var(--admin-text-muted)]">
                      New Password
                    </span>
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className={`${adminInputClassName} mt-2`}
                      placeholder="Leave blank to keep current password"
                      minLength={8}
                    />
                  </label>

                  {password ? (
                    <label className="block">
                      <span className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[var(--admin-text-muted)]">
                        Confirm New Password
                      </span>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        className={`${adminInputClassName} mt-2`}
                        placeholder="Confirm new password"
                      />
                    </label>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <AdminActionButton type="submit" variant="primary" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </AdminActionButton>
            </div>
          </form>
        </AdminPanel>

        <AdminPanel
          title="Verification"
          description="Control the extra verification layer for your super admin account."
          className="admin-reveal admin-reveal-delay-2"
        >
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(102,223,212,0.2)] bg-[rgba(102,223,212,0.1)] text-[var(--admin-signal-2)]">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold text-[var(--admin-text)]">Multi-Factor Authentication</p>
                <p className="mt-1 text-sm leading-6 text-[var(--admin-text-soft)]">
                  Keep destructive and high-trust admin actions behind an additional verification step.
                </p>
              </div>
            </div>

            <MFASettings />
          </div>
        </AdminPanel>
      </div>
    </AdminPage>
  );
}
