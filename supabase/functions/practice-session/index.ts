// ==========================================================================
// practice-session — Edge Function SINOVA
//
// Mencatat sesi praktik siswa ke tabel `practice_sessions`:
//   - start    : membuat sesi baru berstatus `in_progress`
//                (idempotent: start ulang dengan session_id sama tidak
//                membuat sesi ganda).
//   - progress : memperbarui current_level + last_seen_at sesi yang sedang
//                berjalan.
//   - complete : menutup sesi (status `completed`, completed_at terisi).
//   - result   : menyimpan hasil satu level ke `level_results` setelah
//                memastikan sesi milik siswa yang tokennya terverifikasi.
//
// CATATAN KEAMANAN (penting):
//   Endpoint ini memverifikasi identitas siswa dengan token HMAC-SHA256
//   bertanda tangan yang diterbitkan `student-register` (header
//   `x-sinova-token`). Verifikasi dijalankan SEBELUM akses database:
//     1. memvalidasi format & rentang semua input,
//     2. memverifikasi tanda tangan, masa berlaku, dan kecocokan student_id;
//        klaim `student_id` dari body tidak pernah menjadi sumber identitas,
//        hanya pembanding terhadap klaim yang tertanda tangan di dalam token,
//     3. memakai `sid` hasil verifikasi token sebagai identitas untuk SEMUA
//        operasi database (bukan nilai dari body),
//     4. mengunci setiap aksi ke baris sesi milik siswa tersebut (progress/
//        complete/result tidak pernah menyentuh sesi milik siswa lain),
//     5. menangani konflik primary key agar start/result yang diulang tidak
//        membuat baris duplikat (dan tidak pernah mengembalikan baris milik
//        siswa lain saat konflik terjadi).
//
//   FAIL CLOSED: token WAJIB pada setiap permintaan. Hanya bila operator
//   secara eksplisit mengeset `TOKEN_REQUIRED=false` jalur lama tanpa token
//   (yang mempercayai `student_id` dari body) dibuka kembali — mis. untuk
//   pemulihan darurat. Default (env tidak disetel) adalah MEMAKSA token.
//   Jangan menyetel `TOKEN_REQUIRED=false` pada produksi.
//
//   Aksi `result` menyimpan hasil level ke `level_results`. Skema yang
//   diaudit TIDAK memiliki kolom `student_id` maupun `stars`; identitas
//   diturunkan dari sesi, dan `stars` dihitung di UI (tidak disimpan server).
//   Anti-duplikat memakai `id` hasil yang dibuat klien (primary key) sehingga
//   percobaan ulang dengan id yang sama bersifat idempoten tanpa perubahan
//   skema. Skor tetap berasal dari klien dan TIDAK dapat dijamin bebas
//   manipulasi oleh server.
//
// Secret (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
// PRACTICE_SESSION_TOKEN_SECRET) hanya dibaca dari environment server via
// Deno.env.get(). Jangan pernah menaruhnya di frontend.
// ==========================================================================

import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { createClient } from "npm:@supabase/supabase-js@2";
// Helper token HMAC bersama (diterbitkan student-register, diverifikasi di
// sini). Helper ini murni fungsi dan tidak pernah mencatat token/secret.
import { verifyToken } from "../_shared/sinova-token.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info, x-sinova-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Kolom sesuai skema tabel practice_sessions yang diaudit.
const SESSION_COLUMNS =
  "id, student_id, status, current_level, started_at, last_seen_at, completed_at";

// Status valid pada skema: in_progress | completed | disconnected.
// Tahap ini hanya menggunakan in_progress dan completed; `disconnected`
// disisakan untuk mekanisme heartbeat di tahap berikutnya.
const STATUS_IN_PROGRESS = "in_progress";
const STATUS_COMPLETED = "completed";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const LEVEL_MIN = 1;
const LEVEL_MAX = 5;

// Rentang validasi hasil level (nilai di luar ini ditolak sebagai 400).
// Skor/durasi/kesalahan berasal dari klien — lihat catatan anti-manipulasi
// pada blok komentar di atas.
const SCORE_MIN = 0;
const SCORE_MAX = 100;
const MISTAKES_MIN = 0;
const MISTAKES_MAX = 1000;
const DURATION_MIN_SECONDS = 0;
const DURATION_MAX_SECONDS = 86400; // 24 jam

