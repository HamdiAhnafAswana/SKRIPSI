#!/usr/bin/env node
// ============================================================================
// tools/deploy-staging.mjs — deployment Edge Function ke STAGING dengan penjaga.
//
// Prinsip:
//   - Menolak berjalan bila project ref KOSONG atau SAMA dengan ref PRODUKSI.
//   - DEFAULT = DRY-RUN (hanya mencetak rencana). Eksekusi hanya dengan `--run`.
//   - Tidak pernah mencetak nilai secret/token/key.
//   - Shared modules (`supabase/functions/_shared/*`) TIDAK di-deploy terpisah;
//     ikut ter-bundel otomatis oleh CLI.
//
// Pemakaian:
//   # Rencana (aman, tidak mengubah apa pun):
//   node tools/deploy-staging.mjs --ref <ref-staging>
//   # Eksekusi (BUTUH PERSETUJUAN EKSPLISIT):
//   node tools/deploy-staging.mjs --ref <ref-staging> --run
//
// Ref juga dapat diberikan lewat env SINOVA_STAGING_REF.
// `--only a,b` membatasi fungsi yang diproses.
// ============================================================================

import { spawnSync } from "node:child_process";

const PROD_REF = "rezraqimsvtwhhmxygad";

// Urutan deploy: backend siswa dulu, lalu admin. `_shared/*` ter-bundel otomatis.
const SEMUA_FUNGSI = ["student-register", "practice-session", "admin-check", "admin-data"];

const REF_POLA = /^[a-z0-9]{20}$/;

function ambilArgv() {
  const argv = process.argv.slice(2);
  let ref = process.env.SINOVA_STAGING_REF?.trim() ?? "";
  let run = false;
  let only = null;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--run") run = true;
    else if (a === "--ref") ref = (argv[++i] ?? "").trim();
    else if (a.startsWith("--ref=")) ref = a.slice("--ref=".length).trim();
    else if (a === "--only") only = (argv[++i] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    else if (a.startsWith("--only=")) only = a.slice("--only=".length).split(",").map((s) => s.trim()).filter(Boolean);
  }
  return { ref, run, only };
}

function gagal(pesan, kode) {
  console.error("GAGAL: " + pesan);
  process.exit(kode);
}

const { ref, run, only } = ambilArgv();

// --- Penjaga target ---------------------------------------------------------
if (!ref) {
  gagal(
    "project ref staging kosong. Berikan --ref <ref-staging> atau set env SINOVA_STAGING_REF.\n" +
      "         (Tidak ada default: mencegah salah menargetkan produksi.)",
    2,
  );
}
if (ref === PROD_REF) {
  gagal(
    "target SAMA dengan proyek PRODUKSI (" + PROD_REF + "). Deployment produksi dilarang di sini.",
    3,
  );
}
if (!REF_POLA.test(ref)) {
  gagal("project ref tampak tidak valid (harus 20 karakter [a-z0-9]): " + ref, 4);
}
if (only && only.some((f) => !SEMUA_FUNGSI.includes(f))) {
  gagal("--only memuat fungsi tak dikenal: " + only.join(","), 4);
}

const fungsi = only ?? SEMUA_FUNGSI;
const url = "https://" + ref + ".supabase.co";

console.log("=== Deploy STAGING SINOVA ===");
console.log("target ref : " + ref);
console.log("target URL : " + url);
console.log("produksi   : " + PROD_REF + "  (TIDAK disentuh)");
console.log("fungsi     : " + fungsi.join(", "));
console.log("shared     : supabase/functions/_shared/* (ter-bundel otomatis)");
console.log("");
console.log("Catatan secret (SETEL di staging, NILAI tidak dicetak di sini):");
console.log("  - PRACTICE_SESSION_TOKEN_SECRET  (wajib; via `supabase secrets set`)");
console.log("  - SINOVA_ALLOWED_ORIGINS         (CORS staging; origin uji saja)");
console.log("  - TOKEN_REQUIRED                 (biarkan UNSET / bukan 'false')");
console.log("");

const perintah = fungsi.map(
  (f) => ["npx", ["--yes", "supabase@latest", "functions", "deploy", f, "--project-ref", ref]],
);

if (!run) {
  console.log("DRY-RUN (tidak mengeksekusi apa pun). Perintah yang akan dijalankan:");
  for (const p of perintah) console.log("  " + p[0] + " " + p[1].join(" "));
  console.log("");
  console.log("Untuk mengeksekusi (BUTUH PERSETUJUAN): tambahkan --run");
  process.exit(0);
}

console.log("Mengeksekusi deployment...");
for (let i = 0; i < perintah.length; i++) {
  const [cmd, args] = perintah[i];
  console.log("\n$ " + cmd + " " + args.join(" "));
  const hasil = spawnSync(cmd, args, { stdio: "inherit", shell: process.platform === "win32" });
  if (hasil.status !== 0) {
    gagal("deploy '" + fungsi[i] + "' gagal (exit " + hasil.status + "). Berhenti.", 5);
  }
}
console.log("\nSelesai. Lanjutkan dengan verifikasi staging (lihat docs/staging-setup.md §9).");
