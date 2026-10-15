# Aset Visual SINOVA

Folder ini menampung aset visual baru untuk branding **SINOVA**
(*Simulation Interactive Network Virtual Academy*).

Semua aset di sini **hanya untuk tampilan** (logo, avatar pemandu, ikon UI).
Aset simulasi gameplay (kabel, alat, ruangan) tetap berasal dari engine canvas
di `public/game/` dan **tidak boleh diubah**.

## Gaya (style guide)

- **Tema:** 3D educational technology
- **Suasana:** laboratorium jaringan SMK modern
- **Palet:** dark blue cyber
  - Latar gelap: `#070f1a` / `#0b1626`
  - Panel: `#182a40` / `#1e3a5f`
  - Aksen: `#38bdf8` (cyan) / `#7dd3fc` (cyan terang)
  - Teks: `#eaf2fb`
- **Bentuk:** sudut membulat, glow lembut, garis bersih

## Berkas

| Berkas | Fungsi |
| --- | --- |
| `logo.svg` | Logo/ikon SINOVA (motif node jaringan) |
| `andi.svg` | Karakter Andi versi ilustrasi untuk overlay tutorial |

## Catatan penggantian (jika ingin render 3D asli)

Aset SVG ini sudah cukup untuk dijalankan offline. Bila ingin mengganti dengan
render 3D, gunakan berkas dengan nama sama (`logo.svg`, `andi.svg`) atau ubah
impor di `src/components/AndiAvatar.jsx` dan `SinovaWelcome.jsx`.

Prompt contoh untuk pembuatan aset 3D:

> "3D educational technology illustration, modern SMK networking laboratory,
> dark blue cyber theme, cyan accents, friendly Indonesian male technician
> character wearing a cap and safety vest, holding a crimping tool, soft rim
> light, clean background."
