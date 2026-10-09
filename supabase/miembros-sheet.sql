-- Ejecutar después de miembros.sql. Campos del archivo privado.
begin;
alter table public.lsp_member_content
  add column if not exists source_id uuid unique,
  add column if not exists variants text not null default '' check (length(variants)<=1000),
  add column if not exists topic text not null default '' check (length(topic)<=100),
  add column if not exists image_url text not null default '' check (length(image_url)<=1500),
  add column if not exists publish_at timestamptz;
drop policy content_read on public.lsp_member_content;
create policy content_read on public.lsp_member_content for select to authenticated using (
  (select public.lsp_member_active()) and (
    (published and (publish_at is null or publish_at<=now()))
    or (select public.lsp_member_admin())
  )
);
commit;
