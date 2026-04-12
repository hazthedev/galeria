import 'server-only';

import { getResendClient, EMAIL_FROM, isEmailConfigured } from './resend-client';

type WelcomeEmailPayload = {
    to: string;
    name: string;
    loginUrl?: string;
};

type PasswordResetEmailPayload = {
    to: string;
    name: string;
    resetUrl: string;
};

function welcomeHtml(name: string, loginUrl: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Galeria</title>
</head>
<body style="margin:0;padding:0;background:#07101d;font-family:'Segoe UI',sans-serif;color:#f4efe7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#07101d;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:linear-gradient(180deg,rgba(18,31,51,0.92),rgba(11,20,34,0.9));border:1px solid rgba(188,204,232,0.14);border-radius:20px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:40px 48px 32px;border-bottom:1px solid rgba(188,204,232,0.08);">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right:12px;">
                    <div style="width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,#171C2F,#0C1220);border:1px solid rgba(255,255,255,0.10);display:flex;align-items:center;justify-content:center;">
                      <svg width="42" height="42" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="512" height="512" rx="112" fill="url(#bg)"/>
                        <rect x="28" y="28" width="456" height="456" rx="96" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.10)" stroke-width="2"/>
                        <path d="M372 194A120 120 0 1 0 372 318" stroke="url(#acc)" stroke-linecap="round" stroke-width="52"/>
                        <path d="M258 256H366" stroke="url(#acc)" stroke-linecap="round" stroke-width="52"/>
                        <circle cx="256" cy="256" r="28" fill="#F6F1EA"/>
                        <defs>
                          <linearGradient id="bg" x1="88" x2="424" y1="56" y2="456" gradientUnits="userSpaceOnUse">
                            <stop stop-color="#171C2F"/><stop offset="1" stop-color="#0C1220"/>
                          </linearGradient>
                          <linearGradient id="acc" x1="144" x2="372" y1="140" y2="356" gradientUnits="userSpaceOnUse">
                            <stop stop-color="#F6F1EA"/><stop offset="0.5" stop-color="#C4B5FD"/><stop offset="1" stop-color="#8B5CF6"/>
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  </td>
                  <td>
                    <span style="font-size:22px;font-weight:700;color:#f6f1ea;letter-spacing:-0.02em;">Galeria</span><br/>
                    <span style="font-size:10px;font-weight:600;letter-spacing:0.38em;text-transform:uppercase;color:#6f86aa;">Event Gallery Platform</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 48px;">
              <h1 style="margin:0 0 16px;font-size:26px;font-weight:700;color:#f4efe7;letter-spacing:-0.02em;">Welcome, ${name} 👋</h1>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#acbddb;">
                Your Galeria account is ready. You can now create branded event galleries, share QR codes with guests, and run live moderation — all from one place.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="background:linear-gradient(135deg,#9d74ff 0%,#8b5cf6 48%,#67ded3 140%);border-radius:100px;padding:14px 32px;">
                    <a href="${loginUrl}" style="color:#fff9f2;font-size:15px;font-weight:600;text-decoration:none;display:block;">Get started →</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:13px;color:#6f86aa;">
                If you didn't create a Galeria account, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 48px;border-top:1px solid rgba(188,204,232,0.08);">
              <p style="margin:0;font-size:12px;color:#6f86aa;">© ${new Date().getFullYear()} Galeria. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function passwordResetHtml(name: string, resetUrl: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your password</title>
</head>
<body style="margin:0;padding:0;background:#07101d;font-family:'Segoe UI',sans-serif;color:#f4efe7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#07101d;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:linear-gradient(180deg,rgba(18,31,51,0.92),rgba(11,20,34,0.9));border:1px solid rgba(188,204,232,0.14);border-radius:20px;overflow:hidden;">
          <tr>
            <td style="padding:40px 48px 32px;border-bottom:1px solid rgba(188,204,232,0.08);">
              <span style="font-size:22px;font-weight:700;color:#f6f1ea;letter-spacing:-0.02em;">Galeria</span>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 48px;">
              <h1 style="margin:0 0 16px;font-size:26px;font-weight:700;color:#f4efe7;letter-spacing:-0.02em;">Reset your password</h1>
              <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#acbddb;">Hi ${name},</p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#acbddb;">
                We received a request to reset the password for your Galeria account. Click the button below to choose a new password. This link expires in 1 hour.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="background:linear-gradient(135deg,#9d74ff 0%,#8b5cf6 48%,#67ded3 140%);border-radius:100px;padding:14px 32px;">
                    <a href="${resetUrl}" style="color:#fff9f2;font-size:15px;font-weight:600;text-decoration:none;display:block;">Reset password →</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;font-size:13px;color:#6f86aa;">Or copy this link into your browser:</p>
              <p style="margin:0 0 24px;font-size:12px;color:#6f86aa;word-break:break-all;">${resetUrl}</p>
              <p style="margin:0;font-size:13px;color:#6f86aa;">
                If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 48px;border-top:1px solid rgba(188,204,232,0.08);">
              <p style="margin:0;font-size:12px;color:#6f86aa;">© ${new Date().getFullYear()} Galeria. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendWelcomeEmail(payload: WelcomeEmailPayload): Promise<void> {
    if (!isEmailConfigured()) return;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const loginUrl = payload.loginUrl ?? `${appUrl}/organizer`;

    try {
        const resend = getResendClient();
        await resend.emails.send({
            from: EMAIL_FROM,
            to: payload.to,
            subject: 'Welcome to Galeria 🎉',
            html: welcomeHtml(payload.name, loginUrl),
        });
    } catch (err) {
        console.error('[EMAIL] Failed to send welcome email:', err);
    }
}

export async function sendPasswordResetEmail(payload: PasswordResetEmailPayload): Promise<void> {
    if (!isEmailConfigured()) return;

    try {
        const resend = getResendClient();
        await resend.emails.send({
            from: EMAIL_FROM,
            to: payload.to,
            subject: 'Reset your Galeria password',
            html: passwordResetHtml(payload.name, payload.resetUrl),
        });
    } catch (err) {
        console.error('[EMAIL] Failed to send password reset email:', err);
    }
}
