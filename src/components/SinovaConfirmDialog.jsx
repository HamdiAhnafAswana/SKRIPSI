import React from 'react';

/**
 * Dialog konfirmasi "Muat Ulang" pada dashboard SINOVA.
 * Ditampilkan sebagai overlay di atas dashboard sebelum alur masuk
 * (identitas siswa → tutorial) diulang dari awal.
 */
export default function SinovaConfirmDialog({ onCancel, onConfirm }) {
  return (
    <div className="sinova-overlay sinova-overlay-confirm">
      <div className="sinova-card sinova-confirm">
        <h2 className="sinova-confirm-title">Mulai Ulang SINOVA?</h2>
        <p className="sinova-confirm-text">
          Apakah Anda yakin ingin memulai ulang SINOVA dari awal? Kamu akan
          mengisi identitas siswa dan mengikuti tutorial lagi. Progres praktik
          yang belum tersimpan mungkin akan hilang.
        </p>
        <div className="sinova-actions">
          <button type="button" className="sinova-btn sinova-btn-ghost" onClick={onCancel}>
            Batal
          </button>
          <button type="button" className="sinova-btn sinova-btn-primary" onClick={onConfirm} autoFocus>
            Ya, Muat Ulang
          </button>
        </div>
      </div>
    </div>
  );
}
