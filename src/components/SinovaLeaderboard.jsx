import React, { useEffect, useState } from 'react';

// Sumber nilai: penyimpanan hasil praktik engine (netcrimp_v1) — key yang sama
// dipakai dashboard/log hasil. `save.log` menyimpan SETIAP percobaan:
//   { ts, nama, level, skor, bintang, durasi, salah, hasil: 'Lulus'|'Gagal' }
// Aturan resmi aplikasi (core/13-level-core.js): hanya hasil "Lulus" yang
// mencatat rekor (save.best) & papan skor per level. Karena itu akumulasi di
// sini memakai nilai TERBAIK per siswa per level dari hasil Lulus — sekali
// saja, tidak menjumlahkan semua percobaan. Level yang belum lulus = 0.
const LEVELS = [1, 2, 3, 4, 5];
const MAX_ROWS = 5;

function readTotals() {
  try {
    const raw = localStorage.getItem('netcrimp_v1');
    const save = raw ? JSON.parse(raw) : null;
    if (!save || !Array.isArray(save.log)) return [];

    const byName = new Map();
    for (const e of save.log) {
      if (!e) continue;
      const nama = String(e.nama || '').trim();
      if (!nama || nama === '(tanpa nama)') continue; // bukan identitas siswa
      const level = Number(e.level);
      if (!LEVELS.includes(level)) continue;
      if (e.hasil !== 'Lulus') continue; // aturan resmi: hanya hasil lulus
      const skor = Number(e.skor);
      if (!Number.isFinite(skor)) continue;

      let rec = byName.get(nama);
      if (!rec) {
        rec = { nama, best: LEVELS.map(() => 0) };
        byName.set(nama, rec);
      }
      const i = level - 1;
      if (skor > rec.best[i]) rec.best[i] = skor; // sekali per level: nilai terbaik
    }

    const rows = [...byName.values()].map((r) => ({
      nama: r.nama,
      best: r.best,
      total: r.best.reduce((a, b) => a + b, 0),
    }));
    // Urut: total tertinggi → terendah; tie-break: nilai level lebih tinggi
    // menang (Level 5 dulu), lalu nama A–Z agar urutan konsisten.
    rows.sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (a.best[i] !== b.best[i]) return b.best[i] - a.best[i];
      }
      return a.nama.localeCompare(b.nama, 'id');
    });
    return rows;
  } catch (e) {
    return []; // penyimpanan tidak tersedia — panel tampil kosong
  }
}

// Engine menandai scene aktif di <html data-sinova-mode> setiap frame
// (ui/21-loop.js): 'menu' untuk dashboard, 'level' saat bermain.
function isInMenuScene() {
  if (typeof document === 'undefined') return true;
  const mode = document.documentElement.dataset.sinovaMode;
  return mode === undefined || mode === 'menu';
}

/**
 * Panel "Papan Peringkat SINOVA" di sisi kanan dashboard:
 * peringkat siswa berdasarkan akumulasi nilai Level 1–5.
 * Hanya dirender saat scene menu aktif (tidak menutupi gameplay level).
 */
export default function SinovaLeaderboard() {
  const [rows, setRows] = useState(readTotals);
  const [inMenu, setInMenu] = useState(isInMenuScene);

  useEffect(() => {
    const tick = () => {
      setRows(readTotals());
      setInMenu(isInMenuScene());
    };
    tick();
    const id = setInterval(tick, 1000); // engine persist() sendiri setelah praktik
    window.addEventListener('focus', tick);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', tick);
    };
  }, []);

  if (!inMenu) return null;

  return (
    <aside className="lb-panel" aria-label="Papan Peringkat SINOVA — akumulasi nilai Level 1 sampai 5">
      <h2 className="lb-title">{'🏆'} Papan Peringkat SINOVA</h2>
      <p className="lb-sub">Akumulasi nilai Level 1–5</p>
      {rows.length ? (
        <ol className="lb-list">
          {rows.slice(0, MAX_ROWS).map((r, i) => (
            <li
              key={r.nama}
              className={`lb-row${i < 3 ? ` lb-top lb-top-${i + 1}` : ''}`}
            >
              <span className="lb-rank">{i + 1}</span>
              <span className="lb-name" title={`${r.nama} — total ${r.total}`}>{r.nama}</span>
              <span className="lb-total">{r.total}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="lb-empty">Belum ada nilai praktik tersimpan.</p>
      )}
    </aside>
  );
}
