# SINOVA — Kontrak Backend Dashboard Admin (Fase 9 usulan, Fase 10 diimplementasikan)

> Status (Fase 10): Edge Function `admin-data` **sudah dibuat secara lokal**
> (`supabase/functions/admin-data/`) dan **BELUM dideploy**. Tidak ada perubahan
> database/RLS/policy, tidak ada deploy, tidak ada akun admin produksi.
> Dashboard lokal **masih memakai data demo** (lihat §6) karena mode LIVE hanya
> aktif bila `VITE_SINOVA_ADMIN_API === 'live'` dan endpointnya belum ada di
> server manapun.

## 1. Prinsip

1. Browser **TIDAK PERNAH** mengakses tabel (`students`, `practice_sessions`,
   `level_results`, dst.) secara langsung. Semua data admin lewat Edge Function.
2. Fungsi memverifikasi JWT **eksplisit** (`verify_jwt = false`), sama seperti
   `admin-check`: `Authorization: Bearer <jwt>` → `auth.getUser(jwt)` → identitas
   dari hasil validasi (bukan body), lalu peran dibaca dari `user_roles` memakai
   **service role**. Role **tidak pernah** diambil dari body/user_metadata.
3. Service-role key hanya ada di server, **tidak pernah** di frontend.
4. 401/403/kegagalan jaringan/kegagalan server dibedakan; tidak pernah dilaporkan
   sebagai sukses. 404 hanya untuk entitas yang tidak ada.
5. Pagination & pencarian dilakukan di server (klien tidak mengunduh seluruh tabel).
6. Hanya operasi **baca** (`select`). Tidak ada insert/update/delete/rpc.
7. Tidak ada **fallback diam-diam**: bila mode LIVE gagal, respons adalah error
   (`{ok:false,code}`) — dataset DEMO tidak pernah ditampilkan sebagai data LIVE
   (lihat §6 dan `src/admin/api/adminApi.js`).

## 2. Request

`POST /functions/v1/admin-data`
Header: `Authorization: Bearer <access_token>`, `Content-Type: application/json`
Body: `{ "action": "<nama>", ...parameter }`

| `action` | Parameter | Keterangan |
| --- | --- | --- |
| `summary` | — | ringkasan dashboard |
| `students` | `q?`, `classId?`, `status?`, `page?`, `pageSize?` | daftar siswa + `meta` |
| `student` | `studentId` (wajib) | detail 1 siswa + riwayat sesi + hasil level |
| `sessions` | `status?`, `classId?`, `page?`, `pageSize?` | pemantauan sesi + `meta` |
| `classes` | — | daftar kelas (untuk filter) |

Batasan yang **sudah diterapkan** di `admin-data/index.ts` (semua tidak valid →
`400 bad_request`, tanpa pesan detail internal):

| Parameter | Aturan |
| --- | --- |
| `page` | integer `1..MAX_SAFE_INTEGER`, default `1`; nilai di luar rentang → 400 |
| `pageSize` | integer `1..100`, default `10` → 400 bila di luar rentang |
| `classId` | integer `>=1` atau string numeriknya, opsional (`""`/`null` = semua) |
| `status` (students) | salah satu `belum_mulai`/`berjalan`/`terputus`/`selesai` (status **turunan**, bukan kolom) |
| `status` (sessions) | salah satu `in_progress`/`completed`/`disconnected` |
| `q` | string, di-trim, maksimal 100 karakter |
| `studentId` | wajib, format UUID |

Halaman melebihi batas **dijepit** ke halaman terakhir (`meta.page` tetap valid),
bukan error.

## 3. Response

Sukses: `{ "ok": true, "data": <T>, "meta": {...} | null }`
Gagal : `{ "ok": false, "code": "<kode>" }` — tanpa `status` di body; status HTTP
tetap dikirim agar klien mengklasifikasikannya.

| HTTP | `code` | Kapan |
| --- | --- | --- |
| 200 | — | sukses (`ok: true`) |
| 400 | `bad_request` | parameter tidak valid |
| 401 | `unauthorized` | JWT hilang/tidak valid/kedaluwarsa |
| 403 | `forbidden` | login valid tetapi bukan admin |
| 404 | `not_found` | `studentId` tidak ada |
| 405 | `bad_request` | metode bukan POST |
| 500 | `server` | konfigurasi/kegagalan server |

Klien (adapter) memetakan: tanpa respons HTTP → `network`; `context.status` 401 →
`unauthorized`; 403 → `forbidden`; 404 → `not_found`; ≥500 → `server`; 4xx lain →
`bad_request`. Lihat `src/admin/api/adminApi.js` (`klasifikasiError`).

## 4. Bentuk data (`data`)

### 4.1 `summary`
```jsonc
{
  "totalStudents": 14,
  "totalSessions": 12,
  "completedSessions": 5,
  "activeSessions": 4,
  "disconnectedSessions": 2,
  "studentsWithProgress": 10,
  "averageProgressPercent": 57,
  "levelTotal": 5,
  "levelCompletion": [ { "level": 1, "attempted": 10, "passed": 9 } ]
}
```

