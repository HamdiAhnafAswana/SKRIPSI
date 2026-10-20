-- ============================================================================
-- SINOVA — Rekomendasi SQL untuk autentikasi/otorisasi admin (Fase 8)
--
--  ██  STATUS: BELUM DIJALANKAN. JANGAN jalankan bagian §1–§3 tanpa
--  ██  persetujuan pemilik proyek. Berkas ini hanya RANCANGAN.
--
--  §0 = SELECT audit (READ-ONLY, aman dijalankan lewat SQL Editor).
--  §1 = SQL MUTASI (DDL/DCL) — mengubah skema/RLS/policy. BUTUH PERSETUJUAN.
--  §2 = Contoh menambahkan admin (MUTASI) — BUTUH PERSETUJUAN.
--  §3 = Catatan pembatalan (rollback) bila salah satu §1/§2 diterapkan.
--
--  Sebelum menjalankan apa pun: jalankan §0 dan catat hasilnya. Beberapa
--  asumsi di §1 (mis. relasi user_roles → auth.users, tipe kolom, domain role)
--  BELUM TERVERIFIKASI.
-- ============================================================================


-- ============================================================================
-- §0  SELECT AUDIT — READ-ONLY. Aman dijalankan. Hasilnya menentukan §1.
-- ============================================================================

-- 0.1 Kolom, tipe, nullability, dan default (mis. tipe user_roles.user_id).
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in ('students','classes','practice_sessions','level_results',
                     'activity_logs','user_roles')
order by table_name, ordinal_position;

-- 0.2 Primary key, unique, FK, dan CHECK (termasuk domain `role`).
select t.relname as tabel, c.conname, c.contype,
       pg_get_constraintdef(c.oid) as definisi
from pg_constraint c
join pg_class t on t.oid = c.conrelid
join pg_namespace n on n.oid = t.relnamespace
where n.nspname = 'public'
  and t.relname in ('students','classes','practice_sessions','level_results',
                    'activity_logs','user_roles')
order by t.relname, c.contype, c.conname;

-- 0.3 Apakah ada FK dari user_roles.user_id ke auth.users.id?
--     (BELUM TERVERIFIKASI; hasil query ini yang memutuskan §1.1.)
select con.conname, pg_get_constraintdef(con.oid) as definisi
from pg_constraint con
join pg_class t on t.oid = con.conrelid
join pg_namespace n on n.oid = t.relnamespace
where n.nspname = 'public' and t.relname = 'user_roles' and con.contype = 'f';

-- 0.4 RLS aktif/tidak.
select relname, relrowsecurity
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and relname in ('students','classes','practice_sessions','level_results',
                  'activity_logs','user_roles');

-- 0.5 Policy yang sudah ada (audit dulu sebelum menambah).
select tablename, policyname, cmd, roles::text as peran, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 0.6 Hak akses tabel untuk peran API.
select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon','authenticated','service_role')
order by table_name, grantee, privilege_type;

-- 0.7 Nilai `role` yang benar-benar ada (menentukan allowlist & CHECK §1.2).
--     Ganti komentar bila tabel belum boleh dibaca — ini hanya agregasi.
select role, count(*) as jumlah
from public.user_roles
group by role
order by role;

-- 0.8 Apakah sudah ada akun admin? (hanya jumlah, tanpa data pribadi)
select count(*) as jumlah_baris_user_roles from public.user_roles;


-- ============================================================================
-- §1  SQL MUTASI — BUTUH PERSETUJUAN. Belum dijalankan.
--     Jalankan HANYA setelah §0 selesai dan hasilnya ditinjau.
-- ============================================================================

-- 1.1 (Opsional) Pastikan relasi user_roles.user_id → auth.users.id.
--     Jalankan HANYA bila §0.3 menunjukkan BELUM ada FK DAN tipe kolom cocok
--     (uuid). Bila kolom bertipe text, JANGAN jalankan ini sebelum dikonversi.
-- alter table public.user_roles
--   add constraint user_roles_user_id_fkey
--   foreign key (user_id) references auth.users(id) on delete cascade;

-- 1.2 (Opsional) Batasi domain `role`. Jalankan HANYA setelah §0.7 diketahui;
--     nilai yang sudah ada harus tercantum agar validasi tidak gagal.
-- alter table public.user_roles
--   add constraint user_roles_role_check
--   check (role in ('admin'));

-- 1.3 Aktifkan RLS (idempoten) pada seluruh tabel terkait.
-- alter table public.user_roles       enable row level security;
-- alter table public.classes          enable row level security;
-- alter table public.students         enable row level security;
-- alter table public.practice_sessions enable row level security;
-- alter table public.level_results    enable row level security;
-- alter table public.activity_logs    enable row level security;

-- 1.4 Helper peran untuk RLS (SECURITY DEFINER; search_path dikunci).
--     Membaca user_roles tanpa mengeksposnya ke klien.
-- create or replace function public.is_admin(uid uuid default auth.uid())
-- returns boolean
-- language sql
-- security definer
-- set search_path = public, pg_temp
-- stable
-- as $$
--   select exists (
--     select 1 from public.user_roles r
--     where r.user_id = uid and r.role = 'admin'
--   );
-- $$;
-- revoke all on function public.is_admin(uuid) from public;
-- grant execute on function public.is_admin(uuid) to authenticated;

-- 1.5 Policy SELECT admin (Opsi B — defense-in-depth). Hanya SELECT; TIDAK ada
--     INSERT/UPDATE/DELETE untuk admin pada fase ini.
--     PENTING: bila tabel sudah punya policy permisif dari sebelumnya, audit §0.5
--     dulu — menambah policy tidak otomatis menutup policy lama.
-- create policy "admin_read_classes" on public.classes
--   for select to authenticated using (public.is_admin());
-- create policy "admin_read_students" on public.students
--   for select to authenticated using (public.is_admin());
-- create policy "admin_read_practice_sessions" on public.practice_sessions
--   for select to authenticated using (public.is_admin());
-- create policy "admin_read_level_results" on public.level_results
--   for select to authenticated using (public.is_admin());
-- create policy "admin_read_activity_logs" on public.activity_logs
--   for select to authenticated using (public.is_admin());

-- 1.6 Kunci `user_roles` dari klien: tanpa policy = tolak semua akses non-service.
-- alter table public.user_roles enable row level security;
-- revoke all on public.user_roles from anon, authenticated;


-- ============================================================================
-- §2  Contoh menambahkan admin — MUTASI. BUTUH PERSETUJUAN.
--     Buat pengguna lebih dulu: Dashboard → Authentication → Add user.
--     Lalu ambil UUID-nya dan jalankan (ganti <UUID_ADMIN>):
-- ============================================================================
-- insert into public.user_roles (user_id, role)
-- values ('<UUID_ADMIN>', 'admin')
-- on conflict do nothing;


-- ============================================================================
-- §3  Catatan rollback (bila §1/§2 pernah diterapkan). BUTUH PERSETUJUAN.
-- ============================================================================
-- drop policy if exists "admin_read_classes" on public.classes;
-- drop policy if exists "admin_read_students" on public.students;
-- drop policy if exists "admin_read_practice_sessions" on public.practice_sessions;
-- drop policy if exists "admin_read_level_results" on public.level_results;
-- drop policy if exists "admin_read_activity_logs" on public.activity_logs;
-- drop function if exists public.is_admin(uuid);
-- alter table public.user_roles drop constraint if exists user_roles_role_check;
-- alter table public.user_roles drop constraint if exists user_roles_user_id_fkey;
-- delete from public.user_roles where user_id = '<UUID_ADMIN>' and role = 'admin';
