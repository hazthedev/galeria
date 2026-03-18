// ============================================
// Galeria - Admin MFA Settings Component
// ============================================
// Multi-factor authentication settings UI for super admin accounts

'use client';

import { useState, useEffect } from 'react';
import { Shield, ShieldCheck, ShieldX, Copy, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog, useConfirmDialog } from './ConfirmDialog';

interface MFASetupData {
  secret: string;
  uri: string;
  qrCodeUrl: string;
  recoveryCodes: string[];
}

interface MFAStatus {
  enabled: boolean;
  verified: boolean;
}

export function MFASettings() {
  const [mfaStatus, setMfaStatus] = useState<MFAStatus>({ enabled: false, verified: false });
  const [isLoading, setIsLoading] = useState(true);
  const [isSetupLoading, setIsSetupLoading] = useState(false);
  const [setupData, setSetupData] = useState<MFASetupData | null>(null);
  const [verifyToken, setVerifyToken] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Recovery codes
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);

  // Disable confirm dialog
  const disableConfirm = useConfirmDialog();

  // Fetch MFA status on mount
  useEffect(() => {
    fetchMFAStatus();
  }, []);

  const fetchMFAStatus = async () => {
    try {
      const response = await fetch('/api/admin/mfa/status', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setMfaStatus(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch MFA status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupMFA = async () => {
    setIsSetupLoading(true);
    try {
      const response = await fetch('/api/admin/mfa/setup', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.code === 'MFA_ALREADY_ENABLED') {
          toast.error('MFA is already enabled');
          await fetchMFAStatus();
          return;
        }
        throw new Error(error.message || 'Failed to setup MFA');
      }

      const data = await response.json();
      setSetupData(data.data);
      setShowRecoveryCodes(false); // Hide recovery codes initially
      toast.info('Save your recovery codes in a safe place!', { duration: 5000 });
    } catch (error) {
      console.error('Failed to setup MFA:', error);
      toast.error('Failed to setup MFA');
    } finally {
      setIsSetupLoading(false);
    }
  };

  const handleVerifyMFA = async () => {
    const token = verifyToken.trim().replace(/\s/g, '');

    if (!/^\d{6}$/.test(token)) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetch('/api/admin/mfa/setup', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to verify MFA');
      }

      toast.success('Two-factor authentication enabled!');
      setSetupData(null);
      setVerifyToken('');
      await fetchMFAStatus();
    } catch (error) {
      console.error('Failed to verify MFA:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to verify code');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancelSetup = async () => {
    try {
      const response = await fetch('/api/admin/mfa/setup', {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to cancel setup');
      }

      setSetupData(null);
      setVerifyToken('');
      toast.success('MFA setup cancelled');
    } catch (error) {
      console.error('Failed to cancel setup:', error);
      toast.error('Failed to cancel setup');
    }
  };

  const handleDisableMFA = async () => {
    // Token will be added by the disableConfirm callback
    try {
      const token = verifyToken.trim().replace(/\s/g, '');

      if (!/^\d{6}$/.test(token)) {
        toast.error('Please enter your current MFA code to disable');
        return;
      }

      const response = await fetch(`/api/admin/mfa/setup?token=${token}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to disable MFA');
      }

      toast.success('Two-factor authentication disabled');
      setVerifyToken('');
      await fetchMFAStatus();
    } catch (error) {
      console.error('Failed to disable MFA:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to disable MFA');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedCode(label);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  const copyAllRecoveryCodes = () => {
    if (!setupData) return;
    const allCodes = setupData.recoveryCodes.join('\n');
    copyToClipboard(allCodes, 'all');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {mfaStatus.enabled ? (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <ShieldX className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Two-Factor Authentication
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {mfaStatus.enabled
                  ? 'Your account is protected with 2FA'
                  : 'Add an extra layer of security to your account'}
              </p>
            </div>
          </div>

          {!setupData && (
            <button
              onClick={mfaStatus.enabled ? () => disableConfirm.show({
                title: 'Disable Two-Factor Authentication',
                description: 'You will need to enter your current authentication code to disable 2FA. This will make your account less secure.',
                confirmLabel: 'Disable 2FA',
                variant: 'danger',
                onConfirm: handleDisableMFA,
              }) : handleSetupMFA}
              disabled={isSetupLoading}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                mfaStatus.enabled
                  ? 'border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
                  : 'bg-violet-600 text-white hover:bg-violet-700'
              }`}
            >
              {isSetupLoading ? 'Setting up...' : mfaStatus.enabled ? 'Disable 2FA' : 'Enable 2FA'}
            </button>
          )}
        </div>
      </div>

      {/* Setup Flow */}
      {setupData && !mfaStatus.enabled && (
        <div className="rounded-xl border border-violet-200 bg-violet-50 p-6 dark:border-violet-800 dark:bg-violet-950 dark:bg-violet-950/30">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Set Up Two-Factor Authentication
          </h3>

          <div className="space-y-6">
            {/* Step 1: Scan QR Code */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                1. Scan QR Code with Authenticator App
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Use Google Authenticator, Authy, or any TOTP-compatible app
              </p>
              <div className="flex justify-center">
                <img
                  src={setupData.qrCodeUrl}
                  alt="QR Code for TOTP Setup"
                  className="rounded-lg border border-gray-300 bg-white p-2 dark:border-gray-700"
                />
              </div>
            </div>

            {/* Step 2: Enter Code */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                2. Enter Verification Code
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Enter the 6-digit code from your authenticator app
              </p>
              <div className="flex gap-3">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  value={verifyToken}
                  onChange={(e) => setVerifyToken(e.target.value)}
                  className="flex-1 h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm font-mono text-center tracking-widest focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800"
                />
                <button
                  onClick={handleVerifyMFA}
                  disabled={isVerifying || verifyToken.replace(/\s/g, '').length !== 6}
                  className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVerifying ? 'Verifying...' : 'Verify & Enable'}
                </button>
              </div>
            </div>

            {/* Step 3: Recovery Codes */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  3. Save Recovery Codes
                </h4>
                <button
                  onClick={() => setShowRecoveryCodes(!showRecoveryCodes)}
                  className="text-sm text-violet-600 hover:text-violet-700 dark:text-violet-400"
                >
                  {showRecoveryCodes ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Save these codes in a safe place. You can use them to access your account if you lose your authenticator device.
              </p>

              {showRecoveryCodes ? (
                <div className="rounded-lg border border-gray-300 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Your Recovery Codes
                    </span>
                    <button
                      onClick={copyAllRecoveryCodes}
                      className="flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700 dark:text-violet-400"
                    >
                      {copiedCode === 'all' ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy All
                        </>
                      )}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                    {setupData.recoveryCodes.map((code, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded border border-gray-300 bg-white px-2 py-1 dark:border-gray-700 dark:bg-gray-800"
                      >
                        <span className="text-gray-700 dark:text-gray-300">{code}</span>
                        <button
                          onClick={() => copyToClipboard(code, code)}
                          className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300"
                        >
                          {copiedCode === code ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowRecoveryCodes(true)}
                  className="w-full rounded-lg border border-dashed border-gray-300 py-3 text-sm text-gray-600 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-900"
                >
                  View Recovery Codes
                </button>
              )}
            </div>

            {/* Manual Secret Entry */}
            <details className="rounded-lg border border-gray-200 bg-white dark:border-gray-800">
              <summary className="cursor-pointer px-4 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                Manual Entry (if you can't scan QR code)
              </summary>
              <div className="p-4 space-y-3 text-sm">
                <div className="flex items-center justify-between rounded border border-gray-200 bg-gray-50 px-3 py-1 dark:border-gray-700 dark:bg-gray-900">
                  <code className="flex-1 text-gray-700 dark:text-gray-300">{setupData.secret}</code>
                  <button
                    onClick={() => copyToClipboard(setupData.secret, 'secret')}
                    className="ml-2 text-violet-600 hover:text-violet-700 dark:text-violet-400"
                  >
                    {copiedCode === 'secret' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Enter this code manually in your authenticator app
                </p>
              </div>
            </details>

            {/* Cancel Setup */}
            <button
              onClick={handleCancelSetup}
              className="w-full text-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              Cancel Setup
            </button>
          </div>
        </div>
      )}

      {/* Disable 2FA Input */}
      {mfaStatus.enabled && !setupData && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-6 dark:border-orange-800 dark:bg-orange-950 dark:bg-orange-950/30">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Disable Two-Factor Authentication
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Enter your current authentication code to disable 2FA
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              value={verifyToken}
              onChange={(e) => setVerifyToken(e.target.value)}
              className="flex-1 h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm font-mono text-center tracking-widest focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800"
            />
            <button
              onClick={() => disableConfirm.show({
                title: 'Disable Two-Factor Authentication',
                description: 'Are you sure? This will remove the extra security layer from your account.',
                confirmLabel: 'Disable 2FA',
                variant: 'danger',
                onConfirm: () => handleDisableMFA(),
              })}
              disabled={verifyToken.replace(/\s/g, '').length !== 6}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Disable 2FA
            </button>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog {...disableConfirm.dialog} />
    </div>
  );
}
