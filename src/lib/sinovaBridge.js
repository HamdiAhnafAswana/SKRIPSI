// ============================================================================
// sinovaBridge.js — jembatan antara engine game klasik (public/game/**) dan
// helper sesi SINOVA (src/lib/practiceSession.js).
//
// Mengapa jembatan ini ada:
//   Engine game dimuat oleh App.jsx sebagai <script> KLASIK (lihat
//   GAME_SCRIPTS) sehingga berjalan di scope global dan TIDAK dapat
//   meng-import modul ES. Jembatan ini dipasang ke `window.SINOVA_BACKEND`
//   dan hanya mengekspos FUNGSI. Token TIDAK pernah ditaruh di global:
//   token tetap dibaca dari localStorage oleh helper dan dikirim hanya lewat
//   header `x-sinova-token`. Tidak ada service-role key di sisi klien.
//
// Tanggung jawab:
//   - SATU sesi backend per "run" permainan (tidak membuat sesi baru setiap
//     pindah/ulang level, dan TIDAK PERNAH membuat sesi baru otomatis pada 401),
//   - kirim hasil level lewat `sendResult()` (idempoten lewat `resultId`) plus
//     antrean pending lokal,
//   - kirim ulang MANUAL (tanpa retry otomatis tanpa batas).
//
// Identitas server selalu berasal dari token yang diverifikasi server, bukan
// dari nilai `student_id` yang dikirim browser (nilai itu hanya lintas-cek).
// ============================================================================

import {
  startSession,
  sendProgress,
  completeSession,
  sendResult,
  getStoredToken,
  needsReRegistration,
  generateResultId,
  SESSION_STATUS,
} from './practiceSession.js';

// Nama global yang dipasang ke `window`. Sengaja eksplisit dan tanpa rahasia.
export const BRIDGE_GLOBAL = 'SINOVA_BACKEND';

// Antrean hasil yang belum terkonfirmasi server. Dipisah dari `netcrimp_v1`
// (progres engine) karena ini murni data sinkronisasi SINOVA — sejalan dengan
// key `sinova_*` lain yang sudah dipakai proyek.
export const PENDING_KEY = 'sinova_pending_results';

const MAX_PENDING = 50; // batas antrean agar localStorage tidak membengkak
const LEVEL_MIN = 1;
const LEVEL_MAX = 5;
const DURASI_MAX = 86400; // batas wajar server (detik)

// --- state sesi (per muat halaman = satu "run" permainan) -------------------
let currentSessionId = '';
let sessionCompleted = false;
let lastSessionStatus = 'idle';
let sessionInFlight = null;
// Token yang terakhir membuat pembuatan sesi gagal karena autentikasi. Selama
// token tersimpan masih sama, jembatan TIDAK mencoba membuat sesi baru lagi
// (mencegah pengulangan tanpa henti setelah 401). Bila siswa mendaftar ulang
// sehingga token berubah, percobaan diizinkan kembali.
let sesiGagalToken = null;

const AUTH_GAGAL = new Set([
  SESSION_STATUS.MISSING_IDENTITY,
  SESSION_STATUS.MISSING_TOKEN,
  SESSION_STATUS.UNAUTHORIZED,
]);

// --- antrean pending (cache memori + localStorage) --------------------------
let pendingCache = null;

function aman(fn, fallback) {
  try {
    return fn();
  } catch (e) {
    return fallback;
  }
}

