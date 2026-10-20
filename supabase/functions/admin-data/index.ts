// ==========================================================================
// admin-data — Edge Function SINOVA: data READ-ONLY untuk dashboard admin.
//
// Kontrak (lihat docs/admin-dashboard-api.md):
//   POST { action, ...params } dengan header `Authorization: Bearer <jwt>`
//   Sukses : { ok: true,  data, meta }
//   Gagal  : { ok: false, code }  (+ status HTTP yang sesuai)
//
// KEAMANAN (ringkas):
//   - `verify_jwt = false` (lihat config.toml) → fungsi WAJIB memvalidasi JWT
//     sendiri. Validasi memakai GoTrue lewat service role
//     (`auth.getUser(jwt)`); kode TIDAK men-decode klaim secara manual.
//   - Identitas pengguna HANYA diambil dari hasil validasi JWT. Fungsi ini
//     TIDAK PERNAH membaca `user_id`/`role` dari body, query, maupun
//     `user_metadata` — klien tidak dipercaya sama sekali.
//   - Peran admin dibaca dari tabel `user_roles` memakai service role.
//   - SERVICE-ROLE KEY hanya ada di server (Deno.env) dan TIDAK PERNAH
//     dikirim/di-log ke klien.
//   - Hanya operasi BACA (select). Tidak ada insert/update/delete/rpc.
//   - Error internal tidak dibocorkan ke klien (kode generik).
//
// SKEMA: hanya memakai kolom yang TERVERIFIKASI (`gen types`). TIDAK mengasumsi
// `level_results.student_id`/`stars`. Relasi students→classes dipetakan di kode
// (FK students.class_id→classes.id BELUM terverifikasi), sehingga tidak memakai
// embedded join PostgREST.
//
// BATAS SKALA: agregasi (summary/daftar) membaca baris lalu dihitung di fungsi,
// dibatasi SCAN_LIMIT per tabel. Bila batas tersentuh, respons memuat
// `meta.scanLimited = true` (jujur, bukan fallback diam-diam). Untuk data besar,
// ganti dengan agregasi SQL/RPC pada fase berikutnya.
// ==========================================================================

import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  VALID_SESSION_STATUSES,
  VALID_STUDENT_STATUSES,
  buildSessionRows,
  buildStudentDetail,
  buildStudentRows,
  computeSummary,
  filterStudents,
  paginate,
} from "../_shared/sinova-admin-view.ts";
// Pembatasan CORS opsional (staging). Default tetap "*" bila env tidak diset.
import { applyCors, parseAllowedOrigins } from "../_shared/sinova-cors.ts";
import { resolveServerKey } from "../_shared/sinova-server-key.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// HARUS sama dengan ALLOWED_ROLES di admin-check/index.ts.
// Domain nilai `user_roles.role` BELUM TERVERIFIKASI → allowlist sempit.
const ALLOWED_ROLES = ["admin"];

// Kolom sesuai skema yang diaudit (JANGAN menambah kolom yang tak terverifikasi).
const CLASS_COLUMNS = "id, class_name";
const STUDENT_COLUMNS = "id, full_name, class_id, absence_number, created_at";
const SESSION_COLUMNS =
  "id, student_id, status, current_level, started_at, last_seen_at, completed_at";
const RESULT_COLUMNS =
  "id, session_id, level_number, attempt_number, score, mistakes, duration_seconds, passed, status, started_at, completed_at";

const SCAN_LIMIT = 20000;

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;
const MAX_QUERY_LENGTH = 100;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const VALID_ACTIONS = ["summary", "students", "student", "sessions", "classes"];

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      // Respons memuat data siswa — jangan disimpan cache mana pun.
      "Cache-Control": "no-store",
    },
  });
}

function jsonOk(data: unknown, meta: unknown = null) {
  return jsonResponse({ ok: true, data, meta }, 200);
}

function jsonError(code: string, status: number) {
  return jsonResponse({ ok: false, code }, status);
}

// Mengambil token Bearer dari header Authorization. Token TIDAK pernah dicatat.
function bearerToken(req: Request): string {
  const raw = req.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(raw.trim());
  return m ? m[1].trim() : "";
}

