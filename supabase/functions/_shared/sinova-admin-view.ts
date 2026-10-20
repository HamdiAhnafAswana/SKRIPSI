// ============================================================================
// sinova-admin-view.ts — fungsi MURNI pembentuk "view model" dashboard admin.
//
// Dipakai server (Edge Function `admin-data`) untuk MENGUBAH baris tabel yang
// terverifikasi menjadi bentuk yang sudah dipakai komponen dashboard. Semantik
// dan nama fungsi/field SENGAJA identik dengan
// `src/admin/lib/dashboardFormat.js` supaya UI tidak perlu ditulis ulang dan
// hasil mode LIVE sama bentuknya dengan mode DEMO.
//
// Berkas ini murni: tanpa import, tanpa I/O, tanpa Deno/DOM. Hanya membaca
// argumen dan mengembalikan objek. Tidak pernah menyentuh token/secret.
//
// Catatan skema (TERVERIFIKASI via `gen types`; JANGAN mengarang kolom):
//   classes(id, class_name)
//   students(id, full_name, class_id, absence_number, created_at)
//   practice_sessions(id, student_id, status, current_level,
//                     started_at, last_seen_at, completed_at)
//   level_results(id, session_id, level_number, attempt_number, score,
//                 mistakes, duration_seconds, passed, status,
//                 started_at, completed_at)
//   → TIDAK ada `level_results.student_id`, TIDAK ada `stars`.
// ============================================================================

export const LEVEL_TOTAL = 5;

export const SESSION_STATUS = {
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  DISCONNECTED: "disconnected",
};

export const STUDENT_STATUS = {
  BELUM_MULAI: "belum_mulai",
  BERJALAN: "berjalan",
  TERPUTUS: "terputus",
  SELESAI: "selesai",
};

// Nilai status sesi yang sah menurut skema yang diaudit.
export const VALID_SESSION_STATUSES = [
  SESSION_STATUS.IN_PROGRESS,
  SESSION_STATUS.COMPLETED,
  SESSION_STATUS.DISCONNECTED,
];

// Nilai status siswa turunan yang sah (dihitung, bukan kolom).
export const VALID_STUDENT_STATUSES = [
  STUDENT_STATUS.BELUM_MULAI,
  STUDENT_STATUS.BERJALAN,
  STUDENT_STATUS.TERPUTUS,
  STUDENT_STATUS.SELESAI,
];

function unique(arr: any[]): any[] {
  return Array.from(new Set(arr));
}

function grupPertamaKali(list: any[], kunci: (item: any) => any): Map<any, any[]> {
  const m = new Map<any, any[]>();
  for (const item of list) {
    const k = kunci(item);
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(item);
  }
  return m;
}

