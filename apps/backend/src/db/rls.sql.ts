export const rlsSql = `
CREATE SCHEMA IF NOT EXISTS app;

CREATE OR REPLACE FUNCTION app.current_tenant_id() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('app.current_tenant_id', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION app.jwt_claims() RETURNS jsonb
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
$$;

CREATE OR REPLACE FUNCTION app.has_permission(permission_code text) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1
    FROM jsonb_array_elements_text(COALESCE(app.jwt_claims()->'permissions', '[]'::jsonb)) value
    WHERE value = permission_code
  )
$$;

ALTER TABLE automata ENABLE ROW LEVEL SECURITY;
ALTER TABLE automata FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS automata_select_policy ON automata;
CREATE POLICY automata_select_policy ON automata
  FOR SELECT USING (
    tenant_id = app.current_tenant_id()
    AND app.has_permission('automata:read')
  );

DROP POLICY IF EXISTS automata_insert_policy ON automata;
CREATE POLICY automata_insert_policy ON automata
  FOR INSERT WITH CHECK (
    tenant_id = app.current_tenant_id()
    AND app.has_permission('automata:create')
  );

DROP POLICY IF EXISTS automata_update_policy ON automata;
CREATE POLICY automata_update_policy ON automata
  FOR UPDATE USING (
    tenant_id = app.current_tenant_id()
    AND app.has_permission('automata:update')
  ) WITH CHECK (
    tenant_id = app.current_tenant_id()
    AND app.has_permission('automata:update')
  );

DROP POLICY IF EXISTS automata_delete_policy ON automata;
CREATE POLICY automata_delete_policy ON automata
  FOR DELETE USING (
    tenant_id = app.current_tenant_id()
    AND app.has_permission('automata:delete')
  );

ALTER TABLE tenant_global_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_global_variables FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_global_variables_select_policy ON tenant_global_variables;
CREATE POLICY tenant_global_variables_select_policy ON tenant_global_variables
  FOR SELECT USING (
    tenant_id = app.current_tenant_id()
    AND app.has_permission('tenant-variable:read')
  );

DROP POLICY IF EXISTS tenant_global_variables_insert_policy ON tenant_global_variables;
CREATE POLICY tenant_global_variables_insert_policy ON tenant_global_variables
  FOR INSERT WITH CHECK (
    tenant_id = app.current_tenant_id()
    AND app.has_permission('tenant-variable:create')
  );

DROP POLICY IF EXISTS tenant_global_variables_update_policy ON tenant_global_variables;
CREATE POLICY tenant_global_variables_update_policy ON tenant_global_variables
  FOR UPDATE USING (
    tenant_id = app.current_tenant_id()
    AND app.has_permission('tenant-variable:update')
  ) WITH CHECK (
    tenant_id = app.current_tenant_id()
    AND app.has_permission('tenant-variable:update')
  );

DROP POLICY IF EXISTS tenant_global_variables_delete_policy ON tenant_global_variables;
CREATE POLICY tenant_global_variables_delete_policy ON tenant_global_variables
  FOR DELETE USING (
    tenant_id = app.current_tenant_id()
    AND app.has_permission('tenant-variable:delete')
  );
`
