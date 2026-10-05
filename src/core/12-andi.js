// ==========================================================================
// core/12-andi.js
// Diambil dari netcrimp2.html baris 536-622. File ini digabung otomatis oleh build.mjs
// ke dist/netcrimp2.html -- JANGAN diedit langsung di dist/.
// ==========================================================================

/* ---------- karakter Andi ---------- */
function drawAndi(cx, cy, s, mood, t) {
    ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.ellipse(0, 150, 86, 14, 0, 0, 6.3); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fill();
    const g = ctx.createLinearGradient(0, 20, 0, 150);
    g.addColorStop(0, '#3b82f6'); g.addColorStop(1, '#1d4ed8');
    ctx.beginPath();
    ctx.moveTo(-76, 150); ctx.lineTo(-76, 76);
    ctx.quadraticCurveTo(-76, 34, -32, 26);
    ctx.lineTo(32, 26);
    ctx.quadraticCurveTo(76, 34, 76, 76);
    ctx.lineTo(76, 150); ctx.closePath();
    ctx.fillStyle = g; ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath(); ctx.moveTo(-70, 86); ctx.lineTo(-38, 36); ctx.lineTo(-38, 150); ctx.lineTo(-70, 150); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(70, 86); ctx.lineTo(38, 36); ctx.lineTo(38, 150); ctx.lineTo(70, 150); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.6)';
    ctx.fillRect(-70, 98, 32, 7); ctx.fillRect(38, 98, 32, 7);
    ctx.beginPath(); ctx.moveTo(-30, 26); ctx.lineTo(0, 62); ctx.lineTo(30, 26); ctx.lineTo(16, 26); ctx.lineTo(0, 46); ctx.lineTo(-16, 26); ctx.closePath();
    ctx.fillStyle = '#0f2b52'; ctx.fill();
    ctx.fillStyle = '#e8b48a'; ctx.fillRect(-15, 4, 30, 32);
    ctx.beginPath(); ctx.ellipse(0, -26, 49, 53, 0, 0, 6.3); ctx.fillStyle = '#f3c39a'; ctx.fill();
    ctx.beginPath(); ctx.ellipse(-49, -22, 9, 12, 0, 0, 6.3); ctx.fillStyle = '#eeb98f'; ctx.fill();
    ctx.beginPath(); ctx.ellipse(49, -22, 9, 12, 0, 0, 6.3); ctx.fillStyle = '#eeb98f'; ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-49, -30); ctx.quadraticCurveTo(-56, -72, -24, -78);
    ctx.lineTo(24, -78); ctx.quadraticCurveTo(56, -72, 49, -30);
    ctx.quadraticCurveTo(44, -56, 0, -56); ctx.quadraticCurveTo(-44, -56, -49, -30); ctx.closePath();
    ctx.fillStyle = '#241a14'; ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, -58, 50, 44, 0, Math.PI, 2 * Math.PI);
    ctx.lineTo(50, -58); ctx.lineTo(-50, -58); ctx.closePath();
    ctx.fillStyle = '#1d4ed8'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, -58, 60, 11, 0, 0, Math.PI); ctx.closePath();
    ctx.fillStyle = '#1e40af'; ctx.fill();
    ctx.beginPath(); ctx.arc(0, -72, 10, 0, 6.3); ctx.fillStyle = '#fbbf24'; ctx.fill();
    ctx.fillStyle = '#1e3a8a'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('N', 0, -71);
    ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(-52, -10); ctx.quadraticCurveTo(-72, 4, -40, 13); ctx.stroke();
    ctx.beginPath(); ctx.arc(-38, 14, 7, 0, 6.3); ctx.fillStyle = '#334155'; ctx.fill();
    const blink = (Math.sin(t * 1.9) > 0.985) ? 0.12 : 1;
    if (mood === 'happy') {
        ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(-18, -28, 9, Math.PI * 1.12, Math.PI * 1.88); ctx.stroke();
        ctx.beginPath(); ctx.arc(18, -28, 9, Math.PI * 1.12, Math.PI * 1.88); ctx.stroke();
    } else {
        ctx.beginPath(); ctx.ellipse(-18, -28, 7, 9 * blink, 0, 0, 6.3); ctx.fillStyle = '#1e293b'; ctx.fill();
        ctx.beginPath(); ctx.ellipse(18, -28, 7, 9 * blink, 0, 0, 6.3); ctx.fillStyle = '#1e293b'; ctx.fill();
        if (blink > 0.5) {
            ctx.beginPath(); ctx.arc(-15.5, -31.5, 2.2, 0, 6.3); ctx.fillStyle = '#fff'; ctx.fill();
            ctx.beginPath(); ctx.arc(20.5, -31.5, 2.2, 0, 6.3); ctx.fillStyle = '#fff'; ctx.fill();
        }
    }
    ctx.strokeStyle = '#241a14'; ctx.lineWidth = 3.4;
    if (mood === 'sad') {
        ctx.beginPath(); ctx.moveTo(-28, -45); ctx.lineTo(-10, -39); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(28, -45); ctx.lineTo(10, -39); ctx.stroke();
    } else {
        ctx.beginPath(); ctx.moveTo(-28, -42); ctx.lineTo(-10, -46); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(28, -42); ctx.lineTo(10, -46); ctx.stroke();
    }
    ctx.strokeStyle = '#8b4a3a'; ctx.lineWidth = 3.4;
    if (mood === 'talk') { const o = 4 + 4 * Math.abs(Math.sin(t * 9)); ctx.beginPath(); ctx.ellipse(0, 4, 9, o, 0, 0, 6.3); ctx.fillStyle = '#8b4a3a'; ctx.fill(); }
    else if (mood === 'happy') { ctx.beginPath(); ctx.arc(0, -2, 16, 0.12 * Math.PI, 0.88 * Math.PI); ctx.stroke(); }
    else if (mood === 'sad') { ctx.beginPath(); ctx.arc(0, 18, 14, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); }
    else { ctx.beginPath(); ctx.arc(0, -2, 13, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke(); }
    ctx.restore();
}
function drawAndiFace(cx, cy, r, mood, t) {
    ctx.save(); ctx.translate(cx, cy);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.3); ctx.fillStyle = '#f3c39a'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#c99a76'; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, -r * 0.42, r * 0.95, r * 0.6, 0, Math.PI, 2 * Math.PI); ctx.closePath();
    ctx.fillStyle = '#1d4ed8'; ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, -r * 0.42, r * 1.15, r * 0.22, 0, 0, Math.PI); ctx.closePath();
    ctx.fillStyle = '#1e40af'; ctx.fill();
    const blink = (Math.sin(t * 2.1) > 0.985) ? 0.15 : 1;
    ctx.beginPath(); ctx.ellipse(-r * 0.35, -r * 0.05, r * 0.15, r * 0.2 * blink, 0, 0, 6.3); ctx.fillStyle = '#1e293b'; ctx.fill();
    ctx.beginPath(); ctx.ellipse(r * 0.35, -r * 0.05, r * 0.15, r * 0.2 * blink, 0, 0, 6.3); ctx.fillStyle = '#1e293b'; ctx.fill();
    ctx.strokeStyle = '#8b4a3a'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    if (mood === 'happy') { ctx.beginPath(); ctx.arc(0, r * 0.18, r * 0.35, 0.12 * Math.PI, 0.88 * Math.PI); ctx.stroke(); }
    else if (mood === 'sad') { ctx.beginPath(); ctx.arc(0, r * 0.55, r * 0.3, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); }
    else { ctx.beginPath(); ctx.arc(0, r * 0.18, r * 0.3, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke(); }
    ctx.restore();
}