function bulat(v, min, max) {
  const n = typeof v === 'number' && Number.isFinite(v) ? v : 0;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function batasLevel(n) {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return LEVEL_MIN;
  return Math.min(LEVEL_MAX, Math.max(LEVEL_MIN, v));
}

// Mengubah data mentah menjadi bentuk kanonik + membatasi nilai agar tidak
// pernah mengirim payload yang jelas ditolak server.
function normalkan(item) {
  if (!item || typeof item !== 'object') return null;
  const resultId = typeof item.resultId === 'string' ? item.resultId.trim() : '';
  if (!resultId) return null;
  return {
    resultId,
    sessionId: typeof item.sessionId === 'string' ? item.sessionId : '',
    level: batasLevel(item.level),
    score: bulat(item.score, 0, 100),
    mistakes: bulat(item.mistakes, 0, 100000),
    durationSeconds: bulat(item.durationSeconds, 0, DURASI_MAX),
    passed: item.passed === true,
    ts: bulat(item.ts, 0, Number.MAX_SAFE_INTEGER),
    attempts: bulat(item.attempts, 0, 1000000),
    lastStatus: typeof item.lastStatus === 'string' ? item.lastStatus : '',
  };
}

export function bacaPending() {
  if (pendingCache) return pendingCache;
  const data = aman(() => {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.map(normalkan).filter(Boolean) : [];
  }, []);
  pendingCache = data.slice(0, MAX_PENDING);
  return pendingCache;
}

export function tulisPending(daftar) {
  const bersih = (Array.isArray(daftar) ? daftar : [])
    .map(normalkan)
    .filter(Boolean)
    .slice(0, MAX_PENDING);
  pendingCache = bersih;
  aman(() => {
    if (bersih.length) localStorage.setItem(PENDING_KEY, JSON.stringify(bersih));
    else localStorage.removeItem(PENDING_KEY);
  }, null);
  return bersih;
}

export function jumlahPending() {
  return bacaPending().length;
}

function catatPending(item) {
  const baru = normalkan(item);
  if (!baru) return;
  const daftar = bacaPending().slice();
  const idx = daftar.findIndex((x) => x.resultId === baru.resultId);
  if (idx >= 0) daftar[idx] = Object.assign({}, daftar[idx], baru);
  else daftar.push(baru);
  tulisPending(daftar);
}

function hapusPending(resultId) {
  tulisPending(bacaPending().filter((x) => x.resultId !== resultId));
}

// Pesan ramah untuk siswa — TIDAK memuat stack trace/detail internal.
function pesanRamah(status) {
  switch (status) {
    case SESSION_STATUS.MISSING_IDENTITY:
      return 'Identitas siswa belum ada. Daftar dulu agar hasil tersimpan di server.';
    case SESSION_STATUS.MISSING_TOKEN:
      return 'Token identitas belum ada. Daftar ulang, lalu kirim ulang hasil.';
    case SESSION_STATUS.UNAUTHORIZED:
      return 'Sesi tidak valid atau kedaluwarsa. Silakan daftar ulang, lalu kirim ulang.';
    case SESSION_STATUS.CONFIG_ERROR:
      return 'Layanan belum siap. Hasil disimpan di perangkat ini.';
    case SESSION_STATUS.BAD_REQUEST:
      return 'Data hasil tidak diterima server. Hasil tetap tersimpan di perangkat.';
    case SESSION_STATUS.NOT_FOUND:
      return 'Sesi tidak ditemukan. Hasil disimpan di perangkat ini.';
    case SESSION_STATUS.CONFLICT:
      return 'Hasil tidak dapat dikirim saat ini. Coba lagi nanti.';
    case SESSION_STATUS.NETWORK_ERROR:
      return 'Tidak dapat menghubungi server. Hasil disimpan di perangkat ini.';
    default:
      return 'Belum dapat menyimpan ke server. Hasil disimpan di perangkat ini.';
  }
}

// --- sesi ------------------------------------------------------------------

async function buatSesi(level) {
  const hasil = await startSession({ level: batasLevel(level) });
  if (hasil && hasil.ok === true && typeof hasil.sessionId === 'string' && hasil.sessionId) {
    currentSessionId = hasil.sessionId;
    sessionCompleted = false;
    lastSessionStatus = SESSION_STATUS.OK;
    sesiGagalToken = null;
    return {
      ok: true,
      dibuat: true,
      sessionId: currentSessionId,
      status: SESSION_STATUS.OK,
      message: hasil.message || '',
    };
  }
  currentSessionId = '';
  lastSessionStatus = hasil?.status ?? SESSION_STATUS.SERVER_ERROR;
  // Catat kegagalan autentikasi agar tidak diulang dengan token yang sama.
  sesiGagalToken = AUTH_GAGAL.has(lastSessionStatus) ? (getStoredToken() || '') : null;
  return {
    ok: false,
    dibuat: false,
    sessionId: '',
    status: lastSessionStatus,
    message: hasil?.message || pesanRamah(lastSessionStatus),
  };
}

/**
 * Memastikan ada SATU sesi aktif. Idempoten: bila sesi sudah ada, tidak
 * membuat yang baru. Panggilan bersamaan digabung (dedupe) lewat `sessionInFlight`.
 * TIDAK PERNAH membuat sesi baru otomatis berulang setelah 401: selama token
 * tersimpan tidak berubah, percobaan pembuatan sesi tidak diulang.
 */
export async function ensureSession(level = LEVEL_MIN) {
  if (currentSessionId && !sessionCompleted) {
    return { ok: true, dibuat: false, sessionId: currentSessionId, status: SESSION_STATUS.OK, message: '' };
  }
  if (sesiGagalToken !== null && sesiGagalToken === (getStoredToken() || '')) {
    // Gagal karena autentikasi & token belum berubah → jangan coba lagi.
    return {
      ok: false,
      dibuat: false,
      sessionId: '',
      status: lastSessionStatus,
      message: pesanRamah(lastSessionStatus),
    };
  }
  if (sessionInFlight) return await sessionInFlight;
  sessionInFlight = buatSesi(level);
  try {
    return await sessionInFlight;
  } finally {
    sessionInFlight = null;
  }
}

/**
 * Dipanggil engine saat siswa memulai sebuah level.
 * - Membuat sesi bila belum ada (sekali saja untuk seluruh "run").
 * - Bila sesi sudah ada, mengirim progres level.
 * - Sesi yang hilang/tidak aktif (404/409) membuat sesi baru; 401 TIDAK.
 */
export async function beginLevel(level) {
  const lvl = batasLevel(level);
  const sesi = await ensureSession(lvl);
  if (!sesi.ok) return { ok: false, status: sesi.status, message: pesanRamah(sesi.status) };
  if (sesi.dibuat) return { ok: true, status: SESSION_STATUS.OK, sessionId: sesi.sessionId };

  const hasil = await sendProgress({ sessionId: sesi.sessionId, level: lvl });
  if (hasil.ok) return { ok: true, status: SESSION_STATUS.OK, sessionId: sesi.sessionId };

  // Hanya sesi yang benar-benar hilang/tidak aktif yang dipulihkan. 401 tidak.
  if (hasil.status === SESSION_STATUS.NOT_FOUND || hasil.status === SESSION_STATUS.CONFLICT) {
    currentSessionId = '';
    sessionCompleted = false;
    const ulang = await ensureSession(lvl);
    if (ulang.ok) return { ok: true, status: SESSION_STATUS.OK, sessionId: ulang.sessionId, dibuat: true };
    return { ok: false, status: ulang.status, message: pesanRamah(ulang.status) };
  }
  return { ok: false, status: hasil.status, message: pesanRamah(hasil.status) };
}

/**
 * Menutup sesi ("run" selesai). Setelah ini sesi dianggap tuntas sehingga
 * level berikutnya akan memulai sesi baru.
 */
export async function finish() {
  if (!currentSessionId) return { ok: false, status: 'no_session' };
  const sid = currentSessionId;
  const hasil = await completeSession({ sessionId: sid });
  if (hasil.ok) {
    currentSessionId = '';
    sessionCompleted = true;
    lastSessionStatus = 'completed';
    return { ok: true, status: SESSION_STATUS.OK };
  }
  if (hasil.status === SESSION_STATUS.NOT_FOUND) {
    // Sesi sudah tidak ada di server → perlakukan sebagai tuntas.
    currentSessionId = '';
    sessionCompleted = true;
    lastSessionStatus = 'completed';
    return { ok: false, status: hasil.status };
  }
  return { ok: false, status: hasil.status };
}

/**
 * Mengirim hasil satu level. `resultId` wajib dibuat sekali di engine dan
 * dipakai ulang untuk pengiriman ulang (idempoten).
 *
 * Sukses HANYA bila server mengembalikan `result.id` yang sama dengan yang
 * dikirim. Selain itu hasil dimasukkan ke antrean pending dan dilaporkan gagal.
 */
export async function submitResult(input) {
  const bersih = normalkan(input);
  if (!bersih) {
    return { ok: false, status: SESSION_STATUS.BAD_REQUEST, pending: false, message: 'Data hasil tidak valid.' };
  }

  const sesi = await ensureSession(bersih.level);
  const sessionId = sesi.ok ? sesi.sessionId : '';

  let hasil;
  if (sessionId) {
    hasil = await sendResult({
      sessionId,
      resultId: bersih.resultId,
      level: bersih.level,
      score: bersih.score,
      mistakes: bersih.mistakes,
      durationSeconds: bersih.durationSeconds,
      passed: bersih.passed,
    });
  } else {
    hasil = { ok: false, status: sesi.status, message: pesanRamah(sesi.status) };
  }

  if (hasil.ok === true && hasil.result && hasil.result.id === bersih.resultId) {
    hapusPending(bersih.resultId);
    return { ok: true, status: SESSION_STATUS.OK, pending: false, message: hasil.message || '', reused: hasil.reused === true };
  }

  catatPending(Object.assign({}, bersih, { sessionId, lastStatus: hasil.status }));
  return {
    ok: false,
    status: hasil.status,
    pending: true,
    message: hasil.message || pesanRamah(hasil.status),
  };
}

/**
 * Kirim ulang SEMUA hasil pending, sekali jalan per pemanggilan (manual).
 * Tidak ada loop/retry otomatis. Entri yang masih gagal tetap tersimpan.
 */
export async function resendPending() {
  const daftar = bacaPending().slice();
  if (!daftar.length) return { ok: true, terkirim: 0, gagal: 0, sisa: 0 };

  const sesi = await ensureSession(LEVEL_MIN);
  const sesiId = sesi.ok ? sesi.sessionId : '';

  let terkirim = 0;
  let gagal = 0;
  const sisa = [];

  for (const item of daftar) {
    const sessionId = item.sessionId || sesiId;
    if (!sessionId) {
      sisa.push(Object.assign({}, item, { attempts: item.attempts + 1, lastStatus: sesi.status }));
      gagal++;
      continue;
    }
    const hasil = await sendResult({
      sessionId,
      resultId: item.resultId,
      level: item.level,
      score: item.score,
      mistakes: item.mistakes,
      durationSeconds: item.durationSeconds,
      passed: item.passed,
    });
    if (hasil.ok === true && hasil.result && hasil.result.id === item.resultId) {
      terkirim++;
    } else {
      sisa.push(Object.assign({}, item, { sessionId, attempts: item.attempts + 1, lastStatus: hasil.status }));
      gagal++;
    }
  }

  tulisPending(sisa);
  return { ok: gagal === 0, terkirim, gagal, sisa: sisa.length };
}

// Ringkasan status untuk UI game (tanpa rahasia).
export function status() {
  const tanpaToken = aman(() => needsReRegistration(), true);
  return {
    hasSession: !!currentSessionId,
    sessionCompleted,
    sessionStatus: lastSessionStatus,
    pending: jumlahPending(),
    // Daftar ulang diperlukan bila token belum ada ATAU token ditolak server.
    needsReRegistration: tanpaToken || lastSessionStatus === SESSION_STATUS.UNAUTHORIZED,
  };
}

// Objek yang dipasang ke window. HANYA fungsi + data status — tanpa token.
const api = {
  version: 1,
  beginLevel,
  submitResult,
  finish,
  newResultId: generateResultId,
  pendingCount: jumlahPending,
  resendPending,
  status,
  SESSION_STATUS,
};

/**
 * Memasang jembatan ke `window` (idempoten). Dipanggil App.jsx sebelum skrip
 * engine dimuat. Menolak memasang bila tidak ada target (mis. saat diuji di Node).
 */
export function installSinovaBridge(target) {
  const t = target || (typeof window !== 'undefined' ? window : null);
  if (!t) return null;
  t[BRIDGE_GLOBAL] = api;
  return api;
}

export default api;
