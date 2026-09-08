-- prisma/triggers.sql — JALANKAN MANUAL di Supabase SQL Editor (satu kali).
-- Idempotent: aman dijalankan ulang (CREATE OR REPLACE + DROP IF EXISTS).
--
-- 1. Sinkronisasi auth.users -> public."User" (setiap signup).
--    Pemicu gagal = signup gagal total, karena itu ada ON CONFLICT DO NOTHING.
-- 2. Row Level Security: kunci akses anon; app lewat Prisma (service_role/pooler)
--    tetap bisa baca-tulis karena bypass RLS.

-- ── Fungsi + trigger sync user ──────────────────────────────────────────
create or replace function public.handle_new_auth_user()
returns trigger as $$
begin
  insert into public."User" (id, email, name, avatar)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ── RLS ─────────────────────────────────────────────────────────────────
alter table public."User" enable row level security;
alter table public."Generation" enable row level security;

drop policy if exists "user_select_own" on public."User";
create policy "user_select_own" on public."User"
  for select using (auth.uid() = id);

drop policy if exists "generation_owner_all" on public."Generation";
create policy "generation_owner_all" on public."Generation"
  for all using (
    exists (
      select 1 from public."User" u
      where u.id = "Generation"."userId" and u.id = auth.uid()
    )
  );

-- ── Verifikasi (jalankan setelahnya) ─────────────────────────────────────
-- select * from pg_trigger where tgname = 'on_auth_user_created';
-- select tablename, rowsecurity from pg_tables
--   where schemaname = 'public' and tablename in ('User', 'Generation');
-- select policyname, cmd from pg_policies
--   where schemaname = 'public' and tablename in ('User', 'Generation');
