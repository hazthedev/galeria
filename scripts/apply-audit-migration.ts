// ============================================
// Galeria - Apply Audit Migration
// ============================================

import pg from 'pg';
const { Client } = pg;
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function applyMigration() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('[MIGRATION] ERROR: DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  console.log('[MIGRATION] Connecting to:', databaseUrl.split('@')[1]?.split('/')[0]);

  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    await client.connect();
    console.log('[MIGRATION] Connected to database');

    const sql = `
-- Create admin audit logs table
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  target_type VARCHAR(50),
  target_id UUID,
  old_values JSONB,
  new_values JSONB,
  reason TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target ON admin_audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at DESC);
`;

    await client.query(sql);
    console.log('[MIGRATION] SUCCESS: admin_audit_logs table created');
  } catch (error) {
    console.error('[MIGRATION] FAILED:', error instanceof Error ? error.message : error);
    throw error;
  } finally {
    await client.end();
  }
}

applyMigration()
  .then(() => {
    console.log('[MIGRATION] Done');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[MIGRATION] Fatal error:', err);
    process.exit(1);
  });
