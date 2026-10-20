# SINOVA — Paket Setup & Integrasi STAGING

> **STATUS: STAGING BELUM TERSEDIA.** Dokumen ini adalah paket siap-pakai.
> Semua pekerjaan **lokal** sudah selesai; yang tersisa hanyalah tindakan
> eksternal milik pemilik proyek (membuat proyek staging + mengisi konfigurasi).
> **Tidak ada** deployment, pembuatan akun/role, atau SQL mutasi yang dijalankan.

Berkas paket ini:

| Berkas | Fungsi |
| --- | --- |
| `docs/staging-init.sql` | SQL inisialisasi skema staging (+ RPC + RLS + seed kelas) — **belum dijalankan** |
| `tools/deploy-staging.mjs` | Helper deploy berpenjaga (menolak target kosong/sama dengan produksi; default dry-run) |
| `.env.staging.example` | Template env frontend staging (tanpa rahasia) |
| `docs/staging-setup.md` | Dokumen ini (runbook) |

---

## 0. Fakta lingkungan (terverifikasi, Fase 11B/11C)

| Hal | Kenyataan |
| --- | --- |
| Proyek tertaut | `rezraqimsvtwhhmxygad` = **PRODUKSI** (`supabase/.temp/project-ref`) |
| Staging/lokal | **TIDAK ADA** |
| `supabase/migrations/`, `seed.sql` | **tidak ada** → skema direkonstruksi di `docs/staging-init.sql` |
| Docker / `psql` / Supabase CLI | tidak terpasang (hanya `npx`) |
| Kredensial (`SUPABASE_ACCESS_TOKEN`, dll.) | **ABSENT** |
| `src/` membaca tabel langsung | **tidak** (semua akses lewat Edge Function) |
| Service-role key di bundel frontend | **tidak ada** |

---

## 1. Yang harus diisi/disediakan pemilik

| Nama | Jenis | Nilai | Ditaruh di |
| --- | --- | --- | --- |
| Proyek Supabase **staging baru** | wajib | ref 20 char | Dashboard Supabase |
| `SINOVA_STAGING_REF` | config | ref staging | env shell (untuk skrip deploy) |
| `VITE_SUPABASE_URL` | publik | `https://<ref-staging>.supabase.co` | `.env.staging` |
| `VITE_SUPABASE_ANON_KEY` | publik | anon key staging | `.env.staging` |
| `VITE_SINOVA_ADMIN_API` | publik | `live` | `.env.staging` |
| `PRACTICE_SESSION_TOKEN_SECRET` | **SECRET** | ≥16 char acak | `supabase secrets set` |
| `SINOVA_ALLOWED_ORIGINS` | config | origin uji, mis. `http://localhost:5173` | `supabase secrets set` |
| `TOKEN_REQUIRED` | config | **biarkan UNSET** (jangan `false`) | — |
| `SUPABASE_ACCESS_TOKEN` | **SECRET** | token CLI | env shell / `supabase login` (JANGAN commit) |

> `SUPABASE_URL` & `SUPABASE_SERVICE_ROLE_KEY` disediakan otomatis oleh platform
> Edge Function — **jangan** ditulis manual ke source/`.env` frontend.

---

## 2. Membuat proyek staging (langkah manual minimum)

### Opsi A — Supabase Cloud (disarankan)
1. Dashboard Supabase → **New project** → nama mis. `sinova-staging`.
   **JANGAN** memakai/mengubah `rezraqimsvtwhhmxygad` (produksi).
2. Catat **ref** dan **URL**-nya.
3. Di mesin lokal: `npx supabase@latest login` (atau set env `SUPABASE_ACCESS_TOKEN`).
4. `npx supabase@latest link --project-ref <ref-staging>`

### Opsi B — Supabase lokal (tanpa cloud)
1. Pasang Docker Desktop.
2. `npx supabase@latest start` → `npx supabase@latest db reset`.
   Namun `supabase/migrations/` kosong, jadi jalankan `docs/staging-init.sql`
> sendiri lewat `psql`/Studio lokal.

> Jangan menyalin data siswa produksi ke staging.

---

## 3. Skema database staging

Jalankan **seluruh** `docs/staging-init.sql` di SQL Editor proyek **STAGING**
(bukan produksi). Berkas itu:
- membuat tabel `classes`, `students`, `practice_sessions`, `level_results`,
  `activity_logs`, `user_roles` dengan kolom/tipe sesuai hasil `gen types`;
- memasang FK nyata + constraint yang [ASUMSI] (ditandai di berkas);
- mengaktifkan RLS + menutup akses `anon`/`authenticated`;
- membuat RPC `register_sinova_student` (rekonstruksi);
- menambah 3 kelas seed (`X TKJ 1/2/3`) — data sintetis, bukan produksi.

Tidak ada migrasi otomatis. Tidak dijalankan oleh skrip apa pun.

---

## 3b. Akun admin pengujian

1. Dashboard staging → Authentication → **Add user** (email + sandi admin uji).
   Tidak ada kredensial default di source.
2. Ambil UUID user, lalu (SQL mutasi — **butuh persetujuan**, staging saja):
   ```sql
   insert into public.user_roles (user_id, role)
   values ('<UUID_ADMIN_STAGING>', 'admin')
   on conflict (user_id, role) do nothing;
   ```
   (`user_roles.user_id` bertipe **TEXT** — isikan UUID sebagai teks.)
3. Peran **selalu** diputuskan server-side oleh `admin-check` (bukan frontend).

---

## 4. Deploy Edge Function (berurutan)

Urutan & dependensi:

