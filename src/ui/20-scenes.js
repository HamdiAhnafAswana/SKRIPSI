// ==========================================================================
// ui/20-scenes.js
// Diambil dari backup/netcrimp2.ORI.html baris 2816-2934. File ini digabung otomatis oleh build.mjs
// ke index.html -- JANGAN diedit langsung di index.html.
// ==========================================================================

/* ================================================================
   Scene menu
   ------------------------------------------------------------------
   Daftar level TIDAK ditulis di sini. Semuanya datang dari registry
   (src/core/00-registry.js) yang diisi oleh registerLevel() di tiap
   file src/levels/*.js. Tambah level baru = tambah 1 file, core & UI
   tidak perlu disentuh.
   ================================================================ */
function go(s) { if (scene && scene !== s && scene.exit) scene.exit(); scene = s; toast = null; if (s.enter) s.enter(); }
function startLevel(i) { const L = LEVELS[i]; if (!L) return; if (!(save.teacher || i < save.unlocked)) return; go(L.mk()); }

const menuScene = {
    draw() {
        bg(true);
        txt('SINOVA', W / 2, 130, { s: 72, f: FONT_H, a: 'center', w: 600, c: C.text });
        txt('Simulation Interactive Network Virtual Academy', W / 2, 168, { s: 19, a: 'center', c: C.acc });
        txt('Simulasi interaktif instalasi dan troubleshooting jaringan komputer', W / 2, 192, { s: 14, a: 'center', c: C.mute });
        txt('Media pembelajaran untuk siswa SMK TKJ', W / 2, 192, { s: 14, a: 'center', c: C.mute });
        btn(W / 2 - 140, 224, 280, 46, 'Mulai bermain', () => go(levelsScene), { s: 18, color: C.acc });
        btn(W / 2 - 140, 280, 280, 42, 'Cara bermain', () => go(helpScene), { color: '#2b4360', tc: C.text, s: 14 });
        btn(W / 2 - 140, 330, 280, 42, 'Log hasil', () => go(logScene), { color: '#2b4360', tc: C.text, s: 14 });
        btn(W / 2 - 140, 380, 280, 42, 'Grafis L2: ' + save.l2.grafis + ' / Suara: ' + (save.l2.sound ? 'ON' : 'OFF'), () => {
            if (save.l2.grafis === 'hemat') { save.l2.grafis = 'normal'; }
            else { save.l2.grafis = 'hemat'; }
            save.l2.sound = !save.l2.sound;
            persist();
        }, { color: save.l2.grafis === 'hemat' ? C.warn : '#2b4360', tc: save.l2.grafis === 'hemat' ? '#1a1200' : C.text, s: 12 });
        if (!nameEl.value.trim()) txt('Isi nama siswa di atas kanvas agar hasil tercatat di log.', W / 2, 430, { s: 13, a: 'center', c: C.warn });
        const lbY = 456;
        txt('🏆 Papan Peringkat Level 1, 2 & 3', W / 2, lbY, { s: 15, f: FONT_H, a: 'center', c: C.warn });
        const top5 = (save.board || []).slice(0, 3);
        const top5b = (save.board2 || []).slice(0, 3);
        const top5c = (save.board3 || []).slice(0, 3);
        if (!top5.length && !top5b.length && !top5c.length) txt('Belum ada skor. Jadilah yang pertama!', W / 2, lbY + 28, { s: 13, a: 'center', c: C.mute });
        else {
            top5.forEach((e, i) => { const y = lbY + 24 + i * 20; txt('L1 · ' + (i + 1) + '. ' + (e.nama.length > 12 ? e.nama.slice(0, 11) + '…' : e.nama) + ' — ' + e.skor, W / 2 - 270, y, { s: 12, a: 'center', c: i === 0 ? C.warn : C.text }); });
            top5b.forEach((e, i) => { const y = lbY + 24 + i * 20; txt('L2 · ' + (i + 1) + '. ' + (e.nama.length > 12 ? e.nama.slice(0, 11) + '…' : e.nama) + ' — ' + e.skor, W / 2, y, { s: 12, a: 'center', c: i === 0 ? C.warn : C.text }); });
            top5c.forEach((e, i) => { const y = lbY + 24 + i * 20; txt('L3 · ' + (i + 1) + '. ' + (e.nama.length > 12 ? e.nama.slice(0, 11) + '…' : e.nama) + ' — ' + e.skor, W / 2 + 270, y, { s: 12, a: 'center', c: i === 0 ? C.warn : C.text }); });
        }
    }
};
const levelsScene = {
    draw() {
        bg(false);
        txt('Pilih level', W / 2, 72, { s: 38, f: FONT_H, a: 'center', w: 600 });
        txt('Selesaikan level secara berurutan untuk membuka level berikutnya.', W / 2, 100, { s: 14, a: 'center', c: C.mute });
        const list = levelList(), n = list.length;
        const gap = 12, cw = Math.min(168, (W - 72 - gap * (n - 1)) / n), x0 = (W - (cw * n + gap * (n - 1))) / 2;
        list.forEach((L, i) => {
            const x = x0 + i * (cw + gap), y = 126, w = cw, h = 328, open = save.teacher || (L.n - 1) < save.unlocked;
            const hov = open && over(x, y, w, h); if (hov) hoverBtn = true;
            rr(x, y, w, h, 16); ctx.fillStyle = open ? (hov ? '#25405f' : C.panel) : '#111d2c'; ctx.fill(); ctx.strokeStyle = open ? (hov ? C.acc : C.line) : '#1c2a3c'; ctx.lineWidth = 2; ctx.stroke();
            ctx.beginPath(); ctx.arc(x + w / 2, y + 44, 26, 0, 6.3); ctx.fillStyle = open ? C.acc : '#22344a'; ctx.fill();
            txt(L.n, x + w / 2, y + 54, { s: 30, f: FONT_H, a: 'center', c: open ? '#06131f' : '#5f7389', w: 600 });
            const nl = para(L.t, x + w / 2, y + 100, w - 28, 20, { s: 16, a: 'center', w: 800, c: open ? C.text : '#5f7389' });
            para(L.m, x + w / 2, y + 100 + nl * 20 + 10, w - 32, 18, { s: 13, a: 'center', c: open ? C.mute : '#485b71' });
            if (open) {
                for (let k = 0; k < 3; k++) star(x + w / 2 - 34 + k * 34, y + h - 62, 13, k < (save.stars[L.n - 1] || 0));
                txt(save.best[L.n - 1] ? 'Skor terbaik ' + save.best[L.n - 1] : 'Belum dimainkan', x + w / 2, y + h - 22, { s: 13, a: 'center', c: C.mute });
                hit(x, y, w, h, () => startLevel(L.n - 1));
            } else lock(x + w / 2, y + h - 50, 1);
        });
        btn(36, 486, 120, 44, 'Kembali', () => go(menuScene), { color: '#334155', tc: C.text, s: 15 });
        btn(170, 486, 140, 44, 'Log hasil', () => go(logScene), { color: '#2b4360', tc: C.text, s: 15 });
        btn(324, 486, 170, 44, 'Cara bermain', () => go(helpScene), { color: '#2b4360', tc: C.text, s: 15 });
        btn(W - 300, 486, 264, 44, 'Mode guru: ' + (save.teacher ? 'aktif' : 'mati'), () => { save.teacher = !save.teacher; persist(); }, { color: save.teacher ? C.warn : '#334155', tc: save.teacher ? '#1a1200' : C.text, s: 14 });
        txt('Mode guru membuka semua level untuk keperluan uji coba atau validasi.', W - 36, 556, { s: 12, a: 'right', c: C.mute });
    }
};
const helpScene = {
    draw() {
        bg(false);
        txt('Cara bermain', W / 2, 68, { s: 38, f: FONT_H, a: 'center', w: 600 });
        const rows = levelList().map(L => ['Level ' + L.n, L.desc]);
        const step = Math.min(66, (440 - 94) / Math.max(1, rows.length)), bh = step - 8;
        rows.forEach((r, i) => {
            const y = 94 + i * step; rr(60, y, 840, bh, 12); ctx.fillStyle = C.panel; ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 1.5; ctx.stroke();
            txt(r[0], 80, y + bh / 2 + 6, { s: 19, f: FONT_H, c: C.acc, w: 600 });
            const L = wrapLines(r[1], 710, 13.5, 600), lh = 19, ty = y + bh / 2 - (L.length - 1) * lh / 2 + 5;
            L.forEach((ln, k) => txt(ln, 170, ty + k * lh, { s: 13.5, w: 600 }));
        });
        para('Skor awal 100 dan berkurang setiap kesalahan. Tiga bintang untuk skor 85 ke atas, dua bintang 60 ke atas, satu bintang jika level selesai.', 60, 452, 840, 20, { s: 14, c: C.mute });
        btn(W / 2 - 70, 510, 140, 46, 'Kembali', () => go(menuScene), { color: C.acc });
    }
};
function csv() {
    const rows = ['waktu,nama,level,skor,bintang,durasi_detik,kesalahan,hasil,kabel_cm,rj45,bantuan,lencana'];
    save.log.forEach(l => rows.push([new Date(l.ts).toLocaleString('id-ID').replace(/,/g, ''), '"' + String(l.nama).replace(/"/g, '""') + '"', l.level, l.skor, l.bintang, l.durasi, l.salah, l.hasil, l.kabel_cm || 0, l.rj45 || 0, l.bantuan || 0, '"' + String(l.lencana || '-').replace(/"/g, '""') + '"'].join(',')));
    return rows.join('\n');
}
const logScene = {
    draw() {
        bg(false);
        txt('Log hasil', W / 2, 60, { s: 36, f: FONT_H, a: 'center', w: 600 });
        const cols = [{ h: 'Waktu', x: 40 }, { h: 'Nama', x: 150 }, { h: 'Lv', x: 360 }, { h: 'Skor', x: 410 }, { h: 'Bintang', x: 480 }, { h: 'Durasi', x: 580 }, { h: 'Salah', x: 680 }, { h: 'Hasil', x: 770 }];
        rr(30, 84, 900, 384, 12); ctx.fillStyle = C.panel; ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.stroke();
        cols.forEach(c => txt(c.h, c.x, 112, { s: 13, c: C.acc }));
        const rows = save.log.slice(-12).reverse();
        if (!rows.length) txt('Belum ada data. Selesaikan satu level untuk mencatat hasil.', W / 2, 280, { s: 16, a: 'center', c: C.mute });
        rows.forEach((l, i) => {
            const y = 138 + i * 27; if (i % 2 === 0) { ctx.fillStyle = 'rgba(255,255,255,.04)'; ctx.fillRect(34, y - 18, 892, 26); }
            const d = new Date(l.ts); const pad = v => String(v).padStart(2, '0');
            const nm = String(l.nama).length > 26 ? String(l.nama).slice(0, 25) + '…' : l.nama;
            txt(pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()), 40, y, { s: 13, w: 600 });
            txt(nm, 150, y, { s: 13, w: 600 }); txt(l.level, 360, y, { s: 13, w: 600 }); txt(l.skor, 410, y, { s: 13, w: 600 });
            txt('★'.repeat(l.bintang) || '-', 480, y, { s: 13, c: C.warn }); txt(fmt(l.durasi), 580, y, { s: 13, w: 600 }); txt(l.salah, 680, y, { s: 13, w: 600 });
            txt(l.hasil, 770, y, { s: 13, c: l.hasil === 'Lulus' ? C.ok : C.bad });
        });
        btn(30, 490, 130, 44, 'Kembali', () => go(menuScene), { color: '#334155', tc: C.text, s: 15 });
        btn(176, 490, 190, 44, 'Salin sebagai CSV', () => {
            if (!save.log.length) { say('Log masih kosong.', 'info'); return; }
            try { navigator.clipboard.writeText(csv()).then(() => say('Log disalin. Tempel ke Excel atau Google Sheets.', 'ok'), () => say('Browser menolak akses clipboard. Coba buka halaman ini langsung di browser.', 'bad')); }
            catch (e) { say('Clipboard tidak tersedia di browser ini.', 'bad'); }
        }, { color: C.ok, s: 14 });
        btn(W - 200, 490, 170, 44, 'Hapus log', () => { if (logScene.confirm) { save.log = []; persist(); logScene.confirm = false; say('Log dihapus.', 'info'); } else { logScene.confirm = true; say('Tekan Hapus log sekali lagi untuk konfirmasi.', 'bad'); } }, { color: logScene.confirm ? C.bad : '#475569', tc: logScene.confirm ? '#1a0505' : C.text, s: 14 });
        txt('Menampilkan 12 catatan terbaru dari ' + save.log.length + ' total.', W / 2, 564, { s: 12, a: 'center', c: C.mute });
    },
    enter() { logScene.confirm = false; }
};