// ---------------------------------------------------------------------------
// Validasi input (semua nilai dari klien diperlakukan sebagai tidak tepercaya)
// ---------------------------------------------------------------------------

// Bilangan bulat dalam [min,max]; menerima number atau string numerik.
// Mengembalikan null bila tidak valid.
function parseIntegerInRange(
  value: unknown,
  min: number,
  max: number,
): number | null {
  let n: number;
  if (typeof value === "number") {
    n = value;
  } else if (typeof value === "string" && /^-?\d+$/.test(value.trim())) {
    n = Number(value.trim());
  } else {
    return null;
  }
  if (!Number.isInteger(n) || n < min || n > max) return null;
  return n;
}

// Mengembalikan nilai string yang sudah di-trim dengan batas panjang, atau null.
function parseQuery(value: unknown): string | null {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") return null;
  const t = value.trim();
  if (t.length > MAX_QUERY_LENGTH) return null;
  return t;
}

// Status opsional: "" (semua) atau salah satu nilai yang diizinkan.
function parseStatus(value: unknown, diizinkan: string[]): string | null {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value !== "string") return null;
  return diizinkan.includes(value) ? value : null;
}

function parseUuid(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  return UUID_PATTERN.test(t) ? t : null;
}

// ---------------------------------------------------------------------------
// Akses baca (READ-ONLY). Semua helper melempar Error generik bila gagal;
// pemanggil mengubahnya menjadi 500 tanpa membocorkan detail.
// ---------------------------------------------------------------------------

type Scan = { rows: any[]; terpotong: boolean };

// Deteksi pemotongan yang JUJUR: bila server memberi jumlah total baris yang
// cocok (`count`, diminta lewat `{ count: 'exact' }`), bandingkan dengan baris
// yang benar-benar diterima. Ini menangkap pemotongan yang dilakukan server
// (mis. `max_rows` PostgREST / batas REST) yang bisa lebih kecil dari
// SCAN_LIMIT — sehingga tidak ada pemotongan diam-diam. Bila `count` tidak
// tersedia, jatuh ke pemeriksaan konservatif `rows.length >= SCAN_LIMIT`.
function terpotong(rows: any[], count: unknown): boolean {
  if (typeof count === "number" && Number.isFinite(count)) {
    return rows.length < count;
  }
  return rows.length >= SCAN_LIMIT;
}

async function bacaSemua(
  admin: any,
  tabel: string,
  kolom: string,
): Promise<Scan> {
  const { data, error, count } = await admin
    .from(tabel)
    .select(kolom, { count: "exact" })
    .order("id", { ascending: true })
    .limit(SCAN_LIMIT);
  if (error) throw new Error("baca:" + tabel);
  const rows = Array.isArray(data) ? data : [];
  return { rows, terpotong: terpotong(rows, count) };
}

async function bacaSatu(
  admin: any,
  tabel: string,
  kolom: string,
  kolomFilter: string,
  nilai: string,
): Promise<any | null> {
  const { data, error } = await admin
    .from(tabel)
    .select(kolom)
    .eq(kolomFilter, nilai)
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error("baca:" + tabel);
  return data ?? null;
}

async function bacaDenganNilai(
  admin: any,
  tabel: string,
  kolom: string,
  kolomFilter: string,
  nilai: string,
): Promise<Scan> {
  const { data, error, count } = await admin
    .from(tabel)
    .select(kolom, { count: "exact" })
    .eq(kolomFilter, nilai)
    .order("id", { ascending: true })
    .limit(SCAN_LIMIT);
  if (error) throw new Error("baca:" + tabel);
  const rows = Array.isArray(data) ? data : [];
  return { rows, terpotong: terpotong(rows, count) };
}

async function bacaDenganDaftar(
  admin: any,
  tabel: string,
  kolom: string,
  kolomFilter: string,
  daftar: string[],
): Promise<Scan> {
  if (daftar.length === 0) return { rows: [], terpotong: false };
  const { data, error, count } = await admin
    .from(tabel)
    .select(kolom, { count: "exact" })
    .in(kolomFilter, daftar)
    .order("id", { ascending: true })
    .limit(SCAN_LIMIT);
  if (error) throw new Error("baca:" + tabel);
  const rows = Array.isArray(data) ? data : [];
  return { rows, terpotong: terpotong(rows, count) };
}

