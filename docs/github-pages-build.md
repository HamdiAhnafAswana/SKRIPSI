# SINOVA — Konfigurasi Build GitHub Pages (memperbaiki halaman kosong)

> Dokumen ini menjelaskan **akar masalah halaman kosong** pada publikasi
> GitHub Pages dan cara aman memperbaikinya. Tidak ada deployment Supabase,
> SQL mutasi, perubahan role, atau pengaturan secret produksi di sini.

## 1. Akar masalah

`src/lib/supabase.js` (sebelum perbaikan) **melempar error saat modul diimpor**
bila variabel berikut tidak tersedia:

- `VITE_SUPABASE_URL` — URL proyek Supabase (publik)
- `VITE_SUPABASE_ANON_KEY` — anon/publishable key (publik)

Variabel ini hanya ada di `.env` **lokal**, dan `.env*` **diabaikan Git**.
Workflow GitHub Actions (`.github/workflows/deploy.yml`) menjalankan
`npm run build` **tanpa** variabel tersebut, sehingga Vite menyubstitusi
keduanya menjadi `undefined`:

```js
const G0 = void 0, J0 = void 0;   // VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
throw new Error("Konfigurasi Supabase belum lengkap. Periksa file .env.");
```

Karena error dilempar di **level atas modul** (saat React belum sempat
render), seluruh bundel gagal dan muncul **halaman kosong**.

## 2. Perbaikan

### a. Build publik diberi variabel (nilai PUBLIK, bukan secret server)

`.github/workflows/deploy.yml` kini membaca **Repository Variables**:

```yaml
- name: Build (Vite)
  run: npm run build
  env:
    VITE_SUPABASE_URL:      ${{ vars.VITE_SUPABASE_URL }}
    VITE_SUPABASE_ANON_KEY: ${{ vars.VITE_SUPABASE_ANON_KEY }}
    VITE_SINOVA_ADMIN_API:  ${{ vars.VITE_SINOVA_ADMIN_API }}   # opsional
```

Ada langkah **"Cek variabel build wajib"** yang menggagalkan build bila
variabel belum diset — supaya tidak menerbitkan build tanpa konfigurasi lagi.

### b. Aplikasi tidak lagi "mati senyap"

`src/lib/supabase.js` tidak lagi melempar error saat diimpor. Bila konfigurasi
hilang:

- `supabase` bernilai `null`,
- `isSupabaseConfigured` bernilai `false`,
- `supabaseMissingVars` berisi **nama** variabel yang hilang (bukan nilainya).

`src/main.jsx` menampilkan komponen `src/components/SinovaConfigError.jsx`
(pesan jelas: "Aplikasi belum dikonfigurasi") alih-alih halaman kosong.
Konsumen (`practiceSession.js`, `adminAuth.js`) diberi penjaga agar
mengembalikan status kegagalan terarah, bukan crash.

## 3. Cara menyetel Repository Variables (dilakukan pemilik proyek)

1. Buka repo → **Settings** → **Secrets and variables** → **Actions**.
2. Pilih tab **Variables** (BUKAN Secrets).
3. Tambahkan:
   | Name | Contoh nilai | Sifat |
   | --- | --- | --- |
   | `VITE_SUPABASE_URL` | `https://<ref>.supabase.co` | publik |
   | `VITE_SUPABASE_ANON_KEY` | `<anon/publishable key>` | publik |
   | `VITE_SINOVA_ADMIN_API` | `live` (opsional) | publik |
4. Jalankan ulang workflow (push ke `main` atau **Run workflow**).

> **JANGAN** menaruh `SUPABASE_SERVICE_ROLE_KEY`, access/refresh token, atau
> secret server apa pun di sini — semua `VITE_*` terbaca dari browser.

## 4. Keamanan

- URL proyek dan anon/publishable key **memang publik** dan sudah ada di bundel
  frontend. Keduanya hanya *mengidentifikasi* proyek, bukan memberi wewenang.
- Akses data tetap dilindungi **autentikasi + otorisasi server/database**
  (Supabase RLS, Edge Function). Jangan pernah mengandalkan anon key sebagai
  batas keamanan.
- Verifikasi bahwa tabel tidak terbuka untuk `anon` tanpa RLS (lihat
  `docs/admin-db-audit-fase11a.sql`).

## 5. Verifikasi pasca-perbaikan (lokal, terbukti)

- Build **dengan** env: aplikasi render normal, canvas ada, tanpa error.
- Build **tanpa** env (simulasi CI): menampilkan pesan "Aplikasi belum
  dikonfigurasi" + daftar nama variabel yang hilang — **bukan** halaman kosong.
- Rute `#/admin` pada build terkonfigurasi menampilkan halaman login admin.

> Klaim "perbaikan publik berhasil" HANYA boleh dibuat setelah workflow
> dijalankan ulang setelah Repository Variables diset dan URL publik diuji.
