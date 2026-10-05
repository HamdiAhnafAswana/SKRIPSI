// ==========================================================================
// core/13-level-core.js
// Diambil dari netcrimp2.html baris 624-733. File ini digabung otomatis oleh build.mjs
// ke dist/netcrimp2.html -- JANGAN diedit langsung di dist/.
// ==========================================================================

/* ---------- level dasar, HUD, kuis ---------- */
function baseLevel(n, title) {
    const lv = { n, title, score: 100, mistakes: [], t0: performance.now(), phase: 'play', finished: false, delay: 1300, dur: 0, finAt: 0, idx: n - 1 };
    lv.elapsed = () => (performance.now() - lv.t0) / 1000;
    lv.penalize = (p, msg) => { lv.score = Math.max(0, lv.score - p); lv.mistakes.push(msg); say(msg + ' (−' + p + ')', 'bad'); shake = 10; };
    lv.win = d => { if (lv.phase === 'fin') return; lv.phase = 'fin'; lv.finAt = performance.now(); lv.delay = d || 1300; lv.dur = Math.round(lv.elapsed()); };
    lv.tick = () => { if (lv.phase === 'fin' && !lv.finished && performance.now() - lv.finAt > lv.delay) { lv.finished = true; endLevel(lv, true); } };
    return lv;
}
function hud(lv) {
    ctx.fillStyle = '#08111e'; ctx.fillRect(0, 0, W, 54); ctx.fillStyle = C.line; ctx.fillRect(0, 53, W, 1);
    txt('Level ' + lv.n, 18, 35, { s: 22, f: FONT_H, c: C.acc, w: 600 });
    txt(lv.title, 112, 34, { s: 15, c: C.text });
    btn(W - 92, 10, 78, 34, 'Menu', () => go(levelsScene), { color: '#334155', tc: C.text, s: 14 });
    txt('Skor', W - 112, 22, { s: 11, c: C.mute, a: 'right' });
    txt(lv.score, W - 112, 46, { s: 22, f: FONT_H, c: C.warn, a: 'right', w: 600 });
    const t = lv.phase === 'fin' ? lv.dur : lv.elapsed();
    let lab, col = C.text;
    if (lv.limit) { const left = Math.max(0, lv.limit - t); lab = fmt(left); if (left < 30) col = C.bad; } else lab = fmt(t);
    txt(lv.limit ? 'Sisa waktu' : 'Waktu', W - 192, 22, { s: 11, c: C.mute, a: 'right' });
    txt(lab, W - 192, 46, { s: 22, f: FONT_H, c: col, a: 'right', w: 600 });
}
function drawQuiz(lv) {
    btns.length = 0;
    ctx.fillStyle = 'rgba(4,10,20,.8)'; ctx.fillRect(0, 54, W, H - 54);
    const x = 170, y = 130, w = 620, h = 350;
    rr(x, y, w, h, 18); ctx.fillStyle = C.panel; ctx.fill(); ctx.strokeStyle = C.acc; ctx.lineWidth = 2; ctx.stroke();
    const quizzes = lv.quizzes || (lv.quiz ? [lv.quiz] : []);
    const q = quizzes[lv.quizIdx || 0];
    if (!q) return;
    txt('Pertanyaan ' + ((lv.quizIdx || 0) + 1) + ' dari ' + quizzes.length, x + w / 2, y + 40, { s: 24, f: FONT_H, c: C.acc, a: 'center', w: 600 });
    para(q.q, x + w / 2, y + 80, w - 70, 24, { s: 17, a: 'center', c: C.text, w: 700 });
    const fin = lv.phase === 'fin';
    q.opts.forEach((o, i) => {
        const by = y + 150 + i * 58; const right = i === q.ans;
        let color = '#2b4360', tc = C.text, dis = fin;
        if (lv.wrongPicks.includes(i)) { color = '#5b2530'; tc = '#f5b5bd'; dis = true; }
        if (fin && right) { color = C.ok; tc = '#04160f'; }
        btn(x + 30, by, w - 60, 46, o, () => quizPick(lv, i), { color, tc, disabled: false, s: 15 });
        if (dis) { btns.pop(); }
    });
}
function quizPick(lv, i) {
    if (lv.phase !== 'quiz' && lv.phase !== 'fin') return;
    const quizzes = lv.quizzes || (lv.quiz ? [lv.quiz] : []);
    const q = quizzes[lv.quizIdx || 0];
    if (!q) return;
    if (i === q.ans) {
        say('Benar. ' + q.why, 'ok');
        lv.quizIdx = (lv.quizIdx || 0) + 1;
        lv.wrongPicks = [];
        if (lv.quizIdx >= quizzes.length) lv.win(2400);
    } else { lv.wrongPicks.push(i); lv.penalize(10, 'Jawaban kuis kurang tepat'); }
}