async function muatSemuaTabel(admin: any) {
  const [stu, cls, ses, res] = await Promise.all([
    bacaSemua(admin, "students", STUDENT_COLUMNS),
    bacaSemua(admin, "classes", CLASS_COLUMNS),
    bacaSemua(admin, "practice_sessions", SESSION_COLUMNS),
    bacaSemua(admin, "level_results", RESULT_COLUMNS),
  ]);
  return {
    students: stu.rows,
    classes: cls.rows,
    sessions: ses.rows,
    levelResults: res.rows,
    scanLimited: stu.terpotong || cls.terpotong || ses.terpotong || res.terpotong,
  };
}

// ---------------------------------------------------------------------------
// Aksi
// ---------------------------------------------------------------------------

async function aksiSummary(admin: any) {
  const sumber = await muatSemuaTabel(admin);
  return jsonOk(computeSummary(sumber), { scanLimited: sumber.scanLimited });
}

async function aksiStudents(admin: any, body: any) {
  const page = body.page === undefined
    ? 1
    : parseIntegerInRange(body.page, 1, Number.MAX_SAFE_INTEGER);
  const pageSize = body.pageSize === undefined
    ? DEFAULT_PAGE_SIZE
    : parseIntegerInRange(body.pageSize, 1, MAX_PAGE_SIZE);
  const classId = body.classId === undefined || body.classId === "" || body.classId === null
    ? ""
    : parseIntegerInRange(body.classId, 1, Number.MAX_SAFE_INTEGER);
  const status = parseStatus(body.status, VALID_STUDENT_STATUSES);
  const q = parseQuery(body.q);

  if (page === null || pageSize === null || classId === null || status === null || q === null) {
    return jsonError("bad_request", 400);
  }

  const sumber = await muatSemuaTabel(admin);
  const semua = buildStudentRows(sumber);
  const tersaring = filterStudents(semua, { q, classId, status });
  const { items, meta } = paginate(tersaring, page, pageSize);

  return jsonOk(items, {
    ...meta,
    filtered: tersaring.length,
    scanLimited: sumber.scanLimited,
  });
}

async function aksiStudent(admin: any, body: any) {
  const studentId = parseUuid(body.studentId);
  if (!studentId) return jsonError("bad_request", 400);

  const siswa = await bacaSatu(
    admin,
    "students",
    STUDENT_COLUMNS,
    "id",
    studentId,
  );
  if (!siswa) return jsonError("not_found", 404);

  const sesi = await bacaDenganNilai(
    admin,
    "practice_sessions",
    SESSION_COLUMNS,
    "student_id",
    studentId,
  );
  const hasil = await bacaDenganDaftar(
    admin,
    "level_results",
    RESULT_COLUMNS,
    "session_id",
    sesi.rows.map((s: any) => s.id),
  );
  const kelas = await bacaSemua(admin, "classes", CLASS_COLUMNS);

  const detail = buildStudentDetail({
    studentId,
    students: [siswa],
    classes: kelas.rows,
    sessions: sesi.rows,
    levelResults: hasil.rows,
  });

  if (!detail) return jsonError("not_found", 404);

  return jsonOk(detail, {
    scanLimited: sesi.terpotong || hasil.terpotong,
  });
}

async function aksiSessions(admin: any, body: any) {
  const page = body.page === undefined
    ? 1
    : parseIntegerInRange(body.page, 1, Number.MAX_SAFE_INTEGER);
  const pageSize = body.pageSize === undefined
    ? DEFAULT_PAGE_SIZE
    : parseIntegerInRange(body.pageSize, 1, MAX_PAGE_SIZE);
  const classId = body.classId === undefined || body.classId === "" || body.classId === null
    ? ""
    : parseIntegerInRange(body.classId, 1, Number.MAX_SAFE_INTEGER);
  const status = parseStatus(body.status, VALID_SESSION_STATUSES);

  if (page === null || pageSize === null || classId === null || status === null) {
    return jsonError("bad_request", 400);
  }

  const sumber = await muatSemuaTabel(admin);
  let baris = buildSessionRows(sumber);
  if (status) baris = baris.filter((r: any) => r.status === status);
  if (classId !== "") {
    baris = baris.filter((r: any) => String(r.class_id) === String(classId));
  }
  const { items, meta } = paginate(baris, page, pageSize);

  return jsonOk(items, {
    ...meta,
    filtered: baris.length,
    scanLimited: sumber.scanLimited,
  });
}

