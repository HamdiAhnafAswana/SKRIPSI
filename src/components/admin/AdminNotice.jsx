import React from 'react';

// Kartu pesan umum untuk guard (memuat / ditolak / gagal verifikasi).
// Tidak memuat data apa pun dan tidak menampilkan detail teknis.
export default function AdminNotice({ title, body, actionLabel, onAction, tone }) {
  return (
    <div className="admin-login-wrap">
      <div className={`admin-notice admin-notice-${tone || 'info'}`}>
        <h1 className="admin-login-title">{title}</h1>
        {body ? <p className="admin-login-sub">{body}</p> : null}
        {actionLabel && typeof onAction === 'function' ? (
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={onAction}
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
