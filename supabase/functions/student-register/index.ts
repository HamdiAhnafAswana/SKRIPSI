
import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { createClient } from "npm:@supabase/supabase-js@2";
// Helper token HMAC bersama (dipakai juga oleh practice-session untuk
// memverifikasi). Helper ini murni fungsi dan tidak pernah mencatat
// token/secret apa pun.
import { signToken } from "../_shared/sinova-token.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Kolom siswa untuk jalur registrasi ulang — sama dengan field yang dipakai
// klien: id, class_id, full_name, absence_number.
const STUDENT_COLUMNS = "id, class_id, full_name, absence_number";

// Panjang minimum secret token (konsisten dengan helper sinova-token).
// Nilai secret TIDAK pernah dicatat atau ditampilkan.
const MIN_TOKEN_SECRET_LENGTH = 16;

type AdminClient = ReturnType<typeof createClient>;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

// Menerbitkan token sesi praktik (TTL default helper: 30 hari).
// Mengembalikan null bila gagal — pemanggil WAJIB memperlakukan null sebagai
// kegagalan dan tidak boleh membalas sukses. Token/secret tidak pernah dicatat.
async function issueSessionToken(
  studentId: unknown,
  tokenSecret: string,
): Promise<string | null> {
  try {
    return await signToken(studentId as string, tokenSecret);
  } catch {
    console.error("Penerbitan token sesi praktik gagal.");
    return null;
  }
}

// --------------------------------------------------------------------------
// Registrasi ulang: konflik unik (kombinasi kelas + nomor absen sudah ada).
//
// CATATAN KEAMANAN (wajib dibaca): nama, kelas, dan nomor absen BUKAN faktor
// autentikasi rahasia. Jalur ini hanya menerbitkan token untuk siswa yang
// datanya sudah ada bila ketiganya cocok — ini TIDAK membuktikan identitas
// asli pemanggil dan tidak menutup kemungkinan penyamaran bagi pihak yang
// mengetahui data tersebut. Jangan menambahkan PIN/OTP/alur autentikasi baru
// di sini tanpa persetujuan terpisah.
// --------------------------------------------------------------------------
async function handleAlreadyRegistered(
  adminClient: AdminClient,
  tokenSecret: string,
  className: string,
  absenceNumber: number,
  fullName: string,
) {
  // 1) Kelas dicari dari tabel `classes` berdasarkan NAMA — tanpa hardcode id.
  //    Kolom nama kelas pada skema terverifikasi bernama `class_name`.
  const { data: kelas, error: kelasError } = await adminClient
    .from("classes")
    .select("id")
    .eq("class_name", className)
    .maybeSingle();

  if (kelasError) {
    console.error("Gagal membaca data kelas:", kelasError.message);
    return jsonResponse(
      { error: "Pendaftaran gagal. Silakan coba lagi." },
      500,
    );
  }

  if (!kelas) {
    // Data kelas tidak konsisten: jangan menebak id, jangan terbitkan token.
    console.error("Kelas tidak ditemukan saat menangani registrasi ulang.");
    return jsonResponse(
      { error: "Pendaftaran gagal. Silakan coba lagi." },
      500,
    );
  }

  // 2) Siswa terdaftar pada kelas + nomor absen tersebut.
  const { data: siswa, error: siswaError } = await adminClient
    .from("students")
    .select(STUDENT_COLUMNS)
    .eq("class_id", kelas.id)
    .eq("absence_number", absenceNumber)
    .maybeSingle();

  if (siswaError) {
    console.error("Gagal membaca data siswa terdaftar:", siswaError.message);
    return jsonResponse(
      { error: "Pendaftaran gagal. Silakan coba lagi." },
      500,
    );
  }

  if (!siswa) {
    // Konflik unik tanpa baris yang dapat dibaca → perlakukan sebagai konflik.
    return jsonResponse(
      { error: "Nomor absen tersebut sudah terdaftar di kelas ini." },
      409,
    );
  }

  // 3) Nama harus cocok setelah trim + case-insensitive.
  const namaTerdaftar =
    typeof siswa.full_name === "string"
      ? siswa.full_name.trim().toLowerCase()
      : "";

  if (namaTerdaftar !== fullName.toLowerCase()) {
    // Pesan sama seperti perilaku lama; jangan mengungkapkan data siswa lain.
    return jsonResponse(
      { error: "Nomor absen tersebut sudah terdaftar di kelas ini." },
      409,
    );
  }

  // 4) Data cocok → terbitkan token baru untuk siswa yang sama.
  const token = await issueSessionToken(siswa.id, tokenSecret);

  if (!token) {
    return jsonResponse(
      { error: "Pendaftaran gagal. Silakan coba lagi." },
      500,
    );
  }

  return jsonResponse(
    {
      message: "Siswa sudah terdaftar. Token sesi diterbitkan ulang.",
      student: siswa,
      token,
      reused: true,
    },
    200,
  );
}

