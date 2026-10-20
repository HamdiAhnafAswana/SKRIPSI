# SINOVA — Rancangan Autentikasi & Otorisasi Admin (Fase 8)

> Status: **rancangan lokal**. Tidak ada perubahan pada Supabase produksi.
> Tidak ada migrasi/RLS/policy/secret yang dijalankan. Dokumen ini adalah
> rekomendasi yang menunggu persetujuan pemilik proyek.

## 1. Ringkasan hasil audit

| Komponen | Kenyataan saat ini |
| --- | --- |
| `src/lib/supabase.js` | Membuat klien `@supabase/supabase-js` **hanya dengan anon/publishable key**. Tidak ada `persistSession` khusus, tidak ada service-role di klien. |
| Supabase Auth | **BELUM dipakai.** Tidak ada `signIn`, `getSession`, atau `onAuthStateChange` di seluruh `src/**`. |
| Routing | **Tidak ada router.** `App.jsx` memakai state machine `stage` (`welcome`→`tutorial`→`identity`→`game`). Tidak ada halaman admin. |
| `user_roles` (generated types) | Kolom: `user_id text`, `role text`, `created_at timestamptz`. `Relationships: []` → **tidak ada relasi FK yang terekspos** ke `auth.users`. `role` bertipe `string` (bukan enum). |
| Edge Functions | `student-register`, `practice-session` — keduanya `verify_jwt = false` dan memakai service role internal. |
| Ketersediaan Auth | `@supabase/supabase-js ^2.118` sudah menjadi dependensi → `supabase.auth` tersedia tanpa menambah paket. |

**Kesimpulan audit:** keberadaan tabel `user_roles` **tidak** membuktikan ada akun
yang bisa login, dan tidak membuktikan hubunga ke `auth.users`. Fase ini membuat
fondasinya secara lokal.

## 2. Pemisahan identitas (wajib dijaga)

| Kebutuhan | Mekanisme | Penyimpanan | Tidak boleh tercampur |
| --- | --- | --- | --- |
| Bermain game sebagai siswa | Token HMAC `x-sinova-token` | `localStorage['sinova_student']` | **Bukan** identitas admin |
| Login admin | Supabase Auth (email + kata sandi) | Sesi Supabase Auth (kunci `sb-<ref>-auth-token`) | **Bukan** `sinova_student` |
| Peran admin | `user_roles` dibaca server (service role) | Hanya di server | Jangan percaya klien |
| Otorisasi data siswa | Verifikasi peran di server setiap permintaan | Server | Jangan andalkan React saja |

`src/lib/adminAuth.js` **tidak pernah** membaca/menulis `sinova_student`.
Identitas siswa (nama/kelas/nomor absen) **bukan** kredensial admin.

## 3. Mekanisme login admin

- **Metode:** email + kata sandi via **Supabase Auth** (`supabase.auth.signInWithPassword`).
- **Alasan:** dependensi sudah ada, tidak menyimpan kata sandi sendiri, token
  ditandatangani server, ada refresh & kedaluwarsa bawaan.
- **Tidak ada** kredensial bawaan di source code; admin dibuat manual oleh
  pemilik proyek (lihat §7).
- UI: `src/components/admin/AdminLogin.jsx` menangani status loading, login
  gagal (pesan seragam), dan notices. Logout lewat `signOutAdmin()`.
- Sesi kedaluwarsa: `onAuthStateChange` → validasi ulang; bila token hilang saat
  sebelumnya sudah admin, ditampilkan pesan "Sesi admin berakhir".

## 4. Verifikasi peran (server-side)

Edge Function baru: `supabase/functions/admin-check/index.ts`
(`verify_jwt = false` → validasi JWT **eksplisit**).

Alur:
1. Ambil `Authorization: Bearer <jwt>` (tanpa JWT → 401).
2. `adminClient.auth.getUser(jwt)` (service role) → server Supabase memvalidasi
   tanda tangan/kedaluwarsa (→ 401 bila gagal). **Tidak** mendekode klaim sendiri.
3. `user_id` diambil dari hasil validasi (bukan body/query).
4. `select role from user_roles where user_id = <uid>` (service role = sumber tepercaya).
5. Bila peran tidak memuat `admin` → 403.
6. Sukses → `{ ok: true, user: { id, email }, role: "admin" }` (tanpa data siswa).

Yang **sengaja tidak** dilakukan:
- Tidak membaca `user_id`/`role` dari body — body diabaikan sepenuhnya.
- Tidak memakai `raw_user_meta_data`/`user_metadata` (bisa diubah pengguna).
- Tidak mengandalkan pemeriksaan peran di React sebagai satu-satunya lapisan.

Kontrak klien (`src/lib/adminAuth.js`): status = `ok` **hanya bila** server
mengembalikan `ok===true` **dan** `role==='admin'`. 401 → `signed_out`,
403 → `no_role`, tanpa respons HTTP → `network` (bukan sukses).

## 5. Rancangan akses database (rekomendasi, BELUM dijalankan)