// Kolom `level_results` sesuai skema yang diaudit (via `gen types`).
// CATATAN: tabel ini TIDAK memiliki kolom `student_id` maupun `stars`.
const RESULT_COLUMNS =
  "id, session_id, level_number, attempt_number, score, mistakes, duration_seconds, passed, status, started_at, completed_at";

// Panjang minimum secret token (konsisten dengan helper sinova-token).
const MIN_TOKEN_SECRET_LENGTH = 16;

// Header yang membawa token identitas siswa.
const TOKEN_HEADER = "x-sinova-token";

const VALID_ACTIONS = ["start", "progress", "complete", "result"] as const;
type Action = (typeof VALID_ACTIONS)[number];

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      // Respons memuat data sesi siswa — jangan disimpan cache mana pun.
      "Cache-Control": "no-store",
    },
  });
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

// Mengembalikan angka bulat 1–5, atau null jika tidak valid.
function parseLevel(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value)) return null;
  if (value < LEVEL_MIN || value > LEVEL_MAX) return null;
  return value;
}

// Mengembalikan bilangan bulat dalam rentang [min, max], atau null jika tidak
// valid. Dipakai untuk score / mistakes / duration_seconds hasil level.
function parseIntegerInRange(
  value: unknown,
  min: number,
  max: number,
): number | null {
  if (typeof value !== "number" || !Number.isInteger(value)) return null;
  if (value < min || value > max) return null;
  return value;
}

// Input hasil level yang sudah tervalidasi bentuknya (belum tentu milik siswa).
type ResultInput = {
  resultId: string;
  levelNumber: number;
  score: number;
  mistakes: number;
  durationSeconds: number;
  passed: boolean;
};

// Tipe longgar untuk admin client agar helper dapat dipakai bersama.
type AdminClient = ReturnType<typeof createClient>;

// --------------------------------------------------------------------------
// start — membuat sesi, atau mengembalikan sesi yang sudah ada (idempoten).
// --------------------------------------------------------------------------
async function handleStart(
  admin: AdminClient,
  sessionId: string,
  studentId: string,
  level: number,
) {
  // Pastikan siswa benar-benar terdaftar (pemeriksaan integritas data).
  // Bukti kepemilikan identitas berasal dari token yang sudah diverifikasi
  // sebelum handler ini dipanggil — bukan dari baris tabel ini.
  const { data: student, error: studentError } = await admin
    .from("students")
    .select("id")
    .eq("id", studentId)
    .maybeSingle();

  if (studentError) {
    console.error("Gagal memeriksa siswa:", studentError.message);
    return jsonResponse(
      { error: "Tidak dapat memverifikasi data siswa. Coba lagi." },
      500,
    );
  }

  if (!student) {
    return jsonResponse(
      { error: "Siswa tidak ditemukan. Silakan daftar terlebih dahulu." },
      404,
    );
  }

  const nowIso = new Date().toISOString();

  const { data, error } = await admin
    .from("practice_sessions")
    .insert({
      id: sessionId,
      student_id: studentId,
      status: STATUS_IN_PROGRESS,
      current_level: level,
      started_at: nowIso,
      last_seen_at: nowIso,
    })
    .select(SESSION_COLUMNS)
    .single();

  if (error) {
    // Konflik primary key = retry dari start dengan session_id yang sama.
    if (error.code === "23505") {
      const { data: existing, error: fetchError } = await admin
        .from("practice_sessions")
        .select(SESSION_COLUMNS)
        .eq("id", sessionId)
        .maybeSingle();

      if (fetchError || !existing) {
        console.error(
          "Gagal membaca sesi yang sudah ada:",
          fetchError?.message ?? "data tidak ditemukan",
        );
        return jsonResponse(
          { error: "Tidak dapat memverifikasi sesi praktik. Coba lagi." },
          500,
        );
      }

      // Jangan pernah mengembalikan sesi milik siswa lain.
      if (existing.student_id !== studentId) {
        return jsonResponse(
          { error: "session_id tersebut sudah digunakan. Gunakan ID sesi lain." },
          409,
        );
      }

      return jsonResponse(
        {
          message: "Sesi praktik sudah tercatat.",
          session: existing,
          reused: true,
        },
        200,
      );
    }

    console.error("Gagal membuat sesi praktik:", error.message);
    return jsonResponse(
      { error: "Gagal menyimpan sesi praktik. Coba lagi." },
      500,
    );
  }

  return jsonResponse(
    { message: "Sesi praktik dimulai.", session: data },
    201,
  );
}

