// ============================================================================
// sinova-cors.ts — header CORS bersama untuk Edge Function SINOVA.
//
// Tujuan: memungkinkan PEMBATASAN origin pada lingkungan non-produksi
// (staging) TANPA mengubah perilaku lingkungan yang belum dikonfigurasi.
//
// Aturan aman (default):
//   - Bila env `SINOVA_ALLOWED_ORIGINS` TIDAK diset / kosong → header tetap
//     `Access-Control-Allow-Origin: *` seperti sebelumnya. Produksi yang belum
//     dikonfigurasi TIDAK berubah.
//   - Bila env diisi (daftar dipisah koma, mis. di staging) → hanya origin yang
//     cocok yang diizinkan; origin lain TIDAK diberi `Access-Control-Allow-Origin`
//     sehingga browser menolaknya. `Vary: Origin` selalu ditambahkan.
//
// Berkas ini MURNI: tidak membaca Deno.env sendiri (nilai allowlist dikirim oleh
// pemanggil), tidak menyentuh jaringan, dan tidak pernah mencatat apa pun.
// ============================================================================

export const DEFAULT_ALLOWED_HEADERS =
  "authorization, apikey, content-type, x-client-info";
export const DEFAULT_ALLOWED_METHODS = "POST, OPTIONS";

// "https://a.id, http://localhost:5173" → ["https://a.id", "http://localhost:5173"]
export function parseAllowedOrigins(raw: unknown): string[] {
  if (typeof raw !== "string") return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// Menentukan nilai `Access-Control-Allow-Origin`:
//   - ""                   → tidak diizinkan (jangan kirim header)
//   - "*"                  → allowlist kosong (perilaku lama)
//   - origin yang cocok    → origin tersebut
// Mendukung pola wildcard subdomain: "https://*.contoh.id".
export function resolveAllowOrigin(origin: unknown, allowed: string[]): string {
  if (!Array.isArray(allowed) || allowed.length === 0) return "*";
  const o = typeof origin === "string" ? origin.trim() : "";
  for (const pola of allowed) {
    if (typeof pola !== "string" || pola === "") continue;
    if (pola === "*") return o || "*";
    if (pola === o) return o;
    // Pola wildcard di mana pun, mis. "https://*.contoh.id" — cocokkan
    // prefiks + sufiks persis sehingga "contoh.id.evil.com" TIDAK lolos.
    if (pola.includes("*")) {
      const i = pola.indexOf("*");
      const prefiks = pola.slice(0, i);
      const sufiks = pola.slice(i + 1);
      if (
        o.length >= prefiks.length + sufiks.length &&
        o.startsWith(prefiks) &&
        o.endsWith(sufiks)
      ) {
        return o;
      }
    }
  }
  return "";
}

// Menyalin respons dan menormalkan header CORS sesuai allowlist.
// Body/status dipertahankan. Aman untuk respons tanpa body.
export function applyCors(req: Request, res: Response, allowed: string[]): Response {
  const origin = req.headers.get("origin");
  const allow = resolveAllowOrigin(origin, allowed);
  const headers = new Headers(res.headers);
  headers.set("Vary", "Origin");
  if (allow) {
    headers.set("Access-Control-Allow-Origin", allow);
  } else {
    // Tidak diizinkan → jangan biarkan kebetulan ada ACAO dari header bawaan.
    headers.delete("Access-Control-Allow-Origin");
  }
  const tanpaBody = res.status === 204 || res.status === 205 || res.status === 304;
  return new Response(tanpaBody ? null : res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}
