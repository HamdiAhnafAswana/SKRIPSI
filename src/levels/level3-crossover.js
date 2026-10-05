// ==========================================================================
// levels/level3-crossover.js
// Diambil dari netcrimp2.html baris 2446-2567. File ini digabung otomatis oleh build.mjs
// ke dist/netcrimp2.html -- JANGAN diedit langsung di dist/.
// ==========================================================================

/* ================================================================
   LEVEL 3 — Crimping Crossover (T568A–T568B)
   ================================================================ */
function drawChart(x, y, title, std) {
    rr(x, y, 250, 320, 14); ctx.fillStyle = C.panel; ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.stroke();
    txt('Urutan ' + title, x + 18, y + 32, { s: 19, f: FONT_H, w: 600, c: C.acc });
    std.forEach((id, i) => {
        const ry = y + 50 + i * 32;
        txt('Pin ' + (i + 1), x + 18, ry + 15, { s: 13, c: C.mute });
        drawWire(x + 64, ry, 52, 18, id, true);
        txt(WC[id].n, x + 126, ry + 15, { s: 13, w: 700 });
    });
}
function makeCrimp(n) {
    const hard = n === 3;
    const lv = baseLevel(n, hard ? 'Crimping Crossover (T568A–T568B)' : 'Crimping Straight-Through (T568B)');
    const sw = hard ? 40 : 48, gap = hard ? 5 : 6, span = 8 * sw + 7 * gap, cy = 140;
    lv.conns = hard ? [
        { label: 'Ujung A — T568A', short: 'Ujung A', std: T568A, x: 70 },
        { label: 'Ujung B — T568B', short: 'Ujung B', std: T568B, x: 535 }
    ] : [{ label: 'Konektor RJ-45 (tampak atas, pin 1 di kiri)', short: '', std: T568B, x: 292 }];
    lv.conns.forEach(c => { c.slots = Array(8).fill(null); c.res = null; });
    lv.tray = shuffle(Object.keys(WC)); lv.drag = null; lv.testDone = false; lv.hintUntil = 0;
    if (hard) {
        lv.limit = 180; lv.wrongPicks = [];
        lv.quiz = { q: 'Kabel crossover umumnya dipakai untuk menghubungkan…', opts: ['Komputer ke Switch', 'Komputer ke Komputer secara langsung', 'Komputer ke Access Point'], ans: 1, why: 'Crossover menukar jalur kirim dan terima, sehingga dua perangkat sejenis bisa terhubung langsung.' };
        say('Ujung A disusun T568A, ujung B disusun T568B. Tabel warna disembunyikan dan waktu terbatas.', 'info');
    } else say('Seret warna kabel dari rak ke pin 1–8 sesuai tabel T568B, lalu tekan Crimp & Uji.', 'info');
    const trayX = i => 200 + i * 80;
    const slotRect = (c, i) => ({ x: c.x + i * (sw + gap), y: cy, w: sw, h: 150 });
    const edited = () => { lv.conns.forEach(c => c.res = null); lv.testDone = false; };
    function runTest() {
        if (lv.phase !== 'play') return;
        if (lv.conns.some(c => c.slots.some(s => !s))) { say('Isi semua 8 pin pada setiap konektor sebelum diuji.', 'info'); return; }
        lv.conns.forEach(c => { c.res = c.slots.map((s, i) => s === c.std[i]); });
        lv.phase = 'test'; lv.testT0 = performance.now(); lv.drag = null;
    }
    function afterTest() {
        const bad = [];
        lv.conns.forEach(c => { const w = c.res.map((r, i) => r ? 0 : i + 1).filter(Boolean); if (w.length) bad.push((c.short ? c.short + ': ' : '') + 'pin ' + w.join(', ')); });
        lv.testDone = true;
        if (!bad.length) { say('Semua LED hijau. Kabel lulus uji!', 'ok'); lv.phase = 'ok'; lv.okAt = performance.now(); }
        else { lv.phase = 'play'; lv.penalize(10, 'Urutan warna salah → ' + bad.join(' | ')); }
    }
    function drawConn(c) {
        txt(c.label, c.x + span / 2, cy - 46, { s: 15, a: 'center' });
        rr(c.x - 12, cy - 34, span + 24, 196, 12); ctx.fillStyle = 'rgba(180,215,240,.14)'; ctx.fill(); ctx.strokeStyle = 'rgba(180,215,240,.5)'; ctx.lineWidth = 2; ctx.stroke();
        for (let i = 0; i < 8; i++) {
            const r = slotRect(c, i);
            rr(r.x, r.y, r.w, r.h, 6); ctx.fillStyle = '#0a1524'; ctx.fill();
            ctx.fillStyle = C.gold; ctx.fillRect(r.x + sw * .3, cy - 26, sw * .4, 22);
            if (c.slots[i]) drawWire(r.x + 4, r.y + 3, sw - 8, r.h - 6, c.slots[i]);
            let stroke = '#243a55', lw = 1.5;
            if (c.res && lv.testDone && lv.phase !== 'test') { stroke = c.res[i] ? C.ok : C.bad; lw = 3; }
            if (lv.drag && lv.phase === 'play' && mouse.x >= r.x - 3 && mouse.x <= r.x + r.w + 3 && mouse.y >= r.y - 30 && mouse.y <= r.y + r.h + 20) { stroke = C.acc; lw = 3; }
            rr(r.x, r.y, r.w, r.h, 6); ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke();
            ctx.beginPath(); ctx.arc(r.x + sw / 2, r.y + 16, 10, 0, 6.3); ctx.fillStyle = 'rgba(6,14,26,.85)'; ctx.fill();
            txt(i + 1, r.x + sw / 2, r.y + 21, { s: 13, a: 'center' });
        }
        rr(c.x + span * .12, cy + 162, span * .76, 54, 10); const g = ctx.createLinearGradient(0, cy + 162, 0, cy + 216); g.addColorStop(0, '#a3b1c2'); g.addColorStop(1, '#6b7a8c'); ctx.fillStyle = g; ctx.fill();
        txt('Kabel UTP', c.x + span / 2, cy + 195, { s: 14, a: 'center', c: '#0f1c2d' });
        const ty = cy + 224;
        rr(c.x - 12, ty, span + 24, 46, 10); ctx.fillStyle = '#08111e'; ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 1.5; ctx.stroke();
        const now = performance.now();
        for (let i = 0; i < 8; i++) {
            const r = slotRect(c, i);
            let lit = false;
            if (c.res) { lit = lv.phase === 'test' ? (now - lv.testT0) > i * 220 : true; }
            ctx.beginPath(); ctx.arc(r.x + sw / 2, ty + 23, 9, 0, 6.3); ctx.fillStyle = lit ? (c.res[i] ? C.ok : C.bad) : '#1d2a3d'; ctx.fill();
            if (lit) { ctx.save(); ctx.shadowColor = c.res[i] ? C.ok : C.bad; ctx.shadowBlur = 12; ctx.fill(); ctx.restore(); }
            txt(i + 1, r.x + sw / 2, ty + 27, { s: 10, a: 'center', c: lit ? '#04120c' : '#5f7389' });
        }
        txt('LAN Tester', c.x + span / 2, ty + 62, { s: 11, a: 'center', c: C.mute });
    }
    lv.draw = function () {
        lv.tick();
        const now = performance.now();
        if (lv.phase === 'test' && now - lv.testT0 > 2300) afterTest();
        if (lv.phase === 'ok' && now - lv.okAt > 1300) { if (hard) { lv.phase = 'quiz'; } else lv.win(300); }
        if (lv.limit && !lv.finished && (lv.phase === 'play' || lv.phase === 'test') && lv.elapsed() > lv.limit) { lv.finished = true; lv.dur = lv.limit; endLevel(lv, false); return; }
        deskBG(); hud(lv);
        if (!hard) {
            drawChart(20, 84, 'T568B', T568B);
            rr(750, 84, 190, 320, 14); ctx.fillStyle = C.panel; ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.stroke();
            txt('Cara kerja', 770, 116, { s: 19, f: FONT_H, w: 600, c: C.acc });
            para('1. Seret warna dari rak kabel ke slot pin 1–8.\n2. Isi semua pin sesuai tabel.\n3. Tekan Crimp & Uji.\n4. Semua LED hijau berarti lulus.', 770, 142, 152, 20, { s: 13, c: C.text });
        } else txt('Susun ujung A sebagai T568A dan ujung B sebagai T568B. Tabel warna tidak ditampilkan.', W / 2, 80, { s: 14, a: 'center', c: C.mute });
        lv.conns.forEach(drawConn);
        rr(150, 428, 660, 158, 14); ctx.fillStyle = C.panel; ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.stroke();
        txt('Rak kabel — seret warna ke slot pin', W / 2, 448, { s: 12, a: 'center', c: C.mute });
        lv.tray.forEach((id, i) => {
            const x = trayX(i); if (lv.phase === 'play' && over(x - 22, 452, 44, 96)) hoverBtn = true;
            drawWire(x - 17, 456, 34, 88, id);
            txt(WC[id].n, x, 566, { s: 11, a: 'center', c: C.mute });
        });
        const canAct = lv.phase === 'play';
        btn(820, 440, 120, 46, 'Crimp & Uji', runTest, { color: C.ok, disabled: !canAct, s: 15 });
        btn(820, 494, 120, 32, 'Reset', () => { if (lv.phase === 'play') { lv.conns.forEach(c => c.slots.fill(null)); edited(); } }, { color: '#475569', tc: C.text, s: 14, disabled: !canAct });
        if (hard) btn(820, 534, 120, 32, 'Contekan −8', () => { if (lv.phase === 'play' && lv.hintUntil < performance.now()) { lv.penalize(8, 'Membuka contekan'); lv.hintUntil = performance.now() + 6000; } }, { color: C.warn, s: 13, disabled: !canAct });
        if (lv.drag) drawWire(mouse.x - 17, mouse.y - 44, 34, 88, lv.drag.id);
        if (hard && lv.hintUntil > now) {
            ctx.fillStyle = 'rgba(4,10,20,.84)'; ctx.fillRect(0, 54, W, H - 54);
            drawChart(150, 110, 'T568A', T568A); drawChart(560, 110, 'T568B', T568B);
            txt('Contekan ditutup dalam ' + Math.ceil((lv.hintUntil - now) / 1000) + ' detik', W / 2, 470, { s: 16, a: 'center', c: C.warn });
        }
        if (lv.phase === 'quiz' || (lv.phase === 'fin' && lv.quiz)) drawQuiz(lv);
    };
    lv.down = function (p) {
        if (lv.phase !== 'play' || lv.hintUntil > performance.now()) return;
        for (let i = 0; i < 8; i++) { const x = trayX(i); if (p.x >= x - 22 && p.x <= x + 22 && p.y >= 452 && p.y <= 548) { lv.drag = { id: lv.tray[i] }; return; } }
        for (const c of lv.conns) for (let i = 0; i < 8; i++) { if (c.slots[i] && inR(p, slotRect(c, i))) { lv.drag = { id: c.slots[i] }; c.slots[i] = null; edited(); return; } }
    };
    lv.up = function (p) {
        if (!lv.drag) return;
        for (const c of lv.conns) for (let i = 0; i < 8; i++) {
            const r = slotRect(c, i);
            if (p.x >= r.x - 3 && p.x <= r.x + r.w + 3 && p.y >= r.y - 30 && p.y <= r.y + r.h + 20) { c.slots[i] = lv.drag.id; edited(); lv.drag = null; return; }
        }
        lv.drag = null;
    };
    return lv;
}

/* ---------- pendaftaran level ---------- */
registerLevel(3, {
    t: 'Crimping Crossover (T568A–T568B)',
    m: 'Drag dua ujung berbeda, lebih sulit',
    desc: 'Ujung A disusun T568A dan ujung B T568B. Ada batas waktu; contekan mengurangi skor.',
    mk: () => makeCrimp(3)
});
