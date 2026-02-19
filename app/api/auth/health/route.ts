import { NextResponse } from 'next/server';

export async function GET() {
  const jwtConfigured = Boolean(process.env.JWT_ACCESS_SECRET && process.env.JWT_REFRESH_SECRET);

  return NextResponse.json({
    status: 'ok',
    auth: jwtConfigured ? 'configured' : 'degraded',
    timestamp: new Date().toISOString(),
  });
}
