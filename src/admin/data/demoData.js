// ============================================================================
// demoData.js — DATA SIMULASI (DEMO) untuk dashboard admin SINOVA.
//
// PENTING:
//   - Seluruh isi berkas ini adalah DATA KARANGAN untuk tampilan. TIDAK ada satu
//     pun data siswa nyata di sini.
//   - Nilai selalu diberi label DEMO dan nama siswa sengaja dibuat jelas fiktif
//     ("Siswa Demo NN") supaya tidak disalahartikan sebagai data produksi.
//   - Struktur field MENGIKUTI skema yang terverifikasi (gen types):
//       classes(id, class_name)
//       students(id, full_name, class_id, absence_number, created_at)
//       practice_sessions(id, student_id, status, current_level,
//                         started_at, last_seen_at, completed_at)
//       level_results(id, session_id, level_number, attempt_number, score,
//                     mistakes, duration_seconds, passed, status,
//                     started_at, completed_at)
//   - Status sesi mengikuti domain yang diketahui: in_progress / completed /
//     disconnected. Domain `level_results.status` BELUM TERVERIFIKASI — nilai
//     di sini ('completed'/'incomplete') hanya untuk tampilan demo.
// ============================================================================

export const DEMO_LABEL = 'DEMO';

// Waktu acuan tetap agar data demo deterministik (tidak berubah tiap dijalankan).
export const DEMO_NOW = '2026-10-19T13:00:00.000Z';

const MENIT = 60_000;

// Waktu ISO relatif terhadap DEMO_NOW (menit yang lalu).
export function demoTime(minutesAgo) {
  return new Date(Date.parse(DEMO_NOW) - minutesAgo * MENIT).toISOString();
}

export const DEMO_CLASSES = [
  { id: 1, class_name: 'X TKJ 1' },
  { id: 2, class_name: 'X TKJ 2' },
  { id: 3, class_name: 'X TKJ 3' },
];

// 14 siswa demo: 5 di X TKJ 1, 5 di X TKJ 2, 4 di X TKJ 3.
export const DEMO_STUDENTS = [
  { id: 'demo-stu-01', full_name: 'Siswa Demo 01', class_id: 1, absence_number: 1, created_at: demoTime(20_000) },
  { id: 'demo-stu-02', full_name: 'Siswa Demo 02', class_id: 1, absence_number: 2, created_at: demoTime(20_000) },
  { id: 'demo-stu-03', full_name: 'Siswa Demo 03', class_id: 1, absence_number: 3, created_at: demoTime(19_900) },
  { id: 'demo-stu-04', full_name: 'Siswa Demo 04', class_id: 1, absence_number: 4, created_at: demoTime(19_900) },
  { id: 'demo-stu-05', full_name: 'Siswa Demo 05', class_id: 1, absence_number: 5, created_at: demoTime(19_800) },
  { id: 'demo-stu-06', full_name: 'Siswa Demo 06', class_id: 2, absence_number: 1, created_at: demoTime(19_800) },
  { id: 'demo-stu-07', full_name: 'Siswa Demo 07', class_id: 2, absence_number: 2, created_at: demoTime(19_700) },
  { id: 'demo-stu-08', full_name: 'Siswa Demo 08', class_id: 2, absence_number: 3, created_at: demoTime(19_700) },
  { id: 'demo-stu-09', full_name: 'Siswa Demo 09', class_id: 2, absence_number: 4, created_at: demoTime(19_600) },
  { id: 'demo-stu-10', full_name: 'Siswa Demo 10', class_id: 2, absence_number: 5, created_at: demoTime(19_600) },
  { id: 'demo-stu-11', full_name: 'Siswa Demo 11', class_id: 3, absence_number: 1, created_at: demoTime(19_500) },
  { id: 'demo-stu-12', full_name: 'Siswa Demo 12', class_id: 3, absence_number: 2, created_at: demoTime(19_500) },
  { id: 'demo-stu-13', full_name: 'Siswa Demo 13', class_id: 3, absence_number: 3, created_at: demoTime(19_400) },
  { id: 'demo-stu-14', full_name: 'Siswa Demo 14', class_id: 3, absence_number: 4, created_at: demoTime(19_400) },
];

// Pembuat baris sesi (field sesuai skema practice_sessions).
function sesi(id, student_id, status, current_level, mStart, mSeen, mDone) {
  return {
    id,
    student_id,
    status,
    current_level,
    started_at: demoTime(mStart),
    last_seen_at: demoTime(mSeen),
    completed_at: mDone == null ? null : demoTime(mDone),
  };
}

// Pembuat baris hasil level (field sesuai skema level_results).
function hasilLevel(sessionId, level_number, opsi) {
  const {
    attempt = 1,
    score = null,
    mistakes = 0,
    duration = null,
    passed = false,
    mStart = 0,
    mDone = null,
  } = opsi;
  return {
    id: `${sessionId}-L${level_number}-A${attempt}`,
    session_id: sessionId,
    level_number,
    attempt_number: attempt,
    score,
    mistakes,
    duration_seconds: duration,
    passed,
    status: passed ? 'completed' : 'incomplete',
    started_at: demoTime(mStart),
    completed_at: mDone == null ? null : demoTime(mDone),
  };
}