export default {
  fetch: withSupabase(
    { auth: ["publishable"] },
    async (req) => {
      if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
      }

      if (req.method !== "POST") {
        return jsonResponse(
          { error: "Metode tidak diizinkan." },
          405,
        );
      }

      try {
        const body = await req.json();

        if (!body || typeof body !== "object" || Array.isArray(body)) {
          return jsonResponse({ error: "Format data tidak valid." }, 400);
        }

        const fullName =
          typeof body.full_name === "string"
            ? body.full_name.trim()
            : "";

        const className =
          typeof body.class_name === "string"
            ? body.class_name.trim().toUpperCase()
            : "";

        const absenceNumber = body.absence_number;

        if (fullName.length < 2 || fullName.length > 100) {
          return jsonResponse(
            { error: "Nama harus terdiri dari 2–100 karakter." },
            400,
          );
        }

        if (!["X TKJ 1", "X TKJ 2", "X TKJ 3"].includes(className)) {
          return jsonResponse({ error: "Kelas tidak valid." }, 400);
        }

        if (
          typeof absenceNumber !== "number" ||
          !Number.isSafeInteger(absenceNumber) ||
          absenceNumber < 1 ||
          absenceNumber > 1000
        ) {
          return jsonResponse(
            { error: "Nomor absen harus berupa bilangan bulat positif." },
            400,
          );
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        const tokenSecret = Deno.env.get("PRACTICE_SESSION_TOKEN_SECRET");

        if (!supabaseUrl || !serviceRoleKey) {
          console.error("Konfigurasi server Supabase belum lengkap.");
          return jsonResponse(
            { error: "Layanan pendaftaran belum siap." },
            500,
          );
        }

        // Fail closed: tanpa secret token yang valid, identitas (token) tidak
        // boleh diterbitkan. Pesan tetap umum dan nilai konfigurasi tidak
        // pernah dicatat atau ditampilkan.
        if (
          typeof tokenSecret !== "string" ||
          tokenSecret.length < MIN_TOKEN_SECRET_LENGTH
        ) {
          console.error(
            "Secret token pendaftaran tidak tersedia atau tidak valid.",
          );
          return jsonResponse(
            { error: "Layanan pendaftaran belum siap." },
            500,
          );
        }

        const adminClient = createClient(supabaseUrl, serviceRoleKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        });

        const { data, error } = await adminClient.rpc(
          "register_sinova_student",
          {
            p_full_name: fullName,
            p_class_name: className,
            p_absence_number: absenceNumber,
          },
        );

        if (error) {
          if (error.code === "23505") {
            // Kelas + nomor absen sudah terdaftar: coba terbitkan token untuk
            // siswa yang sudah ada (lihat handleAlreadyRegistered).
            return await handleAlreadyRegistered(
              adminClient,
              tokenSecret,
              className,
              absenceNumber,
              fullName,
            );
          }

          if (
            error.message.includes("Nama harus") ||
            error.message.includes("Kelas tidak valid") ||
            error.message.includes("Nomor absen") ||
            error.message.includes("Kelas tidak ditemukan")
          ) {
            return jsonResponse({ error: error.message }, 400);
          }

          console.error("Pendaftaran siswa gagal:", error.message);
          return jsonResponse(
            { error: "Pendaftaran gagal. Silakan coba lagi." },
            500,
          );
        }

        // Data siswa dari RPC harus valid sebelum token diterbitkan.
        if (!data || typeof data !== "object") {
          console.error("Respons pendaftaran tidak memuat data siswa.");
          return jsonResponse(
            { error: "Pendaftaran gagal. Silakan coba lagi." },
            500,
          );
        }

        // Terbitkan token. Bila gagal, JANGAN membalas sukses: klien tidak
        // boleh menerima respons seolah-olah token sudah tersedia.
        const token = await issueSessionToken(
          (data as { id?: unknown }).id,
          tokenSecret,
        );

        if (!token) {
          return jsonResponse(
            { error: "Pendaftaran gagal. Silakan coba lagi." },
            500,
          );
        }

        return jsonResponse(
          {
            message: "Pendaftaran berhasil.",
            student: data,
            token,
          },
          201,
        );
      } catch {
        return jsonResponse(
          { error: "Data permintaan tidak valid." },
          400,
        );
      }
    },
  ),
};
