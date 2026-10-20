// ============================================================================
// practiceSession.js — jembatan frontend ke Edge Function `practice-session`
//
// Tugas  : mencatat sesi praktik siswa (start / progress / complete) dan hasil
//          tiap level (result) dengan token identitas HMAC pada header
//          `x-sinova-token` (BUKAN query string, bukan body).
//
// Prinsip:
//   - TIDAK ada retry otomatis dan TIDAK ada pembuatan sesi baru otomatis,
//     khususnya setelah 401 — pemanggil yang memutuskan langkah berikutnya.
//     Untuk `result`, percobaan ulang aman selama `resultId` yang sama dipakai
//     (server idempoten lewat primary key).
//   - Kegagalan TIDAK pernah dilaporkan sebagai sukses.
//   - Token/secret tidak pernah dicetak ke console dan tidak pernah masuk URL.
//   - Bila token tidak tersedia, permintaan tidak dikirim sama sekali dan
//     status `missing_token` dikembalikan supaya siswa diarahkan mendaftar
//     ulang secara terarah (token tidak pernah dikarang).
//
// Catatan keamanan: token tersimpan di localStorage bersama identitas
// (`sinova_student`) sehingga dapat dicuri lewat XSS. Penyimpanan ini BUKAN
// perlindungan sempurna; jangan memperluas penggunaan token ke tempat lain.
// ============================================================================

import { supabase } from './supabase';

export const PRACTICE_SESSION_FUNCTION = 'practice-session';

// HARUS sama dengan STUDENT_KEY di App.jsx ('sinova_student'). Disalin, bukan
// diimpor, agar App.jsx tidak perlu diubah hanya demi token.
export const STUDENT_STORAGE_KEY = 'sinova_student';

// Status hasil yang mungkin dikembalikan helper ini.
export const SESSION_STATUS = {
  OK: 'ok', // sukses, data sesi dari server tersedia
  MISSING_IDENTITY: 'missing_identity', // studentId belum ada (belum daftar)
  MISSING_TOKEN: 'missing_token', // identitas ada tetapi token belum ada
  UNAUTHORIZED: 'unauthorized', // 401/403: token tidak valid / tidak diterima
  CONFIG_ERROR: 'config_error', // 500: konfigurasi layanan belum siap
  BAD_REQUEST: 'bad_request', // 400: payload ditolak server
  NOT_FOUND: 'not_found', // 404: sesi tidak ditemukan / bukan milik siswa
  CONFLICT: 'conflict', // 409: status sesi tidak memungkinkan aksi
  NETWORK_ERROR: 'network_error', // permintaan tidak sampai ke server
  SERVER_ERROR: 'server_error', // 5xx lain / respons tidak sesuai kontrak
};

const PESAN = {
  [SESSION_STATUS.MISSING_IDENTITY]:
    'Identitas siswa belum tersedia. Silakan daftar terlebih dahulu.',
  [SESSION_STATUS.MISSING_TOKEN]:
    'Token identitas belum tersedia. Silakan daftar ulang untuk memperbaruinya.',
  [SESSION_STATUS.UNAUTHORIZED]:
    'Token identitas tidak valid atau kedaluwarsa. Silakan daftar ulang.',
  [SESSION_STATUS.CONFIG_ERROR]:
    'Layanan pencatatan sesi belum siap. Coba lagi nanti.',
  [SESSION_STATUS.BAD_REQUEST]: 'Data sesi praktik tidak valid.',
  [SESSION_STATUS.NOT_FOUND]: 'Sesi praktik tidak ditemukan.',
  [SESSION_STATUS.CONFLICT]: 'Sesi praktik tidak dapat diperbarui.',
  [SESSION_STATUS.NETWORK_ERROR]:
    'Tidak dapat menghubungi layanan. Periksa koneksi internet.',
  [SESSION_STATUS.SERVER_ERROR]: 'Gagal mencatat sesi praktik. Coba lagi.',
};

// Hasil gagal. Tidak pernah memuat token/secret.
function gagal(status, tambahan = {}) {
  return {
    ok: false,
    status,
    message: PESAN[status] ?? PESAN[SESSION_STATUS.SERVER_ERROR],
    session: null,
    result: null,
    reused: false,
    ...tambahan,
  };
}