async function aksiClasses(admin: any) {
  const kelas = await bacaSemua(admin, "classes", CLASS_COLUMNS);
  return jsonOk(kelas.rows, { scanLimited: kelas.terpotong });
}

async function jalankanAksi(action: string, body: any, admin: any) {
  switch (action) {
    case "summary":
      return await aksiSummary(admin);
    case "students":
      return await aksiStudents(admin, body);
    case "student":
      return await aksiStudent(admin, body);
    case "sessions":
      return await aksiSessions(admin, body);
    case "classes":
      return await aksiClasses(admin);
    default:
      // Tidak mungkin tercapai (action sudah divalidasi), tetapi tetap aman.
      return jsonError("bad_request", 400);
  }
}

async function handle(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return jsonError("bad_request", 405);
    }

    const jwt = bearerToken(req);
    if (!jwt) {
      return jsonError("unauthorized", 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    // Kunci server: SUPABASE_SECRET_KEYS['default'] (direkomendasikan runtime)
    // dengan fallback ke SUPABASE_SERVICE_ROLE_KEY (legacy). Nilai TIDAK dicetak.
    const serverKey = resolveServerKey((nama) => Deno.env.get(nama));

    // Fail closed: tanpa konfigurasi server, tidak ada data yang diberikan.
    if (!supabaseUrl || !serverKey) {
      console.error("admin-data: konfigurasi server belum lengkap.");
      return jsonError("server", 500);
    }

    const admin = createClient(supabaseUrl, serverKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 1) Validasi JWT (tanda tangan/kedaluwarsa) oleh server Supabase.
    let userId = "";
    try {
      const { data, error } = await admin.auth.getUser(jwt);
      if (
        error ||
        !data?.user ||
        typeof data.user.id !== "string" ||
        data.user.id === ""
      ) {
        return jsonError("unauthorized", 401);
      }
      userId = data.user.id;
    } catch {
      return jsonError("unauthorized", 401);
    }

    // 2) Peran dibaca dari sumber tepercaya (service role), bukan dari klien.
    let peran: string[] = [];
    try {
      const { data, error } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      if (error) throw new Error("role");
      peran = Array.isArray(data)
        ? data.map((r: any) =>
          r && typeof r.role === "string" ? r.role : ""
        )
        : [];
    } catch {
      console.error("admin-data: gagal memeriksa peran admin.");
      return jsonError("server", 500);
    }

    if (!peran.some((r) => ALLOWED_ROLES.includes(r))) {
      return jsonError("forbidden", 403);
    }

    // 3) Body + action.
    let body: any;
    try {
      body = await req.json();
    } catch {
      return jsonError("bad_request", 400);
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return jsonError("bad_request", 400);
    }

    const action = body.action;
    if (typeof action !== "string" || !VALID_ACTIONS.includes(action)) {
      return jsonError("bad_request", 400);
    }

    // 4) Jalankan aksi baca. Detail internal tidak dibocorkan ke klien.
    try {
      return await jalankanAksi(action, body, admin);
    } catch {
      console.error("admin-data: gagal menjalankan aksi.");
      return jsonError("server", 500);
    }
}

// Pembatasan origin bersifat OPSIONAL: tanpa `SINOVA_ALLOWED_ORIGINS`, semua
// respons memakai `Access-Control-Allow-Origin: *` (perilaku sebelumnya).
export default {
  fetch: withSupabase({ auth: ["publishable"] }, async (req: Request) => {
    const res = await handle(req);
    return applyCors(
      req,
      res,
      parseAllowedOrigins(Deno.env.get("SINOVA_ALLOWED_ORIGINS")),
    );
  }),
};
