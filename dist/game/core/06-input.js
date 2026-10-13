// ==========================================================================
// core/06-input.js
// Diambil dari backup/netcrimp2.ORI.html baris 126-157. File ini digabung otomatis oleh build.mjs
// ke index.html -- JANGAN diedit langsung di index.html.
// ==========================================================================

/* ---------- input & tombol ---------- */
let mouse = { x: -1, y: -1 }, btns = [], hoverBtn = false, scene = null, toast = null, shake = 0;
const over = (x, y, w, h) => mouse.x >= x && mouse.x <= x + w && mouse.y >= y && mouse.y <= y + h;
function hit(x, y, w, h, fn) { btns.push({ x, y, w, h, fn }); }
function btn(x, y, w, h, label, fn, o) {
    o = o || {}; const dis = !!o.disabled; const hov = !dis && over(x, y, w, h); if (hov) hoverBtn = true;
    rr(x, y, w, h, o.r || 10); ctx.fillStyle = dis ? '#22344a' : (o.color || C.acc); ctx.fill();
    if (hov) { rr(x, y, w, h, o.r || 10); ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fill(); }
    txt(label, x + w / 2, y + h / 2 + (o.s || 16) * 0.35, { s: o.s || 16, a: 'center', w: 800, c: dis ? '#5f7389' : (o.tc || '#06131f') });
    if (!dis) hit(x, y, w, h, fn);
}
function say(msg, kind) { toast = { msg, kind: kind || 'info', t: performance.now() }; }
function drawToast() {
    if (!toast) return; const age = performance.now() - toast.t; if (age > 4600) { toast = null; return; }
    const col = toast.kind === 'bad' ? C.bad : toast.kind === 'ok' ? C.ok : C.acc;
    const L = wrapLines(toast.msg, 690, 15, 700); const w = 740, h = L.length * 20 + 16, x = (W - w) / 2, y = H - h - 8;
    ctx.save(); ctx.globalAlpha = age > 4100 ? Math.max(0, (4600 - age) / 500) : 1;
    rr(x, y, w, h, 10); ctx.fillStyle = 'rgba(6,14,26,.95)'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = col; ctx.stroke();
    L.forEach((l, i) => txt(l, x + w / 2, y + 24 + i * 20, { s: 15, a: 'center', c: C.text }));
    ctx.restore();
}
function P(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; }
cv.addEventListener('pointerdown', e => {
    e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (_) {}
    mouse = P(e);
    for (let i = btns.length - 1; i >= 0; i--) { const b = btns[i]; if (inR(mouse, b)) { b.fn(); return; } }
    if (scene.down) scene.down(mouse);
});
cv.addEventListener('pointermove', e => { mouse = P(e); if (scene.move) scene.move(mouse); });
function endPtr(e) { mouse = P(e); if (scene.up) scene.up(mouse); if (e.pointerType === 'touch') mouse = { x: -1, y: -1 }; }
cv.addEventListener('pointerup', endPtr);
cv.addEventListener('pointercancel', endPtr);
