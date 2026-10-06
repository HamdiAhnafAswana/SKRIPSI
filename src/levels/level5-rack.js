// ==========================================================================
// levels/level5-rack.js
// Diambil dari backup/netcrimp2.ORI.html baris 2669-2814. File ini digabung otomatis oleh build.mjs
// ke index.html -- JANGAN diedit langsung di index.html.
// ==========================================================================

/* ================================================================
   LEVEL 5 — Instalasi Rack Server
   ================================================================ */
function makeL5() {
    const lv = baseLevel(5, 'Instalasi Rack Server');
    lv.phase = 'place'; lv.wrongPicks = [];
    const RX = 340, RY = 70, U = 40, N = 12, RW = 280;
    const devs = shuffle([
        { id: 'patch',  n: 'Patch Panel 24-port', u: 1, col: '#4b5d73' },
        { id: 'sw',     n: 'Switch 24-port',      u: 1, col: '#0e7490' },
        { id: 'router', n: 'Router',              u: 1, col: '#6d3fd0' },
        { id: 'server', n: 'Server',              u: 2, col: '#3a4a5f' },
        { id: 'ups',    n: 'UPS (catu daya)',     u: 2, col: '#a5560f' }
    ]);
    let ty = 88; devs.forEach(d => { d.slot = null; d.used = [false, false, false]; d.ty = ty; ty += d.u * U + 16; });
    const byId = id => devs.find(d => d.id === id);
    const LINKS = [['router', 'sw', 'Router — Switch (uplink)'], ['sw', 'server', 'Switch — Server'], ['sw', 'patch', 'Switch — Patch Panel'], ['ups', 'server', 'UPS — Server (daya)']];
    const RULES = ['UPS di posisi paling bawah', 'Server di bawah perangkat jaringan (router, switch, patch panel)', 'Patch panel di posisi paling atas', 'Switch berada di atas router'];
    lv.links = []; lv.sel = null; lv.drag = null; lv.ruleOk = null;
    lv.quiz = { q: 'Mengapa perangkat berat seperti UPS dan server diletakkan di bagian bawah rack?', opts: ['Agar tampilan rack lebih rapi', 'Agar rack lebih stabil dan tidak mudah terguling', 'Agar patch cord menjadi lebih pendek'], ans: 1, why: 'Beban berat di bawah menurunkan titik berat sehingga rack lebih stabil.' };
    say('Seret perangkat ke rack. Ikuti aturan rack di panel kanan, lalu tekan Cek Susunan Rack.', 'info');
    const devRect = d => d.slot != null ? { x: RX, y: RY + (N - d.slot - d.u) * U, w: RW, h: d.u * U } : { x: 20, y: d.ty, w: RW, h: d.u * U };
    const dotPos = (d, k) => { const r = devRect(d); return { x: r.x + RW - 16 - k * 22, y: r.y + r.h / 2 }; };
    function snap(d) {
        if (mouse.x < RX - 50 || mouse.x > RX + RW + 50 || mouse.y < RY - 30 || mouse.y > RY + N * U + 30) return null;
        const top = mouse.y - lv.drag.offY; let r = Math.round((top - RY) / U); let s = N - r - d.u;
        return Math.max(0, Math.min(N - d.u, s));
    }
    const free = (d, s) => !devs.some(o => o !== d && o.slot != null && s < o.slot + o.u && o.slot < s + d.u);
    function drawDevice(d, x, y, a) {
        const w = RW, h = d.u * U - 4; ctx.save(); ctx.globalAlpha = a == null ? 1 : a;
        rr(x, y + 2, w, h, 5); ctx.fillStyle = d.col; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.arc(x + 8, y + 2 + h / 2, 3, 0, 6.3); ctx.arc(x + w - 8, y + 2 + h / 2, 3, 0, 6.3); ctx.fill();
        txt(d.n, x + 20, y + 16, { s: 11.5, c: '#ffffff' });
        ctx.fillStyle = '#0a1220';
        if (d.id === 'patch' || d.id === 'sw') { for (let k = 0; k < 8; k++)ctx.fillRect(x + 20 + k * 19, y + 21, 13, 11); }
        if (d.id === 'router') { for (let k = 0; k < 4; k++)ctx.fillRect(x + 20 + k * 24, y + 21, 16, 11); ctx.fillStyle = '#4ade80'; ctx.fillRect(x + 130, y + 24, 6, 6); }
        if (d.id === 'server') { for (let k = 0; k < 3; k++) { ctx.fillStyle = '#1c2a3c'; ctx.fillRect(x + 20 + k * 60, y + 26, 54, 38); ctx.fillStyle = '#4ade80'; ctx.fillRect(x + 24 + k * 60, y + 30, 5, 5); } }
        if (d.id === 'ups') { ctx.fillStyle = '#052e1b'; ctx.fillRect(x + 20, y + 26, 92, 38); txt('100%', x + 66, y + 52, { s: 18, a: 'center', c: '#4ade80', f: FONT_H }); for (let k = 0; k < 3; k++) { ctx.fillStyle = '#fbbf24'; ctx.fillRect(x + 130 + k * 24, y + 30, 18, 30); } }
        ctx.restore();
    }
    function drawLink(l) {
        const A = dotPos(l.a, l.ka), B = dotPos(l.b, l.kb), ex = RX + RW + 26 + l.off, dir = B.y > A.y ? 1 : -1;
        ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(ex - 8, A.y); ctx.quadraticCurveTo(ex, A.y, ex, A.y + 8 * dir); ctx.lineTo(ex, B.y - 8 * dir); ctx.quadraticCurveTo(ex, B.y, ex - 8, B.y); ctx.lineTo(B.x, B.y);
        ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = l.power ? 5 : 4; ctx.strokeStyle = l.col; ctx.stroke();
    }
    function checkRack() {
        const s = id => byId(id).slot;
        const r = [
            s('ups') < Math.min(s('server'), s('router'), s('sw'), s('patch')),
            s('server') < Math.min(s('router'), s('sw'), s('patch')),
            s('patch') > Math.max(s('ups'), s('server'), s('router'), s('sw')),
            s('sw') > s('router')
        ];
        lv.ruleOk = r;
        if (r.every(Boolean)) { lv.phase = 'cable'; say('Susunan rack benar. Sekarang sambungkan perangkat: klik satu port, lalu klik port di perangkat lain.', 'ok'); }
        else lv.penalize(10, 'Aturan rack nomor ' + r.map((v, i) => v ? 0 : i + 1).filter(Boolean).join(', ') + ' belum terpenuhi.');
    }
    function clickDot(d, k) {
        if (d.used[k]) { say('Port itu sudah terpakai.', 'info'); return; }
        if (!lv.sel) { lv.sel = { d, k }; return; }
        if (lv.sel.d === d) { lv.sel = { d, k }; return; }
        const a = lv.sel.d, ka = lv.sel.k; lv.sel = null;
        const key = [a.id, d.id].sort().join('|');
        const ok = LINKS.some(l => [l[0], l[1]].sort().join('|') === key);
        if (!ok) {
            let m = 'Sambungan ' + a.n + ' — ' + d.n + ' tidak ada dalam topologi tugas.';
            if (key === 'patch|router') m = 'Patch panel tidak langsung ke router; jalurnya lewat switch.';
            else if (key === 'router|server') m = 'Server terhubung ke switch, bukan langsung ke router.';
            else if (key.includes('ups')) m = 'Dalam topologi ini UPS hanya menyuplai daya ke server.';
            lv.penalize(10, m); return;
        }
        if (lv.links.some(l => l.key === key)) { say('Sambungan itu sudah dibuat.', 'info'); return; }
        const power = key === 'server|ups', cols = ['#38bdf8', '#34d399', '#a78bfa'];
        lv.links.push({ a, ka, b: d, kb: k, key, power, off: 8 + lv.links.length * 12, col: power ? C.warn : cols[lv.links.length % 3] });
        a.used[ka] = true; d.used[k] = true;
        if (lv.links.length === 4) { say('Semua perangkat tersambung!', 'ok'); lv.phase = 'cabled'; lv.cAt = performance.now(); }
        else say('Tersambung: ' + a.n + ' — ' + d.n, 'ok');
    }
    lv.draw = function () {
        lv.tick();
        if (lv.phase === 'cabled' && performance.now() - lv.cAt > 1300) lv.phase = 'quiz';
        deskBG(); hud(lv);
        txt('Perangkat', 20, 80, { s: 15, c: C.mute });
        for (const d of devs) {
            if (d.slot == null && !(lv.drag && lv.drag.d === d)) {
                const r = devRect(d); drawDevice(d, r.x, r.y);
                if (lv.phase === 'place' && over(r.x, r.y, r.w, r.h)) hoverBtn = true;
            }
        }
        rr(RX - 16, RY - 16, RW + 32, N * U + 32, 10); ctx.fillStyle = '#08111e'; ctx.fill(); ctx.strokeStyle = '#5b6f86'; ctx.lineWidth = 3; ctx.stroke();
        for (let r = 0; r < N; r++) { const y = RY + r * U; ctx.fillStyle = r % 2 ? '#0f1c2e' : '#122238'; ctx.fillRect(RX, y, RW, U); txt(N - r, RX - 8, y + U / 2 + 4, { s: 10, a: 'center', c: '#5f7389' }); }
        if (lv.drag && lv.phase === 'place') { const s = snap(lv.drag.d); if (s != null) { const ok = free(lv.drag.d, s); const y = RY + (N - s - lv.drag.d.u) * U; ctx.fillStyle = ok ? 'rgba(52,211,153,.28)' : 'rgba(248,113,113,.3)'; ctx.fillRect(RX, y, RW, lv.drag.d.u * U); } }
        for (const d of devs) if (d.slot != null) { const r = devRect(d); drawDevice(d, r.x, r.y); }
        if (lv.phase !== 'place') {
            lv.links.forEach(drawLink);
            for (const d of devs) for (let k = 0; k < 3; k++) {
                const p = dotPos(d, k), sel = lv.sel && lv.sel.d === d && lv.sel.k === k;
                const hov = lv.phase === 'cable' && Math.hypot(mouse.x - p.x, mouse.y - p.y) < 11; if (hov) hoverBtn = true;
                ctx.beginPath(); ctx.arc(p.x, p.y, sel ? 8 : 6.5, 0, 6.3); ctx.fillStyle = d.used[k] ? '#e2e8f0' : (sel ? C.acc : '#0a1220'); ctx.fill();
                ctx.lineWidth = 2; ctx.strokeStyle = sel || hov ? C.acc : C.gold; ctx.stroke();
            }
        }
        if (lv.drag) drawDevice(lv.drag.d, mouse.x - lv.drag.offX, mouse.y - lv.drag.offY, .92);
        rr(700, 80, 242, 470, 14); ctx.fillStyle = C.panel; ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.stroke();
        txt('Aturan rack', 718, 112, { s: 20, f: FONT_H, w: 600, c: C.acc });
        let y = 136;
        RULES.forEach((t, i) => {
            const st = lv.ruleOk ? (lv.ruleOk[i] ? 'ok' : 'bad') : 'idle';
            if (st === 'ok') tickIcon(724, y + 2, 12, C.ok); else if (st === 'bad') crossIcon(724, y + 2, 12, C.bad); else { ctx.beginPath(); ctx.arc(724, y + 2, 4, 0, 6.3); ctx.fillStyle = '#5f7389'; ctx.fill(); }
            const n = para(t, 742, y + 6, 186, 17, { s: 13, c: st === 'bad' ? '#fca5a5' : C.text }); y += n * 17 + 14;
        });
        if (lv.phase === 'place') {
            const all = devs.every(d => d.slot != null);
            para(all ? 'Semua perangkat sudah di rack. Periksa susunan.' : 'Seret kelima perangkat ke dalam rack.', 718, y + 16, 206, 18, { s: 13, c: C.mute });
            btn(716, 494, 210, 44, 'Cek Susunan Rack', checkRack, { color: C.ok, disabled: !all, s: 15 });
        } else {
            txt('Sambungan', 718, y + 22, { s: 20, f: FONT_H, w: 600, c: C.acc });
            LINKS.forEach((l, i) => {
                const yy = y + 52 + i * 30; const done = lv.links.some(k => k.key === [l[0], l[1]].sort().join('|'));
                if (done) tickIcon(724, yy - 4, 12, C.ok); else { ctx.beginPath(); ctx.arc(724, yy - 4, 4, 0, 6.3); ctx.fillStyle = '#5f7389'; ctx.fill(); }
                txt(l[2], 742, yy, { s: 13, c: done ? C.ok : C.text });
            });
            para('Klik satu port emas, lalu klik port di perangkat lain untuk memasang kabel.', 718, y + 186, 206, 18, { s: 13, c: C.mute });
        }
        if (lv.phase === 'quiz' || (lv.phase === 'fin' && lv.quiz)) drawQuiz(lv);
    };
    lv.down = function (p) {
        if (lv.phase === 'place') {
            for (let i = devs.length - 1; i >= 0; i--) {
                const d = devs[i], r = devRect(d);
                if (inR(p, r)) { lv.drag = { d, offX: p.x - r.x, offY: p.y - r.y, prev: d.slot }; d.slot = null; return; }
            }
        } else if (lv.phase === 'cable') {
            for (const d of devs) for (let k = 0; k < 3; k++) { const q = dotPos(d, k); if (Math.hypot(p.x - q.x, p.y - q.y) < 12) { clickDot(d, k); return; } }
            lv.sel = null;
        }
    };
    lv.up = function () {
        if (!lv.drag) return; const d = lv.drag.d, prev = lv.drag.prev;
        const s = snap(d);
        if (s != null) {
            if (free(d, s)) { d.slot = s; lv.ruleOk = null; }
            else { d.slot = prev; say('Slot bertabrakan dengan perangkat lain.', 'info'); }
        } else d.slot = null;
        lv.drag = null;
    };
    return lv;
}

/* ---------- pendaftaran level ---------- */
registerLevel(5, {
    t: 'Instalasi Rack Server',
    m: 'Drag semua komponen ke rack, sambungkan',
    desc: 'Seret perangkat ke rack (yang berat di bawah), cek susunan, lalu sambungkan port ke port.',
    mk: makeL5
});