// --------------------------------------------------------------------------
// progress — update current_level + last_seen_at pada sesi in_progress milik
// siswa yang sama. Tidak pernah menyentuh sesi milik siswa lain.
// --------------------------------------------------------------------------
async function handleProgress(
  admin: AdminClient,
  sessionId: string,
  studentId: string,
  level: number,
) {
  const nowIso = new Date().toISOString();

  const { data, error } = await admin
    .from("practice_sessions")
    .update({
      current_level: level,
      last_seen_at: nowIso,
    })
    .eq("id", sessionId)
    .eq("student_id", studentId)
    .eq("status", STATUS_IN_PROGRESS)
    .select(SESSION_COLUMNS)
    .maybeSingle();

  if (error) {
    console.error("Gagal memperbarui sesi praktik:", error.message);
    return jsonResponse(
      { error: "Gagal memperbarui sesi praktik. Coba lagi." },
      500,
    );
  }

  if (data) {
    return jsonResponse(
      { message: "Progres sesi diperbarui.", session: data },
      200,
    );
  }

  // Tidak ada baris yang cocok — kenali penyebabnya untuk pesan yang tepat.
  const { data: existing, error: fetchError } = await admin
    .from("practice_sessions")
    .select(SESSION_COLUMNS)
    .eq("id", sessionId)
    .maybeSingle();

  if (fetchError) {
    console.error("Gagal memeriksa sesi praktik:", fetchError.message);
    return jsonResponse(
      { error: "Tidak dapat memverifikasi sesi praktik. Coba lagi." },
      500,
    );
  }

  // Sesi tidak ada ATAU milik siswa lain → pesan generik yang sama,
  // tanpa membocorkan data sesi milik siswa lain.
  if (!existing || existing.student_id !== studentId) {
    return jsonResponse(
      { error: "Sesi praktik tidak ditemukan." },
      404,
    );
  }

  // Sesi milik siswa ini tetapi bukan in_progress (mis. sudah completed).
  return jsonResponse(
    { error: "Hanya sesi berstatus in_progress yang dapat diperbarui." },
    409,
  );
}

// --------------------------------------------------------------------------
// complete — menutup sesi in_progress milik siswa yang sama. Retry pada
// sesi yang sudah completed bersifat idempoten (dikembalikan apa adanya,
// tanpa mengubah status kembali).
// --------------------------------------------------------------------------
async function handleComplete(
  admin: AdminClient,
  sessionId: string,
  studentId: string,
) {
  const nowIso = new Date().toISOString();

  const { data, error } = await admin
    .from("practice_sessions")
    .update({
      status: STATUS_COMPLETED,
      completed_at: nowIso,
      last_seen_at: nowIso,
    })
    .eq("id", sessionId)
    .eq("student_id", studentId)
    .eq("status", STATUS_IN_PROGRESS)
    .select(SESSION_COLUMNS)
    .maybeSingle();

  if (error) {
    console.error("Gagal menyelesaikan sesi praktik:", error.message);
    return jsonResponse(
      { error: "Gagal menyelesaikan sesi praktik. Coba lagi." },
      500,
    );
  }

  if (data) {
    return jsonResponse(
      { message: "Sesi praktik diselesaikan.", session: data },
      200,
    );
  }

  const { data: existing, error: fetchError } = await admin
    .from("practice_sessions")
    .select(SESSION_COLUMNS)
    .eq("id", sessionId)
    .maybeSingle();

  if (fetchError) {
    console.error("Gagal memeriksa sesi praktik:", fetchError.message);
    return jsonResponse(
      { error: "Tidak dapat memverifikasi sesi praktik. Coba lagi." },
      500,
    );
  }

  // Sesi tidak ada ATAU milik siswa lain → pesan generik yang sama.
  if (!existing || existing.student_id !== studentId) {
    return jsonResponse(
      { error: "Sesi praktik tidak ditemukan." },
      404,
    );
  }

  // Retry complete pada sesi yang sudah selesai → idempoten, tanpa
  // mengubah apa pun (tidak "menghidupkan kembali" sesi).
  if (existing.status === STATUS_COMPLETED) {
    return jsonResponse(
      {
        message: "Sesi praktik sudah diselesaikan sebelumnya.",
        session: existing,
        reused: true,
      },
      200,
    );
  }

  // Status lain (mis. disconnected) tidak dapat dipaksa menjadi completed
  // pada tahap ini.
  return jsonResponse(
    { error: "Hanya sesi berstatus in_progress yang dapat diselesaikan." },
    409,
  );
}

