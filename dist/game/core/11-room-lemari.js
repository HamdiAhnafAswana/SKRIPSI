// ==========================================================================
// core/11-room-lemari.js
// Diambil dari backup/netcrimp2.ORI.html baris 388-534. File ini digabung otomatis oleh build.mjs
// ke index.html -- JANGAN diedit langsung di index.html.
// ==========================================================================

/* ---------- ruangan + lemari (Level 1) ---------- */
const ROOM = {
    A: { w1: '#16283f', w2: '#0b1523', f1: '#0a1421', f2: '#050a12', lamp: '#7cc4ff', glow: '124,196,255' },
    C: { w1: '#2a2136', w2: '#150f1f', f1: '#0e0a16', f2: '#06040a', lamp: '#ffb066', glow: '255,176,102' },
    H: { w1: '#13241f', w2: '#0a1512', f1: '#08120f', f2: '#030806', lamp: '#8ef0bb', glow: '142,240,187' }
};
function buildRoom(K) {
    const cn = document.createElement('canvas');
    const vw = typeof VW !== 'undefined' ? VW : W;
    cn.width = vw; cn.height = H;
    const g = cn.getContext('2d'); const prev = ctx; ctx = g;
    const P = ROOM[K.kode] || ROOM.A; const hz = 470;
    let grd = ctx.createLinearGradient(0, 54, 0, hz);
    grd.addColorStop(0, P.w1); grd.addColorStop(1, P.w2);
    ctx.fillStyle = grd; ctx.fillRect(0, 0, vw, hz);
    grd = ctx.createLinearGradient(0, hz, 0, H);
    grd.addColorStop(0, P.f1); grd.addColorStop(1, P.f2);
    ctx.fillStyle = grd; ctx.fillRect(0, hz, vw, H - hz);
    ctx.strokeStyle = 'rgba(255,255,255,.045)'; ctx.lineWidth = 1;
    for (let x = 0; x <= vw; x += 80) { ctx.beginPath(); ctx.moveTo(x, 54); ctx.lineTo(x, hz); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.fillRect(0, hz, vw, 2);
    ctx.fillStyle = 'rgba(255,255,255,.10)';
    ctx.beginPath(); ctx.ellipse(vw / 2, 70, 220, 26, 0, 0, 6.3); ctx.fill();
    const rg = ctx.createRadialGradient(vw / 2, 78, 6, vw / 2, 300, 460);
    rg.addColorStop(0, 'rgba(' + P.glow + ',.14)'); rg.addColorStop(1, 'rgba(' + P.glow + ',0)');
    ctx.fillStyle = rg; ctx.fillRect(0, 54, vw, 520);
    if (K.kode === 'A') {
        for (let i = 0; i < 2; i++) { const x = 4 + i * 40, y = hz - 58; ctx.fillStyle = '#0c1624'; ctx.fillRect(x, y, 34, 58); ctx.fillStyle = 'rgba(56,189,248,.22)'; ctx.fillRect(x + 4, y + 6, 26, 18); }
        ctx.fillStyle = 'rgba(56,189,248,.10)'; ctx.fillRect(700, hz - 130, 96, 46);
        ctx.strokeStyle = 'rgba(56,189,248,.30)'; ctx.lineWidth = 2; ctx.strokeRect(700, hz - 130, 96, 46);
    } else if (K.kode === 'C') {
        for (let i = 0; i < 3; i++) { ctx.fillStyle = i % 2 ? '#241a2e' : '#1a1322'; ctx.fillRect(2 + i * 30, hz - 40 - i * 22, 28, 40 + i * 22); }
        ctx.fillStyle = 'rgba(255,176,102,.10)'; ctx.fillRect(720, hz - 120, 110, 40);
    } else {
        ctx.strokeStyle = 'rgba(142,240,187,.16)'; ctx.lineWidth = 2;
        for (let i = 0; i < 26; i++) { const x = (i * 137) % vw; ctx.beginPath(); ctx.moveTo(x, 54); ctx.lineTo(x - 18, 300); ctx.stroke(); }
        ctx.fillStyle = '#0b1a16'; ctx.fillRect(0, hz - 84, 60, 84);
        ctx.fillStyle = 'rgba(142,240,187,.14)'; ctx.fillRect(6, hz - 76, 48, 30);
    }
    ctx = prev;
    cn._vw = vw;
    return cn;
}
const CABG = { FX: 36, FY: 156, FW: 560, FH: 380, T: 18, DX: 30, DY: -26 };
CABG.IX = CABG.FX + CABG.T; CABG.IY = CABG.FY + CABG.T;
CABG.IW = CABG.FW - 2 * CABG.T; CABG.IH = CABG.FH - 2 * CABG.T;
let _cabSpr = null;
function cabinetSprite() {
    if (_cabSpr) return _cabSpr;
    const G = CABG; const CX0 = 0, CY0 = 108, SPW = 680, SPH = 474;
    const cn = document.createElement('canvas'); cn.width = SPW; cn.height = SPH;
    const g = cn.getContext('2d'); const prev = ctx; ctx = g;
    ctx.setTransform(1, 0, 0, 1, -CX0, -CY0); ctx.lineJoin = 'round';
    let sh = ctx.createRadialGradient(G.FX + G.FW / 2 + 18, G.FY + G.FH + 10, 6, G.FX + G.FW / 2 + 18, G.FY + G.FH + 10, 320);
    sh.addColorStop(0, 'rgba(0,0,0,.62)'); sh.addColorStop(.5, 'rgba(0,0,0,.28)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sh; ctx.beginPath(); ctx.ellipse(G.FX + G.FW / 2 + 18, G.FY + G.FH + 10, 320, 32, 0, 0, 6.3); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(G.FX, G.FY); ctx.lineTo(G.FX + G.DX, G.FY + G.DY);
    ctx.lineTo(G.FX + G.FW + G.DX, G.FY + G.DY); ctx.lineTo(G.FX + G.FW, G.FY); ctx.closePath();
    let gp = ctx.createLinearGradient(0, G.FY + G.DY, 0, G.FY);
    gp.addColorStop(0, '#547a9e'); gp.addColorStop(1, '#31496a');
    ctx.fillStyle = gp; ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(G.FX + G.FW, G.FY); ctx.lineTo(G.FX + G.FW + G.DX, G.FY + G.DY);
    ctx.lineTo(G.FX + G.FW + G.DX, G.FY + G.FH + G.DY); ctx.lineTo(G.FX + G.FW, G.FY + G.FH); ctx.closePath();
    let gs = ctx.createLinearGradient(G.FX + G.FW, 0, G.FX + G.FW + G.DX, 0);
    gs.addColorStop(0, '#2b4058'); gs.addColorStop(1, '#141f2c');
    ctx.fillStyle = gs; ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(G.FX, G.FY + G.FH); ctx.lineTo(G.FX + G.DX, G.FY + G.FH + G.DY);
    ctx.lineTo(G.FX + G.FW + G.DX, G.FY + G.FH + G.DY); ctx.lineTo(G.FX + G.FW, G.FY + G.FH); ctx.closePath();
    ctx.fillStyle = '#0d1724'; ctx.fill();
    ctx.save();
    rr(G.IX - 6, G.IY - 6, G.IW + 12, G.IH + 12, 8); ctx.clip();
    const bg2 = ctx.createLinearGradient(G.IX, G.IY, G.IX + G.IW, G.IY + G.IH);
    bg2.addColorStop(0, '#0a1220'); bg2.addColorStop(1, '#132234');
    ctx.fillStyle = bg2; ctx.fillRect(G.IX - 8, G.IY - 8, G.IW + 16, G.IH + 16);
    ctx.fillStyle = '#0c1826'; ctx.fillRect(G.IX + 21, G.IY - 18, G.IW, G.IH);
    ctx.beginPath();
    ctx.moveTo(G.IX, G.IY); ctx.lineTo(G.IX + 21, G.IY - 18);
    ctx.lineTo(G.IX + 21, G.IY + G.IH - 18); ctx.lineTo(G.IX, G.IY + G.IH); ctx.closePath();
    ctx.fillStyle = '#18283c'; ctx.fill();
    ctx.beginPath();
    ctx.moveTo(G.IX, G.IY + G.IH); ctx.lineTo(G.IX + 21, G.IY + G.IH - 18);
    ctx.lineTo(G.IX + G.IW + 21, G.IY + G.IH - 18); ctx.lineTo(G.IX + G.IW, G.IY + G.IH); ctx.closePath();
    ctx.fillStyle = '#101d2c'; ctx.fill();
    ctx.restore();
    const pgX = G.IX + 6, pgY = G.IY + 4, pgW = G.IW - 12, pgH = 96;
    rr(pgX, pgY, pgW, pgH, 6);
    let gg = ctx.createLinearGradient(0, pgY, 0, pgY + pgH);
    gg.addColorStop(0, '#1c2f45'); gg.addColorStop(1, '#132234');
    ctx.fillStyle = gg; ctx.fill(); ctx.strokeStyle = '#2b4763'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = 'rgba(120,170,220,.16)';
    for (let y = pgY + 10; y < pgY + pgH - 6; y += 14)
        for (let x = pgX + 12; x < pgX + pgW - 6; x += 16) { ctx.beginPath(); ctx.arc(x, y, 1.6, 0, 6.3); ctx.fill(); }
    ctx.fillStyle = '#2a4258'; ctx.fillRect(pgX, pgY + pgH - 8, pgW, 8);
    ctx.fillStyle = 'rgba(255,255,255,.10)'; ctx.fillRect(pgX, pgY + pgH - 8, pgW, 2);
    function shelf(y) {
        const x0 = G.IX + 6, x1 = G.IX + G.IW - 6;
        ctx.beginPath();
        ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.lineTo(x1 + 16, y - 13); ctx.lineTo(x0 + 16, y - 13); ctx.closePath();
        let sg = ctx.createLinearGradient(0, y - 13, 0, y);
        sg.addColorStop(0, '#3d5a78'); sg.addColorStop(1, '#2a415a');
        ctx.fillStyle = sg; ctx.fill();
        rr(x0, y, x1 - x0, 10, 3);
        let fg = ctx.createLinearGradient(0, y, 0, y + 10);
        fg.addColorStop(0, '#4a6c8e'); fg.addColorStop(1, '#22374d');
        ctx.fillStyle = fg; ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(x0 + 2, y + 1, x1 - x0 - 4, 1.6);
        ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x0, y + 10, x1 - x0, 5);
    }
    shelf(276); shelf(390); shelf(500);
    const F = G;
    ctx.fillStyle = '#33506f';
    ctx.fillRect(F.FX, F.FY, F.FW, F.T);
    ctx.fillRect(F.FX, F.FY + F.FH - F.T, F.FW, F.T);
    ctx.fillRect(F.FX, F.FY, F.T, F.FH);
    ctx.fillRect(F.FX + F.FW - F.T, F.FY, F.T, F.FH);
    let mg = ctx.createLinearGradient(0, F.FY, 0, F.FY + F.FH);
    mg.addColorStop(0, 'rgba(255,255,255,.22)'); mg.addColorStop(.5, 'rgba(255,255,255,.02)'); mg.addColorStop(1, 'rgba(0,0,0,.30)');
    ctx.fillStyle = mg;
    ctx.fillRect(F.FX, F.FY, F.FW, F.T);
    ctx.fillRect(F.FX, F.FY, F.T, F.FH);
    ctx.fillRect(F.FX + F.FW - F.T, F.FY, F.T, F.FH);
    ctx.fillRect(F.FX, F.FY + F.FH - F.T, F.FW, F.T);
    ctx.fillStyle = '#8fa9c4';
    [[F.FX + 9, F.FY + 9], [F.FX + F.FW - 9, F.FY + 9], [F.FX + 9, F.FY + F.FH - 9], [F.FX + F.FW - 9, F.FY + F.FH - 9]].forEach(p => {
        ctx.beginPath(); ctx.arc(p[0], p[1], 3, 0, 6.3); ctx.fill();
        ctx.fillStyle = '#40597a'; ctx.beginPath(); ctx.arc(p[0] - .7, p[1] - .7, 1.4, 0, 6.3); ctx.fill();
        ctx.fillStyle = '#8fa9c4';
    });
    ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = 2; ctx.strokeRect(F.FX, F.FY, F.FW, F.FH);
    const lx = F.FX + F.FW / 2;
    ctx.fillStyle = '#1b2a3d';
    rr(lx - 96, F.FY + F.DY - 26, 192, 16, 6); ctx.fill();
    ctx.strokeStyle = '#4d6c8d'; ctx.lineWidth = 1.5; ctx.stroke();
    let lg2 = ctx.createLinearGradient(0, F.FY + F.DY - 12, 0, F.FY + F.DY - 6);
    lg2.addColorStop(0, 'rgba(255,255,255,.15)'); lg2.addColorStop(1, '#bfe6ff');
    ctx.fillStyle = lg2;
    rr(lx - 88, F.FY + F.DY - 12, 176, 6, 3); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const cg = ctx.createLinearGradient(0, F.FY + F.DY - 6, 0, F.FY + F.FH * .8);
    cg.addColorStop(0, 'rgba(190,230,255,.16)'); cg.addColorStop(1, 'rgba(190,230,255,0)');
    ctx.fillStyle = cg;
    ctx.beginPath(); ctx.moveTo(lx - 88, F.FY + F.DY - 6); ctx.lineTo(lx + 88, F.FY + F.DY - 6);
    ctx.lineTo(lx + 300, F.FY + F.FH * .85); ctx.lineTo(lx - 300, F.FY + F.FH * .85); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx = prev;
    _cabSpr = { cn, x: CX0, y: CY0, w: SPW, h: SPH };
    return _cabSpr;
}
