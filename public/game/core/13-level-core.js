// ==========================================================================
// core/13-level-core.js
// Diambil dari backup/netcrimp2.ORI.html baris 624-733. File ini digabung otomatis oleh build.mjs
// ke index.html -- JANGAN diedit langsung di index.html.
// ==========================================================================

/* ---------- level dasar, HUD ---------- */
function baseLevel(n, title) {
    const lv = { n, title, score: 100, mistakes: [], t0: performance.now(), phase: 'play', finished: false, delay: 1300, dur: 0, finAt: 0, idx: n - 1 };
    lv.elapsed = () => (performance.now() - lv.t0) / 1000;
    lv.penalize = (p, msg) => { lv.score = Math.max(0, lv.score - p); lv.mistakes.push(msg); say(msg + ' (−' + p + ')', 'bad'); shake = 10; };
    lv.win = d => { if (lv.phase === 'fin') return; lv.phase = 'fin'; lv.finAt = performance.now(); lv.delay = d || 1300; lv.dur = Math.round(lv.elapsed()); };
    lv.tick = () => { if (lv.phase === 'fin' && !lv.finished && performance.now() - lv.finAt > lv.delay) { lv.finished = true; endLevel(lv, true); } };
    return lv;
}
function hud(lv) {
    ctx.save(); ctx.translate(-OX, 0);
    ctx.fillStyle = '#08111e'; ctx.fillRect(0, 0, VW, 54); ctx.fillStyle = C.line; ctx.fillRect(0, 53, VW, 1);
    ctx.restore();
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
    // Referensi ke entri log yang baru ditambahkan (shift hanya membuang entri
    // paling lama, jadi entri terbaru selalu berada di indeks terakhir).
    const catatan = save.log[save.log.length - 1];
    kirimHasilKeServer(lv, ok, catatan);
    go((lv.makeResult || resultScene)(lv, ok, stars, isNewBest));
}
/* ---------- sinkronisasi hasil ke backend SINOVA (opsional) ----------
   Mengirim hasil level lewat jembatan window.SINOVA_BACKEND. Aturan:
   - resultId dibuat SEKALI per percobaan (disimpan di lv + catatan log) supaya
     pengiriman ulang tidak menggandakan hasil; percobaan baru = lv baru = id baru.
   - Hasil ditandai tersinkron HANYA setelah server mengonfirmasi (ok === true).
   - Bila jembatan tidak tersedia (game dijalankan tanpa shell SINOVA) atau
     siswa belum punya token valid, fungsi ini tidak mengganggu alur game —
     hasil tetap tersimpan lokal dan diantrekan untuk kirim ulang manual.
   - Tidak ada pemanggilan endLevel ganda yang mengirim ulang hasil yang sama. */
function kirimHasilKeServer(lv, ok, catatan) {
    try {
        const b = (typeof window !== 'undefined') ? window.SINOVA_BACKEND : null;
        if (!b || typeof b.submitResult !== 'function') return;
        if (lv.sinovaTerkirim) return; // cegah kiriman ganda dari endLevel berulang
        if (!lv.sinovaResultId) lv.sinovaResultId = b.newResultId();
        lv.sinovaTerkirim = true;
        const resultId = lv.sinovaResultId;
        catatan.sinova = { resultId: resultId, status: 'pending', ts: Date.now() };
        Promise.resolve(b.submitResult({
            resultId: resultId, level: lv.n, score: lv.score,
            mistakes: lv.mistakes.length, durationSeconds: lv.dur, passed: !!ok
        })).then(function (hasil) {
            if (catatan.sinova) catatan.sinova.status = (hasil && hasil.ok) ? 'synced' : 'pending';
            persist();
            if (hasil && hasil.ok) say('Hasil level tersimpan di server.', 'ok');
            else if (hasil && hasil.status === 'unauthorized') say('Sesi belajar perlu diperbarui. Daftar ulang lalu kirim ulang hasil.', 'bad');
            else say('Hasil tersimpan di perangkat. Sinkronkan lewat Log hasil.', 'info');
        }).catch(function () {
            if (catatan.sinova) catatan.sinova.status = 'pending';
        });
        // Sesi backend dianggap tuntas saat seluruh level telah diselesaikan.
        if (ok && lv.n >= levelTotal() && typeof b.finish === 'function') {
            Promise.resolve(b.finish()).catch(function () {});
        }
    } catch (e) { /* sinkronisasi opsional — jangan ganggu alur game */ }
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
            if (ok && lv.boardKey === 'board4') {
                const arr4 = save.board4 || [];
                const pos4 = arr4.findIndex(e => e.skor === lv.score && e.waktu === lv.dur);
                if (pos4 >= 0 && pos4 < 10) txt('Peringkat #' + (pos4 + 1) + ' di papan skor Level 4', W / 2, y + 286, { s: 14, a: 'center', c: C.acc, w: 700 });
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
