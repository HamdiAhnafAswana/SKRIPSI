// ============================================================================
// sinova-server-key.ts — pemilihan kunci server (bypass RLS) untuk Edge Function
// admin SINOVA.
//
// Latar belakang (runtime Supabase saat ini):
//   - Platform menyuntikkan `SUPABASE_SECRET_KEYS` berupa JSON kamus kunci
//     rahasia bernama, mis. {"default":"sb_secret_..."}. Ini jalur yang
//     DIREKOMENDASIKAN (lihat dokumentasi Environment Variables
//     `@supabase/server` dan docs Supabase "Default secrets").
//   - `SUPABASE_SERVICE_ROLE_KEY` masih disuntikkan, tetapi berisi kunci
//     LEGACY (`service_role`) dan bersifat deprecated.
//
// Aturan berkas ini:
//   1. Prioritaskan `SUPABASE_SECRET_KEYS['default']`.
//   2. Bila tidak ada / bukan string / JSON rusak / kosong → fallback ke
//      `SUPABASE_SERVICE_ROLE_KEY` (legacy).
//   3. Bila keduanya tidak tersedia → kembalikan `undefined` (pemanggil WAJIB
//      fail-closed).
//   4. MURNI: tanpa I/O, tanpa `Deno`, tanpa log. Nilai kunci TIDAK PERNAH
//      dicetak/dikembalikan sebagai bagian dari pesan diagnostik.
//
// Dipakai HANYA oleh `admin-check` dan `admin-data`. Fungsi siswa tidak
// mengimpor berkas ini.
// ============================================================================

export type EnvGetter = (name: string) => string | undefined;

/** Nilai non-kosong sebagai string, atau `undefined`. Tidak men-trim nilai. */
function kunciTakKosong(nilai: unknown): string | undefined {
  if (typeof nilai !== "string") return undefined;
  if (nilai.trim() === "") return undefined;
  return nilai;
}

/**
 * Ambil kunci server: `SUPABASE_SECRET_KEYS['default']` lebih dulu, lalu
 * `SUPABASE_SERVICE_ROLE_KEY` (legacy). `undefined` = tidak ada kunci yang
 * layak dipakai (pemanggil harus fail-closed).
 */
export function resolveServerKey(getEnv: EnvGetter): string | undefined {
  const paket = getEnv("SUPABASE_SECRET_KEYS");
  if (paket) {
    let terurai: unknown;
    try {
      terurai = JSON.parse(paket);
    } catch {
      // JSON rusak: jangan menebak, lanjut ke fallback legacy.
      terurai = undefined;
    }
    if (terurai && typeof terurai === "object" && !Array.isArray(terurai)) {
      const defaultKey = kunciTakKosong(
        (terurai as Record<string, unknown>)["default"],
      );
      if (defaultKey) return defaultKey;
    }
  }

  return kunciTakKosong(getEnv("SUPABASE_SERVICE_ROLE_KEY"));
}
