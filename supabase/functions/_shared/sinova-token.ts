// ==========================================================================
// sinova-token.ts — utilitas token HMAC-SHA256 SINOVA (bersama / shared)
//
// Pemakai     : student-register (penerbitan) & practice-session (verifikasi)
// Jalur impor : import { ... } from "../_shared/sinova-token.ts"  (ekstensi .ts)
//
// Desain:
//   - Murni fungsi: secret, TTL, dan waktu DIKIRIM pemanggil.
//     Pembacaan Deno.env dilakukan di masing-masing Edge Function — file ini
//     tidak membaca env apa pun sehingga bisa diuji lokal tanpa Deno/Docker.
//   - Web Crypto (HMAC-SHA256) bawaan runtime — tanpa dependensi npm/jsr.
//   - TIDAK mencatat apa pun: token dan secret tidak boleh pernah masuk log
//     (tanpa console.* sama sekali).
//
// Format token:
//   v1.<student_uuid>.<exp_unix_detik>.<base64url(hmac-sha256)>
//   yang ditandatangani : "v1.<student_uuid>.<exp>" (tanpa segmen signature)
//
// Urutan verifikasi : konfigurasi (fail closed) -> format -> signature
//                     (constant-time) -> expiry -> sid.
// ==========================================================================

const TOKEN_VERSION = "v1";
const DEFAULT_TTL_SECONDS = 2_592_000; // 30 hari
// Panjang minimum secret yang dapat dipakai membuat kunci HMAC. Dipakai
// bersama oleh signToken() dan verifyToken() agar tidak terjadi selisih aturan.
const MIN_SECRET_LENGTH = 16;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EXP_RE = /^\d{1,12}$/;
// 32 byte HMAC-SHA256 -> base64url tanpa padding = tepat 43 karakter.
const SIG_RE = /^[A-Za-z0-9_-]{43}$/;

export type FailReason =
  | "invalid_secret"
  | "missing"
  | "invalid_format"
  | "invalid_signature"
  | "expired"
  | "sid_mismatch";

export type VerifyResult =
  | { ok: true; studentId: string; exp: number }
  | { ok: false; reason: FailReason };

function fail(reason: FailReason): VerifyResult {
  return { ok: false, reason };
}

function b64urlEncode(bytes: ArrayBuffer): string {
  const bin = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(bin).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function b64urlDecode(s: string): Uint8Array | null {
  try {
    const b64 = s.replaceAll("-", "+").replaceAll("_", "/");
    // Tambahkan padding agar dekoder ketat apa pun menerima (43 -> 44).
    const padded = b64.padEnd(Math.ceil(b64.length / 4) * 4, "=");
    const bin = atob(padded);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

async function importKey(secret: string): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/**
 * Menerbitkan token untuk studentId.
 * `ttlSeconds` default 2.592.000 (30 hari). Melempar Error bila input invalid
 * (pemanggil bertanggung jawab mengubahnya menjadi respons 500).
 */
export async function signToken(
  studentId: string,
  secret: string,
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
): Promise<string> {
  if (typeof studentId !== "string" || !UUID_RE.test(studentId)) {
    throw new Error("studentId bukan UUID valid.");
  }
  if (typeof secret !== "string" || secret.length < MIN_SECRET_LENGTH) {
    throw new Error("Secret token tidak valid.");
  }
  if (!Number.isInteger(ttlSeconds) || ttlSeconds < 1) {
    throw new Error("TTL token tidak valid.");
  }

  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${TOKEN_VERSION}.${studentId}.${exp}`;
  const sig = await crypto.subtle.sign(
    "HMAC",
    await importKey(secret),
    new TextEncoder().encode(payload),
  );
  return `${payload}.${b64urlEncode(sig)}`;
}

/**
 * Verifikasi token terhadap studentId.
 * `nowSeconds` bisa disuntik untuk pengujian expiry; tanpa argumen memakai
 * waktu server. Tidak pernah mencatat token/secret apa pun.
 *
 * Fail closed: bila `secret` tidak tersedia/bukan string/kosong/kurang dari
 * MIN_SECRET_LENGTH karakter, fungsi mengembalikan kegagalan `invalid_secret`
 * TANPA pernah membentuk kunci HMAC (tidak ada kunci dari undefined/kosong).
 * Pemanggil sebaiknya memetakan `invalid_secret` ke 500 (kesalahan
 * konfigurasi server) dan alasan lain ke 401.
 */
export async function verifyToken(
  token: unknown,
  studentId: string,
  secret: string,
  nowSeconds?: number,
): Promise<VerifyResult> {
  // --- 0) Konfigurasi server: JANGAN lanjut bila secret tidak valid.
  //    Dijalankan paling awal agar kunci HMAC tidak pernah dibuat dari
  //    undefined / string kosong / secret terlalu pendek.
  if (typeof secret !== "string" || secret.length < MIN_SECRET_LENGTH) {
    return fail("invalid_secret");
  }

  if (typeof token !== "string" || token.length === 0) return fail("missing");

  // --- 1) Format ketat ---
  const parts = token.split(".");
  if (parts.length !== 4) return fail("invalid_format");
  const [version, sid, expStr, sigStr] = parts;
  if (version !== TOKEN_VERSION) return fail("invalid_format");
  if (!UUID_RE.test(sid)) return fail("invalid_format");
  if (!EXP_RE.test(expStr)) return fail("invalid_format");
  if (!SIG_RE.test(sigStr)) return fail("invalid_format");

  const exp = Number(expStr);
  if (!Number.isSafeInteger(exp) || exp <= 0) return fail("invalid_format");

  const sigBytes = b64urlDecode(sigStr);
  if (!sigBytes || sigBytes.byteLength !== 32) return fail("invalid_format");

  // --- 2) Signature: constant-time via crypto.subtle.verify.
  //    Dijalankan SEBELUM keputusan apa pun atas isi token.
  const payload = `${version}.${sid}.${expStr}`;
  const valid = await crypto.subtle.verify(
    "HMAC",
    await importKey(secret),
    sigBytes,
    new TextEncoder().encode(payload),
  );
  if (!valid) return fail("invalid_signature");

  // --- 3) Masa berlaku ---
  const now = nowSeconds ?? Math.floor(Date.now() / 1000);
  if (exp <= now) return fail("expired");

  // --- 4) Kecocokan student_id (UUID case-insensitive) ---
  if (sid.toLowerCase() !== String(studentId ?? "").toLowerCase()) {
    return fail("sid_mismatch");
  }

  return { ok: true, studentId: sid, exp };
}
