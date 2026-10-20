import React from 'react';
import {
  SESSION_STATUS,
  SESSION_STATUS_LABEL,
  formatDateTime,
  formatRelative,
} from '../lib/dashboardFormat.js';
import { EmptyBlock } from './StateBlocks.jsx';

const OPSI_STATUS = [
  SESSION_STATUS.IN_PROGRESS,
  SESSION_STATUS.COMPLETED,
  SESSION_STATUS.DISCONNECTED,
];

// Pemantauan sesi: status, level terakhir, dan waktu pembaruan.
// Murni (tanpa hook); filter/paginasi dikendalikan induk.
export default function SessionMonitor({
  sessions = [],
  classes = [],
  filters = {},
  meta = null,
  onFilters,
  now,
}) {
  const f = {
    status: filters.status ?? '',
    classId: filters.classId ?? '',
    page: filters.page ?? 1,
  };
  const ubah = (patch) => {
    if (typeof onFilters === 'function') onFilters(patch);
  };
  const total = meta?.total ?? sessions.length;
  const totalPages = meta?.totalPages ?? 1;

  return (
    <section className="admin-card admin-list">
      <div className="admin-filters">
        <label className="admin-filter">
          <span>Status sesi</span>
          <select
            name="status"
            value={f.status}
            onChange={(e) => ubah({ status: e.target.value, page: 1 })}
          >
            <option value="">Semua status</option>
            {OPSI_STATUS.map((st) => (
              <option key={st} value={st}>
                {SESSION_STATUS_LABEL[st]}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-filter">
          <span>Kelas</span>
          <select
            name="classId"
            value={String(f.classId)}
            onChange={(e) => ubah({ classId: e.target.value, page: 1 })}
          >
            <option value="">Semua kelas</option>
            {classes.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.class_name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {sessions.length === 0 ? (
        <EmptyBlock
          title="Tidak ada sesi"
          body="Tidak ada sesi yang cocok dengan filter saat ini."
        />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Siswa</th>
                <th>Kelas</th>
                <th>Status</th>
                <th>Level terakhir</th>
                <th>Level lulus</th>
                <th>Mulai</th>
                <th>Diperbarui</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td className="admin-cell-name">{s.student_name}</td>
                  <td>{s.class_name || '—'}</td>
                  <td>
                    <span className={`admin-pill admin-pill-${s.status}`}>
                      {SESSION_STATUS_LABEL[s.status] || s.status}
                    </span>
                  </td>
                  <td>
                    {s.current_level ?? '—'}/{s.level_total}
                  </td>
                  <td>
                    {s.levels_passed}/{s.level_total}
                  </td>
                  <td title={formatDateTime(s.started_at)}>
                    {formatDateTime(s.started_at)}
                  </td>
                  <td title={formatDateTime(s.last_seen_at)}>
                    {formatRelative(s.last_seen_at, now)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="admin-pagination">
        <button
          type="button"
          className="admin-btn admin-btn-ghost admin-btn-sm"
          data-aksi="prev"
          disabled={f.page <= 1}
          onClick={() => ubah({ page: Math.max(1, f.page - 1) })}
        >
          Sebelumnya
        </button>
        <span className="admin-page-info">
          Halaman {f.page} dari {totalPages} &middot; {total} sesi
        </span>
        <button
          type="button"
          className="admin-btn admin-btn-ghost admin-btn-sm"
          data-aksi="next"
          disabled={f.page >= totalPages}
          onClick={() => ubah({ page: Math.min(totalPages, f.page + 1) })}
        >
          Berikutnya
        </button>
      </div>
    </section>
  );
}
