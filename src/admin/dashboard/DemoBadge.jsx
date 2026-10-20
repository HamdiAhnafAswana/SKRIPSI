import React from 'react';

// Penanda bahwa angka/yang ditampilkan adalah DATA SIMULASI, bukan data nyata.
export function DemoBadge({ label }) {
  return (
    <span
      className="admin-demo-badge"
      title="Data simulasi (demo), bukan data siswa nyata"
    >
      {label || 'DEMO'}
    </span>
  );
}

// Spanduk peringatan mode demo. Ditampilkan selama backend produksi belum
// disetujui, supaya tidak ada yang menyangka ini data nyata.
export function DemoNotice({ label, children }) {
  return (
    <div className="admin-demo-notice" role="note">
      <DemoBadge label={label} />
      <span className="admin-demo-notice-text">
        {children || 'Moda demo: seluruh angka di halaman ini adalah data simulasi, bukan data siswa nyata.'}
      </span>
    </div>
  );
}

// Penanda mode LIVE: data berasal dari server nyata, BUKAN simulasi. Ditampilkan
// hanya bila adapter aktif bukan DEMO, agar kedua mode tidak pernah tertukar.
export function LiveBadge({ label }) {
  return (
    <span
      className="admin-live-badge"
      role="note"
      data-aksi="live-badge"
      title="Data nyata dari server (mode LIVE)"
    >
      {label || 'LIVE'}
    </span>
  );
}

export default { DemoBadge, DemoNotice, LiveBadge };
