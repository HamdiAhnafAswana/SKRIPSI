// ==========================================================================
// core/08-wire-colors.js
// Diambil dari backup/netcrimp2.ORI.html baris 183-201. File ini digabung otomatis oleh build.mjs
// ke index.html -- JANGAN diedit langsung di index.html.
// ==========================================================================

/* ---------- warna kabel ---------- */
const WC = {
    wo: { n: 'Putih-Oranye', c: '#f97316', st: 1 }, o: { n: 'Oranye', c: '#f97316' },
    wg: { n: 'Putih-Hijau', c: '#16a34a', st: 1 }, b: { n: 'Biru', c: '#2563eb' },
    wb: { n: 'Putih-Biru', c: '#2563eb', st: 1 }, g: { n: 'Hijau', c: '#16a34a' },
    wbr: { n: 'Putih-Coklat', c: '#8b5a2b', st: 1 }, br: { n: 'Coklat', c: '#8b5a2b' },
    sarung_tangan: { n: 'Sarung Tangan', c: '#dc2626', st: 0 }
};
const T568B = ['wo', 'o', 'wg', 'b', 'wb', 'g', 'wbr', 'br'];
const T568A = ['wg', 'g', 'wo', 'b', 'wb', 'o', 'wbr', 'br'];
function drawWire(x, y, w, h, id, hz) {
    const d = WC[id], r = Math.min(w, h) / 2.4;
    rr(x, y, w, h, r); ctx.fillStyle = d.st ? '#f2f2ee' : d.c; ctx.fill();
    if (d.st) {
        ctx.save(); rr(x, y, w, h, r); ctx.clip(); ctx.fillStyle = d.c; const L = hz ? w : h, n = 6, b = L / n;
        for (let k = 0; k < n; k += 2) { if (hz) ctx.fillRect(x + k * b + b * .25, y - 1, b, h + 2); else ctx.fillRect(x - 1, y + k * b + b * .25, w + 2, b); } ctx.restore();
    }
    rr(x, y, w, h, r); ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.stroke();
}
