import { NextResponse } from 'next/server';
import { getDefaultSystemSettings, getSystemSettings } from '@/lib/system-settings';

export async function GET() {
  try {
    let settings;

    try {
      settings = await getSystemSettings();
    } catch (error) {
      console.warn('[UPLOAD_SETTINGS] Falling back to defaults:', error);
      settings = getDefaultSystemSettings();
    }

    return NextResponse.json({
      data: {
        max_file_mb: settings.uploads.max_file_mb,
        allowed_types: settings.uploads.allowed_types,
      },
    });
  } catch (error) {
    console.error('[UPLOAD_SETTINGS] Get error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch upload settings', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
