-- ============================================================
-- SUPROVAL — Fix: privilegios del rol service_role
-- Pégalo tal cual en el SQL Editor de Supabase y ejecútalo.
--
-- Problema detectado en producción (logs de Vercel):
--   código 42501: "permission denied for table partes_taller"
--   al consultar con la SUPABASE_SERVICE_ROLE_KEY desde el cron
--   /api/cron/recordatorio-parados.
--
-- El rol service_role salta las políticas RLS, pero necesita
-- igualmente privilegios SQL (GRANT) sobre las tablas. En este
-- proyecto esos grants por defecto no están presentes, así que
-- los restauramos de forma explícita.
-- ============================================================

-- Acceso al esquema
grant usage on schema public to service_role;

-- Privilegios sobre las tablas existentes (partes_taller, profiles…)
grant select, insert, update, delete
  on all tables in schema public to service_role;

-- Secuencias (por si alguna tabla futura usa serial/identity)
grant usage, select on all sequences in schema public to service_role;

-- Y que cualquier tabla creada en el futuro los reciba automáticamente
alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;
alter default privileges in schema public
  grant usage, select on sequences to service_role;

-- ============================================================
-- Verificación (opcional): esta consulta debe devolver filas
-- indicando los privilegios de service_role sobre partes_taller.
-- ============================================================
-- select grantee, privilege_type
-- from information_schema.role_table_grants
-- where table_schema = 'public'
--   and table_name = 'partes_taller'
--   and grantee = 'service_role';
