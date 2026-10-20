// ============================================================================
// adminRoute.js — penentu rute area admin (MURNI, tanpa React/DOM).
//
// Area admin diakses lewat hash `#/admin` supaya:
//   - bundel game siswa tidak memuat kode admin (impor dinamis di main.jsx);
//   - area admin tidak memuat skrip engine game.
//
// Dipisahkan dari main.jsx agar keputusan rute ini dapat diuji langsung.
// ============================================================================

// Menerima nilai `window.location.hash` (mis. "#/admin"). Mengembalikan true
// HANYA untuk jalur `/admin` yang persis atau beralih dengan "/" atau "?".
// Contoh yang BUKAN admin: "#/administrasi", "", "#/", "#/game".
export function isAdminRoute(hash) {
  const h = typeof hash === 'string' ? hash : '';
  const bersih = h.startsWith('#') ? h.slice(1) : h;
  return (
    bersih === '/admin' ||
    bersih.startsWith('/admin/') ||
    bersih.startsWith('/admin?')
  );
}

export default { isAdminRoute };
