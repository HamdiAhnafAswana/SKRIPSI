import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ADMIN_ACCESS,
  resolveAdminAccess,
  signOutAdmin,
  subscribeAdminAuth,
} from '../lib/adminAuth.js';
import { viewForStatus, ADMIN_VIEW } from './adminAccess.js';
import AdminLogin from '../components/admin/AdminLogin.jsx';
import AdminGuard from '../components/admin/AdminGuard.jsx';
import AdminLayout from '../components/admin/AdminLayout.jsx';
import AdminDataGate from './dashboard/AdminDataGate.jsx';
import AdminDashboard from './dashboard/AdminDashboard.jsx';
import './admin.css';

// Titik masuk area admin. Dipisahkan dari App.jsx (game siswa): tidak memuat
// skrip engine dan tidak menyentuh identitas siswa (localStorage sinova_student).
export default function AdminApp() {
  const [akses, setAkses] = useState({
    status: ADMIN_ACCESS.LOADING,
    user: null,
    expired: false,
  });
  // Menandai bahwa sesi pernah terverifikasi admin, agar saat token
  // kedaluwarsa/di-logout kita dapat menampilkan pesan "sesi berakhir".
  const pernahAdmin = useRef(false);

  const muat = useCallback(async () => {
    setAkses((prev) => ({ ...prev, status: ADMIN_ACCESS.LOADING }));
    const hasil = await resolveAdminAccess();

    if (hasil.status === ADMIN_ACCESS.ADMIN) {
      pernahAdmin.current = true;
    }

    const expired =
      hasil.status === ADMIN_ACCESS.SIGNED_OUT && pernahAdmin.current === true;
    if (expired) pernahAdmin.current = false;

    setAkses({
      status: hasil.status,
      user: hasil.user ?? null,
      expired,
    });
  }, []);

  useEffect(() => {
    muat();
  }, [muat]);

  useEffect(() => {
    // Setiap perubahan sesi (login, logout, refresh/kedaluwarsa token)
    // memicu validasi ulang peran ke server.
    return subscribeAdminAuth(() => {
      muat();
    });
  }, [muat]);

  const keluar = useCallback(async () => {
    pernahAdmin.current = false;
    await signOutAdmin();
    setAkses({ status: ADMIN_ACCESS.SIGNED_OUT, user: null, expired: false });
  }, []);

  const view = viewForStatus(akses.status);

  if (view === ADMIN_VIEW.LOGIN) {
    return (
      <AdminLogin
        onLoggedIn={muat}
        notice={akses.expired ? 'Sesi admin berakhir. Silakan masuk kembali.' : ''}
      />
    );
  }

  return (
    <AdminGuard status={akses.status} onRetry={muat} onLogout={keluar}>
      <AdminLayout user={akses.user} onLogout={keluar}>
        {/* Gerbang data: konten admin hanya dirender untuk status ADMIN.
            Server tetap memverifikasi ulang setiap permintaan data. */}
        <AdminDataGate accessStatus={akses.status}>
          <AdminDashboard onUnauthorized={muat} />
        </AdminDataGate>
      </AdminLayout>
    </AdminGuard>
  );
}