// --------------------------------------------------------------------------
// result — menyimpan hasil satu level ke `level_results`.
//
// Kepemilikan sesi diverifikasi lebih dulu: identitas datang dari token, dan
// sesi harus benar-benar milik siswa tersebut (pesan 404 seragam bila tidak,
// tanpa membocorkan kepemilikan sesi milik siswa lain).
//
// Idempotensi: `id` baris hasil dibuat klien (`result_id`) dan dipakai sebagai
// primary key, sehingga percobaan ulang dengan id yang sama TIDAK membuat baris
// ganda — tanpa kolom/constraint tambahan. `attempt_number` dihitung di server.
// Kolom `status` sengaja TIDAK diisi karena domain nilainya belum terverifikasi.
// --------------------------------------------------------------------------
async function handleResult(
  admin: AdminClient,
  sessionId: string,
  studentId: string,
  input: ResultInput,
) {
  // 1) Pastikan sesi ada dan milik siswa hasil verifikasi token.
  const { data: sesi, error: sesiError } = await admin
    .from("practice_sessions")
    .select("id, student_id, status")
    .eq("id", sessionId)
    .maybeSingle();

  if (sesiError) {
    console.error("Gagal memeriksa sesi hasil level:", sesiError.message);
    return jsonResponse(
      { error: "Tidak dapat memverifikasi sesi praktik. Coba lagi." },
      500,
    );
  }

  // Sesi tidak ada ATAU milik siswa lain → pesan generik yang sama.
  if (!sesi || sesi.student_id !== studentId) {
    return jsonResponse({ error: "Sesi praktik tidak ditemukan." }, 404);
  }

  // 2) attempt_number dihitung server-side dari baris yang sudah ada.
  const { data: rows, error: hitungError } = await admin
    .from("level_results")
    .select("id")
    .eq("session_id", sessionId)
    .eq("level_number", input.levelNumber);

  if (hitungError) {
    console.error("Gagal menghitung attempt_number:", hitungError.message);
    return jsonResponse(
      { error: "Gagal menyimpan hasil level. Coba lagi." },
      500,
    );
  }

  const attemptNumber = (Array.isArray(rows) ? rows.length : 0) + 1;

  // 3) Simpan. `started_at` diturunkan dari durasi (laporan klien) agar konsisten
  //    dengan `completed_at`; keduanya diisi server.
  const nowIso = new Date().toISOString();
  const startedAtIso = new Date(
    Date.now() - input.durationSeconds * 1000,
  ).toISOString();

  const { data, error } = await admin
    .from("level_results")
    .insert({
      id: input.resultId,
      session_id: sessionId,
      level_number: input.levelNumber,
      attempt_number: attemptNumber,
      score: input.score,
      mistakes: input.mistakes,
      duration_seconds: input.durationSeconds,
      passed: input.passed,
      started_at: startedAtIso,
      completed_at: nowIso,
    })
    .select(RESULT_COLUMNS)
    .single();

  if (error) {
    // Konflik primary key = retry dengan `result_id` yang sama.
    if (error.code === "23505") {
      const { data: existing, error: fetchError } = await admin
        .from("level_results")
        .select(RESULT_COLUMNS)
        .eq("id", input.resultId)
        .maybeSingle();

      if (fetchError || !existing) {
        console.error(
          "Gagal membaca hasil level yang sudah ada:",
          fetchError?.message ?? "data tidak ditemukan",
        );
        return jsonResponse(
          { error: "Gagal menyimpan hasil level. Coba lagi." },
          500,
        );
      }

      // Jangan pernah mengembalikan hasil milik sesi lain.
      if (existing.session_id !== sessionId) {
        return jsonResponse(
          { error: "result_id tersebut sudah digunakan. Gunakan ID hasil lain." },
          409,
        );
      }

      return jsonResponse(
        {
          message: "Hasil level sudah tercatat.",
          result: existing,
          reused: true,
        },
        200,
      );
    }

    console.error("Gagal menyimpan hasil level:", error.message);
    return jsonResponse(
      { error: "Gagal menyimpan hasil level. Coba lagi." },
      500,
    );
  }

  return jsonResponse({ message: "Hasil level tersimpan.", result: data }, 201);
}

