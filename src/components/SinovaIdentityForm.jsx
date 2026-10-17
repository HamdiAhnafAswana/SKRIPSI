import React, { useState } from 'react';
import logo from '../assets/sinova/logo.svg';

const KELAS = ['X TKJ 1', 'X TKJ 2', 'X TKJ 3'];
const ABSEN_MIN = 1;
const ABSEN_MAX = 60;

function readOldName() {
  // Kompatibilitas: nama lama yang tersimpan engine disimpan di 'netcrimp_v1_nama'.
  try {
    return localStorage.getItem('netcrimp_v1_nama') || '';
  } catch (e) {
    return '';
  }
}

/**
 * Form identitas siswa sebelum masuk dashboard.
 * Hasil disimpan oleh App ke localStorage `sinova_student`:
 *   { nama: "", kelas: "", absen: "" }
 */
export default function SinovaIdentityForm({ onSubmit }) {
  const [nama, setNama] = useState(readOldName);
  const [kelas, setKelas] = useState(KELAS[0]);
  const [absen, setAbsen] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const n = nama.trim();
    const a = parseInt(absen, 10);
    if (!n) {
      setError('Nama lengkap wajib diisi.');
      return;
    }
    if (!Number.isFinite(a) || a < ABSEN_MIN || a > ABSEN_MAX) {
      setError(`Nomor absen harus berupa angka ${ABSEN_MIN}–${ABSEN_MAX}.`);
      return;
    }
    setError('');
    onSubmit({ nama: n, kelas, absen: String(a) });
  }

  return (
    <div className="sinova-overlay sinova-overlay-identity">
      <form className="sinova-card sinova-form sinova-form-identity" onSubmit={handleSubmit} noValidate>
        <img className="sinova-logo sinova-logo-sm" src={logo} alt="Logo SINOVA" width={64} height={64} />
        <h2 className="sinova-form-title">Selamat Datang!</h2>
        <p className="sinova-form-sub">Data akan tersimpan otomatis.</p>

        <label className="sinova-field">
          <span>Nama Lengkap</span>
          <input
            type="text"
            value={nama}
            maxLength={40}
            autoComplete="off"
            placeholder="Tulis nama lengkapmu"
            onChange={(e) => setNama(e.target.value)}
          />
        </label>

        <label className="sinova-field">
          <span>Kelas</span>
          <select value={kelas} onChange={(e) => setKelas(e.target.value)}>
            {KELAS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>

        <label className="sinova-field">
          <span>Nomor Absen</span>
          <input
            type="number"
            value={absen}
            min={ABSEN_MIN}
            max={ABSEN_MAX}
            inputMode="numeric"
            placeholder="Contoh: 12"
            onChange={(e) => setAbsen(e.target.value)}
          />
        </label>

        {error && <p className="sinova-error">{error}</p>}

        <button type="submit" className="sinova-btn sinova-btn-primary sinova-btn-block">
          MULAI PRAKTIKUM
        </button>
      </form>
    </div>
  );
}