### 4.2 `students` (item) — `data: [item...]`

`meta` (identik untuk `students` dan `sessions`):
```jsonc
{ "page": 1, "pageSize": 10, "total": 14, "totalPages": 2, "filtered": 14,
  "scanLimited": false }
```
- `total` = jumlah baris **setelah** filter (`filtered` sama dengan `total`;
  dipertahankan agar cocok dengan adapter mode DEMO).
- `scanLimited` = `true` bila salah satu tabel menyentuh batas pemindaian
  (`SCAN_LIMIT`), artinya agregat **mungkin belum lengkap** — bukan fallback
  diam-diam. Lihat §5a.
```jsonc
{
  "id": "<uuid>", "full_name": "...", "class_id": 1, "class_name": "X TKJ 1",
  "absence_number": 7, "created_at": "<iso>",
  "sessions_total": 2, "sessions_completed": 1,
  "levels_passed": 3, "level_total": 5, "progress_percent": 60,
  "last_activity_at": "<iso>|null",
  "status": "belum_mulai|berjalan|terputus|selesai"
}
```

### 4.3 `student` (detail)
```jsonc
{
  "student": { "id": "...", "full_name": "...", "class_id": 1,
               "class_name": "X TKJ 1", "absence_number": 7, "created_at": "<iso>" },
  "sessions": [
    {
      "id": "<uuid>", "student_id": "<uuid>", "status": "completed",
      "current_level": 5, "started_at": "<iso>", "last_seen_at": "<iso>",
      "completed_at": "<iso>|null",
      "level_results": [
        { "level_number": 1, "attempt_number": 1, "score": 92, "mistakes": 0,
          "duration_seconds": 55, "passed": true, "status": "completed",
          "started_at": "<iso>", "completed_at": "<iso>|null" }
      ]
    }
  ]
}
```

### 4.4 `sessions` (item)
```jsonc
{
  "id": "<uuid>", "student_id": "<uuid>", "student_name": "...",
  "class_id": 1, "class_name": "X TKJ 1", "absence_number": 7,
  "status": "in_progress", "current_level": 3, "level_total": 5,
  "started_at": "<iso>", "last_seen_at": "<iso>", "completed_at": "<iso>|null",
  "levels_attempted": 3, "levels_passed": 2
}
```

### 4.5 `classes`
```jsonc
[ { "id": 1, "class_name": "X TKJ 1" } ]
```

## 5. Pemetaan ke skema yang TERVERIFIKASI

| Field keluaran | Sumber (tabel.kolom) |
| --- | --- |
| `full_name`, `class_id`, `absence_number`, `created_at` | `students.*` |
| `class_name` | `classes.class_name` — **dipetakan di kode**, bukan embedded join PostgREST (lihat catatan di bawah) |
| `sessions_current/started/last_seen/completed/status` | `practice_sessions.*` |
| `level_number`, `attempt_number`, `score`, `mistakes`, `duration_seconds`, `passed`, `status`, `started_at`, `completed_at` | `level_results.*` |
| `levels_passed` | hitung `distinct level_number` dengan `passed = true` per siswa |
| `progress_percent` | `levels_passed / 5 * 100` (jumlah level = 5, dari `LEVEL_MAX`) |
| `summary.*` | agregasi dari tabel di atas (dilakukan di server) |

Kolom yang **TIDAK** dipakai (tidak ada di skema): `level_results.student_id`,
`level_results.stars`.

Kolom yang dipakai dari tabel:

```text
classes            : id, class_name
students           : id, full_name, class_id, absence_number, created_at
practice_sessions  : id, student_id, status, current_level, started_at,
                     last_seen_at, completed_at
level_results      : id, session_id, level_number, attempt_number, score,
                     mistakes, duration_seconds, passed, status,
                     started_at, completed_at
user_roles         : role   (hanya untuk pemeriksaan peran; select di server)
```

### 5a. Batas pemindaian (`SCAN_LIMIT`) — dibatasi & dilaporkan

Agregat (`summary`, `students`, `sessions`) membaca baris tabel lalu
menghitungnya di dalam fungsi, **dibatasi `SCAN_LIMIT = 20.000` baris per
tabel** (dengan `.order('id')` agar penjepitan deterministik).

Pemotongan dilaporkan **jujur**: setiap pemindaian memakai
`.select(kolom, { count: 'exact' })`, lalu `scanLimited = (rows.length < count)`.
Ini juga menangkap pemotongan yang dilakukan **server** (mis. `max_rows`
PostgREST yang bisa jauh lebih kecil dari `SCAN_LIMIT`) — jadi angka yang
mungkin belum lengkap tidak pernah disajikan seolah-olah lengkap.

- Batas ini ditambahkan agar fungsi tetap terbatas (limit `max_rows` REST juga
  tidak diandalkan), dan **jangan pernah diam-diam dianggap akurat**.
- Keputusan tindak lanjut (milik pemilik proyek): mengganti agregasi ini dengan
  RPC/agregasi SQL di sisi server bila jumlah data besar — perlu SQL mutasi,
  sehingga **tidak dikerjakan di Fase 10**.
