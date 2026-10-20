// ============================================================================
// adminAccess.js — logika keputusan akses admin yang MURNI (tanpa React/DOM).
//
// Dipisahkan agar dapat diuji langsung: memetakan status akses (dari
// src/lib/adminAuth.js) ke tampilan yang harus dirender oleh route guard.
//
// Ini HANYA untuk menentukan apa yang ditampilkan. Wewenang sesungguhnya tetap
// ditentukan server (Edge Function `admin-check`), bukan oleh fungsi ini.
// ============================================================================

import { ADMIN_ACCESS } from '../lib/adminAuth.js';

export const ADMIN_VIEW = {
  LOADING: 'loading', // tampilkan indikator sedang memeriksa
  LOGIN: 'login', // tampilkan halaman login admin
  DENIED: 'denied', // login valid tetapi bukan admin
  ERROR: 'error', // gagal verifikasi (jaringan/server)
  PANEL: 'panel', // admin terverifikasi → boleh menampilkan area admin
};

export function viewForStatus(status) {
  switch (status) {
    case ADMIN_ACCESS.ADMIN:
      return ADMIN_VIEW.PANEL;
    case ADMIN_ACCESS.SIGNED_OUT:
      return ADMIN_VIEW.LOGIN;
    case ADMIN_ACCESS.NO_ROLE:
      return ADMIN_VIEW.DENIED;
    case ADMIN_ACCESS.ERROR:
      return ADMIN_VIEW.ERROR;
    case ADMIN_ACCESS.LOADING:
    default:
      return ADMIN_VIEW.LOADING;
  }
}

// Apakah status ini boleh menampilkan data siswa? Selalu hanya untuk ADMIN.
// Dipakai sebagai penjaga tambahan sebelum komponen data (Fase 9) dirender.
export function bolehLihatDataAdmin(status) {
  return status === ADMIN_ACCESS.ADMIN;
}