export default {
  fetch: withSupabase(
    { auth: ["publishable"] },
    async (req) => {
      if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
      }

      if (req.method !== "POST") {
        return jsonResponse({ error: "Metode tidak diizinkan." }, 405);
      }

      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return jsonResponse({ error: "Data permintaan tidak valid." }, 400);
      }

      if (!body || typeof body !== "object" || Array.isArray(body)) {
        return jsonResponse({ error: "Format data tidak valid." }, 400);
      }

      const payload = body as Record<string, unknown>;

      const action = payload.action;
      if (
        typeof action !== "string" ||
        !VALID_ACTIONS.includes(action as Action)
      ) {
        return jsonResponse({ error: "Aksi tidak dikenali." }, 400);
      }

      const sessionId = payload.session_id;
      const studentId = payload.student_id;

      if (!isUuid(sessionId)) {
        return jsonResponse(
          { error: "session_id harus berupa UUID yang valid." },
          400,
        );
      }

      if (!isUuid(studentId)) {
        return jsonResponse(
          { error: "student_id harus berupa UUID yang valid." },
          400,
        );
      }

      // current_level: wajib untuk progress, opsional untuk start
      // (default 1), diabaikan untuk complete.
      let level: number | null = null;
      if (action === "progress") {
        level = parseLevel(payload.current_level);
        if (level === null) {
          return jsonResponse(
            { error: "current_level harus berupa bilangan bulat 1–5." },
            400,
          );
        }
      } else if (action === "start") {
        if (payload.current_level !== undefined) {
          level = parseLevel(payload.current_level);
          if (level === null) {
            return jsonResponse(
              { error: "current_level harus berupa bilangan bulat 1–5." },
              400,
            );
          }
        } else {
          level = LEVEL_MIN;
        }
      }

      // Hasil level (aksi `result`) — validasi bentuk & rentang seluruh input
      // SEBELUM akses database. Semua pesan validasi bersifat umum.
      let resultInput: ResultInput | null = null;
      if (action === "result") {
        if (!isUuid(payload.result_id)) {
          return jsonResponse(
            { error: "result_id harus berupa UUID yang valid." },
            400,
          );
        }

        const levelNumber = parseLevel(payload.level_number);
        if (levelNumber === null) {
          return jsonResponse(
            { error: "level_number harus berupa bilangan bulat 1–5." },
            400,
          );
        }

        const score = parseIntegerInRange(
          payload.score,
          SCORE_MIN,
          SCORE_MAX,
        );
        if (score === null) {
          return jsonResponse(
            { error: "score harus berupa bilangan bulat 0–100." },
            400,
          );
        }

        const mistakes = parseIntegerInRange(
          payload.mistakes,
          MISTAKES_MIN,
          MISTAKES_MAX,
        );
        if (mistakes === null) {
          return jsonResponse(
            { error: "mistakes harus berupa bilangan bulat 0–1000." },
            400,
          );
        }

        const durationSeconds = parseIntegerInRange(
          payload.duration_seconds,
          DURATION_MIN_SECONDS,
          DURATION_MAX_SECONDS,
        );
        if (durationSeconds === null) {
          return jsonResponse(
            { error: "duration_seconds harus berupa bilangan bulat 0–86400." },
            400,
          );
        }

        if (typeof payload.passed !== "boolean") {
          return jsonResponse(
            { error: "passed harus berupa boolean." },
            400,
          );
        }

        resultInput = {
          resultId: payload.result_id,
          levelNumber,
          score,
          mistakes,
          durationSeconds,
          passed: payload.passed,
        };
      }

      // -----------------------------------------------------------------
      // Verifikasi identitas (token HMAC) — SEBELUM akses database apa pun.
      //
      // FAIL CLOSED: token WAJIB. Hanya bila operator secara eksplisit
      // mengeset TOKEN_REQUIRED=false jalur lama dibuka (student_id dari body
      // dipercaya apa adanya) — untuk pemulihan darurat saja. Default (env
      // tidak disetel / nilai lain) = verifikasi dijalankan.
      //
      // Token/secret tidak pernah dicatat; alasan kegagalan tidak pernah
      // dikirim ke klien (hanya pesan seragam) agar tidak menjadi oracle.
      // -----------------------------------------------------------------
      const tokenHeader = req.headers.get(TOKEN_HEADER);
      const tokenDikirim =
        typeof tokenHeader === "string" && tokenHeader.trim() !== "";
      const tokenBolehDilewati =
        (Deno.env.get("TOKEN_REQUIRED") ?? "").trim().toLowerCase() === "false";

      // Identitas yang dipakai untuk operasi database. Diisi ulang dengan
      // `sid` hasil verifikasi bila token valid.
      let effectiveStudentId = studentId;

      if (tokenDikirim || !tokenBolehDilewati) {
        const tokenSecret = Deno.env.get("PRACTICE_SESSION_TOKEN_SECRET");

        // Konfigurasi tidak siap → tolak dengan pesan umum TANPA menyentuh
        // database. Nilai konfigurasi tidak pernah dicatat atau ditampilkan.
        if (
          typeof tokenSecret !== "string" ||
          tokenSecret.length < MIN_TOKEN_SECRET_LENGTH
        ) {
          console.error(
            "Secret token sesi praktik tidak tersedia atau tidak valid.",
          );
          return jsonResponse(
            { error: "Layanan pencatatan sesi belum siap." },
            500,
          );
        }

        const hasil = await verifyToken(
          tokenDikirim ? tokenHeader : "",
          studentId,
          tokenSecret,
        );

        if (!hasil.ok) {
          // `invalid_secret` = kesalahan konfigurasi server → 500. Alasan
          // lain (missing/format/signature/expired/sid) → 401 seragam.
          if (hasil.reason === "invalid_secret") {
            console.error("Verifikasi token gagal karena konfigurasi server.");
            return jsonResponse(
              { error: "Layanan pencatatan sesi belum siap." },
              500,
            );
          }

          // Log server hanya memuat label alasan tetap (bukan token/secret).
          console.warn("Verifikasi token identitas gagal:", hasil.reason);
          return jsonResponse({ error: "Token identitas tidak valid." }, 401);
        }

        // Pakai identitas hasil verifikasi untuk operasi database.
        effectiveStudentId = hasil.studentId;
      }

      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

      if (!supabaseUrl || !serviceRoleKey) {
        console.error("Konfigurasi server Supabase belum lengkap.");
        return jsonResponse(
          { error: "Layanan pencatatan sesi belum siap." },
          500,
        );
      }

      const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });

      try {
        if (action === "start") {
          return await handleStart(
            adminClient,
            sessionId,
            effectiveStudentId,
            level ?? LEVEL_MIN,
          );
        }
        if (action === "progress") {
          return await handleProgress(
            adminClient,
            sessionId,
            effectiveStudentId,
            level as number,
          );
        }
        if (action === "result") {
          return await handleResult(
            adminClient,
            sessionId,
            effectiveStudentId,
            resultInput as ResultInput,
          );
        }
        return await handleComplete(adminClient, sessionId, effectiveStudentId);
      } catch {
        return jsonResponse(
          { error: "Terjadi kesalahan pada server. Coba lagi." },
          500,
        );
      }
    },
  ),
};