/* ---------- akhir level, hasil, log ---------- */
function endLevel(lv, ok) {
    if (!lv.dur) lv.dur = Math.round(lv.elapsed());
    const stars = ok ? (lv.score >= 85 ? 3 : lv.score >= 60 ? 2 : 1) : 0;
    const i = lv.n - 1;
    const isNewBest = ok && lv.score > (save.best[i] || 0);
    if (ok) {
        save.stars[i] = Math.max(save.stars[i] || 0, stars);
        save.best[i] = Math.max(save.best[i] || 0, lv.score);
        save.unlocked = Math.max(save.unlocked, Math.min(levelTotal(), lv.n + 1));
        const nm = (nameEl.value || '(tanpa nama)').trim() || '(tanpa nama)';
        const bk = lv.boardKey || 'board';
        if (!Array.isArray(save[bk])) save[bk] = [];
        save[bk].push({ nama: nm, skor: lv.score, waktu: lv.dur, ts: Date.now() });
        save[bk].sort((a, b) => b.skor - a.skor || a.waktu - b.waktu);
        save[bk] = save[bk].slice(0, 10);
    }
    const extra = lv.logExtra || {};
    save.log.push(Object.assign({
        ts: Date.now(), nama: (nameEl.value || '(tanpa nama)').trim() || '(tanpa nama)', level: lv.n, skor: lv.score,
        bintang: stars, durasi: lv.dur, salah: lv.mistakes.length, hasil: ok ? 'Lulus' : 'Gagal'
    }, { kabel_cm: 0, rj45: 0, bantuan: 0, lencana: '' }, extra));
    if (save.log.length > 300) save.log.shift();
    persist();
    go((lv.makeResult || resultScene)(lv, ok, stars, isNewBest));
}
function resultScene(lv, ok, stars, isNewBest) {
    return {
        draw() {
            bg(false);
            const x = 250, y = 70, w = 460, h = 460;
            rr(x, y, w, h, 20); ctx.fillStyle = C.panel; ctx.fill(); ctx.strokeStyle = ok ? C.ok : C.bad; ctx.lineWidth = 2; ctx.stroke();
            txt(ok ? 'Level selesai' : 'Waktu habis', W / 2, y + 54, { s: 34, f: FONT_H, a: 'center', c: ok ? C.ok : C.bad, w: 600 });
            txt('Level ' + lv.n + ' · ' + lv.title, W / 2, y + 82, { s: 14, a: 'center', c: C.mute });
            if (isNewBest) txt('REKOR BARU!', W / 2, y + 108, { s: 18, f: FONT_H, a: 'center', c: C.warn, w: 600 });
            for (let i = 0; i < 3; i++)star(W / 2 - 56 + i * 56, y + 132, 22, i < stars);
            txt(lv.score, W / 2, y + 210, { s: 60, f: FONT_H, a: 'center', c: C.warn, w: 600 });
            txt('skor akhir', W / 2, y + 232, { s: 13, a: 'center', c: C.mute });
            txt('Waktu ' + fmt(lv.dur) + '   ·   Kesalahan ' + lv.mistakes.length, W / 2, y + 262, { s: 15, a: 'center' });
            if (ok && lv.n === 1) {
                const pos = save.board.findIndex(e => e.skor === lv.score && e.waktu === lv.dur);
                if (pos >= 0 && pos < 10) txt('Peringkat #' + (pos + 1) + ' di papan skor Level 1', W / 2, y + 286, { s: 14, a: 'center', c: C.acc, w: 700 });
            }
            if (lv.mistakes.length) {
                txt('Catatan kesalahan:', x + 30, y + 300, { s: 13, c: C.mute });
                lv.mistakes.slice(0, 3).forEach((m, i) => { const l = wrapLines(m, w - 60, 12, 600)[0]; txt('• ' + (l.length < m.length && wrapLines(m, w - 60, 12, 600).length > 1 ? l + ' …' : l), x + 30, y + 320 + i * 18, { s: 12, w: 600, c: C.text }); });
            } else txt(ok ? 'Tanpa kesalahan. Kerja bagus!' : 'Coba lagi, kamu pasti bisa.', x + 30, y + 308, { s: 14, c: C.ok });
            const by = y + 380;
            btn(x + 30, by, 130, 46, 'Ulangi', () => startLevel(lv.idx), { color: '#334155', tc: C.text });
            if (ok && lv.n < levelTotal()) btn(x + 175, by, 255, 46, 'Lanjut ke level ' + (lv.n + 1), () => startLevel(lv.n), { color: C.ok });
            else btn(x + 175, by, 255, 46, 'Pilih level', () => go(levelsScene), { color: C.acc });
            if (ok && lv.n === levelTotal()) txt('Semua level selesai. Selamat!', W / 2, y + 446, { s: 14, a: 'center', c: C.warn });
        }
    };
}
