-- ============================================================================
-- SINOVA — Fase 11A: DAFTAR QUERY AUDIT (SELECT-ONLY / READ-ONLY)
--
--  ██  STATUS: AMAN. Semua query di berkas ini HANYA `select`.
--  ██  Tidak ada DDL/DML. Tidak mengubah skema, RLS, policy, grant, atau data.
--  ██  Jalankan di Supabase SQL Editor dan CATAT hasilnya.
--
--  Tujuan: menutup item yang masih BELUM TERVERIFIKASI sebelum integrasi nyata
--  (lihat docs/admin-dashboard-api.md §7 dan docs/admin-auth.md §5.1).
--
--  Hubungan dengan docs/admin-schema-recommendation.sql:
--    • Berkas ini MELENGKAPI §0 (audit) di sana.
--    • §1–§3 di berkas itu adalah SQL MUTASI dan TETAP BELUM BOLEH dijalankan
--      tanpa persetujuan pemilik proyek. Audit ini dulu, keputusan kemudian.
--
--  CARA PAKAI: jalankan blok satu per satu (bukan sekaligus). Supabase SQL
--  Editor hanya menampilkan hasil dari statement TERAKHIR bila beberapa
--  statement dieksekusi bersamaan, sehingga menjalankan per blok menghindari
--  hasil yang tertimpa. Semua blok saling independen.
--
--  PENTING:
--    • Jangan menempelkan nilai rahasia (JWT, kata sandi, key) ke dokumen ini.
--    • Hasil F1/F3/F4/F5/F6 bersifat agregat (jumlah) — tidak menampilkan PII
--      siswa. Nama siswa TIDAK pernah diminta di berkas ini.
--    • `auth.users` hanya diakses untuk MENGHITUNG/junction, bukan membaca PII.
-- ============================================================================


-- ============================================================================
-- A. KOLOM, TIPE, DAN DOMAIN
-- ============================================================================

-- A1. Tipe kolom yang sebenarnya. FOKUS: user_roles.user_id (text vs uuid) dan
--     level_results.status (text vs enum). Hasilnya menentukan §1.1/§1.2.
select table_name, ordinal_position, column_name,
       data_type, udt_name, is_nullable, column_default,
       character_maximum_length, numeric_precision
from information_schema.columns
where table_schema = 'public'
  and table_name in ('students','classes','practice_sessions','level_results',
                     'activity_logs','user_roles')
order by table_name, ordinal_position;

-- A2 Kolom bertipe ENUM (bila ada). Kosong = semua kolom bertipe text/number.
--    Hasilnya menentukan apakah `level_results.status` / `user_roles.role`
--    adalah enum PostgreSQL.
select c.table_name, c.column_name, c.udt_schema, c.udt_name,
       (select json_agg(e.enumlabel order by e.enumsortorder)
          from pg_enum e
          join pg_type t on t.oid = e.enumtypid
         where t.typname = c.udt_name) as enum_values
from information_schema.columns c
where c.table_schema = 'public'
  and c.table_name in ('students','classes','practice_sessions','level_results',
                       'activity_logs','user_roles')
  and c.udt_name in (select t.typname from pg_type t where t.typtype = 'e')
order by c.table_name, c.column_name;


-- ============================================================================
-- §B — CONSTRAINT (PK / UNIQUE / FK / CHECK / NOT NULL) & INDEKS
-- ============================================================================

-- B1 Seluruh constraint ke-6 tabel, dengan definisi yang bisa dibaca.
--    (contype: p=PK, u=UNIQUE, f=FK, c=CHECK, n=NOT NULL, x=EXCLUDE)
select t.relname as tabel, c.conname, c.contype as kode,
       case c.contype
         when 'p' then 'PRIMARY KEY' when 'u' then 'UNIQUE'
         when 'f' then 'FOREIGN KEY' when 'c' then 'CHECK'
         when 'n' then 'NOT NULL'   when 'x' then 'EXCLUDE'
         else c.contype::text end as jenis,
       pg_get_constraintdef(c.oid) as definisi
from pg_constraint c
join pg_class t on t.oid = c.conrelid
join pg_namespace n on n.oid = t.relnamespace
where n.nspname = 'public'
  and t.relname in ('students','classes','practice_sessions','level_results',
                    'activity_logs','user_roles')
order by t.relname, c.contype, c.conname;

-- B2 SEMUA foreign key + skema/tabel targetnya.
--    Dipakai untuk memastikan FK `user_roles.user_id -> auth.users.id`
--    (ada/tidak) dan memetakan relasi siswa/kelas.
select t.relname as tabel, c.conname,
       pg_get_constraintdef(c.oid) as definisi,
       rn.nspname as skema_target, rt.relname as tabel_target