// --- identitas tersimpan (localStorage) -------------------------------------a

export function getStoredIdentity() {
  try {
    const raw = localStorage.getItem(STUDENT_STORAGE_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (!d || typeof d !== 'object') return null;
    return {
      nama: typeof d.nama === 'string' ? d.nama : '',
      kelas: typeof d.kelas === 'string' ? d.kelas : '',
      absen: d.absen ?? '',
      studentId: typeof d.studentId === 'string' ? d.studentId : '',
      // Identitas lama (pra-token) tetap valid untuk bermain, token = ''.
      token: typeof d.token === 'string' ? d.token : '',
    };
  } catch {
    return null;
  }
}

export function getStoredToken() {
  const identitas = getStoredIdentity();
  return identitas && identitas.token ? identitas.token : '';
}

// Identitas lama tanpa token TIDAK dihapus otomatis. Helper hanya melaporkan
// bahwa pendaftaran ulang diperlukan; alur "Muat Ulang" di dashboard sudah
// membuka kembali form identitas sehingga siswa dapat memperoleh token baru.
export function needsReRegistration(identitas = getStoredIdentity()) {
  return !identitas || identitas.token === '';
}

// --- util ------------------------------------------------------------------

// UUID v4 untuk session_id (dipakai agar `start` idempoten saat diulang).
export function generateSessionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

// UUID v4 untuk `result_id`. Dibuat SEKALI oleh pemanggil per percobaan level,
// lalu dipakai ulang saat mencoba ulang agar server mengenali pengiriman ganda
// (idempoten lewat primary key). Memakai generator UUID yang sama.
export function generateResultId() {
  return generateSessionId();
}

function statusDariHttp(httpStatus) {
  switch (httpStatus) {
    case 400:
      return SESSION_STATUS.BAD_REQUEST;
    case 401:
    case 403:
      return SESSION_STATUS.UNAUTHORIZED;
    case 404:
      return SESSION_STATUS.NOT_FOUND;
    case 409:
      return SESSION_STATUS.CONFLICT;
    case 500:
      return SESSION_STATUS.CONFIG_ERROR;
    default:
      return SESSION_STATUS.SERVER_ERROR;
  }
}

function httpStatusDariError(error) {
  const res = error && error.context;
  return res && typeof res.status === 'number' ? res.status : null;
}

// --- pemanggilan inti -------------------------------------------------------

async function kirim(action, payload, token, jenis = 'session') {
  // Klien Supabase tidak tersedia bila konfigurasi build tidak lengkap.
  // Dilaporkan sebagai kegagalan layanan (bukan crash) tanpa mengarang sesi.
  if (!supabase) return gagal(SESSION_STATUS.CONFIG_ERROR);

  const siswanya = payload && typeof payload.student_id === 'string' ? payload.student_id : '';
  if (!siswanya) return gagal(SESSION_STATUS.MISSING_IDENTITY);

  const tok = typeof token === 'string' && token.trim() !== ''
    ? token
    : getStoredToken();

  if (!tok) return gagal(SESSION_STATUS.MISSING_TOKEN);

  let hasil;
  try {
    // Token HANYA lewat header — tidak pernah di URL/query string.
    hasil = await supabase.functions.invoke(PRACTICE_SESSION_FUNCTION, {
      body: { action, ...payload },
      headers: { 'x-sinova-token': tok },
    });
  } catch (err) {
    // Termasuk kegagalan jaringan / fungsi tidak tersedia.
    return gagal(SESSION_STATUS.NETWORK_ERROR, { errorName: err?.name ?? 'Error' });
  }

  const { data, error } = hasil ?? {};

  if (error) {
    const httpStatus = httpStatusDariError(error);
    // Tanpa respons HTTP = kegagalan jaringan (bukan kesalahan server).
    const status = httpStatus === null
      ? SESSION_STATUS.NETWORK_ERROR
      : statusDariHttp(httpStatus);
    return gagal(status, {
      httpStatus,
      errorName: typeof error.name === 'string' ? error.name : 'FunctionsError',
    });
  }

  // Aksi `result`: sukses hanya bila server benar-benar mengembalikan baris hasil.
  if (jenis === 'result') {
    if (!data || typeof data !== 'object' || !data.result || typeof data.result.id !== 'string') {
      return gagal(SESSION_STATUS.SERVER_ERROR);
    }
    return {
      ok: true,
      status: SESSION_STATUS.OK,
      message: typeof data.message === 'string' ? data.message : '',
      session: null,
      result: data.result,
      reused: data.reused === true,
      httpStatus: 200,
    };
  }

  // Sukses hanya bila server benar-benar mengembalikan baris sesi.
  if (!data || typeof data !== 'object' || !data.session || typeof data.session.id !== 'string') {
    return gagal(SESSION_STATUS.SERVER_ERROR);
  }

  return {
    ok: true,
    status: SESSION_STATUS.OK,
    message: typeof data.message === 'string' ? data.message : '',
    session: data.session,
    reused: data.reused === true,
    httpStatus: 200,
  };
}

function badanAksi({ sessionId, studentId, level }) {
  const body = { session_id: sessionId, student_id: studentId };
  if (typeof level === 'number') body.current_level = level;
  return body;
}

// --- API publik -------------------------------------------------------------

/**
 * Memulai (atau mengulang, idempoten) sesi praktik.
 * Mengembalikan `sessionId` yang dipakai agar pemanggil dapat menyimpannya
 * dan memakainya untuk progress/complete.
 */
export async function startSession(options = {}) {
  const { sessionId, studentId, level, token } = options;
  const sid = sessionId || generateSessionId();
  const siswa = studentId || (getStoredIdentity()?.studentId ?? '');
  const hasil = await kirim('start', badanAksi({ sessionId: sid, studentId: siswa, level }), token);
  return { ...hasil, sessionId: sid };
}

/**
 * Mengirim progres level pada sesi in_progress milik siswa.
 * Tidak pernah membuat sesi baru, tidak mengulang permintaan.
 */
export async function sendProgress(options = {}) {
  const { sessionId, studentId, level, token } = options;
  const siswa = studentId || (getStoredIdentity()?.studentId ?? '');
  return await kirim('progress', badanAksi({ sessionId, studentId: siswa, level }), token);
}

/**
 * Menutup sesi praktik (idempoten di server untuk pengulangan yang sama).
 * Tidak pernah membuat sesi baru, tidak mengulang permintaan.
 */
export async function completeSession(options = {}) {
  const { sessionId, studentId, token } = options;
  const siswa = studentId || (getStoredIdentity()?.studentId ?? '');
  return await kirim('complete', badanAksi({ sessionId, studentId: siswa }), token);
}

/**
 * Mengirim hasil SATU level ke server (`level_results`).
 *
 * `resultId` WAJIB dibuat sekali di pemanggil (mis. `generateResultId()`) dan
 * dipakai ulang bila pengiriman harus diulang: server memakainya sebagai
 * primary key sehingga pengiriman ganda tidak membuat baris baru. Helper ini
 * TIDAK pernah mengulang permintaan sendiri dan TIDAK pernah membuat sesi baru;
 * pemanggil hanya boleh menandai hasil "tersimpan" bila `ok === true`.
 */
export async function sendResult(options = {}) {
  const {
    sessionId,
    studentId,
    resultId,
    level,
    score,
    mistakes,
    durationSeconds,
    passed,
    token,
  } = options;
  const siswa = studentId || (getStoredIdentity()?.studentId ?? '');
  const body = {
    session_id: sessionId,
    student_id: siswa,
    result_id: resultId,
    level_number: level,
    score,
    mistakes,
    duration_seconds: durationSeconds,
    passed,
  };
  return await kirim('result', body, token, 'result');
}

const practiceSession = { startSession, sendProgress, completeSession, sendResult, getStoredIdentity, getStoredToken, needsReRegistration, generateSessionId, generateResultId, SESSION_STATUS, STUDENT_STORAGE_KEY, PRACTICE_SESSION_FUNCTION };
export default practiceSession;
