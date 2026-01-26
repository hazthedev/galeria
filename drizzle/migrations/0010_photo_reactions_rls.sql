-- ============================================
-- MOMENTIQUE - Migration 0010: Photo Reactions RLS
-- ============================================
-- Enable RLS and add tenant isolation policies for photo_reactions

ALTER TABLE photo_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY photo_reactions_select_policy ON photo_reactions
  FOR SELECT
  TO PUBLIC
  USING (
    photo_id IN (
      SELECT p.id
      FROM photos p
      JOIN events e ON p.event_id = e.id
      WHERE e.tenant_id = current_tenant_id()
    )
  );

CREATE POLICY photo_reactions_insert_policy ON photo_reactions
  FOR INSERT
  TO PUBLIC
  WITH CHECK (
    photo_id IN (
      SELECT p.id
      FROM photos p
      JOIN events e ON p.event_id = e.id
      WHERE e.tenant_id = current_tenant_id()
    )
  );

CREATE POLICY photo_reactions_delete_policy ON photo_reactions
  FOR DELETE
  TO PUBLIC
  USING (
    photo_id IN (
      SELECT p.id
      FROM photos p
      JOIN events e ON p.event_id = e.id
      WHERE e.tenant_id = current_tenant_id()
    )
  );

INSERT INTO migration_version (version, description) VALUES (10, 'Enable RLS for photo_reactions')
ON CONFLICT (version) DO NOTHING;