from pg_constraint c
join pg_class t on t.oid = c.conrelid
join pg_namespace n on n.oid = t.relnamespace
join pg_class rt on rt.oid = c.confrelid
join pg_namespace rn on rn.oid = rt.relnamespace
where c.contype = 'f'
  and n.nspname = 'public'
  and t.relname in ('students','classes','practice_sessions','level_results',
                    'activity_logs','user_roles')
order by t.relname, c.conname;

-- B3 CHECK constraint yang relevan (domain `status`, `role`, `level_number`, dst).
--    Hasil B3 menentukan nilai yang sah dan apakah ada CHECK pada
--    `level_results.status` / `user_roles.role`.
select t.relname as tabel, c.conname,
       pg_get_constraintdef(c.oid) as definisi
from pg_constraint c
join pg_class t on t.oid = c.conrelid
join pg_namespace n on n.oid = t.relnamespace
where c.contype = 'c'
  and n.nspname = 'public'
  and t.relname in ('students','classes','practice_sessions','level_results',
                    'activity_logs','user_roles')
order by t.relname, c.conname;

-- B4 Indeks (termasuk indeks unik). PENTING: bila ada UNIQUE(session_id,
--    level_number), percobaan level ke-2 pada sesi yang sama bisa gagal 500
--    alih-alih menjadi attempt_number = 2 (lihat laporan Fase 11A).
select tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in ('students','classes','practice_sessions','level_results',
                    'activity_logs','user_roles')
order by tablename, indexname;

-- B5 Kolom NOT NULL (eksplisit). Berguna memastikan kolom yang dibaca fungsi
--    tidak bisa null (mis. practice_sessions.last_seen_at, level_results.id).
select table_name, column_name, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and is_nullable = 'NO'
  and table_name in ('students','classes','practice_sessions','level_results',
                     'activity_logs','user_roles')
order by table_name, ordinal_position;

-- B6 Default kolom kunci (id / attempt_number / status / last_seen_at).
--    Memastikan tidak ada trigger tersembunyi yang mengisi `id`.
select table_name, column_name, column_default, is_nullable, data_type
from information_schema.columns
where table_schema = 'public'
  and column_name in ('id','attempt_number','status','last_seen_at','student_id',
                      'session_id','class_id','level_number','role','user_id')
  and table_name in ('students','classes','practice_sessions','level_results',
                     'activity_logs','user_roles')
order by table_name, column_name;

-- B7 Trigger (non-internal) pada ke-6 tabel. Mendeteksi trigger BEFORE INSERT
--    yang mengubah `id` (bila ada).
select c.relname as tabel, t.tgname, t.tgenabled,
       pg_get_triggerdef(t.oid) as definisi
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and not t.tgisinternal
  and c.relname in ('students','classes','practice_sessions','level_results',
                    'activity_logs','user_roles')
order by c.relname, t.tgname;


-- ============================================================================
-- §C — ROW LEVEL SECURITY (RLS) & POLICY
-- ============================================================================

-- C1 Apakah RLS aktif/forced pada tiap tabel, dan siapa pemiliknya.
select n.nspname as skema, c.relname as tabel,
       c.relrowsecurity as rls_aktif,
       c.relforcerowsecurity as rls_forced,
       pg_get_userbyid(c.relowner) as pemilik
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('students','classes','practice_sessions','level_results',
                    'activity_logs','user_roles')
order by c.relname;

-- C2 Daftar policy yang ada sekarang. Beri perhatian khusus pada policy
--    `using (true)` / `permissive = 'PERMISSIVE'` yang membuka akses klien.
select tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('students','classes','practice_sessions','level_results',
                    'activity_logs','user_roles')
order by tablename, policyname;

-- C3 Jumlah policy per tabel (ringkasan cepat; 0 = tidak ada policy).
select tablename, count(*) as jumlah_policy
from pg_policies
where schemaname = 'public'
  and tablename in ('students','classes','practice_sessions','level_results',
                    'activity_logs','user_roles')
group by tablename
order by tablename;


-- ============================================================================
-- §D — GRANTS & FUNCTION (apakah klien bisa membaca tabel langsung?)
-- ============================================================================

-- D1 Grant tingkat tabel ke peran API. Tabel admin seharusnya TIDAK memberi
--    `select` ke `anon`/`authenticated` (klien membaca lewat Edge Function).
select table_name, grantee, privilege_type, is_grantable
from information_schema.table_privileges
where table_schema = 'public'
  and table_name in ('students','classes','practice_sessions','level_results',
                     'activity_logs','user_roles')
  and grantee in ('anon','authenticated','service_role')
order by table_name, grantee, privilege_type;

-- D2 Grant tingkat kolom (jarang, tetapi mungkin ada dan bisa membuka sebagian).
select table_name, column_name, grantee, privilege_type
from information_schema.column_privileges
where table_schema = 'public'
  and table_name in ('students','classes','practice_sessions','level_results',
                     'activity_logs','user_roles')
  and grantee in ('anon','authenticated','service_role')
order by table_name, column_name, grantee;

