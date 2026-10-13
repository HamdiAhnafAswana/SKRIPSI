# NetCrimp — Simulasi Instalasi & Pengkabelan Jaringan

Game edukasi instalasi & pengkabelan jaringan untuk siswa SMK TKJ.
Dibangun dengan React + Vite, mesin game berbasis Canvas 2D.

## Cara Menjalankan

```bash
# Development server (hot reload)
npm run dev

# Build produksi ke dist/
npm run build

# Preview hasil build
npm run preview

# Jalankan semua tes pengujian
npm test
```

## Struktur Proyek

```
NetCrimp/
├── index.html              # Entry point Vite (memuat React + game engine)
├── package.json            # Dependensi & skrip
├── vite.config.js          # Konfigurasi Vite
├── public/
│   └── game/               # File-file game engine (static assets)
│       ├── core/           # Mesin game inti
│       ├── levels/         # Logika Level 1-5
│       └── ui/             # Scene UI (menu, level select, dll)
├── src/
│   ├── main.jsx            # Entry point React
│   ├── App.jsx             # Komponen utama (memuat canvas + game engine)
│   └── styles/             # CSS global
├── tools/                  # Alat bantu pengujian & pengembangan
│   ├── game-loader.mjs     # Helper merakit game dari public/game/
│   ├── verify.mjs          # Verifikasi integritas kode
│   ├── smoke.mjs           # Uji jalur otomatis (headless)
│   ├── play2.mjs           # Uji interaksi Level 2
│   ├── play3.mjs           # Uji interaksi Level 3
│   ├── play4net.mjs        # Uji interaksi Level 4 (jaringan lab)
│   ├── play4.mjs           # Uji interaksi Level 4 (patch panel)
│   ├── play5.mjs           # Uji interaksi Level 5 (rack server)
│   ├── probe-geom.mjs      # Uji geometri kabel Level 2
│   └── shot4.mjs           # Tangkapan layar Level 4 (Chrome headless)
└── backup/                 # Versi monolit lama (referensi)
```

## Tingkat (Level)

| Level | Judul | Materi |
|-------|-------|--------|
| 1 | Persiapan Alat & Bahan | Alat & bahan TKJ |
| 2 | Crimping Straight-Through | Kabel straight T568A/T568B |
| 3 | Crimping Crossover | Kabel crossover T568A–T568B |
| 4 | Pakai Kabel di Jaringan Lab | Pasang kabel ke PC & switch, IP, ping, troubleshooting |
| 5 | Instalasi Rack Server | Penempatan perangkat di rack |

## Pengujian

```bash
npm test                    # Semua tes di bawah ini sekaligus
node tools/verify.mjs       # Verifikasi integritas kode & karakter
node tools/cari-asing.mjs   # Deteksi karakter asing di sumber
node tools/smoke.mjs        # Uji jalur otomatis semua level
node tools/play2.mjs        # Uji interaksi Level 2
node tools/play3.mjs        # Uji interaksi Level 3
node tools/play4net.mjs     # Uji interaksi Level 4 (jaringan lab)
node tools/play4.mjs        # Uji interaksi Level 4 (patch panel)
node tools/play5.mjs        # Uji interaksi Level 5 (rack server)
node tools/probe-geom.mjs   # Uji geometri kabel Level 2
```

## Arsitektur

Game engine menggunakan arsitektur canvas murni dengan sistem scene:
- Satu canvas 960×600 untuk seluruh game
- Scene system: `go(scene)` → `scene.draw()` / `.down()` / `.move()` / `.up()`
- Game loop: `requestAnimationFrame` di `public/game/ui/21-loop.js`
- Input: pointer events pada canvas dengan sistem tombol canvas
- State: objek `save` di localStorage

React digunakan untuk:
- Wrapper aplikasi & layout
- Build system via Vite
