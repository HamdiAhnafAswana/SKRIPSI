// ============================================================================
// adminAuth.js — autentikasi & otorisasi ADMIN di sisi klien.
//
// Pemisahan yang tegas (WAJIB dipertahankan):
//   - Identitas SISWA untuk bermain  : localStorage `sinova_student` +
//     token HMAC `x-sinova-token` (lihat practiceSession.js / sinovaBridge.js).
//   - Sesi AUTENTIKASI ADMIN         : Supabase Auth (email + kata sandi).
//     Modul ini TIDAK PERNAH membaca/menulis `sinova_student`.
//
// Prinsip keamanan:
//   - Peran admin TIDAK PERNAH ditentukan di klien. Klien hanya *menanyakan*
//     ke Edge Function `admin-check` (lihat supabase/functions/admin-check)
//     yang memvalidasi JWT dan membaca peran dari `user_roles` memakai service
//     role. Hasil di klien hanya dipakai untuk MENAMPILKAN UI, bukan untuk
//     memberi wewenang — setiap endpoint data admin berikutnya harus memeriksa
//     ulang di server.
//   - Tidak ada kredensial bawaan, tidak ada kata sandi di source code.
//   - Token/JWT tidak pernah dicetak ke console dan tidak pernah masuk URL.
//   - Kegagalan (jaringan/tak terverifikasi) TIDAK pernah dilaporkan sebagai
//     sukses.
// ============================================================================

import { supabase } from './supabase';

export const ADMIN_FUNCTION = 'admin-check';
// HARUS sama dengan ALLOWED_ROLES di supabase/functions/admin-check/index.ts.
export const ADMIN_ROLE = 'admin';

// Status akses admin (hasil resolveAdminAccess()).
export const ADMIN_ACCESS = {
  LOADING: 'loading', // sedang memeriksa
  SIGNED_OUT: 'signed_out', // belum login / sesi hilang / kedaluwarsa
  NO_ROLE: 'no_role', // login valid tetapi tanpa peran admin
  ADMIN: 'admin', // login + peran admin terverifikasi server
  ERROR: 'error', // gagal verifikasi (jaringan/server)
};

const PESAN = {
  empty_fields: 'Email dan kata sandi wajib diisi.',
  invalid_login: 'Email atau kata sandi salah.',
  no_role: 'Akun ini tidak memiliki akses admin.',
  expired: 'Sesi admin berakhir. Silakan masuk kembali.',
  network: 'Tidak dapat menghubungi layanan. Periksa koneksi Anda.',
  generic: 'Terjadi kesalahan. Silakan coba lagi.',
};

// Mengubah kode pesan internal menjadi teks ramah (tanpa detail teknis).
export function pesanAdmin(kode) {
  return PESAN[kode] ?? PESAN.generic;
}

// Membaca status HTTP dari error `supabase.functions.invoke` (bila ada).
function statusHttp(error) {
  const res = error && error.context;
  return res && typeof res.status === 'number' ? res.status : null;
}

/**
 * Login admin dengan email + kata sandi (Supabase Auth).
 * Mengembalikan { ok, code } — TIDAK memuat token. Pemanggil cukup memanggil
 * resolveAdminAccess() lagi untuk memverifikasi peran di server.
 */
export async function signInAdmin(email, password) {
  const mail = typeof email === 'string' ? email.trim() : '';
  if (!mail || typeof password !== 'string' || password === '') {
    return { ok: false, code: 'empty_fields', message: PESAN.empty_fields };
  }

  if (!supabase) {
    // Konfigurasi build tidak lengkap: laporkan sebagai gangguan layanan,
    // bukan "email/sandi salah" (jangan menyesatkan pengguna).
    return { ok: false, code: 'network', message: PESAN.network };
  }

  let res;
  try {
    res = await supabase.auth.signInWithPassword({ email: mail, password });
  } catch {
    return { ok: false, code: 'network', message: PESAN.network };
  }

  const { data, error } = res ?? {};
  if (error || !data?.session || !data?.user) {
    // Pesan seragam untuk semua kegagalan login (jangan bocorkan mana yang salah).
    return { ok: false, code: 'invalid_login', message: PESAN.invalid_login };
  }

  return { ok: true, code: 'ok', message: '' };
}

