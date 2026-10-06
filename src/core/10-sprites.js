// ==========================================================================
// core/10-sprites.js
// Diambil dari backup/netcrimp2.ORI.html baris 364-386. File ini digabung otomatis oleh build.mjs
// ke index.html -- JANGAN diedit langsung di index.html.
// ==========================================================================

/* ---------- sprite cache ---------- */
const _sprCache = new Map();
function toolSprite(id) {
    if (_sprCache.has(id)) return _sprCache.get(id);
    const half = 74, SS = 2;
    const cn = document.createElement('canvas'); cn.width = cn.height = half * 2 * SS;
    const g = cn.getContext('2d'); const prev = ctx; ctx = g;
    ctx.setTransform(SS, 0, 0, SS, half * SS, half * SS);
    icon(id, 0, 0, 1);
    ctx.globalCompositeOperation = 'source-atop';
    const lg = ctx.createLinearGradient(0, -half, 0, half);
    lg.addColorStop(0, 'rgba(255,255,255,.30)'); lg.addColorStop(.40, 'rgba(255,255,255,.05)');
    lg.addColorStop(.72, 'rgba(0,0,0,.12)'); lg.addColorStop(1, 'rgba(0,0,0,.38)');
    ctx.fillStyle = lg; ctx.fillRect(-half, -half, half * 2, half * 2);
    ctx.globalCompositeOperation = 'source-over'; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx = prev;
    _sprCache.set(id, cn); return cn;
}
function drawSprite(id, x, y, size, rot, alpha) {
    const sp = toolSprite(id);
    ctx.save(); if (alpha != null) ctx.globalAlpha = alpha;
    ctx.translate(x, y); if (rot) ctx.rotate(rot);
    ctx.drawImage(sp, -size / 2, -size / 2, size, size); ctx.restore();
}
