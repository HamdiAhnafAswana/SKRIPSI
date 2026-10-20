// ============================================================================
// dashboardFormat.js — fungsi MURNI untuk dashboard admin (tanpa React/DOM).
//
// Semua bentuk data di sini adalah "view model" yang dinormalkan dari bentuk
// tabel yang terverifikasi. Fungsi-fungsi ini sengaja tidak menyentuh jaringan
// sehingga mudah diuji, dan nantinya dapat dipakai ulang sebagai acuan bentuk
// respons Edge Function admin.
// ============================================================================

export const LEVEL_TOTAL = 5;

export const SESSION_STATUS = {
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  DISCONNECTED: 'disconnected',
};

export const SESSION_STATUS_LABEL = {
  in_progress: 'Berjalan',
  completed: 'Selesai',
  disconnected: 'Terputus',
};

export const STUDENT_STATUS = {
  BELUM_MULAI: 'belum_mulai',
  BERJALAN: 'berjalan',
  TERPUTUS: 'terputus',
  SELESAI: 'selesai',
};

export const STUDENT_STATUS_LABEL = {
  belum_mulai: 'Belum mulai',
  berjalan: 'Berjalan',
  terputus: 'Terputus',
  selesai: 'Selesai',
};

export const DATA_ERROR = {
  UNAUTHORIZED: 'unauthorized',
  FORBIDDEN: 'forbidden',
  NOT_FOUND: 'not_found',
  NETWORK: 'network',
  SERVER: 'server',
  BAD_REQUEST: 'bad_request',
  UNKNOWN: 'unknown',
};

const PESAN_ERROR = {
  unauthorized: 'Sesi admin berakhir atau tidak valid. Silakan masuk kembali.',
  forbidden: 'Anda tidak memiliki akses admin untuk data ini.',
  not_found: 'Data yang diminta tidak ditemukan.',
  network: 'Tidak dapat menghubungi server. Periksa koneksi Anda.',
  server: 'Terjadi kesalahan pada server. Silakan coba lagi.',
  bad_request: 'Permintaan tidak valid.',
  unknown: 'Terjadi kesalahan. Silakan coba lagi.',
};

// Pesan ramah untuk kode kesalahan adapter (tanpa detail teknis).
export function pesanErrorData(code) {
  return PESAN_ERROR[code] ?? PESAN_ERROR.unknown;
}

function pad(n) {
  return String(n).padStart(2, '0');
}

