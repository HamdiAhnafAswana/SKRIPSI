import React from 'react';

// Kartu ringkasan dashboard. Murni (tanpa hook) dan hanya menampilkan agregat
// (tidak ada detail pribadi siswa).
function Kartu({ label, nilai, catatan }) {
  return (
    <div className="admin-stat">
      <span className="admin-stat-value">{nilai}</span>
      <span className="admin-stat-label">{label}</span>
      {catatan ? <span className="admin-stat-note">{catatan}</span> : null}
    </div>
  );
}

export default function SummaryPanel({ summary }) {
  if (!summary) return null;

  const s = summary;
  const totalLevel = s.levelTotal || 5;

  return (
    <div className="admin-summary">
      <div className="admin-stats">
        <Kartu label="Total Siswa" nilai={s.totalStudents} />
        <Kartu label="Sesi Latihan" nilai={s.totalSessions} />
        <Kartu label="Sesi Selesai" nilai={s.completedSessions} />
        <Kartu label="Sesi Berjalan" nilai={s.activeSessions} />
        <Kartu label="Sesi Terputus" nilai={s.disconnectedSessions} />
        <Kartu
          label="Progres Rata-rata"
          nilai={`${s.averageProgressPercent}%`}
          catatan={`dari ${totalLevel} level`}
        />
        <Kartu
          label="Siswa Berprogres"
          nilai={`${s.studentsWithProgress}/${s.totalStudents}`}
        />
      </div>

      <section className="admin-card">
        <h3 className="admin-card-title">Capaian per Level</h3>
        <ul className="admin-level-list">
          {(s.levelCompletion || []).map((lv) => {
            const persen = s.totalStudents
              ? Math.round((lv.passed / s.totalStudents) * 100)
              : 0;
            return (
              <li key={lv.level} className="admin-level-item">
                <span className="admin-level-name">Level {lv.level}</span>
                <span className="admin-level-bar" aria-hidden="true">
                  <span className="admin-level-fill" style={{ width: `${persen}%` }} />
                </span>
                <span className="admin-level-value">
                  {lv.passed}/{s.totalStudents} lulus
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
