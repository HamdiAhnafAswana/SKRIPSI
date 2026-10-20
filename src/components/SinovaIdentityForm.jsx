
import React, { useState } from 'react';
import logo from '../assets/sinova/logo.svg';
import { supabase } from '../lib/supabase';

const KELAS = ['X TKJ 1', 'X TKJ 2', 'X TKJ 3'];
const ABSEN_MIN = 1;
const ABSEN_MAX = 60;

function readOldName() {
  try {
    return localStorage.getItem('netcrimp_v1_nama') || '';
  } catch {
    return '';
  }
}

export default function SinovaIdentityForm({ onSubmit }) {
  const [nama, setNama] = useState(readOldName);
  const [kelas, setKelas] = useState(KELAS[0]);
  const [absen, setAbsen] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (loading) return;

    const n = nama.trim();
    const a = Number(absen);

    if (n.length < 2 || n.length > 40) {
      setError('Nama lengkap harus terdiri dari 2–40 karakter.');
      return;
    }

    if (!KELAS.includes(kelas)) {
      setError('Silakan pilih kelas yang tersedia.');
      return;
    }

    if (
      !Number.isSafeInteger(a) ||
      a < ABSEN_MIN ||
      a > ABSEN_MAX
    ) {
      setError(
        `Nomor absen harus berupa bilangan bulat ${ABSEN_MIN}–${ABSEN_MAX}.`
      );
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        'student-register',
        {
          body: {
            full_name: n,
            class_name: kelas,
            absence_number: a,
          },
        }
      );

      if (invokeError) {
        let message = 'Pendaftaran gagal. Silakan coba lagi.';

        try {
          const response = invokeError.context;
          if (response && typeof response.json === 'function') {
            const body = await response.json();
            if (typeof body?.error === 'string') {
              message = body.error;
            }
          }
        } catch {
          // Gunakan pesan umum jika respons tidak dapat dibaca.
        }

        setError(message);
        return;
      }

      if (!data?.student?.id) {
        setError(
          typeof data?.error === 'string'
            ? data.error
            : 'Respons pendaftaran tidak valid. Silakan coba lagi.'
        );
        return;
      }

      // Token identitas (HMAC) dari server — diteruskan hanya bila benar-benar
      // ada dan berupa string non-kosong. Token TIDAK pernah dikarang: bila
      // server belum menerbitkannya (masa transisi sebelum deployment backend),
      // pendaftaran tetap diterima tanpa token dan modul sesi praktik akan
      // melaporkan status `missing_token` (siswa diarahkan daftar ulang).
      const token =
        typeof data.token === 'string' && data.token.trim() !== ''
          ? data.token
          : null;

      onSubmit({
        nama: data.student.full_name,
        kelas,
        absen: String(data.student.absence_number),
        studentId: data.student.id,
        ...(token ? { token } : {}),
      });
    } catch (err) {
      console.error('Gagal menghubungi layanan pendaftaran:', err);
      setError('Tidak dapat menghubungi server. Periksa koneksi internet.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sinova-overlay sinova-overlay-identity">
      <form
        className="sinova-card sinova-form sinova-form-identity"
        onSubmit={handleSubmit}
        noValidate
      >
        <img
          className="sinova-logo sinova-logo-sm"
          src={logo}
          alt="Logo SINOVA"
          width={64}
          height={64}
        />

        <h2 className="sinova-form-title">Selamat Datang!</h2>
        <p className="sinova-form-sub">
          Data akan tersimpan otomatis.
        </p>

        <label className="sinova-field">
          <span>Nama Lengkap</span>
          <input
            type="text"
            value={nama}
            maxLength={40}
            autoComplete="off"
            placeholder="Tulis nama lengkapmu"
            onChange={(e) => setNama(e.target.value)}
            disabled={loading}
          />
        </label>

        <label className="sinova-field">
          <span>Kelas</span>
          <select
            value={kelas}
            onChange={(e) => setKelas(e.target.value)}
            disabled={loading}
          >
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
            step="1"
            inputMode="numeric"
            placeholder="Contoh: 12"
            onChange={(e) => setAbsen(e.target.value)}
            disabled={loading}
          />
        </label>

        {error && (
          <p className="sinova-error" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="sinova-btn sinova-btn-primary sinova-btn-block"
          disabled={loading}
        >
          {loading ? 'MENDAFTARKAN...' : 'MULAI PRAKTIKUM'}
        </button>
      </form>
    </div>
  );
}
