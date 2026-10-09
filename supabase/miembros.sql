-- Ejecutar una vez en SQL Editor de un proyecto Supabase gratuito.
-- No contiene contraseñas. Las cuentas se gestionan mediante Supabase Auth.
begin;
create table public.lsp_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('member','admin')),
  status text not null default 'pending' check (status in ('pending','active','suspended')),
  created_at timestamptz not null default now()
);
create table public.lsp_member_categories (
  id uuid primary key default gen_random_uuid(),
  title text not null unique check (length(trim(title)) between 1 and 100),
  description text not null default '' check (length(description) <= 500),
  position integer not null default 0
);
create table public.lsp_member_content (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.lsp_member_categories(id) on delete restrict,
  title text not null check (length(trim(title)) between 1 and 160),
  description text not null default '' check (length(description) <= 4000),
  keywords text not null default '' check (length(keywords) <= 1000),
  youtube_id text not null check (youtube_id ~ '^[a-zA-Z0-9_-]{11}$'),
  published boolean not null default false,
  created_at timestamptz not null default now()
);
create index lsp_member_content_category_idx on public.lsp_member_content(category_id);
alter table public.lsp_members enable row level security;
alter table public.lsp_member_categories enable row level security;
alter table public.lsp_member_content enable row level security;

-- Funciones con ruta de búsqueda vacía; permisos leídos de una tabla
-- que los miembros no pueden modificar. No se confía en user_metadata.
create function public.lsp_member_active() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.lsp_members where user_id = auth.uid() and status = 'active');
$$;
create function public.lsp_member_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.lsp_members where user_id = auth.uid() and role = 'admin' and status = 'active');
$$;
revoke all on function public.lsp_member_active(), public.lsp_member_admin() from public, anon;
grant execute on function public.lsp_member_active(), public.lsp_member_admin() to authenticated;
revoke all on public.lsp_members, public.lsp_member_categories, public.lsp_member_content from anon, authenticated;
grant select on public.lsp_members to authenticated;
grant select, insert, update, delete on public.lsp_member_categories, public.lsp_member_content to authenticated;
create policy members_self_read on public.lsp_members for select to authenticated using (user_id = (select auth.uid()));
create policy categories_read on public.lsp_member_categories for select to authenticated using ((select public.lsp_member_active()));
create policy categories_admin_insert on public.lsp_member_categories for insert to authenticated with check ((select public.lsp_member_admin()));
create policy categories_admin_update on public.lsp_member_categories for update to authenticated using ((select public.lsp_member_admin())) with check ((select public.lsp_member_admin()));
create policy categories_admin_delete on public.lsp_member_categories for delete to authenticated using ((select public.lsp_member_admin()));
create policy content_read on public.lsp_member_content for select to authenticated using ((select public.lsp_member_active()) and (published or (select public.lsp_member_admin())));
create policy content_admin_insert on public.lsp_member_content for insert to authenticated with check ((select public.lsp_member_admin()));
create policy content_admin_update on public.lsp_member_content for update to authenticated using ((select public.lsp_member_admin())) with check ((select public.lsp_member_admin()));
create policy content_admin_delete on public.lsp_member_content for delete to authenticated using ((select public.lsp_member_admin()));

create function public.lsp_list_members()
returns table(user_id uuid, email text, role text, status text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.lsp_member_admin() then raise exception 'Acceso denegado' using errcode = '42501'; end if;
  return query select u.id, u.email::text, coalesce(m.role,'member'), coalesce(m.status,'pending')
    from auth.users u left join public.lsp_members m on m.user_id = u.id order by u.created_at desc;
end; $$;
create function public.lsp_set_member_status(target_user uuid, new_status text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.lsp_member_admin() then raise exception 'Acceso denegado' using errcode = '42501'; end if;
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
('Contenido para profesores','Recursos y actividades para el trabajo educativo.',4);
commit;

-- DESPUÉS: crear tu cuenta en Authentication → Users, y ejecutar por separado:
-- insert into public.lsp_members(user_id,role,status)
-- select id,'admin','active' from auth.users where lower(email) = lower('TU_CORREO')
-- on conflict(user_id) do update set role = 'admin', status = 'active';
