-- Aplicar sobre las tablas existentes lsp_members / lsp_content. Es aditiva e idempotente.
begin;
alter table public.lsp_members add column if not exists expires_at timestamptz;
alter table public.lsp_members add column if not exists allowed_sections text[];
-- NULL permite todas las secciones; un arreglo vacío no permite ninguna.
grant update(expires_at,allowed_sections) on public.lsp_members to service_role;
create or replace function lsp_internal.member_live()
returns boolean language sql stable security definer set search_path='' as $$
  select lsp_internal.is_admin() or exists (
    select 1 from public.lsp_members m where m.user_id=auth.uid() and m.status='active'
    and (m.expires_at is null or m.expires_at>now())
  );
$$;
create or replace function lsp_internal.section_allowed(section_name text)
returns boolean language sql stable security definer set search_path='' as $$
  select lsp_internal.is_admin() or exists (
    select 1 from public.lsp_members m where m.user_id=auth.uid() and m.status='active'
    and (m.expires_at is null or m.expires_at>now()) and (
      m.allowed_sections is null or
      (case section_name when 'Señas Internacionales (IS)' then 'IS' when 'Lengua de Señas Americana (ASL)' then 'ASL'
       when 'Contenido para profesores' then 'Profesores' else section_name end)=any(m.allowed_sections)
    )
  );
$$;
revoke all on function lsp_internal.member_live(),lsp_internal.section_allowed(text) from public,anon;
grant execute on function lsp_internal.member_live(),lsp_internal.section_allowed(text) to authenticated;
-- Políticas restrictivas: se combinan con las existentes, sin retirar su protección.
drop policy if exists member_access_limits on public.lsp_content;
create policy member_access_limits on public.lsp_content as restrictive for select to authenticated
using (lsp_internal.section_allowed(section) and (lsp_internal.is_admin() or (published and (published_at is null or published_at<=now()))));
drop policy if exists category_access_limits on public.lsp_member_categories;
create policy category_access_limits on public.lsp_member_categories as restrictive for select to authenticated
using (lsp_internal.section_allowed(title));
create or replace function public.lsp_member_features() returns jsonb
language sql stable security definer set search_path='' as $$
  select case when coalesce(auth.role(),'')='service_role' or lsp_internal.member_live() then '{"version":2,"sectionAccess":true,"expiration":true}'::jsonb else '{}'::jsonb end;
$$;
revoke all on function public.lsp_member_features() from public,anon;
grant execute on function public.lsp_member_features() to authenticated,service_role;
create or replace function public.lsp_set_member_access(target_user uuid, new_sections text[], new_expiry timestamptz, expected_access jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare m public.lsp_members; current_access jsonb;
begin
  if not (coalesce(auth.role(),'')='service_role' or lsp_internal.is_admin()) then
    raise exception 'Acceso denegado' using errcode='42501';
  end if;
  select * into m from public.lsp_members where user_id=target_user for update;
  if not found then raise exception 'La cuenta no tiene perfil. Actualiza los usuarios.'; end if;
  if m.role='admin' then raise exception 'La cuenta administradora está protegida'; end if;
  current_access=jsonb_build_object('sections',m.allowed_sections,'expires',m.expires_at);
  if expected_access is null or (expected_access->'sections') is distinct from (current_access->'sections') or (expected_access->>'expires')::timestamptz is distinct from m.expires_at then raise exception 'El acceso cambió. Actualiza la lista'; end if;
  if new_sections is not null and (cardinality(new_sections)>100 or exists (
    select 1 from unnest(new_sections) s where s is null or not exists (
      select 1 from public.lsp_member_categories c where s=(case c.title
        when 'Señas Internacionales (IS)' then 'IS' when 'Lengua de Señas Americana (ASL)' then 'ASL'
        when 'Contenido para profesores' then 'Profesores' else c.title end)
    )
  )) then raise exception 'Sección inválida'; end if;
  update public.lsp_members set allowed_sections=new_sections,expires_at=new_expiry where user_id=target_user;
  return jsonb_build_object('ok',true);
end; $$;
revoke all on function public.lsp_set_member_access(uuid,text[],timestamptz,jsonb) from public,anon;
grant execute on function public.lsp_set_member_access(uuid,text[],timestamptz,jsonb) to authenticated,service_role;
commit;
