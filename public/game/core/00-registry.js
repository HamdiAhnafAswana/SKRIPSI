/* ==========================================================================
   REGISTRY LEVEL
   ----------------------------------------------------------------------
   Setiap file di src/levels/ mendaftarkan dirinya sendiri lewat
   registerLevel(n, {...}). Core tidak perlu diedit saat menambah /
   menghapus level.

       registerLevel(6, {
           t:    'Judul level',            // tampil di kartu pilih level
           m:    'Deskripsi singkat',      // tampil di kartu pilih level
           desc: 'Penjelasan di menu Cara bermain',
           mk:   makeL6                    // fungsi pembuat scene level
       });

   Wajib: file level harus berada di folder src/levels/ dan variable
   mk-nya adalah function declaration (hoisted) supaya boleh dipanggil
   sebelum semua file selesai dimuat.
   ========================================================================== */

/** Daftar level. Indeks = n - 1, jadi LEVELS[0] adalah level 1. */
const LEVELS = [];

/**
 * @param {number} n  nomor level (1 = pertama)
 * @param {{t:string, m:string, desc?:string, mk:Function}} def
 */
function registerLevel(n, def) {
  if (!Number.isInteger(n) || n < 1) throw new Error('registerLevel: nomor level tidak valid -> ' + n);
  if (typeof def.mk !== 'function') throw new Error('registerLevel(' + n + '): def.mk harus berupa fungsi');
  if (LEVELS[n - 1]) console.warn('registerLevel: level ' + n + ' didaftarkan dua kali (yang lama diabaikan).');
  LEVELS[n - 1] = { n: n, t: def.t || 'Level ' + n, m: def.m || '', desc: def.desc || def.m || '', mk: def.mk };
}

/** Level yang benar-benar terdaftar, urut dari nomor terkecil. */
function levelList() { return LEVELS.filter(Boolean); }

/** Total level terdaftar (dipakai core untuk batas unlocking & pesan akhir). */
function levelTotal() { return levelList().length; }