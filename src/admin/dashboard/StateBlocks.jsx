import React from 'react';
import { pesanErrorData } from '../lib/dashboardFormat.js';

// Blok status untuk dashboard. Semuanya murni (tanpa hook) sehingga dapat diuji
// langsung, dan tidak pernah memuat data siswa.

export function LoadingBlock({ label }) {
  return (
    <div className="admin-state admin-state-loading" role="status" aria-live="polite">
      <span className="admin-spinner" aria-hidden="true" />
      <span>{label || 'Memuat data…'}</span>
    </div>
  );
}

export function EmptyBlock({ title, body }) {
  return (
    <div className="admin-state admin-state-empty" role="status">
      <strong className="admin-state-title">{title || 'Tidak ada data'}</strong>
      {body ? <span className="admin-state-body">{body}</span> : null}
    </div>
  );
}

export function ErrorBlock({ code, message, onRetry }) {
  return (
    <div className="admin-state admin-state-error" role="alert">
      <strong className="admin-state-title">Gagal memuat data</strong>
      <span className="admin-state-body">{message || pesanErrorData(code)}</span>
      {typeof onRetry === 'function' ? (
        <button type="button" className="admin-btn admin-btn-ghost" onClick={onRetry}>
          Coba lagi
        </button>
      ) : null}
    </div>
  );
}

export function DeniedBlock({ message }) {
  return (
    <div className="admin-state admin-state-denied" role="alert">
      <strong className="admin-state-title">Akses ditolak</strong>
      <span className="admin-state-body">
        {message || 'Data siswa hanya ditampilkan untuk admin terverifikasi.'}
      </span>
    </div>
  );
}

export default { LoadingBlock, EmptyBlock, ErrorBlock, DeniedBlock };
