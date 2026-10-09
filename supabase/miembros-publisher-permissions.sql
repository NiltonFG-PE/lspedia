-- Permisos del servidor del Publicador para el esquema existente lsp_content/lsp_members.
-- Aplicar solo tras autorizar este acceso del servidor. No cambia anon, authenticated ni RLS.
begin;
grant select, insert, update on public.lsp_content to service_role;
grant select on public.lsp_members to service_role;
grant insert (user_id, role, status), update (status) on public.lsp_members to service_role;
commit;
