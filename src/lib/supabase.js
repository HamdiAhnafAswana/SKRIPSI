// ============================================================================
// supabase.js — klien Supabase untuk frontend SINOVA.
//
// NILAI YANG WAJIB TERSEDIA SAAT INISIALISASI (keduanya PUBLIK, boleh masuk
// bundle — JANGAN pernah menaruh service-role key / secret server di sini):
//   - VITE_SUPABASE_URL        : URL proyek Supabase (mis. https://<ref>.supabase.co)
//   - VITE_SUPABASE_ANON_KEY   : anon/publishable key proyek
//
// PENTING (perbaikan halaman kosong):
//   Modul ini TIDAK PERNAH `throw` saat diimpor. Bila konfigurasi hilang
//   (mis. build publik tanpa variabel VITE_*), kita TIDAK meruntuhkan seluruh
//   bundel (yang menyebabkan halaman kosong tanpa pesan). Sebagai gantinya:
//     - `supabase` bernilai `null`,
//     - `isSupabaseConfigured` bernilai `false`,
//     - `supabaseConfigError` berisi pesan ramah untuk ditampilkan UI.
//   Entry point (src/main.jsx) memeriksa `isSupabaseConfigured` dan menampilkan
//   layar peringatan yang jelas, bukan halaman kosong.
//
// Keamanan: akses data tetap dilindungi autentikasi + otorisasi di server
// (RLS Supabase & Edge Function). Anon key hanya mengidentifikasi proyek,
// bukan memberi wewenang baca/tulis tabel.
// ============================================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function nonEmpty(v) {
  return typeof v === 'string' && v.trim() !== '';
}

// Daftar variabel yang hilang (hanya NAMA, bukan nilai) — aman ditampilkan.
export const supabaseMissingVars = [
  nonEmpty(supabaseUrl) ? null : 'VITE_SUPABASE_URL',
  nonEmpty(supabaseKey) ? null : 'VITE_SUPABASE_ANON_KEY',
].filter(Boolean);

export const isSupabaseConfigured = supabaseMissingVars.length === 0;

export const supabaseConfigError = isSupabaseConfigured
  ? ''
  : 'Konfigurasi Supabase belum lengkap. Variabel berikut tidak tersedia saat build: ' +
    supabaseMissingVars.join(', ') +
    '.';

// Klien dibuat HANYA bila konfigurasi lengkap. `null` = tidak terkonfigurasi.
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;