/**
 * Keluar dari sesi admin. Aman dipanggil walau tidak ada sesi.
 */
export async function signOutAdmin() {
  try {
    await supabase.auth.signOut();
    return { ok: true };
  } catch {
    return { ok: false, code: 'network' };
  }
}

/**
 * Membaca sesi Supabase Auth saat ini.
 * Mengembalikan accessToken untuk dipakai MEMVALIDASI peran di server.
 * Token ini tidak boleh dicatat/ditampilkan.
 */
export async function getAdminSession() {
  try {
    if (!supabase) {
      return { hasSession: false, accessToken: '', userId: '', email: null };
    }
    const { data, error } = await supabase.auth.getSession();
    if (error || !data?.session?.access_token) {
      return { hasSession: false, accessToken: '', userId: '', email: null };
    }
    const s = data.session;
    return {
      hasSession: true,
      accessToken: s.access_token,
      userId: typeof s.user?.id === 'string' ? s.user.id : '',
      email: typeof s.user?.email === 'string' ? s.user.email : null,
    };
  } catch {
    return { hasSession: false, accessToken: '', userId: '', email: null, error: true };
  }
}

/**
 * Menanyakan ke server apakah pemegang token berperan admin.
 * Hanya `{ ok: true, role: 'admin' }` dari server yang diterima sebagai bukti.
 */
export async function checkAdminRole(accessToken) {
  if (typeof accessToken !== 'string' || accessToken.trim() === '') {
    return { allowed: false, code: 'signed_out' };
  }

  let hasil;
  try {
    hasil = await supabase.functions.invoke(ADMIN_FUNCTION, {
      headers: { Authorization: `Bearer ${accessToken}` },
      body: {},
    });
  } catch {
    return { allowed: false, code: 'network' };
  }

  const { data, error } = hasil ?? {};

  if (error) {
    const status = statusHttp(error);
    if (status === 401) return { allowed: false, code: 'signed_out' };
    if (status === 403) return { allowed: false, code: 'no_role' };
    if (status === null) return { allowed: false, code: 'network' };
    return { allowed: false, code: 'error' };
  }

  // Kontrak sukses: server mengembalikan ok===true DAN role yang diharapkan.
  if (!data || data.ok !== true || data.role !== ADMIN_ROLE) {
    return { allowed: false, code: 'error' };
  }

  return {
    allowed: true,
    code: 'admin',
    user: data.user ?? null,
    role: data.role,
  };
}

/**
 * Menyelesaikan status akses admin: sesi + verifikasi peran server.
 * Mengembalikan { status: ADMIN_ACCESS.*, user }.
 */
export async function resolveAdminAccess() {
  const sesi = await getAdminSession();
  if (!sesi.hasSession) {
    return { status: ADMIN_ACCESS.SIGNED_OUT, user: null };
  }

  const cek = await checkAdminRole(sesi.accessToken);
  if (cek.allowed) {
    return {
      status: ADMIN_ACCESS.ADMIN,
      user: cek.user ?? { id: sesi.userId, email: sesi.email },
    };
  }
  if (cek.code === 'no_role') {
    return {
      status: ADMIN_ACCESS.NO_ROLE,
      user: { id: sesi.userId, email: sesi.email },
    };
  }
  if (cek.code === 'signed_out') {
    return { status: ADMIN_ACCESS.SIGNED_OUT, user: null };
  }
  return { status: ADMIN_ACCESS.ERROR, user: null, code: cek.code };
}

/**
 * Berlangganan perubahan status autentikasi (login/logout/refresh token).
 * Mengembalikan fungsi pembatalan. Aman bila API tidak tersedia.
 */
export function subscribeAdminAuth(callback) {
  try {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      try {
        callback(event, session ?? null);
      } catch {
        // Jangan biarkan error pemanggil mengganggu langganan.
      }
    });
    return () => {
      try {
        data?.subscription?.unsubscribe?.();
      } catch {
        // abaikan
      }
    };
  } catch {
    return () => {};
  }
}

const adminAuth = {
  ADMIN_FUNCTION,
  ADMIN_ROLE,
  ADMIN_ACCESS,
  pesanAdmin,
  signInAdmin,
  signOutAdmin,
  getAdminSession,
  checkAdminRole,
  resolveAdminAccess,
  subscribeAdminAuth,
};
export default adminAuth;
