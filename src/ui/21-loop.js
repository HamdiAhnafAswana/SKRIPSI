// ==========================================================================
// ui/21-loop.js
// Diambil dari backup/netcrimp2.ORI.html baris 2936-2950. File ini digabung otomatis oleh build.mjs
// ke index.html -- JANGAN diedit langsung di index.html.
// ==========================================================================

/* ---------- loop utama ---------- */
scene = menuScene;
function frame() {
    hoverBtn = false; btns = [];
    ctx.setTransform(cv.width / VW, 0, 0, cv.height / H, 0, 0);
    ctx.clearRect(0, 0, VW, H);
    ctx.save();
    if (shake > .3) { ctx.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake); shake *= .85; } else shake = 0;
    try {
        ctx.save();
        ctx.translate(OX, 0);
        scene.draw();
        ctx.restore();
    } catch (e) { console.error(e); }
    ctx.restore();
    drawToast();
    cv.style.cursor = hoverBtn ? 'pointer' : 'default';
    const docEl = (typeof document !== 'undefined' && document.documentElement) ? document.documentElement : null;
    if (docEl) {
        try {
            const mode = (scene && typeof scene.phase !== 'undefined') ? 'level' : 'menu';
            if (docEl.dataset.sinovaMode !== mode) docEl.dataset.sinovaMode = mode;
        } catch (e) {}
    }
    requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
