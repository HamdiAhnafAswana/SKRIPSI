-- ============================================================================
-- SINOVA — INISIALISASI SKEMA STAGING
--
--  ██  STATUS: BELUM DIJALANKAN. Berkas ini untuk proyek STAGING saja.
--  ██  JANGAN jalankan pada produksi (`rezraqimsvtwhhmxygad`).
--  ██  JANGAN menyalin data siswa produksi ke staging.
--
--  Konteks & sumber kebenaran
--  --------------------------
--  Repositori ini TIDAK memiliki folder `supabase/migrations/` maupun
--  `seed.sql`. Skema asal (produksi) dibuat di luar migrasi. Karena itu berkas
--  ini merekonstruksi skema dari sumber yang BENAR-BENAR tersedia:
--    (a) hasil `gen types` produksi (kolom, tipe, nullability, FK) — TEPAT;
--    (b) pemakaian kolom/status oleh kode Edge Function di repositori ini.
--
--  Yang PASTI (dari gen types):
--    classes(id:number, class_name:string)
--    students(id:string, full_name:string, class_id:number,
--             absence_number:number, created_at:string)
--    practice_sessions(id:string, student_id:string, status:string,
--             current_level:number|null, started_at:string,
--             last_seen_at:string, completed_at:string|null)
--    level_results(id:string, session_id:string, level_number:number,
--             attempt_number:number, score:number|null, mistakes:number|null,
--             duration_seconds:number|null, passed:boolean|null,
--             status:string, started_at:string, completed_at:string|null)
--    activity_logs(id:number, event_type:string, details:Json,
--             session_id:string|null, student_id:string|null, created_at:string)
--    user_roles(user_id:string(text), role:string, created_at:string) — tanpa relasi
--    RPC register_sinova_student(p_full_name, p_class_name, p_absence_number) -> Json
--    FK nyata: students.class_id→classes.id; practice_sessions.student_id→students.id;
--              level_results.session_id→practice_sessions.id;
--              activity_logs.session_id→practice_sessions.id;
--              activity_logs.student_id→students.id
--
--  ASUMSI YANG BELUM TERBUKTI (ditandai [ASUMSI] di bawah; tinjau sebelum jalan):
--    * id numerik (classes.id, students.class_id, activity_logs.id) memakai
--      BIGINT identity (gen types hanya menyebut `number`; int4 vs int8 tak
--      dapat dipastikan dari tipe TS).
--    * id berbentuk string memakai UUID (default gen_random_uuid()).
--    * `level_results.status` WAJIB punya DEFAULT karena kode tidak pernah
--      mengisi kolom ini; domain nilainya BELUM terverifikasi → dipakai
--      'completed' sebagai default sementara.
--    * Constraint UNIQUE: classes.class_name; students(class_id, absence_number).
--      Yang terakhir diperlukan agar jalur "sudah terdaftar" (kode 23505) bekerja.
--    * Domain `user_roles.role` dan kemungkinan PRIMARY KEY/UNIQUE-nya tidak
--      terverifikasi (gen types: Relationships []).
--    * Isi body RPC `register_sinova_student` (tidak tersedia) — direkonstruksi
--      agar cocok dengan pesan/kode error yang diharapkan `student-register`.
--    * RLS/policy: rekomendasi (lihat §4), bukan hasil audit produksi.
--
--  CARA PAKAI (staging): jalankan seluruh berkas ini di SQL Editor proyek
--  STAGING. JANGAN di produksi. Tidak ada migrasi otomatis di repositori ini.
-- ============================================================================


-- ============================================================================
-- §1  Ekstensi
-- ============================================================================
create extension if not exists pgcrypto with schema extensions;


-- ============================================================================
-- §2  Tabel (kolom/tipe/nullability dari gen types; DDL di bawah ini [ASUMSI]
--     untuk default/identity/constraint yang tidak terlihat dari gen types)
-- ============================================================================

-- 2.1 classes ---------------------------------------------------------------
create table if not exists public.classes (
  id          bigint generated always as identity primary key,  -- [ASUMSI] identity
  class_name  text not null unique                              -- [ASUMSI] unique
);

