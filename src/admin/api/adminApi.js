// ============================================================================
// adminApi.js — ADAPTER dashboard admin.
//
// Kontrak respons (sama untuk mode demo maupun live):
//   Sukses : { ok: true,  data: <T>, meta: {...} | null }
//   Gagal  : { ok: false, code: 'unauthorized' | 'forbidden' | 'not_found'
//                    | 'network' | 'server' | 'bad_request' | 'unknown',
//              status?: number }
//
// ATURAN KEAMANAN:
//   - Mode LIVE HANYA memanggil Edge Function (`admin-data`), TIDAK PERNAH
//     membaca tabel siswa langsung dari browser.
//   - Token admin dikirim lewat header Authorization; role TIDAK pernah diambil
//     dari body/user_metadata — server yang menentukan (lein `admin-check`).
//   - 401/403/kegagalan jaringan/kegagalan server DIBEDAKAN dan TIDAK pernah
//     dilaporkan sebagai sukses.
//   - 401 dari endpoint data berarti sesi admin tidak valid → pemanggil harus
//     memicu pemeriksaan ulang sesi (bukan menampilkan data).
//
// Mode DEMO memakai data simulasi (src/admin/data/demoData.js) yang selalu
// dilabeli DEMO dan tidak pernah menyentuh jaringan.
// ============================================================================

import { DEMO_DATA, DEMO_LABEL } from '../data/demoData.js';
import {
  DATA_ERROR,
  buildSessionRows,
  buildStudentDetail,
  buildStudentRows,
  computeSummary,
  filterStudents,
  paginate,
} from '../lib/dashboardFormat.js';

export const ADMIN_API_MODE = { DEMO: 'demo', LIVE: 'live' };

// Nama Edge Function data admin yang DIUSULKAN (belum dideploy).
export const ADMIN_DATA_FUNCTION = 'admin-data';

export { DATA_ERROR };

export function ok(data, meta = null) {
  return { ok: true, data, meta };
}

export function gagal(code, extra = null) {
  return { ok: false, code, ...(extra ?? {}) };
}

// Menentukan kode kesalahan dari error `supabase.functions.invoke`.
export function klasifikasiError(error) {
  const status = error && error.context && typeof error.context.status === 'number'
    ? error.context.status
    : null;
  if (status === 401) return gagal(DATA_ERROR.UNAUTHORIZED, { status });
  if (status === 403) return gagal(DATA_ERROR.FORBIDDEN, { status });
  if (status === 404) return gagal(DATA_ERROR.NOT_FOUND, { status });
  if (status === null) return gagal(DATA_ERROR.NETWORK); // tanpa respons HTTP
  if (status >= 500) return gagal(DATA_ERROR.SERVER, { status });
  if (status >= 400) return gagal(DATA_ERROR.BAD_REQUEST, { status });
  return gagal(DATA_ERROR.UNKNOWN, { status });
}

// ---------------------------------------------------------------------------
// Adapter DEMO (default). Data simulasi, tanpa jaringan.
// ---------------------------------------------------------------------------
export function createDemoAdminApi() {
  const sumber = DEMO_DATA;
  return {
    mode: ADMIN_API_MODE.DEMO,
    isDemo: true,
    label: DEMO_LABEL,

    async getSummary() {
      return ok(computeSummary(sumber), { demo: true });
    },

    async listStudents({ q = '', classId = '', status = '', page = 1, pageSize = 10 } = {}) {
      const semua = buildStudentRows(sumber);
      const tersaring = filterStudents(semua, { q, classId, status });
      const { items, meta } = paginate(tersaring, page, pageSize);
      return ok(items, { ...meta, demo: true, filtered: tersaring.length });
    },

    async getStudent(studentId) {
      const detail = buildStudentDetail({ studentId, ...sumber });
      if (!detail) return gagal(DATA_ERROR.NOT_FOUND);
      return ok(detail, { demo: true });
    },

    async listSessions({ status = '', classId = '', page = 1, pageSize = 10 } = {}) {
      let baris = buildSessionRows(sumber);
      if (status) baris = baris.filter((r) => r.status === status);
      if (classId !== '' && classId !== null) {
        baris = baris.filter((r) => String(r.class_id) === String(classId));
      }
      const { items, meta } = paginate(baris, page, pageSize);
      return ok(items, { ...meta, demo: true, filtered: baris.length });
    },

    async listClasses() {
      return ok(sumber.classes.slice(), { demo: true });
    },
  };
}

// ---------------------------------------------------------------------------
// Adapter LIVE (dirancang, belum diaktifkan). Hanya memanggil Edge Function.
// ---------------------------------------------------------------------------
export function createLiveAdminApi({ invoke, getToken, functionName = ADMIN_DATA_FUNCTION } = {}) {
  async function panggil(body) {
    if (typeof invoke !== 'function') return gagal(DATA_ERROR.SERVER);

    let headers = {};
    try {
      const token = typeof getToken === 'function' ? await getToken() : '';
      if (typeof token === 'string' && token) {
        headers = { Authorization: `Bearer ${token}` };
      }
    } catch {
      return gagal(DATA_ERROR.NETWORK);
    }

    let hasil;
    try {
      hasil = await invoke(functionName, { headers, body });
    } catch {
      return gagal(DATA_ERROR.NETWORK);
    }

    const { data, error } = hasil ?? {};
    if (error) return klasifikasiError(error);
    if (!data || data.ok !== true) return gagal(DATA_ERROR.SERVER);
    return ok(data.data, data.meta ?? null);
  }

  return {
    mode: ADMIN_API_MODE.LIVE,
    isDemo: false,
    label: 'LIVE',
    getSummary: () => panggil({ action: 'summary' }),
    listStudents: (p = {}) => panggil({ action: 'students', ...p }),
    getStudent: (studentId) => panggil({ action: 'student', studentId }),
    listSessions: (p = {}) => panggil({ action: 'sessions', ...p }),
    listClasses: () => panggil({ action: 'classes' }),
  };
}

// Pabrik adapter. Default DEMO agar tidak pernah menyentuh jaringan tanpa izin.
export function createAdminApi(opts = {}) {
  return opts.mode === ADMIN_API_MODE.LIVE
    ? createLiveAdminApi(opts)
    : createDemoAdminApi(opts);
}

const adminApi = { ADMIN_API_MODE, ADMIN_DATA_FUNCTION, DATA_ERROR, createAdminApi, createDemoAdminApi, createLiveAdminApi, klasifikasiError };
export default adminApi;
