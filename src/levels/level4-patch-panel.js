// ==========================================================================
// levels/level4-patch-panel.js
// Diambil dari netcrimp2.html baris 2569-2667. File ini digabung otomatis oleh build.mjs
// ke dist/netcrimp2.html -- JANGAN diedit langsung di dist/.
// ==========================================================================

/* ================================================================
   LEVEL 4 — Pasang ke Patch Panel
   ================================================================ */
function makeL4() {
    const lv = baseLevel(4, 'Pasang ke Patch Panel');
    const rooms = ['Lab Komputer', 'Ruang Guru', 'Perpustakaan', 'Tata Usaha'];
    const ports = shuffle([1, 2, 3, 4, 5, 6, 7, 8]).slice(0, 4);
    const homes = shuffle([330, 480, 630, 780]);
    const HY = 510;
    lv.cables = rooms.map((r, i) => ({ room: r, port: ports[i], home: homes[i], hx: homes[i], hy: HY, seated: null, punched: false }));
    lv.occ = Array(8).fill(null); lv.tool = null; lv.blade = 'in'; lv.drag = null; lv.pa = null;
    const TOOLS = [{ id: 'crimp', n: 'Crimping Tool' }, { id: 'punch', n: 'Punch-down Tool' }, { id: 'obeng', n: 'Obeng' }];
    const bx = j => 290 + j * 77, BY = 124;
    say('Pasang tiap kabel ke port sesuai daftar jalur, lalu tekan kawatnya dengan alat yang tepat.', 'info');
    function punchAttempt(j) {
        const c = lv.occ[j];
        if (!lv.tool) { say('Pilih alat terlebih dahulu.', 'info'); return; }
        if (lv.tool !== 'punch') { lv.penalize(5, (TOOLS.find(t => t.id === lv.tool).n) + ' bukan alat untuk punch-down.'); return; }
        if (!c) { lv.penalize(5, 'Port ' + (j + 1) + ' belum berisi kabel.'); return; }
        if (c.punched) return;
        if (lv.blade === 'in') { lv.penalize(5, 'Bilah potong harus menghadap ke luar agar sisa kawat terpotong rapi.'); return; }
        c.punched = true; lv.pa = { j, t0: performance.now() };
        const left = lv.cables.filter(k => !k.punched).length;
        if (left === 0) { say('Semua kabel terminasi dengan benar. Jalur siap dipakai!', 'ok'); lv.win(1800); }
        else say('Port ' + (j + 1) + ' (' + c.room + ') terminasi. Sisa ' + left + ' kabel.', 'ok');
    }
    lv.draw = function () {
        lv.tick(); deskBG(); hud(lv);
        rr(20, 84, 250, 250, 14); ctx.fillStyle = C.panel; ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.stroke();
        txt('Daftar jalur', 38, 118, { s: 20, f: FONT_H, w: 600, c: C.acc });
        lv.cables.slice().sort((a, b) => a.port - b.port).forEach((c, i) => {
            const y = 140 + i * 44; rr(34, y, 222, 36, 8); ctx.fillStyle = '#0f1c2d'; ctx.fill();
            txt('Port ' + c.port, 46, y + 24, { s: 14, c: C.warn }); txt(c.room, 116, y + 24, { s: 14 });
        });
        txt(lv.cables.filter(c => c.punched).length + ' / 4 terminasi', 145, 318, { s: 14, a: 'center', c: C.mute });
        rr(272, 100, 640, 150, 14); ctx.fillStyle = '#233a55'; ctx.fill(); ctx.strokeStyle = '#4a6a8f'; ctx.lineWidth = 2; ctx.stroke();
        for (let j = 0; j < 8; j++) {
            const x = bx(j); const c = lv.occ[j];
            const hov = lv.drag && mouse.x > x - 12 && mouse.x < x + 76 && mouse.y > 90 && mouse.y < 320;
            rr(x, BY, 64, 92, 8); ctx.fillStyle = c && c.punched ? '#0f3d2e' : '#101d2f'; ctx.fill();
            ctx.lineWidth = hov ? 3 : 2; ctx.strokeStyle = hov ? C.acc : (c && c.punched ? C.ok : '#3c5878'); ctx.stroke();
            for (let k = 0; k < 8; k++) { ctx.fillStyle = WC[T568B[k]].c; ctx.fillRect(x + 9 + k * 6.6, BY + 8, 4, 26); }
            txt(j + 1, x + 32, BY + 114, { s: 15, a: 'center', c: C.mute });
            if (c && c.punched) tickIcon(x + 32, BY + 62, 18, C.ok);
        }
        for (const c of lv.cables) {
            ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(c.hx, c.hy); ctx.bezierCurveTo(c.hx, c.hy + 90, c.home, c.hy + 40, c.home, H + 40);
            ctx.lineWidth = 11; ctx.strokeStyle = '#2c4a78'; ctx.stroke(); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.stroke();
            for (let k = 0; k < 8; k++) {
                const d = WC[T568B[k]]; let x1, y1, x2, y2;
                if (c.seated !== null) { x1 = c.hx - 14 + k * 4; y1 = c.hy - 6; x2 = bx(c.seated) + 11 + k * 6.6; y2 = BY + 92; }
                else { x1 = c.hx - 14 + k * 4; y1 = c.hy - 6; x2 = x1; y2 = c.hy - 32; }
                if (c.punched) { y2 = c.hy - 40; }
                ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineWidth = 3; ctx.strokeStyle = d.st ? '#f2f2ee' : d.c; ctx.setLineDash([]); ctx.stroke();
                if (d.st) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = d.c; ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]); }
            }
            const hov = !c.punched && Math.hypot(mouse.x - c.hx, mouse.y - c.hy) < 18; if (hov) hoverBtn = true;
            ctx.beginPath(); ctx.arc(c.hx, c.hy, 13, 0, 6.3); ctx.fillStyle = c.punched ? '#166534' : '#93c5fd'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = hov ? '#fff' : '#1e3a5f'; ctx.stroke();
            rr(c.hx - 36, c.hy + 17, 72, 32, 6); ctx.fillStyle = '#0b1626'; ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 1.5; ctx.stroke();
            const nm = c.room.split(' ');
            txt(nm[0], c.hx, c.hy + 30, { s: 11, a: 'center' }); txt(nm.slice(1).join(' '), c.hx, c.hy + 43, { s: 11, a: 'center' });
        }
        TOOLS.forEach((t, i) => {
            const x = 290 + i * 140, y = 330, w = 130, h = 62, sel = lv.tool === t.id, hov = over(x, y, w, h); if (hov) hoverBtn = true;
            rr(x, y, w, h, 12); ctx.fillStyle = sel ? '#1d4f74' : (hov ? '#2a4565' : C.panel2); ctx.fill(); ctx.lineWidth = sel ? 3 : 2; ctx.strokeStyle = sel ? C.acc : C.line; ctx.stroke();
            icon(t.id, x + 34, y + 31, .6); txt(t.n, x + 62, y + 35, { s: 12.5, w: 800 });
            hit(x, y, w, h, () => { lv.tool = t.id; });
        });
        btn(725, 330, 187, 62, 'Bilah: ' + (lv.blade === 'in' ? 'menghadap dalam' : 'menghadap luar'), () => { lv.blade = lv.blade === 'in' ? 'out' : 'in'; }, { color: lv.blade === 'out' ? C.ok : C.warn, s: 14 });
        para('Langkah: seret kabel ke port sesuai daftar jalur → pilih Punch-down Tool → atur bilah menghadap luar → klik port berisi kabel.', 290, 420, 620, 20, { s: 14, c: C.mute });
        if (lv.pa) {
            const dt = performance.now() - lv.pa.t0; if (dt < 600) {
                const cx = bx(lv.pa.j) + 32; icon('punch', cx, BY + 92 + 70 - Math.min(dt, 180) / 180 * 44, 1);
                if (dt > 180) { ctx.beginPath(); ctx.arc(cx, BY + 92, (dt - 180) / 6, 0, 6.3); ctx.strokeStyle = 'rgba(251,191,36,' + (1 - (dt - 180) / 420) + ')'; ctx.lineWidth = 3; ctx.stroke(); }
            } else lv.pa = null;
        }
    };
    lv.down = function (p) {
        if (lv.phase !== 'play') return;
        for (const c of lv.cables) {
            if (!c.punched && Math.hypot(p.x - c.hx, p.y - c.hy) < 20) {
                if (c.seated !== null) { lv.occ[c.seated] = null; c.seated = null; }
                lv.drag = { c }; return;
            }
        }
        for (let j = 0; j < 8; j++) { if (inR(p, { x: bx(j), y: BY, w: 64, h: 92 })) { punchAttempt(j); return; } }
    };
    lv.move = function (p) { if (lv.drag) { lv.drag.c.hx = p.x; lv.drag.c.hy = p.y; } };
    lv.up = function (p) {
        if (!lv.drag) return; const c = lv.drag.c; lv.drag = null;
        let j = -1;
        for (let k = 0; k < 8; k++) { if (p.x >= bx(k) - 12 && p.x <= bx(k) + 76 && p.y >= 90 && p.y <= 320) { j = k; break; } }
        const home = () => { c.hx = c.home; c.hy = HY; };
        if (j < 0) { c.hx = Math.min(930, Math.max(30, p.x)); c.hy = Math.min(560, Math.max(470, p.y)); if (p.y < 470) home(); return; }
        if (lv.occ[j]) { say('Port ' + (j + 1) + ' sudah terisi kabel lain.', 'info'); home(); return; }
        if (j + 1 !== c.port) { lv.penalize(10, 'Kabel ' + c.room + ' harus ke Port ' + c.port + ', bukan Port ' + (j + 1) + '. Cek daftar jalur.'); home(); return; }
        c.seated = j; lv.occ[j] = c; c.hx = bx(j) + 32; c.hy = 285;
        say('Kabel ' + c.room + ' terpasang di Port ' + (j + 1) + '. Sekarang tekan dengan punch-down tool.', 'ok');
    };
    return lv;
}

/* ---------- pendaftaran level ---------- */
registerLevel(4, {
    t: 'Pasang ke Patch Panel',
    m: 'Drag kabel ke port, klik punch-down tool',
    desc: 'Seret kabel ke port sesuai daftar jalur. Pilih Punch-down Tool, hadapkan bilah ke luar, lalu klik port.',
    mk: makeL4
});
