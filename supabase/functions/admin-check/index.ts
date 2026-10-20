// ==========================================================================
// admin-check — Edge Function SINOVA: verifikasi sesi admin + peran (role).
//
// Tujuan: menjadi SATU-SATUNYA sumber kebenaran otorisasi admin di sisi server.
// Klien TIDAK dipercaya sama sekali: fungsi ini tidak pernah membaca `user_id`
// atau `role` dari body maupun query string. Identitas hanya diambil dari JWT
// yang sudah divalidasi, dan peran hanya diambil dari tabel `user_roles`
// memakai service role.
//
// Alur verifikasi (berurutan, gagal = tolak):
//   1. Ambil JWT dari header `Authorization: Bearer <jwt>`.
//   2. Validasi JWT lewat GoTrue (`adminClient.auth.getUser(jwt)`). Server
//      Supabase memeriksa tanda tangan, masa berlaku, dan audiens — kode kita
//      TIDAK men-decode klaim secara manual dan tidak mempercayai payload.
//   3. Ambil `id` pengguna dari hasil validasi (bukan dari body).
//   4. Periksa peran di `user_roles` memakai service role (sumber tepercaya).
//   5. Tolak (403) bila peran tidak memuat peran yang diizinkan.
//
// CATATAN PENTING: `verify_jwt = false` pada config.toml fungsi ini berarti
// platform TIDAK memvalidasi JWT untuk kita — karena itu langkah 2 WAJIB.
// Jangan mengandalkan pemeriksaan peran di React sebagai lapisan keamanan.
//
// Fungsi ini hanya mengembalikan identitas admin yang berwenang. Fungsi ini
// TIDAK mengembalikan data siswa apa pun (belum ada endpoint data pada fase ini).
// ==========================================================================

import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { createClient } from "npm:@supabase/supabase-js@2";
// Pembatasan CORS opsional (staging). Default tetap "*" bila env tidak diset.
import { applyCors, parseAllowedOrigins } from "../_shared/sinova-cors.ts";
import { resolveServerKey } from "../_shared/sinova-server-key.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Peran yang diizinkan mengakses area admin pada fase ini. Domain nilai kolom
// `user_roles.role` BELUM TERVERIFIKASI (lihat docs/admin-auth.md), karena itu
// daftar ini sengaja sempit dan mudah diaudit — bukan hasil menebak.
const ALLOWED_ROLES = ["admin"];

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      // Respons memuat identitas admin — jangan disimpan cache mana pun.
      "Cache-Control": "no-store",
    },
  });
}

// Mengambil token Bearer dari header Authorization. Mengembalikan "" bila tidak
// ada / tidak berformat Bearer. Token TIDAK pernah dicatat atau dikembalikan.
function bearerToken(req: Request): string {
  const raw = req.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(raw.trim());
  return m ? m[1].trim() : "";
}

async function handle(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return jsonResponse({ error: "Metode tidak diizinkan." }, 405);
    }

    const jwt = bearerToken(req);
    if (!jwt) {
      // Tanpa JWT tidak ada yang bisa diverifikasi. Pesan seragam.
      return jsonResponse({ error: "Sesi admin tidak valid." }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    // Kunci server: SUPABASE_SECRET_KEYS['default'] (direkomendasikan runtime)
    // dengan fallback ke SUPABASE_SERVICE_ROLE_KEY (legacy). Nilai TIDAK dicetak.
    const serverKey = resolveServerKey((nama) => Deno.env.get(nama));

    // Fail closed: tanpa konfigurasi server, akses admin tidak diberikan.
    if (!supabaseUrl || !serverKey) {
      console.error("Konfigurasi server Supabase belum lengkap.");
      return jsonResponse({ error: "Layanan admin belum siap." }, 500);
    }

    const adminClient = createClient(supabaseUrl, serverKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 1) Validasi JWT (tanda tangan/kedaluwarsa) oleh server Supabase.
    let userId = "";
    let userEmail: string | null = null;
    try {
      const { data, error } = await adminClient.auth.getUser(jwt);
      if (
        error ||
        !data?.user ||
        typeof data.user.id !== "string" ||
        data.user.id === ""
      ) {
        return jsonResponse({ error: "Sesi admin tidak valid." }, 401);
      }
      userId = data.user.id;
      userEmail =
        typeof data.user.email === "string" ? data.user.email : null;
    } catch {
      return jsonResponse({ error: "Sesi admin tidak valid." }, 401);
    }

    // 2) Peran dibaca dari sumber tepercaya (service role), bukan dari klien.
    const { data: rows, error: roleError } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (roleError) {
      // Jangan ungkap detail internal; jangan izinkan akses.
      console.error("Gagal memeriksa peran admin:", roleError.message);
      return jsonResponse({ error: "Layanan admin belum siap." }, 500);
    }

    const roles = Array.isArray(rows)
      ? rows.map((r) =>
        r && typeof (r as { role?: unknown }).role === "string"
          ? (r as { role: string }).role
          : ""
      )
      : [];

    const berwenang = roles.some((r) => ALLOWED_ROLES.includes(r));

    if (!berwenang) {
      // Login valid tetapi tanpa peran yang sesuai: 403 (bukan 401).
      return jsonResponse({ error: "Akses admin ditolak." }, 403);
    }

    return jsonResponse({
      ok: true,
      user: { id: userId, email: userEmail },
      role: "admin",
    });
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
