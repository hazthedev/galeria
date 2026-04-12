import 'server-only';

import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;

export function isEmailConfigured(): boolean {
    return Boolean(apiKey);
}

let client: Resend | null = null;

export function getResendClient(): Resend {
    if (!apiKey) {
        throw new Error('RESEND_API_KEY is not configured');
    }
    if (!client) {
        client = new Resend(apiKey);
    }
    return client;
}

export const EMAIL_FROM =
    process.env.EMAIL_FROM ?? 'Galeria <onboarding@resend.dev>';
