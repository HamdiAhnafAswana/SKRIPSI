import React from 'react';
import { bolehLihatDataAdmin } from '../adminAccess.js';
import { DeniedBlock } from './StateBlocks.jsx';

// Gerbang data admin. Murni (tanpa hook): children HANYA dirender bila status
// otorisasi = ADMIN. Ini lapisan UX tambahan — server tetap memverifikasi ulang
// setiap permintaan data (route guard frontend bukan batas keamanan utama).
export default function AdminDataGate({ accessStatus, children }) {
  if (!bolehLihatDataAdmin(accessStatus)) {
    return (
      <DeniedBlock message="Data siswa hanya ditampilkan untuk admin terverifikasi." />
    );
  }
  return children;
}
