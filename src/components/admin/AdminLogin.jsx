import React, { useState } from 'react';
import { signInAdmin, pesanAdmin } from '../../lib/adminAuth.js';

// Halaman login admin. Hanya email + kata sandi (Supabase Auth).
// TIDAK memakai nama/kelas/nomor absen siswa, dan TIDAK ada kredensial bawaan.
//
// Urutan state (dipakai oleh pengujian lokal):
//   0: email, 1: password, 2: error, 3: loading
export default function AdminLogin({ onLoggedIn, notice }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;

    const mail = email.trim();
    if (!mail || !password) {
      setError(pesanAdmin('empty_fields'));
      return;
    }

    setError('');
    setLoading(true);

    const hasil = await signInAdmin(mail, password);

    setLoading(false);

    if (!hasil.ok) {
      setError(hasil.message || pesanAdmin('generic'));
      return;
    }

    if (typeof onLoggedIn === 'function') onLoggedIn();
  }

  return (
    <div className="admin-login-wrap">
      <form className="admin-login" onSubmit={handleSubmit} noValidate>
        <h1 className="admin-login-title">Masuk Admin SINOVA</h1>
        <p className="admin-login-sub">
          Area terbatas. Gunakan akun admin yang terdaftar.
        </p>

        {notice ? (
          <p className="admin-login-notice" role="status">
            {notice}
          </p>
        ) : null}

        <label className="admin-field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            autoComplete="username"
            placeholder="nama@contoh.sch.id"
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </label>

        <label className="admin-field">
          <span>Kata Sandi</span>
          <input
            type="password"
            value={password}
            autoComplete="current-password"
            placeholder="••••••••"
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </label>

        {error ? (
          <p className="admin-error" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className="admin-btn admin-btn-primary"
          disabled={loading}
        >
          {loading ? 'MEMPROSES...' : 'MASUK'}
        </button>

        <a
          className="admin-login-back"
          href="#/"
          onClick={(e) => {
            // Rute hash (#/admin) hanya dievaluasi saat halaman dimuat, jadi
            // kembali ke game perlu MUAT ULANG penuh agar area admin benar-benar
            // dilepas (hanya mengubah hash tidak mengganti aplikasi).
            e.preventDefault();
            try { window.location.hash = '#/'; } catch (err) { /* abaikan */ }
            try { window.location.reload(); } catch (err) { /* abaikan */ }
          }}
        >
          &larr; Kembali ke game
        </a>
      </form>
    </div>
  );
}