| Urutan | Fungsi | Dependensi `_shared` (ter-bundel otomatis) |
| --- | --- | --- |
| 1 | `student-register` | `sinova-token.ts` |
| 2 | `practice-session` | `sinova-token.ts` |
| 3 | `admin-check` | `sinova-cors.ts` |
| 4 | `admin-data` | `sinova-admin-view.ts`, `sinova-cors.ts` |

Perintah (penjaga menolak target kosong atau = produksi):

```bash
# 1) Rencana (aman, tidak mengubah apa pun):
node tools/deploy-staging.mjs --ref <ref-staging>

# 2) Eksekusi (BUTUH PERSETUJUAN EKSPLISIT):
node tools/deploy-staging.mjs --ref <ref-staging> --run

# Bila hanya admin:
node tools/deploy-staging.mjs --ref <ref-staging> --only admin-check,admin-data --run
```

Setel secret lebih dulu (nilai TIDAK dicetak/ditulis di source):

- **Cara 1 (disarankan):** Dashboard staging → Project Settings → Edge
  Functions → **Secrets** → tambahkan `PRACTICE_SESSION_TOKEN_SECRET` dan
  `SINOVA_ALLOWED_ORIGINS`. Nilai diketik langsung di dashboard.
- **Cara 2 (CLI), bila sudah `supabase login`:**

  ```bash
  npx supabase@latest secrets set --project-ref <ref-staging> \
    PRACTICE_SESSION_TOKEN_SECRET SINOVA_ALLOWED_ORIGINS
  # CLI akan meminta nilai secara interaktif — jangan menempel rahasia ke
  # berkas yang mungkin ikut ter-commit.
  ```

> Jangan menyimpan berkas rahasia di repositori.

---

## 5. CORS staging

- Set `SINOVA_ALLOWED_ORIGINS` (secret/env Edge Function) ke **origin pengujian
  saja**, mis. `http://localhost:5173,https://<domain-staging>`.
- Bila env **tidak** diset → CORS `*` (perilaku lama). Karena itu, di staging
  **wajib** diset agar tidak terbuka.
- Implementasi: `supabase/functions/_shared/sinova-cors.ts` (dipakai
  `admin-check` & `admin-data`).
- **Produksi tidak diubah**: pembatasan hanya berlaku pada lingkungan yang
  menyetel env tersebut.

---

## 6. Konfigurasi frontend LIVE

1. Salin `.env.staging.example` → `.env.staging` (berkas ini **ter-ignore** Git).
2. Isi `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` milik staging dan
   `VITE_SINOVA_ADMIN_API=live`.
3. JANGAN menaruh service-role key / secret server di `VITE_*` (ter-embed ke bundel).
4. Default lokal/produksi tetap **DEMO** (tanpa `VITE_SINOVA_ADMIN_API`).

---

## 7. Menjalankan aplikasi

```bash
# Lokal + staging backend (mode staging → memuat .env.staging):
npx vite --mode staging

# Build staging:
npx vite build --mode staging

# Pratinjau build:
npx vite preview
```

Navigasi dashboard admin: rute `#/admin` (login lewat Supabase Auth staging).

---

## 8. Verifikasi staging (checklist)

Autentikasi/otorisasi:
- tanpa token → **401**; JWT rusak/kedaluwarsa → **401**; login tanpa role → **403**;
  admin sah → **200**; sesi kedaluwarsa di UI → state "sesi berakhir" (bukan DEMO).

Lima aksi `admin-data` (POST, `{ "action": ... }`):
- `summary`, `students` (cari/filter/pagination), `student` (id tak ada → 404),
  `sessions` (urut waktu/filter kelas), `classes`.

Dashboard LIVE:
- Ringkasan/Siswa/Detail/Pemantauan Sesi terisi; pencarian, filter, pagination,
  kosong, loading, error, akses ditolak; **tidak** ada fallback DEMO saat gagal;
  label DEMO tidak muncul untuk data LIVE; **tidak** ada request browser langsung
  ke tabel Supabase (semua lewat Edge Function).

CORS/keamanan:
- preflight dari origin diizinkan → ACAO origin tsb + `Vary: Origin`; origin lain
  → tanpa ACAO. Tidak ada service-role key/secret di bundel; error internal tidak
  membocorkan detail DB; aksi tetap read-only; `scanLimited` tampil bila terbatas.

Contoh preflight (ganti `<URL>`):

```bash
curl -i -X OPTIONS "<URL>/functions/v1/admin-data" \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: authorization,content-type"
```

---

## 9. Rollback staging

- Hapus/desaktifkan fungsi staging; hapus akun admin uji; kosongkan
  `user_roles` staging; hapus `SINOVA_ALLOWED_ORIGINS` bila perlu.
- Frontend staging: hapus `VITE_SINOVA_ADMIN_API` (kembali DEMO).

---

## 10. Batas keamanan (dipegang)

- Dilarang menyentuh produksi; dilarang SQL mutasi/DDL/RLS/policy/grant tanpa
  persetujuan terpisah.
- Dilarang menulis/menyalin data siswa produksi ke staging.
- Dilarang membuat akun/role atau deploy tanpa persetujuan eksplisit.
- Jangan mencetak/menyimpan secret, password, JWT, atau key.
- DEMO tetap default lokal; LIVE tidak pernah diam-diam jatuh ke DEMO.

---

## 10b. Blocker eksternal (tidak dapat diatasi lokal)

1. Pembuatan proyek Supabase staging + `SUPABASE_ACCESS_TOKEN`.
2. Penyetelan secret server staging.
3. Pembuatan akun admin staging + baris `user_roles`.
4. Persetujuan deployment (skrip `tools/deploy-staging.mjs`).
