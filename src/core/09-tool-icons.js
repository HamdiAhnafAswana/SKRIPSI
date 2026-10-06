// ==========================================================================
// core/09-tool-icons.js
// Diambil dari backup/netcrimp2.ORI.html baris 203-362. File ini digabung otomatis oleh build.mjs
// ke index.html -- JANGAN diedit langsung di index.html.
// ==========================================================================

/* ---------- ikon alat ---------- */
function icon(id, x, y, s) {
    s = s || 1; ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    switch (id) {
        case 'utp':
            for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(0, 0, 34 - i * 7, 22 - i * 5, 0, 0, 6.3); ctx.lineWidth = 6; ctx.strokeStyle = i % 2 ? '#2563eb' : '#60a5fa'; ctx.stroke(); }
            ctx.beginPath(); ctx.moveTo(30, 8); ctx.bezierCurveTo(44, 24, 52, 10, 58, 20); ctx.lineWidth = 5; ctx.strokeStyle = '#60a5fa'; ctx.stroke(); break;
        case 'utp_out':
            ctx.beginPath(); ctx.ellipse(0, 0, 40, 28, 0, 0, 6.3); ctx.fillStyle = '#0a0a0a'; ctx.fill();
            ctx.beginPath(); ctx.ellipse(0, 0, 36, 24, 0, 0, 6.3); ctx.lineWidth = 3; ctx.strokeStyle = '#1f2937'; ctx.stroke();
            for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(-3, 0, 26 - i * 5, 17 - i * 4, 0, 0, 6.3); ctx.lineWidth = 4; ctx.strokeStyle = i % 2 ? '#2563eb' : '#60a5fa'; ctx.stroke(); }
            ctx.beginPath(); ctx.moveTo(28, 10); ctx.bezierCurveTo(40, 24, 50, 12, 56, 22); ctx.lineWidth = 4; ctx.strokeStyle = '#1f2937'; ctx.stroke();
            ctx.beginPath(); ctx.arc(30, -22, 8, 0, 6.3); ctx.fillStyle = '#38bdf8'; ctx.fill();
            ctx.beginPath(); ctx.moveTo(30, -26); ctx.lineTo(30, -20); ctx.lineTo(34, -18); ctx.strokeStyle = '#082f49'; ctx.lineWidth = 2; ctx.stroke(); break;
        case 'utp_in':
            for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(-3, 0, 32 - i * 7, 21 - i * 5, 0, 0, 6.3); ctx.lineWidth = 5; ctx.strokeStyle = i % 2 ? '#2563eb' : '#60a5fa'; ctx.stroke(); }
            ctx.beginPath(); ctx.moveTo(26, 8); ctx.bezierCurveTo(40, 22, 48, 10, 54, 18); ctx.lineWidth = 4; ctx.strokeStyle = '#60a5fa'; ctx.stroke();
            ctx.beginPath(); ctx.moveTo(24, -26); ctx.lineTo(40, -26); ctx.lineTo(32, -8); ctx.closePath();
            ctx.fillStyle = '#fbbf24'; ctx.fill(); ctx.strokeStyle = '#92400e'; ctx.lineWidth = 1.5; ctx.stroke();
            txt('!', 32, -14, { s: 14, a: 'center', c: '#1a1200', w: 800 }); break;
        case 'rj45':
            rr(-22, -14, 44, 32, 4); ctx.fillStyle = 'rgba(210,232,245,.92)'; ctx.fill(); ctx.strokeStyle = '#7aa0b8'; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = C.gold; for (let k = 0; k < 8; k++)ctx.fillRect(-18 + k * 5, -12, 3, 12);
            rr(-10, 18, 20, 8, 2); ctx.fillStyle = 'rgba(210,232,245,.92)'; ctx.fill(); break;
        case 'crimp':
            ctx.lineWidth = 9; ctx.strokeStyle = '#dc2626'; ctx.beginPath(); ctx.moveTo(-26, 28); ctx.lineTo(-6, -4); ctx.moveTo(26, 28); ctx.lineTo(6, -4); ctx.stroke();
            rr(-16, -26, 32, 24, 5); ctx.fillStyle = '#9aa8b8'; ctx.fill(); ctx.strokeStyle = '#5b6b7d'; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = '#3b4757'; ctx.fillRect(-9, -20, 18, 8); break;
        case 'strip':
            ctx.lineWidth = 8; ctx.strokeStyle = '#eab308'; ctx.beginPath(); ctx.moveTo(-24, 28); ctx.lineTo(-2, -2); ctx.moveTo(24, 28); ctx.lineTo(2, -2); ctx.stroke();
            ctx.fillStyle = '#cbd5e1'; ctx.beginPath(); ctx.moveTo(-10, -2); ctx.lineTo(-3, -28); ctx.lineTo(4, -2); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#94a3b8'; ctx.beginPath(); ctx.moveTo(10, -2); ctx.lineTo(3, -28); ctx.lineTo(-4, -2); ctx.closePath(); ctx.fill(); break;
        case 'tester':
            rr(-36, -20, 72, 40, 6); ctx.fillStyle = '#166534'; ctx.fill(); ctx.strokeStyle = '#0b3b1f'; ctx.lineWidth = 2; ctx.stroke();
            for (let k = 0; k < 8; k++) { ctx.beginPath(); ctx.arc(-28 + k * 8, -8, 3, 0, 6.3); ctx.fillStyle = k % 3 ? '#4ade80' : '#fde047'; ctx.fill(); }
            ctx.fillStyle = '#0b1220'; ctx.fillRect(-22, 4, 16, 10); ctx.fillRect(6, 4, 16, 10); break;
        case 'obeng':
            rr(-38, -8, 30, 16, 6); ctx.fillStyle = '#f97316'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#94a3b8'; ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(38, 0); ctx.stroke(); break;
        case 'solder':
            rr(-38, -9, 32, 18, 6); ctx.fillStyle = '#374151'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#94a3b8'; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(26, 0); ctx.stroke();
            ctx.strokeStyle = '#f97316'; ctx.beginPath(); ctx.moveTo(26, 0); ctx.lineTo(38, 0); ctx.stroke(); break;
        case 'palu':
            ctx.lineWidth = 9; ctx.strokeStyle = '#92602b'; ctx.beginPath(); ctx.moveTo(-6, 30); ctx.lineTo(6, -8); ctx.stroke(); rr(-24, -28, 44, 20, 4); ctx.fillStyle = '#8892a0'; ctx.fill(); break;
        case 'punch':
            rr(-9, -30, 18, 40, 7); ctx.fillStyle = '#2563eb'; ctx.fill(); ctx.fillStyle = '#cbd5e1'; ctx.fillRect(-5, 10, 10, 18); ctx.fillStyle = '#64748b'; ctx.fillRect(-5, 24, 10, 4); break;
        case 'hdmi':
            ctx.lineWidth = 6; ctx.strokeStyle = '#475569'; ctx.beginPath(); ctx.moveTo(24, 0); ctx.bezierCurveTo(44, 0, 40, 20, 60, 16); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-26, -11); ctx.lineTo(24, -11); ctx.lineTo(24, 11); ctx.lineTo(-20, 11); ctx.lineTo(-26, 4); ctx.closePath(); ctx.fillStyle = '#1e293b'; ctx.fill(); ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2; ctx.stroke(); break;
        case 'bnc':
            ctx.beginPath(); ctx.arc(0, 0, 22, 0, 6.3); ctx.fillStyle = '#cbd5e1'; ctx.fill(); ctx.strokeStyle = '#64748b'; ctx.lineWidth = 3; ctx.stroke();
            ctx.beginPath(); ctx.arc(0, 0, 11, 0, 6.3); ctx.fillStyle = '#475569'; ctx.fill(); ctx.beginPath(); ctx.arc(0, 0, 3.5, 0, 6.3); ctx.fillStyle = C.gold; ctx.fill(); break;
        case 'lakban':
            ctx.beginPath(); ctx.arc(0, 0, 17, 0, 6.3); ctx.lineWidth = 14; ctx.strokeStyle = '#4b5563'; ctx.stroke();
            ctx.beginPath(); ctx.arc(0, 0, 24, 0, 6.3); ctx.lineWidth = 1.5; ctx.strokeStyle = '#9ca3af'; ctx.stroke(); break;
        case 'vga':
            ctx.beginPath();
            ctx.moveTo(-42, -18); ctx.lineTo(26, -18); ctx.lineTo(38, -9); ctx.lineTo(38, 9); ctx.lineTo(26, 18); ctx.lineTo(-42, 18);
            ctx.closePath(); ctx.fillStyle = '#3b82f6'; ctx.fill(); ctx.strokeStyle = '#1e40af'; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = '#dbeafe';
            for (let r0 = 0; r0 < 3; r0++)for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(-32 + k * 11, -9 + r0 * 9, 2.7, 0, 6.3); ctx.fill(); }
            break;
        case 'mouse':
            ctx.beginPath(); ctx.moveTo(0, -30); ctx.bezierCurveTo(20, -30, 22, -6, 22, 4); ctx.bezierCurveTo(22, 22, 12, 28, 0, 28);
            ctx.bezierCurveTo(-12, 28, -22, 22, -22, 4); ctx.bezierCurveTo(-22, -6, -20, -30, 0, -30); ctx.closePath();
            ctx.fillStyle = '#cbd5e1'; ctx.fill(); ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2; ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(0, -4); ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2; ctx.stroke();
            rr(-5, -25, 10, 17, 5); ctx.fillStyle = '#94a3b8'; ctx.fill();
            ctx.beginPath(); ctx.moveTo(0, -30); ctx.quadraticCurveTo(-6, -44, -26, -46); ctx.strokeStyle = '#64748b'; ctx.lineWidth = 3; ctx.stroke(); break;
        case 'keyboard':
            rr(-40, -22, 80, 44, 6); ctx.fillStyle = '#334155'; ctx.fill(); ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = '#94a3b8';
            for (let r0 = 0; r0 < 3; r0++)for (let k = 0; k < 8; k++)ctx.fillRect(-33 + k * 8.5, -15 + r0 * 10, 6, 6.5);
            ctx.fillStyle = '#94a3b8'; ctx.fillRect(-14, 16, 28, 4); break;
        case 'speaker':
            rr(-24, -32, 48, 64, 7); ctx.fillStyle = '#3f3f46'; ctx.fill(); ctx.strokeStyle = '#18181b'; ctx.lineWidth = 2; ctx.stroke();
            ctx.beginPath(); ctx.arc(0, -14, 8, 0, 6.3); ctx.fillStyle = '#18181b'; ctx.fill();
            ctx.beginPath(); ctx.arc(0, 12, 14, 0, 6.3); ctx.fillStyle = '#18181b'; ctx.fill();
            ctx.beginPath(); ctx.arc(0, 12, 6.5, 0, 6.3); ctx.fillStyle = '#52525b'; ctx.fill(); break;
        case 'flashdisk':
            rr(-11, -28, 22, 20, 3); ctx.fillStyle = '#cbd5e1'; ctx.fill(); ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = '#94a3b8'; ctx.fillRect(-7, -24, 5, 5); ctx.fillRect(1, -24, 5, 5);
            rr(-19, -10, 38, 36, 7); ctx.fillStyle = '#dc2626'; ctx.fill(); ctx.strokeStyle = '#991b1b'; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-15, -6, 30, 4); break;
        case 'switch':
            rr(-44, -16, 88, 32, 4); ctx.fillStyle = '#1e293b'; ctx.fill(); ctx.strokeStyle = '#475569'; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = '#0a1220'; for (let k = 0; k < 6; k++)ctx.fillRect(-34 + k * 12, -8, 9, 16);
            ctx.beginPath(); ctx.arc(34, -8, 3, 0, 6.3); ctx.fillStyle = '#4ade80'; ctx.fill();
            ctx.beginPath(); ctx.arc(34, 2, 3, 0, 6.3); ctx.fillStyle = '#fbbf24'; ctx.fill(); break;
        case 'tang':
            ctx.lineWidth = 8; ctx.strokeStyle = '#f97316';
            ctx.beginPath(); ctx.moveTo(-12, 34); ctx.lineTo(-10, 4); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(12, 34); ctx.lineTo(10, 4); ctx.stroke();
            ctx.beginPath(); ctx.arc(0, 0, 5, 0, 6.3); ctx.fillStyle = '#4b5563'; ctx.fill();
            ctx.beginPath(); ctx.moveTo(-11, -2); ctx.lineTo(-5, -28); ctx.lineTo(5, -28); ctx.lineTo(11, -2); ctx.closePath();
            ctx.fillStyle = '#9ca3af'; ctx.fill(); ctx.strokeStyle = '#4b5563'; ctx.lineWidth = 2; ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, -28); ctx.lineTo(0, -14); ctx.strokeStyle = '#4b5563'; ctx.lineWidth = 1.5; ctx.stroke(); break;
        case 'sarung_tangan': {
            ctx.beginPath();
            rr(-26, -6, 44, 36, 8);
            const gloveGrad = ctx.createLinearGradient(0, -6, 0, 30);
            gloveGrad.addColorStop(0, '#f87171'); gloveGrad.addColorStop(1, '#b91c1c');
            ctx.fillStyle = gloveGrad; ctx.fill(); ctx.strokeStyle = '#7f1d1d'; ctx.lineWidth = 2; ctx.stroke();
            const fingers = [{ x: -24, w: 12, h: 26 }, { x: -10, w: 12, h: 32 }, { x: 4, w: 12, h: 30 }, { x: 18, w: 12, h: 24 }];
            fingers.forEach(f => { ctx.beginPath(); rr(f.x, -6 - f.h, f.w, f.h + 8, 6); ctx.fillStyle = gloveGrad; ctx.fill(); ctx.strokeStyle = '#7f1d1d'; ctx.lineWidth = 2; ctx.stroke(); });
            ctx.beginPath(); rr(-38, -2, 14, 22, 6); ctx.fillStyle = gloveGrad; ctx.fill(); ctx.strokeStyle = '#7f1d1d'; ctx.lineWidth = 2; ctx.stroke();
            ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]);
            ctx.beginPath(); ctx.moveTo(-26, 8); ctx.lineTo(18, 8); ctx.stroke(); ctx.setLineDash([]);
            break;
        }
        case 'gunting':
            ctx.lineWidth = 5; ctx.strokeStyle = '#cbd5e1';
            ctx.beginPath(); ctx.moveTo(-22, -26); ctx.lineTo(12, 8); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(22, -26); ctx.lineTo(-12, 8); ctx.stroke();
            ctx.beginPath(); ctx.arc(-20, 20, 9, 0, 6.3); ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 6; ctx.stroke();
            ctx.beginPath(); ctx.arc(20, 20, 9, 0, 6.3); ctx.stroke();
            ctx.beginPath(); ctx.arc(0, 0, 3, 0, 6.3); ctx.fillStyle = '#475569'; ctx.fill(); break;
        case 'isolasi':
            ctx.beginPath(); ctx.arc(0, 0, 18, 0, 6.3); ctx.lineWidth = 16; ctx.strokeStyle = '#1f2937'; ctx.stroke();
            ctx.beginPath(); ctx.arc(0, 0, 26, 0, 6.3); ctx.lineWidth = 2; ctx.strokeStyle = '#374151'; ctx.stroke();
            ctx.beginPath(); ctx.moveTo(20, -10); ctx.lineTo(40, -18); ctx.lineTo(40, 10); ctx.lineTo(20, 16); ctx.closePath();
            ctx.fillStyle = '#1f2937'; ctx.fill();
            ctx.beginPath(); ctx.moveTo(24, -8); ctx.lineTo(38, -14); ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 1; ctx.stroke(); break;
        case 'multimeter':
            rr(-24, -32, 48, 62, 6); ctx.fillStyle = '#fbbf24'; ctx.fill(); ctx.strokeStyle = '#92400e'; ctx.lineWidth = 2; ctx.stroke();
            rr(-18, -26, 36, 20, 3); ctx.fillStyle = '#0a1220'; ctx.fill();
            txt('12.5', 0, -11, { s: 12, a: 'center', c: '#4ade80', f: FONT_H });
            ctx.beginPath(); ctx.arc(0, 10, 12, 0, 6.3); ctx.fillStyle = '#475569'; ctx.fill();
            ctx.beginPath(); ctx.arc(0, 10, 3.5, 0, 6.3); ctx.fillStyle = '#1e293b'; ctx.fill();
            ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(0, 2); ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2; ctx.stroke(); break;
        case 'coaxial':
            ctx.lineWidth = 10; ctx.strokeStyle = '#0f172a';
            ctx.beginPath(); ctx.moveTo(-40, 0); ctx.lineTo(16, 0); ctx.stroke();
            ctx.lineWidth = 6; ctx.strokeStyle = '#1e293b';
            ctx.beginPath(); ctx.moveTo(-40, 0); ctx.lineTo(14, 0); ctx.stroke();
            ctx.beginPath(); ctx.arc(28, 0, 11, 0, 6.3); ctx.fillStyle = '#cbd5e1'; ctx.fill(); ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2; ctx.stroke();
            ctx.beginPath(); ctx.arc(28, 0, 5, 0, 6.3); ctx.fillStyle = '#475569'; ctx.fill();
            ctx.beginPath(); ctx.arc(28, 0, 2, 0, 6.3); ctx.fillStyle = C.gold; ctx.fill(); break;
        case 'loc_lab':
            rr(-16, -13, 32, 22, 2); ctx.fillStyle = '#0f172a'; ctx.fill(); ctx.strokeStyle = '#475569'; ctx.lineWidth = 2; ctx.stroke();
            rr(-13, -10, 26, 16, 1); ctx.fillStyle = '#38bdf8'; ctx.fill();
            ctx.fillStyle = '#475569'; ctx.fillRect(-3, 9, 6, 3); ctx.fillRect(-8, 12, 16, 3); break;
        case 'loc_repair':
            ctx.save(); ctx.rotate(-0.5);
            ctx.beginPath(); ctx.arc(-9, -10, 7, 0, 6.3); ctx.fillStyle = '#cbd5e1'; ctx.fill();
            ctx.beginPath(); ctx.arc(-9, -10, 3, 0, 6.3); ctx.fillStyle = '#0f172a'; ctx.fill();
            ctx.fillStyle = '#cbd5e1'; ctx.fillRect(-11, -5, 4, 20);
            ctx.restore();
            ctx.beginPath(); ctx.arc(12, -2, 4, 0, 6.3); ctx.fillStyle = '#fbbf24'; ctx.fill();
            ctx.beginPath(); ctx.moveTo(12, -8); ctx.lineTo(15, -2); ctx.lineTo(9, -2); ctx.closePath(); ctx.fillStyle = '#fbbf24'; ctx.fill(); break;
        case 'loc_outdoor':
            rr(-18, 2, 12, 14, 1); ctx.fillStyle = '#475569'; ctx.fill();
            rr(-4, -6, 14, 22, 1); ctx.fillStyle = '#334155'; ctx.fill();
            ctx.fillStyle = '#fbbf24';
            for (let r0 = 0; r0 < 3; r0++)for (let c0 = 0; c0 < 2; c0++)ctx.fillRect(-2 + c0 * 5, -3 + r0 * 5, 3, 3);
            ctx.beginPath(); ctx.arc(-12, 7, 2.2, 0, 6.3); ctx.fillStyle = '#0ea5e9'; ctx.fill();
            ctx.beginPath(); ctx.arc(-8, 7, 2.2, 0, 6.3); ctx.fillStyle = '#0ea5e9'; ctx.fill();
            ctx.beginPath(); ctx.arc(-10, 9, 2.8, 0, 6.3); ctx.fillStyle = '#0ea5e9'; ctx.fill(); break;
    }
    ctx.restore();
}
