-- ============================================
-- Migration: Add Admin Audit Logs
-- ============================================
-- This migration adds an audit logging table for tracking all super admin actions
-- Essential for security compliance and troubleshooting

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

-- Create indexes for common queries
CREATE INDEX idx_admin_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX idx_admin_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX idx_admin_audit_logs_target ON admin_audit_logs(target_type, target_id);
CREATE INDEX idx_admin_audit_logs_created_at ON admin_audit_logs(created_at DESC);

-- Add comment for documentation
COMMENT ON TABLE admin_audit_logs IS 'Audit trail for all super admin actions across the platform';
COMMENT ON COLUMN admin_audit_logs.action IS 'Type of action performed (e.g., user.role_changed, user.deleted, tenant.suspended)';
COMMENT ON COLUMN admin_audit_logs.target_type IS 'Type of entity affected (e.g., user, tenant, event)';
COMMENT ON COLUMN admin_audit_logs.target_id IS 'ID of the affected entity';
COMMENT ON COLUMN admin_audit_logs.old_values IS 'Previous state of the entity before the action';
COMMENT ON COLUMN admin_audit_logs.new_values IS 'New state of the entity after the action';
COMMENT ON COLUMN admin_audit_logs.ip_address IS 'IP address of the admin who performed the action';
COMMENT ON COLUMN admin_audit_logs.user_agent IS 'User agent string of the admin browser/client';