// Format tanggal+jam (UTC, deterministik) → "19/10/2026 12:34" atau "—".
export function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return (
    `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}` +
    ` ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
  );
}

// Detik → "1 mnt 05 dtk" / "45 dtk" / "—".
export function formatDuration(seconds) {
  if (seconds === null || seconds === undefined) return '—';
  const total = Math.max(0, Math.round(Number(seconds)));
  if (!Number.isFinite(total)) return '—';
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m > 0) return `${m} mnt ${pad(s)} dtk`;
  return `${s} dtk`;
}

// Selisih menit antara dua waktu ISO (dari lebih baru ke lebih lama) atau null.
export function minutesBetween(laterIso, earlierIso) {
  const a = Date.parse(laterIso);
  const b = Date.parse(earlierIso);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((a - b) / 60_000);
}

// "3 menit lalu" / "2 jam lalu" / "—" (relatif terhadap acuan, default now).
export function formatRelative(laterIso, acuanIso) {
  const acuan = acuanIso ?? laterIso;
  if (!laterIso) return '—';
  const menit = minutesBetween(acuan, laterIso);
  if (menit === null) return '—';
  if (menit < 1) return 'baru saja';
  if (menit < 60) return `${menit} menit lalu`;
  const jam = Math.floor(menit / 60);
  if (jam < 24) return `${jam} jam lalu`;
  const hari = Math.floor(jam / 24);
  return `${hari} hari lalu`;
}

function unique(arr) {
  return Array.from(new Set(arr));
}

function grupPertamaKali(list, kunci) {
  const m = new Map();
  for (const item of list) {
    const k = kunci(item);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(item);
  }
  return m;
}

// Menentukan status ringkas seorang siswa dari sesi + level yang lulus.
export function statusSiswa(sesiSiswa, levelsPassed) {
  if (levelsPassed >= LEVEL_TOTAL) return STUDENT_STATUS.SELESAI;
  if (sesiSiswa.some((s) => s.status === SESSION_STATUS.IN_PROGRESS)) {
    return STUDENT_STATUS.BERJALAN;
  }
  if (sesiSiswa.some((s) => s.status === SESSION_STATUS.COMPLETED)) {
    return STUDENT_STATUS.BERJALAN; // ada progres, tetapi belum tuntas
  }
  if (sesiSiswa.some((s) => s.status === SESSION_STATUS.DISCONNECTED)) {
    return STUDENT_STATUS.TERPUTUS;
  }
  return STUDENT_STATUS.BELUM_MULAI;
}

// Baris daftar siswa (nama, kelas, absen, ringkasan aktivitas + progres).
export function buildStudentRows({ students, classes, sessions, levelResults }) {
  const classById = new Map(classes.map((c) => [c.id, c]));
  const sesiPerSiswa = grupPertamaKali(sessions, (s) => s.student_id);
  const hasilPerSesi = grupPertamaKali(levelResults, (r) => r.session_id);

  return students.map((st) => {
    const sesiSiswa = sesiPerSiswa.get(st.id) ?? [];
    const levelLulus = new Set();
    for (const s of sesiSiswa) {
      for (const r of hasilPerSesi.get(s.id) ?? []) {
        if (r.passed === true) levelLulus.add(r.level_number);
      }
    }
    const levelsPassed = levelLulus.size;
    const lastSeen = sesiSiswa.length
      ? sesiSiswa.map((s) => s.last_seen_at).sort().slice(-1)[0]
      : null;

    return {
      id: st.id,
      full_name: st.full_name,
      class_id: st.class_id,
      class_name: classById.get(st.class_id)?.class_name ?? '(kelas tidak dikenal)',
      absence_number: st.absence_number,
      created_at: st.created_at,
      sessions_total: sesiSiswa.length,
      sessions_completed: sesiSiswa.filter((s) => s.status === SESSION_STATUS.COMPLETED).length,
      levels_passed: levelsPassed,
      level_total: LEVEL_TOTAL,
      progress_percent: Math.round((Math.min(LEVEL_TOTAL, levelsPassed) / LEVEL_TOTAL) * 100),
      last_activity_at: lastSeen,
      status: statusSiswa(sesiSiswa, levelsPassed),
    };
  });
}

// Filter daftar siswa: pencarian teks, kelas, dan status.
export function filterStudents(rows, { q = '', classId = '', status = '' } = {}) {
  const cari = String(q ?? '').trim().toLowerCase();
  return rows.filter((r) => {
    if (classId !== '' && classId !== null && String(r.class_id) !== String(classId)) return false;
    if (status && r.status !== status) return false;
    if (cari) {
      const hay = `${r.full_name} ${r.class_name} ${r.absence_number}`.toLowerCase();
      if (!hay.includes(cari)) return false;
    }
    return true;
  });
}

// Paginasi dengan penjepitan halaman agar tetap valid.
export function paginate(list, page = 1, pageSize = 10) {
  const size = Math.max(1, Math.floor(Number(pageSize) || 10));
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / size));
  const p = Math.min(Math.max(1, Math.floor(Number(page) || 1)), totalPages);
  const start = (p - 1) * size;
  return {
    items: list.slice(start, start + size),
    meta: { page: p, pageSize: size, total, totalPages },
  };
}

// Ringkasan dashboard.
export function computeSummary({ students, sessions, levelResults }) {
  const sesiById = new Map(sessions.map((s) => [s.id, s]));
  const hitung = (st) => sessions.filter((s) => s.status === st).length;

  const levelLulusPerSiswa = new Map();
  for (const r of levelResults) {
    if (r.passed !== true) continue;
    const s = sesiById.get(r.session_id);
    if (!s) continue;
    if (!levelLulusPerSiswa.has(s.student_id)) levelLulusPerSiswa.set(s.student_id, new Set());
    levelLulusPerSiswa.get(s.student_id).add(r.level_number);
  }

  let siswaBerprogres = 0;
  let jumlahLevelLulus = 0;
  for (const st of students) {
    const n = levelLulusPerSiswa.get(st.id)?.size ?? 0;
    if (n > 0) siswaBerprogres++;
    jumlahLevelLulus += Math.min(LEVEL_TOTAL, n);
  }

  const totalSiswa = students.length;
  const rataProgres = totalSiswa
    ? Math.round((jumlahLevelLulus / (totalSiswa * LEVEL_TOTAL)) * 100)
    : 0;

  const levelCompletion = [];
  for (let lv = 1; lv <= LEVEL_TOTAL; lv++) {
    const dicoba = new Set();
    const lulus = new Set();
    for (const r of levelResults) {
      if (r.level_number !== lv) continue;
      const s = sesiById.get(r.session_id);
      if (!s) continue;
      dicoba.add(s.student_id);
      if (r.passed === true) lulus.add(s.student_id);
    }
    levelCompletion.push({ level: lv, attempted: dicoba.size, passed: lulus.size });
  }

  return {
    totalStudents: totalSiswa,
    totalSessions: sessions.length,
    completedSessions: hitung(SESSION_STATUS.COMPLETED),
    activeSessions: hitung(SESSION_STATUS.IN_PROGRESS),
    disconnectedSessions: hitung(SESSION_STATUS.DISCONNECTED),
    studentsWithProgress: siswaBerprogres,
    averageProgressPercent: rataProgres,
    levelTotal: LEVEL_TOTAL,
    levelCompletion,
  };
}

// Baris pemantauan sesi (terbaru lebih dulu).
export function buildSessionRows({ sessions, students, classes, levelResults }) {
  const classById = new Map(classes.map((c) => [c.id, c]));
  const siswaById = new Map(students.map((s) => [s.id, s]));
  const hasilPerSesi = grupPertamaKali(levelResults, (r) => r.session_id);

  return sessions
    .map((s) => {
      const st = siswaById.get(s.student_id);
      const hasil = hasilPerSesi.get(s.id) ?? [];
      return {
        id: s.id,
        student_id: s.student_id,
        student_name: st?.full_name ?? '(siswa tidak dikenal)',
        class_id: st?.class_id ?? null,
        class_name: st ? classById.get(st.class_id)?.class_name ?? '' : '',
        absence_number: st?.absence_number ?? null,
        status: s.status,
        current_level: s.current_level,
        level_total: LEVEL_TOTAL,
        started_at: s.started_at,
        last_seen_at: s.last_seen_at,
        completed_at: s.completed_at,
        levels_attempted: unique(hasil.map((r) => r.level_number)).length,
        levels_passed: unique(hasil.filter((r) => r.passed === true).map((r) => r.level_number)).length,
      };
    })
    .sort((a, b) => String(b.last_seen_at).localeCompare(String(a.last_seen_at)));
}

// Detail satu siswa: identitas + riwayat sesi + hasil per level.
export function buildStudentDetail({ studentId, students, classes, sessions, levelResults }) {
  const st = students.find((s) => s.id === studentId);
  if (!st) return null;
  const classById = new Map(classes.map((c) => [c.id, c]));
  const hasilPerSesi = grupPertamaKali(levelResults, (r) => r.session_id);

  const riwayat = sessions
    .filter((s) => s.student_id === studentId)
    .sort((a, b) => String(b.started_at).localeCompare(String(a.started_at)))
    .map((s) => ({
      ...s,
      level_results: (hasilPerSesi.get(s.id) ?? []).slice().sort((a, b) =>
        a.level_number - b.level_number || a.attempt_number - b.attempt_number
      ),
    }));

  return {
    student: {
      id: st.id,
      full_name: st.full_name,
      class_id: st.class_id,
      class_name: classById.get(st.class_id)?.class_name ?? '(kelas tidak dikenal)',
      absence_number: st.absence_number,
      created_at: st.created_at,
    },
    sessions: riwayat,
  };
}