- Tanpa relasi embedded: FK `students.class_id → classes.id` **belum
  terverifikasi**, jadi `class_name` dipetakan lewat `Map` dari tabel `classes`
  (bukan `classes:class_name`).

## 6. Data demo (kondisi saat ini)

- Default adapter = **DEMO** (`src/admin/api/defaultAdminApi.js`).
- Sumber demo: `src/admin/data/demoData.js` (label `DEMO`, nama fiktif
  "Siswa Demo NN", waktu acuan tetap `DEMO_NOW` agar deterministik).
- Mode LIVE hanya aktif bila `VITE_SINOVA_ADMIN_API === 'live'`. Adapter LIVE
  (`createLiveAdminApi`) memanggil Edge Function `admin-data` dengan header
  `Authorization: Bearer <access_token>`; fungsi itu **bukan** dataset demo.
- Bila mode LIVE gagal (401/403/404/500/jaringan), yang tampil adalah state
  error/denied — **bukan** data demo (§1.7).
- Dashboard menampilkan spanduk **DEMO** selama `api.isDemo === true`.

## 7. Yang masih BELUM TERVERIFIKASI (jangan diasumsikan)

- Domain nilai `level_results.status` (hanya diteruskan apa adanya; UI memakai
  `passed`, bukan `status`).
- Hubungan `user_roles.user_id` → `auth.users.id`.
- FK `students.class_id` → `classes.id` (karena itu tidak memakai embedded join).
- Nilai `user_roles.role` (allowlist sempit `["admin"]`, sama dengan `admin-check`).
- Status RLS/policy/grants sesungguhnya (lihat `docs/admin-auth.md` §5 dan
  `docs/admin-schema-recommendation.sql` §0 untuk SELECT audit). Catatan: karena
  `admin-data` memakai **service role** di server, ia **tidak bergantung** pada
  RLS; RLS tetap penting agar klien tidak bisa membaca tabel langsung.
- Ketersediaan `admin-check` maupun `admin-data` di produksi (keduanya belum
  dideploy).
- Perilaku nyata `SCAN_LIMIT` dan performa agregasi pada data produksi yang besar.

Audit SELECT-only tidak dapat dijalankan pada Fase 10 (tidak ada kredensial DB,
tidak ada Docker/psql di lingkungan kerja) → semua item di atas dicatat sebagai
**belum terverifikasi**, bukan "aman".

## 8. Status implementasi & pengujian (Fase 10)

| Item | Status |
| --- | --- |
| `supabase/functions/admin-data/index.ts` | dibuat (lokal) |
| `supabase/functions/admin-data/deno.json` | dibuat (lokal) |
| `supabase/functions/_shared/sinova-admin-view.ts` | dibuat — view-model murni, disamakan dengan `dashboardFormat.js` |
| `supabase/config.toml` `[functions.admin-data]` | ditambahkan (`verify_jwt = false`, hanya konfigurasi lokal) |
| Deploy fungsi | **tidak** dilakukan |
| SQL mutasi / perubahan skema | **tidak** dilakukan |
| Akun admin produksi | **tidak** dibuat |
| Uji integrasi Supabase nyata (staging/produksi) | **belum** dilakukan (tidak tersedia) |

Pengujian memakai **mock** (tanpa jaringan/DB): `test-admin-data.mts` (fungsi
Edge), `test-admin-view-parity.mts` (kesetaraan view server ↔ frontend, termasuk
fuzz 300 dataset), serta pembaruan `test-admin-api.mts` dan
`test-admin-dashboard.mts` (mode LIVE, 403, tanpa fallback DEMO, tanpa
service-role key di bundle).

Cara mengaktifkan LIVE (setelah deploy disetujui): set
`VITE_SINOVA_ADMIN_API=live` pada lingkungan **non-produksi**, pastikan CORS
produksi mengizinkan header `authorization`, lalu uji jalur 401/403. Spanduk
DEMO hilang saat `api.isDemo === false`.

## 9. Pembatasan CORS opsional (Fase 11B)

`admin-data` dan `admin-check` menormalkan header CORS lewat
`supabase/functions/_shared/sinova-cors.ts`:

- **Default aman:** bila env `SINOVA_ALLOWED_ORIGINS` tidak diset/kosong, header
  tetap `Access-Control-Allow-Origin: *` (perilaku sebelumnya — produksi yang
  belum dikonfigurasi **tidak** berubah), ditambah `Vary: Origin`.
- **Allowlist:** bila diisi (daftar dipisah koma; mendukung wildcard
  subdomain `https://*.contoh.id`), hanya origin yang cocok diberi
  `Access-Control-Allow-Origin`; origin lain tidak diberi header sehingga
  browser menolaknya. Gunakan pada **staging** dengan origin pengujian saja.
- Nilai disetel lewat mekanisme secret/env Supabase, **bukan** di source code.
- Uji: `test-sinova-cors.mts` (parser, resolusi origin, wildcard, normalisasi
  respons, dan integrasi handler `admin-data`).

Runbook staging lengkap: `docs/staging-setup.md`.
