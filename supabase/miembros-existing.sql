-- Integración sobre lsp_content y lsp_members ya creadas. No ejecutar miembros.sql en este proyecto.
begin;
create table if not exists public.lsp_member_categories (
  id uuid primary key default gen_random_uuid(),
  title text not null unique check (length(trim(title)) between 1 and 100),
  description text not null default '' check (length(description) <= 500),
  position integer not null default 0
);
alter table public.lsp_member_categories enable row level security;
revoke all on public.lsp_member_categories from anon, authenticated;
grant select, insert, update, delete on public.lsp_member_categories to authenticated;
grant all on public.lsp_member_categories to service_role;
create policy categories_read on public.lsp_member_categories for select to authenticated using ((select lsp_internal.is_member()));
create policy categories_admin on public.lsp_member_categories for all to authenticated using ((select lsp_internal.is_admin())) with check ((select lsp_internal.is_admin()));
create or replace function public.lsp_list_members()
returns table(user_id uuid, email text, role text, status text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not lsp_internal.is_admin() then raise exception 'Acceso denegado' using errcode = '42501'; end if;
  return query select u.id, u.email::text, coalesce(m.role,'member'), coalesce(m.status,'pending')
    from auth.users u left join public.lsp_members m on m.user_id = u.id order by u.created_at desc;
end; $$;
create or replace function public.lsp_set_member_status(target_user uuid, new_status text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not lsp_internal.is_admin() then raise exception 'Acceso denegado' using errcode = '42501'; end if;
  if new_status not in ('active','suspended') or new_status is null then raise exception 'Estado inválido'; end if;
  if target_user = auth.uid() or exists(select 1 from public.lsp_members where user_id = target_user and role = 'admin') then
    raise exception 'Las cuentas administradoras se gestionan en SQL Editor';
  end if;
  insert into public.lsp_members(user_id,role,status) values(target_user,'member',new_status)
    on conflict(user_id) do update set status = excluded.status where public.lsp_members.role = 'member';
end; $$;
revoke all on function public.lsp_list_members(), public.lsp_set_member_status(uuid,text) from public, anon;
grant execute on function public.lsp_list_members(), public.lsp_set_member_status(uuid,text) to authenticated;

insert into public.lsp_member_categories(title,description,position) values
('Señas Internacionales (IS)','Videos y recursos de Señas Internacionales.',1),
('Lengua de Señas Americana (ASL)','Videos y recursos de ASL.',2),
('Tutoriales','Guías y videos organizados por temas.',3),
('Contenido para profesores','Recursos y actividades para el trabajo educativo.',4) on conflict(title) do nothing;
commit;
