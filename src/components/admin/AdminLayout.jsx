import React from 'react';

// Tata letak area admin — TERPISAH dari tata letak game siswa.
// Tidak memuat kanvas game maupun skrip engine public/game/**.
export default function AdminLayout({ user, onLogout, children }) {
  const email =
    user && typeof user.email === 'string' && user.email ? user.email : '(tanpa email)';

  return (
    <div className="admin-app">
      <header className="admin-header">
        <div className="admin-brand">
          <strong>SINOVA</strong>
          <span className="admin-brand-sub">Panel Admin</span>
        </div>
        <div className="admin-header-right">
          <span className="admin-user" title={email}>{email}</span>
          <button
            type="button"
            className="admin-btn admin-btn-ghost"
            onClick={onLogout}
          >
            Keluar
          </button>
        </div>
      </header>
      <main className="admin-main">{children}</main>
    </div>
  );
}