// 5 level semuanya lulus (sesi selesai).
function hasilLengkap(sessionId, mBase, daftarSkor) {
  return daftarSkor.map((skor, i) =>
    hasilLevel(sessionId, i + 1, {
      score: skor,
      mistakes: i % 2,
      duration: 55 + i * 7,
      passed: true,
      mStart: mBase - (daftarSkor.length - i) * 9,
      mDone: mBase - (daftarSkor.length - i) * 9 + 7,
    })
  );
}

// Sebagian level dicoba (sesi berjalan / terputus).
function hasilSebagian(sessionId, levelTerakhir, mBase, lulusSampai = levelTerakhir) {
  const out = [];
  for (let n = 1; n <= levelTerakhir; n++) {
    out.push(
      hasilLevel(sessionId, n, {
        score: lulusSampai >= n ? 68 + n * 4 : null,
        mistakes: n,
        duration: lulusSampai >= n ? 48 + n * 3 : null,
        passed: lulusSampai >= n,
        mStart: mBase - (levelTerakhir - n) * 8,
        mDone: lulusSampai >= n ? mBase - (levelTerakhir - n) * 8 + 6 : null,
      })
    );
  }
  return out;
}

export const DEMO_SESSIONS = [
  // Siswa Demo 01: satu sesi selesai + satu sesi berjalan.
  sesi('demo-ses-01a', 'demo-stu-01', 'completed', 5, 1_500, 1_320, 1_300),
  sesi('demo-ses-01b', 'demo-stu-01', 'in_progress', 3, 150, 8, null),
  // Siswa Demo 02: sesi selesai.
  sesi('demo-ses-02a', 'demo-stu-02', 'completed', 5, 2_800, 2_620, 2_600),
  // Siswa Demo 03: sesi terputus.
  sesi('demo-ses-03a', 'demo-stu-03', 'disconnected', 2, 3_000, 2_700, null),
  // Siswa Demo 04: sesi berjalan.
  sesi('demo-ses-04a', 'demo-stu-04', 'in_progress', 1, 95, 5, null),
  // Siswa Demo 05: belum pernah bermain (tanpa sesi).
  // Siswa Demo 06: sesi selesai.
  sesi('demo-ses-06a', 'demo-stu-06', 'completed', 5, 4_100, 3_950, 3_930),
  // Siswa Demo 07: sesi berjalan.
  sesi('demo-ses-07a', 'demo-stu-07', 'in_progress', 2, 420, 12, null),
  // Siswa Demo 08: belum pernah bermain.
  // Siswa Demo 09: sesi terputus.
  sesi('demo-ses-09a', 'demo-stu-09', 'disconnected', 3, 5_200, 4_900, null),
  // Siswa Demo 10: sesi selesai.
  sesi('demo-ses-10a', 'demo-stu-10', 'completed', 5, 6_000, 5_840, 5_820),
  // Siswa Demo 11: sesi berjalan.
  sesi('demo-ses-11a', 'demo-stu-11', 'in_progress', 1, 40, 3, null),
  // Siswa Demo 12: belum pernah bermain.
  // Siswa Demo 13: sesi selesai.
  sesi('demo-ses-13a', 'demo-stu-13', 'completed', 5, 7_500, 7_340, 7_320),
  // Siswa Demo 14: belum pernah bermain.
];

export const DEMO_LEVEL_RESULTS = [
  ...hasilLengkap('demo-ses-01a', 1_300, [92, 88, 85, 90, 95]),
  ...hasilSebagian('demo-ses-01b', 3, 8, 2),
  ...hasilLengkap('demo-ses-02a', 2_600, [80, 76, 82, 78, 88]),
  ...hasilSebagian('demo-ses-03a', 2, 2_700, 1),
  ...hasilSebagian('demo-ses-04a', 1, 5, 0),
  ...hasilLengkap('demo-ses-06a', 3_930, [70, 72, 68, 74, 80]),
  ...hasilSebagian('demo-ses-07a', 2, 12, 1),
  ...hasilSebagian('demo-ses-09a', 3, 4_900, 2),
  ...hasilLengkap('demo-ses-10a', 5_820, [85, 90, 88, 92, 94]),
  ...hasilSebagian('demo-ses-11a', 1, 3, 0),
  ...hasilLengkap('demo-ses-13a', 7_320, [78, 80, 84, 86, 90]),
];

export const DEMO_DATA = {
  classes: DEMO_CLASSES,
  students: DEMO_STUDENTS,
  sessions: DEMO_SESSIONS,
  levelResults: DEMO_LEVEL_RESULTS,
};

export default DEMO_DATA;
