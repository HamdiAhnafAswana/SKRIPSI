import React, { useState } from 'react';

export default function IdentityForm({ onSubmit }) {
  const [nama, setNama] = useState('');
  const [kelas, setKelas] = useState('');
  const [absen, setAbsen] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nama.trim() || !kelas || !absen.trim()) {
      setError('Semua field wajib diisi');
      return;
    }
    const student = { nama: nama.trim(), kelas, absen: absen.trim() };
    localStorage.setItem('sinova_student', JSON.stringify(student));
    onSubmit(student);
  };

  return (
    <div className="sinova-identity">
      <div className="sinova-identity-card">
        <h2 className="sinova-identity-title">Data Siswa</h2>
        <p className="sinova-identity-subtitle">Masukkan identitas kamu sebelum memulai simulasi</p>

        <form onSubmit={handleSubmit} className="sinova-form">
          <div className="sinova-form-group">
            <label htmlFor="nama">Nama Lengkap</label>
            <input
              id="nama"
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Masukkan nama lengkap"
              maxLength={50}
            />
          </div>

          <div className="sinova-form-group">
            <label htmlFor="kelas">Kelas</label>
            <select
              id="kelas"
              value={kelas}
              onChange={(e) => setKelas(e.target.value)}
            >
              <option value="">Pilih Kelas</option>
              <option value="X TKJ 1">X TKJ 1</option>
              <option value="X TKJ 2">X TKJ 2</option>
              <option value="X TKJ 3">X TKJ 3</option>
            </select>
          </div>

          <div className="sinova-form-group">
            <label htmlFor="absen">Nomor Absen</label>
            <input
              id="absen"
              type="text"
              value={absen}
              onChange={(e) => setAbsen(e.target.value)}
              placeholder="Masukkan nomor absen"
              maxLength={5}
            />
          </div>

          {error && <p className="sinova-error">{error}</p>}

          <button type="submit" className="sinova-btn sinova-btn-primary sinova-btn-full">
            Mulai SINOVA
          </button>
        </form>
      </div>
    </div>
  );
}
