import React from 'react';
import { viewForStatus, ADMIN_VIEW } from '../../admin/adminAccess.js';
import AdminNotice from './AdminNotice.jsx';

// Route guard area admin. Hanya merender `children` bila status akses = ADMIN
// (peran terverifikasi server). Selain itu menampilkan pesan yang sesuai.
//
// Guard ini BUKAN lapisan keamanan tunggal: server tetap memverifikasi ulang
// setiap permintaan data admin.
export default function AdminGuard({ status, onRetry, onLogout, children }) {
  const view = viewForStatus(status);

  if (view === ADMIN_VIEW.PANEL) return children;

  // Status belum login ditangani oleh AdminApp (menampilkan halaman login),
  // jadi guard tidak merender apa pun di sini.
  if (view === ADMIN_VIEW.LOGIN) return null;

  if (view === ADMIN_VIEW.DENIED) {
    return (
      <AdminNotice
        tone="warn"
        title="Akses ditolak"
        body="Akun ini tidak memiliki peran admin."
        actionLabel="Keluar"
        onAction={onLogout}
      />
    );
  }

  if (view === ADMIN_VIEW.ERROR) {
    return (
      <AdminNotice
        tone="error"
        title="Tidak dapat memverifikasi akses"
        body="Periksa koneksi lalu coba lagi. Akses admin tidak diberikan tanpa verifikasi."
        actionLabel="Coba lagi"
        onAction={onRetry}
      />
    );
  }

  // LOADING (default): jangan pernah render area admin sebelum terverifikasi.
  return (
    <AdminNotice
      tone="info"
      title="Memeriksa sesi admin…"
      body="Mohon tunggu sebentar."
    />
  );
}
