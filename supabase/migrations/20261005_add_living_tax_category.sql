-- Add a publication category without changing existing articles or RLS.
alter table public.harugyeol_posts
  drop constraint harugyeol_posts_category_check;
alter table public.harugyeol_posts
  add constraint harugyeol_posts_category_check
  check (category in ('생활세금', '정리', '청소', '주방', '루틴', '살림도구'));
