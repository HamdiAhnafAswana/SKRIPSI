import React from 'react';
import {
  STUDENT_STATUS,
  STUDENT_STATUS_LABEL,
  formatDateTime,
  formatRelative,
} from '../lib/dashboardFormat.js';
import { EmptyBlock } from './StateBlocks.jsx';

const OPSI_STATUS = [
  STUDENT_STATUS.BELUM_MULAI,
  STUDENT_STATUS.BERJALAN,
  STUDENT_STATUS.TERPUTUS,
  STUDENT_STATUS.SELESAI,
];

// Daftar siswa: pencarian, filter kelas & status, tabel, dan paginasi.
// Murni (tanpa hook): seluruh keadaan filter/​halaman dikendalikan induk.
export default function StudentList({
  students = [],
  classes = [],
  filters = {},
  meta = null,
  onFilters,
  onOpenStudent,
  now,
}) {
  const f = {
    q: filters.q ?? '',
    classId: filters.classId ?? '',
    status: filters.status ?? '',
    page: filters.page ?? 1,
    pageSize: filters.pageSize ?? 10,
  };
  const ubah = (patch) => {
    if (typeof onFilters === 'function') onFilters(patch);
  };

  const total = meta?.total ?? students.length;
  const totalPages = meta?.totalPages ?? 1;

  return (
    <section className="admin-card admin-list">
      <div className="admin-filters">
        <label className="admin-filter admin-filter-search">
          <span>Cari siswa</span>
          <input
            type="search"
            name="q"
            value={f.q}
            placeholder="Nama / kelas / nomor absen"
            onChange={(e) => ubah({ q: e.target.value, page: 1 })}
          />
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

        <label className="admin-filter">
          <span>Status</span>
          <select
            name="status"
            value={f.status}
            onChange={(e) => ubah({ status: e.target.value, page: 1 })}
          >
            <option value="">Semua status</option>
            {OPSI_STATUS.map((st) => (
              <option key={st} value={st}>
                {STUDENT_STATUS_LABEL[st]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {students.length === 0 ? (
        <EmptyBlock
          title="Tidak ada siswa"
          body="Tidak ada siswa yang cocok dengan pencarian/filter saat ini."
        />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Kelas</th>
                <th>Absen</th>
                <th>Sesi</th>
                <th>Level lulus</th>
                <th>Progres</th>
                <th>Aktivitas terakhir</th>
                <th>Status</th>
                <th aria-label="Aksi" />
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td className="admin-cell-name">{s.full_name}</td>
                  <td>{s.class_name}</td>
                  <td>{s.absence_number}</td>
                  <td>
                    {s.sessions_completed}/{s.sessions_total}
                  </td>
                  <td>
                    {s.levels_passed}/{s.level_total}
                  </td>
                  <td>
                    <span className="admin-progress">
                      <span
                        className="admin-progress-fill"
                        style={{ width: `${s.progress_percent}%` }}
                      />
                    </span>
                    <span className="admin-progress-text">{s.progress_percent}%</span>
                  </td>
                  <td title={formatDateTime(s.last_activity_at)}>
                    {formatRelative(s.last_activity_at, now)}
                  </td>
                  <td>
                    <span className={`admin-pill admin-pill-${s.status}`}>
                      {STUDENT_STATUS_LABEL[s.status] || s.status}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="admin-btn admin-btn-ghost admin-btn-sm"
                      data-aksi="buka-siswa"
                      data-id={s.id}
                      onClick={() => typeof onOpenStudent === 'function' && onOpenStudent(s.id)}
                    >
                      Detail
                    </button>
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
          Halaman {f.page} dari {totalPages} &middot; {total} siswa
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
