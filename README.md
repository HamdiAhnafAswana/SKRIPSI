# NetCrimp — cara kerja project

Game ini **sudah dipecah per level** supaya mudah di-update, tapi **tetap dijalankan
sebagai satu file HTML**.

```
index.html            <-- INI YANG DIPLAY. Hasil build, jangan diedit langsung.
                         Buka dengan klik ganda. Bisa dikirim ke siswa apa adanya.

build.bat / build.mjs   <-- penggabung src/ -> index.html
src/
  template.html             kerangka HTML (CSS, <head>, <body>)
  core/                     infrastruktur bersama semua level
  levels/                   SATU FILE PER LEVEL  <-- focus update di sini
  ui/                       menu, daftar level, cara bermain, log hasil, loop
tools/                   alat bantu (verify, smoke test, splitter asli)
backup/                  netcrimp2.ORI.html = versi monolit sebelum dipecah
```

---

## Alur kerja (cukup 3 langkah)

1. Edit file yang mau diubah di `src/` — biasanya di `src/levels/`.
2. Klik dua kali **`build.bat`** (atau jalankan `node build.mjs`).
3. Buka `index.html` untuk mencoba.

Kalau `build.bat` complaining "Node.js tidak ditemukan", unduh Node.js dari
nodejs.org lalu install sekali saja.

---

## Isi tiap folder

### `src/core/` — jangan diedit kecuali memang(kernel game)

| File | Isi |
|---|---|
| `00-registry.js` | **daftar level**. Tiap file level mendaftarkan dirinya di sini lewat `registerLevel()` |
| `01-init.js` | ukuran kanvas, font, palet warna |
| `02-storage.js` | localStorage: bintang, skor terbaik, log, nama siswa |
| `03-audio.js` | efek suara (Web Audio, tanpa file eksternal) |
| `04-three.js` | pemuat Three.js dari CDN + deteksi WebGL |
| `05-canvas.js` | helper gambar: teks, paragraf, kotak, ikon bintang/gembok |
| `06-input.js` | mouse/sentuh + tombol |
| `07-draw.js` | latar, ikon umum |
| `08-wire-colors.js` | warna kabel, standar T568A/T568B, gambar kawat |
| `09-tool-icons.js` | gambar 13 alat (crimping tool, tester, stripper, ...) |
| `10-sprites.js` | cache sprite alat |
| `11-room-lemari.js` | gambar ruangan & lemari (dipakai Level 1) |
| `12-andi.js` | karakter Pak Andi (dipakai Level 1) |
| `13-level-core.js` | `baseLevel()`, HUD, kuis, `endLevel()`, layar hasil |

### `src/levels/` — ini yang paling sering diedit

| File | Level |
|---|---|
| `level1-alat.js` | Level 1 — Persiapan Alat & Bahan (studi kasus) |
| `level2-kabel-3d.js` | Level 2 — Crimping Straight-Through (Three.js) |
| `level3-crossover.js` | Level 3 — Crimping Crossover T568A–T568B |
| `level4-patch-panel.js` | Level 4 — Pasang ke Patch Panel |
| `level5-rack.js` | Level 5 — Instalasi Rack Server |

Masing-masing file **mandiri**: berisi data, logika, dan gambar level tersebut.
Tidak ada kode level 2 yang bocor ke file level 3, jadi aman diedit sendiri.

### `src/ui/`

| File | Isi |
|---|---|
| `20-scenes.js` | menu utama, kartu pilih level, cara bermain, log hasil + ekspor CSV |
| `21-loop.js` | game loop (`requestAnimationFrame`) |

---

## Menambah Level 6 (tanpa menyentuh core & UI)

1. Salin `src/levels/level5-rack.js` jadi `src/levels/level6-nama.js`.
2. Ubah `function makeL5()` jadi `function makeL6()`.
3. Ganti `baseLevel(5, ...)` jadi `baseLevel(6, ...)`.
4. Ganti blok paling bawah jadi:

```js
registerLevel(6, {
    t:    'Judul Level 6',
    m:    'Deskripsi singkat di kartu',
    desc: 'Penjelasan panjang di menu Cara Bermain',
    mk:   makeL6
});
```

5. `node build.mjs`

Selesai. Kartu level, urutan, bintang, log, dan batas "semua level selesai"
ikut menyesuaikan karena semuanya membaca dari registry.

> Level sebaiknya bernomor berurutan (1, 2, 3, ...) agar kartu tersusun rapi.
> Kalau nomor meloncat, level yang nomornya tidak ada akan dilewati saja.

## Menghapus Level 4

Hapus `src/levels/level4-patch-panel.js` lalu `node build.mjs`.
Registry ikut menyesuaikan. Data lama di localStorage siswa tetap aman
(tidak dihapus, cuma tidak tampil lagi).

---

## Pemeriksaan otomatis

```
node tools/verify.mjs   -> cek sintaks, registry, dan pastikan tidak ada baris
                           kode lama yang hilang tanpa sengaja
node tools/smoke.mjs    -> menjalankan game sungguhan di Node (stub DOM),
                           lalu membandingkan hasilnya dengan backup/
                           netcrimp2.ORI.html. Hasilnya harus "PERILAKU IDENTIK".
```

`tools/split-from-single-file.mjs` hanya dipakai **sekali** waktu pemecahan
tadi. Tidak perlu dijalankan lagi.

---

## Catatan penting

- **`index.html` di root adalah hasil build.** Edit di `src/`, bukan di sana,
  karena perubahan langsung akan hilang saat build berikutnya.
- **Jangan pakai Notepad bawaan Windows untuk `src/*.js`** — Notepad itu
  menyimpan dengan encoding ANSI dan bisa merusak karakter seperti `→`, `•`,
  `★`, `–`. Pakai **VS Code** (gratis) atau **Notepad++**. Kalau karakter sudah
  rusak, `node tools/verify.mjs` akan memberi tahu.
- Progres siswa (bintang, skor, log) disimpan di localStorage browser masing-masing,
  jadi tetap bekerja seperti sebelumnya.