-- 2.2 students --------------------------------------------------------------
create table if not exists public.students (
  id              uuid primary key default gen_random_uuid(),   -- [ASUMSI] uuid
  full_name       text not null,
  class_id        bigint not null,
  absence_number  integer not null,
  created_at      timestamptz not null default now(),
  constraint students_class_id_fkey
    foreign key (class_id) references public.classes(id),        -- FK NYATA
  constraint students_class_absence_unique
    unique (class_id, absence_number)                            -- [ASUMSI] wajib utk 23505
);

-- 2.3 practice_sessions -----------------------------------------------------
create table if not exists public.practice_sessions (
  id            uuid primary key default gen_random_uuid(),      -- [ASUMSI] uuid
  student_id    uuid not null,
  status        text not null default 'in_progress',            -- domain: in_progress|completed|disconnected
  current_level integer,
  started_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  completed_at  timestamptz,
  constraint practice_sessions_student_id_fkey
    foreign key (student_id) references public.students(id)      -- FK NYATA
);

-- 2.4 level_results ---------------------------------------------------------
create table if not exists public.level_results (
  id                uuid primary key default gen_random_uuid(),  -- [ASUMSI] uuid (id dibuat klien)
  session_id        uuid not null,
  level_number      integer not null,
  attempt_number    integer not null default 1,
  score             integer,
  mistakes          integer,
  duration_seconds  integer,
  passed            boolean,
  status            text not null default 'completed',          -- [ASUMSI] domain DEFAULT belum terverifikasi
  started_at        timestamptz not null default now(),
  completed_at      timestamptz,
  constraint level_results_session_id_fkey
    foreign key (session_id) references public.practice_sessions(id)  -- FK NYATA
);

-- 2.5 activity_logs ---------------------------------------------------------
create table if not exists public.activity_logs (
  id          bigint generated always as identity primary key,   -- [ASUMSI] identity
  event_type  text not null,
  details     jsonb not null default '{}'::jsonb,
  session_id  uuid,
  student_id  uuid,
  created_at  timestamptz not null default now(),
  constraint activity_logs_session_id_fkey
    foreign key (session_id) references public.practice_sessions(id),  -- FK NYATA
  constraint activity_logs_student_id_fkey
    foreign key (student_id) references public.students(id)           -- FK NYATA
);

-- 2.6 user_roles (user_id = TEXT, bukan uuid; tanpa relasi di gen types) ----
create table if not exists public.user_roles (
  user_id     text not null,
  role        text not null,
  created_at  timestamptz not null default now(),
  constraint user_roles_user_role_unique unique (user_id, role)   -- [ASUMSI] belum terverifikasi
);


-- ============================================================================
-- §3  Indeks pendukung (rekomendasi; [ASUMSI] belum terverifikasi di produksi)
--     Cocok dengan pola query kode: sesi per siswa/status, hasil per sesi/level.
-- ============================================================================
create index if not exists idx_practice_sessions_student  on public.practice_sessions (student_id);
create index if not exists idx_practice_sessions_status   on public.practice_sessions (status);
create index if not exists idx_level_results_session     on public.level_results (session_id);
create index if not exists idx_level_results_sess_level  on public.level_results (session_id, level_number);
create index if not exists idx_activity_logs_session     on public.activity_logs (session_id);
create index if not exists idx_user_roles_user_id        on public.user_roles (user_id);


-- ============================================================================
-- §4  Keamanan/DCL (REKOMENDASI, bukan hasil audit). Aplikasi TIDAK pernah
--     membaca tabel dari browser (admin maupun siswa memakai Edge Function
--     dengan service role), jadi menutup akses anon/authenticated aman.
--     Rincian opsi policy ada di docs/admin-schema-recommendation.sql.
-- ============================================================================
alter table public.classes           enable row level security;
alter table public.students          enable row level security;
alter table public.practice_sessions enable row level security;
alter table public.level_results     enable row level security;
alter table public.activity_logs     enable row level security;
alter table public.user_roles        enable row level security;

revoke all on public.classes, public.students, public.practice_sessions,
              public.level_results, public.activity_logs, public.user_roles
  from anon, authenticated;

grant all on public.classes, public.students, public.practice_sessions,
             public.level_results, public.activity_logs, public.user_roles
  to service_role;


