-- 하루결 GitHub Pages용 콘텐츠 테이블.
-- 공개 읽기와 전용 관리자 쓰기를 분리하고 RLS를 항상 적용합니다.

create table if not exists public.harugyeol_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 2 and 120),
  excerpt text not null check (char_length(excerpt) between 20 and 320),
  category text not null check (category in ('정리', '청소', '주방', '루틴', '살림도구')),
  intro text not null check (char_length(intro) between 20 and 1000),
  sections jsonb not null default '[]'::jsonb check (jsonb_typeof(sections) = 'array'),
  status text not null default 'draft' check (status in ('draft', 'published')),
  featured boolean not null default false,
  accent text not null default 'sage' check (accent in ('sage', 'clay', 'sky', 'butter', 'plum')),
  reading_minutes smallint not null default 5 check (reading_minutes between 1 and 60),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint harugyeol_published_requires_date check (status <> 'published' or published_at is not null)
);

create index if not exists harugyeol_posts_published_at_idx on public.harugyeol_posts (published_at desc) where status = 'published';
create index if not exists harugyeol_posts_category_published_idx on public.harugyeol_posts (category, published_at desc) where status = 'published';

alter table public.harugyeol_posts enable row level security;
grant usage on schema public to anon, authenticated;
grant select on table public.harugyeol_posts to anon, authenticated;
grant insert, update, delete on table public.harugyeol_posts to authenticated;

create policy "harugyeol published posts are public" on public.harugyeol_posts for select to anon using (status = 'published');
create policy "harugyeol authenticated readers" on public.harugyeol_posts for select to authenticated using (status = 'published' or (((select auth.jwt()) -> 'app_metadata' ->> 'harugyeol_role') = 'admin'));
create policy "harugyeol admins can create posts" on public.harugyeol_posts for insert to authenticated with check ((((select auth.jwt()) -> 'app_metadata' ->> 'harugyeol_role') = 'admin'));
create policy "harugyeol admins can update posts" on public.harugyeol_posts for update to authenticated using ((((select auth.jwt()) -> 'app_metadata' ->> 'harugyeol_role') = 'admin')) with check ((((select auth.jwt()) -> 'app_metadata' ->> 'harugyeol_role') = 'admin'));
create policy "harugyeol admins can delete posts" on public.harugyeol_posts for delete to authenticated using ((((select auth.jwt()) -> 'app_metadata' ->> 'harugyeol_role') = 'admin'));

create or replace function public.set_harugyeol_post_updated_at()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at = now();
  if new.status = 'published' and new.published_at is null then new.published_at = now(); end if;
  return new;
end;
$$;

create trigger set_harugyeol_posts_updated_at before update on public.harugyeol_posts for each row execute function public.set_harugyeol_post_updated_at();
revoke all on function public.set_harugyeol_post_updated_at() from public, anon, authenticated;
