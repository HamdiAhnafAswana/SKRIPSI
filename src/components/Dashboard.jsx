import React from 'react';

export default function Dashboard({ student, onNavigate }) {
  return (
    <div className="sinova-dashboard">
      <div className="sinova-dashboard-header">
        <div className="sinova-dashboard-welcome">
          <h2>Selamat datang, {student.nama}</h2>
          <div className="sinova-dashboard-info">
            <span>Kelas: {student.kelas}</span>
            <span>Absen: {student.absen}</span>
          </div>
        </div>
      </div>

      <div className="sinova-dashboard-menu">
        <button className="sinova-menu-card" onClick={() => onNavigate('levels')}>
          <div className="sinova-menu-icon">▶</div>
          <h3>Mulai Simulasi</h3>
          <p>Mulai simulasi instalasi jaringan</p>
        </button>

        <button className="sinova-menu-card" onClick={() => onNavigate('levels')}>
          <div className="sinova-menu-icon">☰</div>
          <h3>Pilih Level</h3>
          <p>Pilih level simulasi yang tersedia</p>
        </button>

        <button className="sinova-menu-card" onClick={() => onNavigate('log')}>
          <div className="sinova-menu-icon">☰</div>
          <h3>Log Hasil</h3>
          <p>Lihat riwayat hasil simulasi</p>
        </button>

        <button className="sinova-menu-card" onClick={() => onNavigate('ranking')}>
          <div className="sinova-menu-icon">★</div>
          <h3>Ranking</h3>
          <p>Papan peringkat siswa</p>
        </button>
      </div>
    </div>
  );
}
