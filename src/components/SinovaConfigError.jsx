import React from 'react';

// ============================================================================
// SinovaConfigError — layar peringatan bila konfigurasi build tidak lengkap.
//
// Ditampilkan oleh src/main.jsx sebagai PENGGANTI aplikasi saat variabel
// `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` tidak tersedia pada build.
// Tujuannya: mengganti "halaman kosong" dengan pesan yang jelas dan dapat
// ditindaklanjuti.
//
// Sengaja memakai gaya INLINE (tanpa bergantung file CSS) supaya tetap terlihat
// walau bundel gaya gagal dimuat. Hanya menampilkan NAMA variabel yang hilang,
// TIDAK pernah nilainya.
// ============================================================================

export default function SinovaConfigError({ missingVars = [] }) {
  const daftar = Array.isArray(missingVars) ? missingVars : [];

  return (
    <div
      role="alert"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: '#0b1220',
        color: '#e7eefc',
        fontFamily:
          'Nunito, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        lineHeight: 1.55,
      }}
    >
      <div
        style={{
          maxWidth: '560px',
          width: '100%',
          background: '#111d2c',
          border: '1px solid #22344a',
          borderRadius: '16px',
          padding: '28px 26px',
        }}
      >
        <h1 style={{ margin: '0 0 12px', fontSize: '22px' }}>
          Aplikasi belum dikonfigurasi
        </h1>
        <p style={{ margin: '0 0 16px', color: '#93a6ba' }}>
          Halaman tidak dapat dimuat karena konfigurasi Supabase belum tersedia
          pada saat build. Ini biasanya terjadi bila build publik (mis. GitHub
          Pages) dijalankan tanpa variabel lingkungan yang dibutuhkan.
        </p>

        {daftar.length > 0 ? (
          <div style={{ margin: '0 0 16px' }}>
            <p style={{ margin: '0 0 6px', color: '#e7eefc' }}>
              Variabel yang belum tersedia:
            </p>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#fca5a5' }}>
              {daftar.map((v) => (
                <li key={v}>
                  <code>{v}</code>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p style={{ margin: 0, color: '#93a6ba', fontSize: '14px' }}>
          Tindakan: setel variabel tersebut sebagai variabel build (mis. pada
          workflow GitHub Actions) lalu jalankan build ulang. Nilainya bersifat
          publik (URL proyek + anon/publishable key) — jangan gunakan
          service-role key atau secret server di sisi frontend.
        </p>
      </div>
    </div>
  );
}
