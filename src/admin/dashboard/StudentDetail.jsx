import React from 'react';
import {
  SESSION_STATUS_LABEL,
  formatDateTime,
  formatDuration,
} from '../lib/dashboardFormat.js';
import { EmptyBlock } from './StateBlocks.jsx';

// Detail satu siswa: identitas + riwayat sesi + hasil per level.
// Murni (tanpa hook) dan hanya menampilkan field yang telah terverifikasi.
export default function StudentDetail({ detail, onBack }) {
  if (!detail || !detail.student) {
    return (
      <div className="admin-card">
        <button
          type="button"
          className="admin-btn admin-btn-ghost admin-btn-sm"
          data-aksi="kembali"
          onClick={() => typeof onBack === 'function' && onBack()}
        >
          &larr; Kembali
        </button>
        <EmptyBlock title="Siswa tidak ditemukan" body="Data siswa tidak tersedia." />
      </div>
    );
  }

  const st = detail.student;
  const sesi = detail.sessions || [];

  return (
    <div className="admin-detail">
      <button
        type="button"
        className="admin-btn admin-btn-ghost admin-btn-sm"
        data-aksi="kembali"
        onClick={() => typeof onBack === 'function' && onBack()}
      >
        &larr; Kembali ke daftar
      </button>

      <section className="admin-card admin-detail-head">
        <h2 className="admin-card-title">{st.full_name}</h2>
        <dl className="admin-detail-meta">
          <div>
            <dt>Kelas</dt>
            <dd>{st.class_name}</dd>
          </div>
          <div>
            <dt>Nomor absen</dt>
            <dd>{st.absence_number}</dd>
          </div>
          <div>
            <dt>Terdaftar</dt>
            <dd>{formatDateTime(st.created_at)}</dd>
          </div>
          <div>
            <dt>Jumlah sesi</dt>
            <dd>{sesi.length}</dd>
          </div>
        </dl>
      </section>

      {sesi.length === 0 ? (
        <section className="admin-card">
          <EmptyBlock
            title="Belum ada sesi"
            body="Siswa ini belum memulai sesi latihan."
          />
        </section>
      ) : (
        sesi.map((s) => (
          <section key={s.id} className="admin-card admin-session">
            <header className="admin-session-head">
              <span className={`admin-pill admin-pill-${s.status}`}>
                {SESSION_STATUS_LABEL[s.status] || s.status}
              </span>
              <span className="admin-session-title">
                Sesi {formatDateTime(s.started_at)}
              </span>
              <span className="admin-session-sub">
                Level terakhir: {s.current_level ?? '—'}
              </span>
            </header>

            <dl className="admin-session-meta">
              <div>
                <dt>Mulai</dt>
                <dd>{formatDateTime(s.started_at)}</dd>
              </div>
              <div>
                <dt>Pembaruan</dt>
                <dd>{formatDateTime(s.last_seen_at)}</dd>
              </div>
              <div>
                <dt>Selesai</dt>
                <dd>{formatDateTime(s.completed_at)}</dd>
              </div>
            </dl>

            {(s.level_results || []).length === 0 ? (
              <EmptyBlock title="Belum ada hasil level" body="Belum ada level yang dicatat pada sesi ini." />
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Level</th>
                      <th>Percobaan</th>
                      <th>Skor</th>
                      <th>Kesalahan</th>
                      <th>Durasi</th>
                      <th>Lulus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.level_results.map((r) => (
                      <tr key={`${s.id}-${r.level_number}-${r.attempt_number}`}>
                        <td>{r.level_number}</td>
                        <td>{r.attempt_number}</td>
                        <td>{r.score ?? '—'}</td>
                        <td>{r.mistakes ?? '—'}</td>
                        <td>{formatDuration(r.duration_seconds)}</td>
                        <td>
                          <span className={`admin-pass admin-pass-${r.passed ? 'yes' : 'no'}`}>
                            {r.passed ? 'Lulus' : 'Belum'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ))
      )}
    </div>
  );
}
