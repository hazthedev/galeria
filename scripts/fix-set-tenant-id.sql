-- Fix set_tenant_id function to use correct set_config function
CREATE OR REPLACE FUNCTION set_tenant_id(tenant_uuid UUID)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', tenant_uuid::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