-- D3 Default privileges di schema `public` (grant otomatis untuk tabel baru).
select pg_get_userbyid(d.defaclrole) as grantor,
       n.nspname as skema, d.defaclobjtype as objtype,
       d.defaclacl::text as acl
from pg_default_acl d
left join pg_namespace n on n.oid = d.defaclnamespace
order by grantor, skema, objtype;

-- D4 Fungsi di schema `public` (mis. register_sinova_student): SECURITY DEFINER?
--    `proconfig` memperlihatkan `search_path` yang dikunci (bila ada).
select n.nspname as skema, p.proname,
       pg_get_function_identity_arguments(p.oid) as args,
       p.prosecdef as security_definer,
       p.provolatile,
       p.proconfig,
       p.proacl::text as acl
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
order by p.proname;

-- D5 View di schema `public`. View berpotensi MEMBUKA data lewat API meski
--    tabelnya tertutup — periksa apakah ada view yang mengekspos data siswa
--    dan apakah view memakai `security_invoker` (default: sebagai pemilik).
select table_name, is_updatable, view_definition
from information_schema.views
where table_schema = 'public'
order by table_name;

-- D6 Materialized view di schema `public` (bila ada).
select schemaname, matviewname, ispopulated
from pg_matviews
where schemaname = 'public'
order by matviewname;


-- ============================================================================
-- §D2 — KONFIGURASI PERAN API (DIFILTER AGAR TIDAK MENAMPILKAN RAHASIA)
-- ============================================================================

-- D2.1 Setting peran `anon`/`authenticated`/`service_role`, TANPA setting yang
--      memuat kata secret/password/jwt/key. `authenticator` sengaja TIDAK
--      disertakan (menyimpan setting PostgREST yang dapat memuat rahasia).
select r.rolname, s as setting
from pg_roles r, unnest(coalesce(r.rolconfig, '{}'::text[])) as s
where r.rolname in ('anon','authenticated','service_role')
  and s !~* 'secret|password|jwt|key'
order by r.rolname, s;


-- ============================================================================
-- §E — SANITY DATA (AGREGAT SAJA, TANPA PII)
-- ============================================================================

-- E1 Jumlah baris tiap tabel (menentukan apakah SCAN_LIMIT = 20.000 relevan).
select 'classes' as tabel, count(*) as jumlah from public.classes
union all select 'students',          count(*) from public.students
union all select 'practice_sessions', count(*) from public.practice_sessions
union all select 'level_results',     count(*) from public.level_results
union all select 'activity_logs',     count(*) from public.activity_logs
union all select 'user_roles',        count(*) from public.user_roles
union all select 'auth.users',        count(*) from auth.users
order by tabel;

-- E2 Nilai dan domain `user_roles.role` + jumlah (menentukan ALLOWED_ROLES).
--    Hanya agregat peran (tanpa user_id).
select role, count(*) as jumlah
from public.user_roles
group by role
order by role;

-- E3 Baris `user_roles` yang menunjuk ke pengguna auth yang TIDAK ada
--    (mengukur dampak belum adanya FK ke auth.users).
select count(*) as baris_tanpa_user_auth
from public.user_roles r
left join auth.users u on u.id::text = r.user_id
where u.id is null;

-- E4 Jumlah pengguna yang punya lebih dari satu baris role.
select count(*) as user_dengan_role_ganda
from (select user_id from public.user_roles
      group by user_id having count(*) > 1) x;

-- E5 Domain nilai `level_results.status` (hanya distribusi, tanpa PII).
select status, count(*) as jumlah
from public.level_results
group by status
order by jumlah desc, status;

-- E6 Domain nilai `practice_sessions.status`.
select status, count(*) as jumlah
from public.practice_sessions
group by status
order by jumlah desc, status;

-- E7 Apakah ada (session_id, level_number, attempt_number) ganda?
--    Bila > 0, ada kemungkinan idempotensi/attempt bertabrakan.
select count(*) as duplikat_session_level_attempt
from (select session_id, level_number, attempt_number
      from public.level_results
      group by session_id, level_number, attempt_number
      having count(*) > 1) x;

-- E8 Rentang `attempt_number` (memastikan percobaan ulang benar-benar tercatat).
select min(attempt_number) as min_attempt,
       max(attempt_number) as max_attempt,
       count(distinct attempt_number) as jumlah_nilai
from public.level_results;

-- E9 Siswa yang menunjuk kelas tidak ada (harusnya 0 karena FK ada).
select count(*) as siswa_tanpa_kelas
from public.students s
left join public.classes c on c.id = s.class_id
where c.id is null;

-- E10 Siswa yang belum punya sesi sama sekali (bukan error, sekadar konteks
--     untuk status turunan `belum_mulai`).
select count(*) as siswa_tanpa_sesi
from public.students s
left join public.practice_sessions ps on ps.student_id = s.id
where ps.id is null;