### 5.1 Status verifikasi yang jujur

| Hal | Status |
| --- | --- |
| RLS aktif/tidak pada 6 tabel | **BELUM TERVERIFIKASI** |
| Policy yang ada sekarang | **BELUM TERVERIFIKASI** |
| `user_roles.user_id` → `auth.users.id` (FK) | **BELUM TERVERIFIKASI** (generated types: `Relationships: []`) |
| Domain nilai `user_roles.role` | **BELUM TERVERIFIKASI** (bertipe `string`) |
| Apakah ada akun admin | **TIDAK DIKETAHUI** (tidak ada yang dibuat/diubah) |

Jalankan **SELECT audit** (aman, read-only) pada `docs/admin-schema-recommendation.sql`
§0 sebelum menerapkan apa pun.

### 5.2 Prinsip policy yang direkomendasikan

1. **`user_roles`** — jangan pernah diekspos ke klien. Tidak ada policy untuk
   `anon`/`authenticated`; hanya service role (Edge Function) yang membacanya.
   Ini mencegah pengguna mendaur-ulang perannya sendiri.
2. **Data siswa** (`students`, `classes`, `practice_sessions`, `level_results`,
   `activity_logs`) — dua opsi:
   - **Opsi A (utama, direkomendasikan):** akses admin lewat Edge Function
     (service role) yang lebih dulu memanggil logika setara `admin-check`.
     Tabel tetap tertutup untuk klien → paling aman dan paling mudah diaudit.
   - **Opsi B (defense-in-depth):** policy `SELECT` langsung dari klien memakai
     fungsi `public.is_admin()` (`SECURITY DEFINER` yang membaca `user_roles`).
     Hanya bila dashboard memang perlu query langsung. Tetap **tidak** memberi
     `INSERT/UPDATE/DELETE` ke admin pada fase ini.
3. **Siswa yang sedang bermain** tetap memakai token HMAC lewat Edge Function —
   tidak berubah. Jangan tambahkan policy yang membuka data siswa ke `anon`.
4. **Jangan** memakai klaim `user_metadata` untuk otorisasi.

### 5.3 Pemetaan tabel

| Tabel | anon | authenticated (siswa) | authenticated (admin) | service role |
| --- | --- | --- | --- | --- |
| `user_roles` | tolak | tolak | tolak (dibaca hanya di server) | baca |
| `classes` | tolak | tolak | baca (via server/Opsi B) | baca/tulis |
| `students` | tolak | tolak | baca | baca/tulis |
| `practice_sessions` | tolak | tolak | baca | baca/tulis |
| `level_results` | tolak | tolak | baca | baca/tulis |
| `activity_logs` | tolak | tolak | baca | baca/tulis |

## 6. Risiko & blocker yang tersisa

- **Belum ada E2E Supabase nyata** (Docker/lokal tidak tersedia). Semua uji
  memakai mock. Perilaku nyata `auth.getUser`, RLS, dan CORS belum diuji.
- **Hubungan `user_roles.user_id` → `auth.users.id` belum terverifikasi.** Tanpa
  FK, baris `user_roles` bisa menunjuk ke pengguna yang tidak ada.
- **Domain `role` belum terverifikasi.** Fungsi memakai allowlist sempit `["admin"]`.
- **CORS** fungsi admin belum diuji di produksi (`Admin` header `authorization`
  sudah termasuk di `corsHeaders` lokal; perlu verifikasi pasca-deploy).
- **Belum ada akun admin** dan belum ada cara membuatnya (lihat §7).
- **Klaim deployment drift:** kode `admin-check` belum dideploy; produksi belum
  memiliki fungsi ini.

## 7. Rekomendasi langkah (menunggu persetujuan)

1. Jalankan SELECT audit (`docs/admin-schema-recommendation.sql` §0) untuk
   memastikan FK, domain `role`, dan RLS.
2. Buat akun admin **secara manual** lewat Dashboard Supabase (Auth → Add user),
   lalu tambahkan baris `user_roles(user_id = <uid>, role = 'admin')` lewat SQL
   Editor **atas persetujuan**. Jangan simpan kata sandi di repo.
3. Terapkan rekomendasi SQL (§1 berkas `.sql`) setelah audit — **belum dijalankan**.
4. Deploy `admin-check` (menunggu persetujuan), lalu verifikasi CORS + smoke di
   lingkungan lokal/browser.
5. Lanjut Fase 9: dashboard data siswa melalui Edge Function ber-otorisasi server.

## 8. Berkas terkait

- Klien: `src/lib/adminAuth.js`, `src/admin/adminAccess.js`, `src/admin/AdminApp.jsx`,
  `src/admin/admin.css`, `src/components/admin/*.jsx`, `src/main.jsx` (rute `#/admin`).
- Server: `supabase/functions/admin-check/index.ts`, `.../deno.json`,
  `supabase/config.toml`.
- SQL: `docs/admin-schema-recommendation.sql` (SELECT audit + mutasi, **belum dijalankan**).
