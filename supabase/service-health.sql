-- Monitor de disponibilidad: no lee tablas ni permite modificar datos.
begin;
create or replace function public.lsp_service_health_v1()
returns boolean language sql stable security invoker set search_path = ''
as $$ select true $$;
revoke all on function public.lsp_service_health_v1() from public;
grant execute on function public.lsp_service_health_v1() to anon, authenticated;
commit;