// Status ringkas seorang siswa dari sesi + jumlah level yang lulus.
export function statusSiswa(sesiSiswa: any[], levelsPassed: number): string {
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
export function buildStudentRows(input: any): any[] {
  const { students, classes, sessions, levelResults } = input;
  const classById = new Map<any, any>(classes.map((c: any) => [c.id, c]));
  const sesiPerSiswa = grupPertamaKali(sessions, (s: any) => s.student_id);
  const hasilPerSesi = grupPertamaKali(levelResults, (r: any) => r.session_id);

  return students.map((st: any) => {
    const sesiSiswa = sesiPerSiswa.get(st.id) ?? [];
    const levelLulus = new Set<number>();
    for (const s of sesiSiswa) {
      for (const r of hasilPerSesi.get(s.id) ?? []) {
        if (r.passed === true) levelLulus.add(r.level_number);
      }
    }
    const levelsPassed = levelLulus.size;
    const lastSeen = sesiSiswa.length
      ? sesiSiswa.map((s: any) => s.last_seen_at).sort().slice(-1)[0]
      : null;

    const kelas = classById.get(st.class_id);

    return {
      id: st.id,
      full_name: st.full_name,
      class_id: st.class_id,
      class_name: kelas ? kelas.class_name : "(kelas tidak dikenal)",
      absence_number: st.absence_number,
      created_at: st.created_at,
      sessions_total: sesiSiswa.length,
      sessions_completed: sesiSiswa.filter(
        (s: any) => s.status === SESSION_STATUS.COMPLETED,
      ).length,
      levels_passed: levelsPassed,
      level_total: LEVEL_TOTAL,
      progress_percent: Math.round(
        (Math.min(LEVEL_TOTAL, levelsPassed) / LEVEL_TOTAL) * 100,
      ),
      last_activity_at: lastSeen,
      status: statusSiswa(sesiSiswa, levelsPassed),
    };
  });
}

// Filter daftar siswa: pencarian teks, kelas, dan status.
export function filterStudents(rows: any[], opsi: any = {}): any[] {
  const q = opsi.q ?? "";
  const classId = opsi.classId ?? "";
  const status = opsi.status ?? "";
  const cari = String(q).trim().toLowerCase();
  return rows.filter((r: any) => {
    if (classId !== "" && classId !== null && String(r.class_id) !== String(classId)) {
      return false;
    }
    if (status && r.status !== status) return false;
    if (cari) {
      const hay = `${r.full_name} ${r.class_name} ${r.absence_number}`.toLowerCase();
      if (!hay.includes(cari)) return false;
    }
    return true;
  });
}

// Paginasi dengan penjepitan halaman agar selalu valid.
export function paginate(list: any[], page = 1, pageSize = 10): any {
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

// Ringkasan dashboard (agregat; tidak memuat detail pribadi).
export function computeSummary(input: any): any {
  const { students, sessions, levelResults } = input;
  const sesiById = new Map<any, any>(sessions.map((s: any) => [s.id, s]));
  const hitung = (st: string) => sessions.filter((s: any) => s.status === st).length;

  const levelLulusPerSiswa = new Map<any, Set<number>>();
  for (const r of levelResults) {
    if (r.passed !== true) continue;
    const s = sesiById.get(r.session_id);
    if (!s) continue;
    if (!levelLulusPerSiswa.has(s.student_id)) {
      levelLulusPerSiswa.set(s.student_id, new Set<number>());
    }
    levelLulusPerSiswa.get(s.student_id)!.add(r.level_number);
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
    const dicoba = new Set<string>();
    const lulus = new Set<string>();
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
export function buildSessionRows(input: any): any[] {
  const { sessions, students, classes, levelResults } = input;
  const classById = new Map<any, any>(classes.map((c: any) => [c.id, c]));
  const siswaById = new Map<any, any>(students.map((s: any) => [s.id, s]));
  const hasilPerSesi = grupPertamaKali(levelResults, (r: any) => r.session_id);

  return sessions
    .map((s: any) => {
      const st = siswaById.get(s.student_id);
      const hasil = hasilPerSesi.get(s.id) ?? [];
      return {
        id: s.id,
        student_id: s.student_id,
        student_name: st ? st.full_name : "(siswa tidak dikenal)",
        class_id: st ? st.class_id : null,
        class_name: st ? (classById.get(st.class_id)?.class_name ?? "") : "",
        absence_number: st ? st.absence_number : null,
        status: s.status,
        current_level: s.current_level,
        level_total: LEVEL_TOTAL,
        started_at: s.started_at,
        last_seen_at: s.last_seen_at,
        completed_at: s.completed_at,
        levels_attempted: unique(hasil.map((r: any) => r.level_number)).length,
        levels_passed: unique(
          hasil.filter((r: any) => r.passed === true).map((r: any) => r.level_number),
        ).length,
      };
    })
    .sort((a: any, b: any) =>
      String(b.last_seen_at).localeCompare(String(a.last_seen_at))
    );
}

// Detail satu siswa: identitas + riwayat sesi + hasil per level.
export function buildStudentDetail(input: any): any {
  const { studentId, students, classes, sessions, levelResults } = input;
  const st = students.find((s: any) => s.id === studentId);
  if (!st) return null;
  const classById = new Map<any, any>(classes.map((c: any) => [c.id, c]));
  const hasilPerSesi = grupPertamaKali(levelResults, (r: any) => r.session_id);

  const riwayat = sessions
    .filter((s: any) => s.student_id === studentId)
    .sort((a: any, b: any) =>
      String(b.started_at).localeCompare(String(a.started_at))
    )
    .map((s: any) => ({
      ...s,
      level_results: (hasilPerSesi.get(s.id) ?? []).slice().sort(
        (a: any, b: any) =>
          a.level_number - b.level_number || a.attempt_number - b.attempt_number,
      ),
    }));

  return {
    student: {
      id: st.id,
      full_name: st.full_name,
      class_id: st.class_id,
      class_name: classById.get(st.class_id)?.class_name ?? "(kelas tidak dikenal)",
      absence_number: st.absence_number,
      created_at: st.created_at,
    },
    sessions: riwayat,
  };
}