-- ============================================================================
-- §5  RPC register_sinova_student  [REKONSTRUKSI]
--     Body asli tidak tersedia. Implementasi ini dibuat agar sesuai dengan
--     kontrak yang diharapkan `student-register/index.ts`:
--       - sukses  → mengembalikan baris siswa (Json dengan `id`, dst) → 201
--       - duplikat (kelas+absen sama) → unique_violation 23505 → fungsi
--         menempuh jalur "sudah terdaftar" (verifikasi nama lalu token ulang)
--       - validasi gagal → exception dengan pesan yang dipetakan ke 400
--     Fungsi dijalankan Edge Function memakai SERVICE ROLE (bypass RLS).
--     SECURITY DEFINER + search_path dikunci.
-- ============================================================================
create or replace function public.register_sinova_student(
  p_full_name text,
  p_class_name text,
  p_absence_number integer
)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_nama    text;
  v_kelas   text;
  v_kelas_id bigint;
  v_siswa   public.students;
begin
  v_nama  := btrim(coalesce(p_full_name, ''));
  v_kelas := upper(btrim(coalesce(p_class_name, '')));

  if char_length(v_nama) < 2 or char_length(v_nama) > 100 then
    raise exception 'Nama harus terdiri dari 2–100 karakter.';
  end if;

  if v_kelas not in ('X TKJ 1', 'X TKJ 2', 'X TKJ 3') then
    raise exception 'Kelas tidak valid.';
  end if;

  if p_absence_number is null
     or p_absence_number < 1
     or p_absence_number > 1000 then
    raise exception 'Nomor absen harus berupa bilangan bulat positif.';
  end if;

  -- Cari kelas berdasarkan NAMA (sesuai kode); buat bila belum ada.
  select id into v_kelas_id from public.classes where class_name = v_kelas;
  if v_kelas_id is null then
    insert into public.classes (class_name)
    values (v_kelas)
    returning id into v_kelas_id;
  end if;

  -- Duplikat (kelas, absen) memunculkan unique_violation (23505) secara alami,
  -- sehingga ditangani oleh `student-register` sebagai "sudah terdaftar".
  insert into public.students (full_name, class_id, absence_number)
  values (v_nama, v_kelas_id, p_absence_number)
  returning * into v_siswa;

  return to_json(v_siswa);
end;
$$;

-- Eksekusi hanya oleh pemanggil tepercaya (service role / pemilik).
revoke all on function public.register_sinova_student(text, text, integer) from public;
grant execute on function public.register_sinova_student(text, text, integer) to service_role;


-- ============================================================================
-- §6  Seed kelas (DATA SINTETIS — bukan data produksi). Opsional tetapi
--     diperlukan agar alur pendaftaran siswa dapat diuji. Tiga nama kelas
--     sama persis dengan allowlist di student-register/index.ts.
-- ============================================================================
insert into public.classes (class_name)
values ('X TKJ 1'), ('X TKJ 2'), ('X TKJ 3')
on conflict (class_name) do nothing;


-- ============================================================================
-- §6b  Akun admin pengujian — JANGAN dijalankan otomatis.
--      Buat pengguna lewat Dashboard → Authentication → Add user, lalu ambil
--      UUID-nya dan jalankan (pada STAGING saja):
--
--        insert into public.user_roles (user_id, role)
--        values ('<UUID_ADMIN_STAGING>', 'admin')
--        on conflict (user_id, role) do nothing;
--
--      (Catatan: `user_roles.user_id` bertipe TEXT — isikan UUID sebagai teks.)
-- ============================================================================


-- ============================================================================
-- §7  Verifikasi pasca-init (READ-ONLY). Bandingkan dengan kolom pada header.
-- ============================================================================
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in ('students','classes','practice_sessions','level_results',
                     'activity_logs','user_roles')
order by table_name, ordinal_position;

select t.relname as tabel, c.conname, c.contype,
       pg_get_constraintdef(c.oid) as definisi
from pg_constraint c
join pg_class t on t.oid = c.conrelid
join pg_namespace n on n.oid = t.relnamespace
where n.nspname = 'public'
  and t.relname in ('students','classes','practice_sessions','level_results',
                    'activity_logs','user_roles')
order by t.relname, c.contype, c.conname;

select proname, pg_get_function_identity_arguments(oid) as args,
       prosecdef as security_definer
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and proname = 'register_sinova_student';
