// ==========================================================================
// core/09-tool-icons.js
// Diambil dari backup/netcrimp2.ORI.html baris 203-362. File ini digabung otomatis oleh build.mjs
// ke index.html -- JANGAN diedit langsung di index.html.
// ==========================================================================

/* ---------- palet sarung tangan kerja (oranye keselamatan) --------------
   Dipakai bersama oleh ikon panel kecil (case 'sarung_tangan') dan oleh
   sprite besar di area kerja (drawWorkHand / drawHandGrip / drawGloveProp),
   supaya desain sarung tangan di seluruh level tetap sama. Sarung bergaya
   "full finger safety glove" milik teknisi jaringan: kain oranye, lapisan
   grip abu-gelap di ujung jari/telapak, panel pelindung ringan di punggung
   tangan, dan manset elastis.
     skin*  : kulit tangan telanjang (terlihat sebelum sarung terpasang)
     knit*  : kain sarung oranye keselamatan (#F59E0B) + highlight/shadow
     coat*  : lapisan karet grip abu-gelap (anti-slip) pada jari & telapak
     panel* : panel pelindung ringan (TPR) di punggung tangan
     cuff*  : manset elastis oranye dengan trim gelap
     seam   : warna garis jahitan                                         */
const GLOVE_PALETTE = {
    skinHi: '#f7d6b1', skin0: '#e8b48a', skin1: '#c08d61', skinLn: '#8a5c37',
    knitHi: '#fcd34d', knit0: '#f59e0b', knit1: '#b45309', knitLn: '#7c2d12',
    coatHi: '#64748b', coat0: '#334155', coatLn: '#0f172a',
    gripHi: '#475569', grip0: '#1f2937',
    panelHi: '#4b5563', panel0: '#1f2937', panelLn: '#0b1220',
    cuffHi: '#fbbf24', cuff0: '#f59e0b', cuff1: '#b45309', cuffLn: '#7c2d12',
    seam: 'rgba(255,247,224,.55)'
};

/* ---------- ikon alat ---------- */
function icon(id, x, y, s) {
    s = s || 1; ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    // Helper: bayangan lembut di bawah alat
    function shadow(w, h, blur) {
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,.35)';
        ctx.shadowBlur = blur || 6;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = 'rgba(0,0,0,.01)';
        ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.restore();
    }
    // Helper: highlight logam
    function metalGrad(x0, y0, x1, y1, c1, c2) {
        const g = ctx.createLinearGradient(x0, y0, x1, y1);
        g.addColorStop(0, c1 || '#e2e8f0');
        g.addColorStop(.5, c2 || '#94a3b8');
        g.addColorStop(1, '#475569');
        return g;
    }
    // Helper: plastik glossy
    function plasticGrad(x0, y0, x1, y1, c1, c2, c3) {
        const g = ctx.createLinearGradient(x0, y0, x1, y1);
        g.addColorStop(0, c1);
        g.addColorStop(.6, c2);
        g.addColorStop(1, c3);
        return g;
    }

    switch (id) {
        case 'utp':
            // Kabel dengan selubung biru dan highlight
            for (let i = 0; i < 4; i++) {
                ctx.beginPath(); ctx.ellipse(0, 0, 34 - i * 7, 22 - i * 5, 0, 0, 6.3);
                ctx.lineWidth = 6; ctx.strokeStyle = i % 2 ? '#1d4ed8' : '#3b82f6'; ctx.stroke();
            }
            // Ujung kabel terlihat
            ctx.beginPath(); ctx.moveTo(30, 8); ctx.bezierCurveTo(44, 24, 52, 10, 58, 20);
            ctx.lineWidth = 5; ctx.strokeStyle = '#60a5fa'; ctx.stroke();
            // Highlight
            ctx.beginPath(); ctx.ellipse(0, -8, 30, 12, 0, Math.PI, 2 * Math.PI);
            ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.stroke();
            break;
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
            // Bodi semi-transparan dengan gradient
            const rjG = ctx.createLinearGradient(0, -14, 0, 18);
            rjG.addColorStop(0, 'rgba(226,240,250,.95)');
            rjG.addColorStop(.5, 'rgba(200,225,240,.88)');
            rjG.addColorStop(1, 'rgba(170,205,225,.92)');
            rr(-22, -14, 44, 32, 4); ctx.fillStyle = rjG; ctx.fill();
            ctx.strokeStyle = '#7aa0b8'; ctx.lineWidth = 2; ctx.stroke();
            // Highlight glossy
            ctx.fillStyle = 'rgba(255,255,255,.5)'; rr(-20, -12, 40, 6, 3); ctx.fill();
            // 8 kontak emas dengan kedalaman
            for (let k = 0; k < 8; k++) {
                const gx = -18 + k * 5;
                const g = ctx.createLinearGradient(gx, -12, gx + 3, 0);
                g.addColorStop(0, '#fde047'); g.addColorStop(.5, '#d4a72c'); g.addColorStop(1, '#92400e');
                ctx.fillStyle = g; ctx.fillRect(gx, -12, 3, 12);
                ctx.strokeStyle = '#78350f'; ctx.lineWidth = .5; ctx.strokeRect(gx, -12, 3, 12);
            }
            // Lock tab
            rr(-10, 18, 20, 8, 2); ctx.fillStyle = 'rgba(200,225,240,.9)'; ctx.fill();
            ctx.strokeStyle = '#7aa0b8'; ctx.lineWidth = 1.5; ctx.stroke();
            break;
        case 'crimp': {
            // Tang crimping realistis: gagang merah, engsel logam, rahang
            for (let side = -1; side <= 1; side += 2) {
                const a = side * .42;
                const sx = Math.sin(a), cy = Math.cos(a);
                ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(sx * 34, 2 + cy * 34);
                ctx.lineWidth = 8; ctx.strokeStyle = '#8d99ae'; ctx.stroke();
                ctx.beginPath(); ctx.moveTo(sx * 11, 2 + cy * 11); ctx.lineTo(sx * 34, 2 + cy * 34);
                ctx.lineWidth = 11; ctx.strokeStyle = '#b91c1c'; ctx.stroke();
            }
            ctx.beginPath(); ctx.arc(0, 2, 5, 0, 6.3); ctx.fillStyle = '#cbd5e1'; ctx.fill();
            ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.5; ctx.stroke();
            rr(-13, -34, 26, 22, 6);
            const cg2 = ctx.createLinearGradient(0, -34, 0, -12);
            cg2.addColorStop(0, '#e2e8f0'); cg2.addColorStop(.5, '#94a3b8'); cg2.addColorStop(1, '#475569');
            ctx.fillStyle = cg2; ctx.fill(); ctx.strokeStyle = '#334155'; ctx.lineWidth = 2; ctx.stroke();
            // rahang terbuka (dua belahan)
            ctx.strokeStyle = '#64748b'; ctx.lineWidth = 6;
            ctx.beginPath(); ctx.moveTo(-3, -12); ctx.lineTo(-8, -26); ctx.moveTo(3, -12); ctx.lineTo(8, -26); ctx.stroke();
            ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(-6, -17); ctx.lineTo(-4, -12); ctx.moveTo(6, -17); ctx.lineTo(4, -12); ctx.stroke();
            break;
        }
        case 'strip':
            ctx.lineWidth = 8; ctx.strokeStyle = '#eab308'; ctx.beginPath(); ctx.moveTo(-24, 28); ctx.lineTo(-2, -2); ctx.moveTo(24, 28); ctx.lineTo(2, -2); ctx.stroke();
            ctx.fillStyle = '#cbd5e1'; ctx.beginPath(); ctx.moveTo(-10, -2); ctx.lineTo(-3, -28); ctx.lineTo(4, -2); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#94a3b8'; ctx.beginPath(); ctx.moveTo(10, -2); ctx.lineTo(3, -28); ctx.lineTo(-4, -2); ctx.closePath(); ctx.fill(); break;
        case 'tester':
            // Body dengan gradient plastik
            ctx.fillStyle = plasticGrad(0, -20, 0, 20, '#22c55e', '#16a34a', '#14532d');
            rr(-36, -20, 72, 40, 6); ctx.fill();
            ctx.strokeStyle = '#0b3b1f'; ctx.lineWidth = 2; ctx.stroke();
            // Highlight glossy
            ctx.fillStyle = 'rgba(255,255,255,.2)'; rr(-34, -18, 68, 8, 4); ctx.fill();
            // Label
            ctx.fillStyle = '#fff'; ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('LAN TESTER', 0, -12);
            // LED indikator 8 pin
            for (let k = 0; k < 8; k++) {
                const lx = -28 + k * 8;
                ctx.beginPath(); ctx.arc(lx, -4, 3.5, 0, 6.3);
                ctx.fillStyle = k % 3 ? '#4ade80' : '#fde047'; ctx.fill();
                ctx.strokeStyle = '#052e16'; ctx.lineWidth = 1; ctx.stroke();
            }
            // Display digital
            ctx.fillStyle = '#0b1220'; rr(-22, 4, 44, 10, 2); ctx.fill();
            ctx.fillStyle = '#4ade80'; ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center';
            ctx.fillText('READY', 0, 12);
            break;
        case 'obeng':
            rr(-38, -8, 30, 16, 6); ctx.fillStyle = '#f97316'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#94a3b8'; ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(38, 0); ctx.stroke(); break;
        case 'solder':
            rr(-38, -9, 32, 18, 6); ctx.fillStyle = '#374151'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#94a3b8'; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(26, 0); ctx.stroke();
            ctx.strokeStyle = '#f97316'; ctx.beginPath(); ctx.moveTo(26, 0); ctx.lineTo(38, 0); ctx.stroke(); break;
        case 'palu':
            ctx.lineWidth = 9; ctx.strokeStyle = '#92602b'; ctx.beginPath(); ctx.moveTo(-6, 30); ctx.lineTo(6, -8); ctx.stroke(); rr(-24, -28, 44, 20, 4); ctx.fillStyle = '#8892a0'; ctx.fill(); break;
        case 'punch': {
            // Punch-down tool: kepala logam, bilah potong, pegangan kuning
            rr(-11, -34, 22, 20, 5);
            const pg2 = ctx.createLinearGradient(0, -34, 0, -14);
            pg2.addColorStop(0, '#e2e8f0'); pg2.addColorStop(.5, '#94a3b8'); pg2.addColorStop(1, '#475569');
            ctx.fillStyle = pg2; ctx.fill(); ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.5; ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-6, -14); ctx.lineTo(6, -14); ctx.lineTo(0, -2); ctx.closePath();
            ctx.fillStyle = '#cbd5e1'; ctx.fill(); ctx.strokeStyle = '#334155'; ctx.lineWidth = 1; ctx.stroke();
            rr(-4, -2, 8, 24, 3);
            const sg2 = ctx.createLinearGradient(-4, 0, 4, 0);
            sg2.addColorStop(0, '#cbd5e1'); sg2.addColorStop(.5, '#64748b'); sg2.addColorStop(1, '#334155');
            ctx.fillStyle = sg2; ctx.fill();
            rr(-9, 20, 18, 30, 7);
            const hg2 = ctx.createLinearGradient(0, 20, 0, 50);
            hg2.addColorStop(0, '#facc15'); hg2.addColorStop(.6, '#ca8a04'); hg2.addColorStop(1, '#854d0e');
            ctx.fillStyle = hg2; ctx.fill(); ctx.strokeStyle = '#713f12'; ctx.lineWidth = 1.5; ctx.stroke();
            break;
        }
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
            /* Ikon panel ALAT: satu sarung tangan kerja jaringan oranye
               keselamatan, tampak punggung, jari ke atas, ibu jari di kiri.
               Siluet & gaya sengaja memakai pelukis yang sama dengan sprite
               area kerja (ncPaintGlove + ncGloveCuff) supaya konsisten; di
               sini detailnya diringkas (lite) agar tetap jelas saat dipakai
               sebagai ikon kartu berukuran kecil.                         */
            ctx.save();
            ctx.scale(.86, .86); ctx.translate(0, 8);
            ncPaintGlove(.12, true);
            ncGloveCuff(true);
            ctx.restore();
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

/* ---------- alat mekanis dengan animasi (Level 2, 3 & 4) ----------
   Menggambar alat dengan bagian yang bergerak sesuai state permainan:
   gagang tang crimping menutup saat sq naik, bilah punch-down menekan
   saat press naik. Dipanggil dari animasi crimping dan terminasi
   yang dijalankan mesin game — bukan dekorasi. */
function drawCrimpTool(x, y, s, sq, rot) {
    const lp = (a, b, t) => a + (b - a) * t;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.scale(s, s);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const spread = lp(.46, .17, sq);        // sudut buka gagang
    const jaw = lp(.30, .03, sq);           // sudut tutup rahang
    for (let side = -1; side <= 1; side += 2) {          // gagang
        const a = side * spread;
        const sx = Math.sin(a), cy = Math.cos(a);
        ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(sx * 56, 2 + cy * 56);
        ctx.lineWidth = 8; ctx.strokeStyle = '#8d99ae'; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(sx * 16, 2 + cy * 16); ctx.lineTo(sx * 56, 2 + cy * 56);
        ctx.lineWidth = 12; ctx.strokeStyle = '#b91c1c'; ctx.stroke();
        ctx.strokeStyle = 'rgba(127,29,29,.8)'; ctx.lineWidth = 1.5;
        for (let r = 0; r < 3; r++) {                     // rusuk pegangan
            const t = .5 + r * .16;
            const cxp = sx * (16 + 40 * t), cyp = 2 + cy * (16 + 40 * t);
            ctx.beginPath();
            ctx.moveTo(cxp - cy * 5.5, cyp + sx * 5.5);
            ctx.lineTo(cxp + cy * 5.5, cyp - sx * 5.5);
            ctx.stroke();
        }
        ctx.beginPath(); ctx.arc(sx * 56, 2 + cy * 56, 4, 0, 6.3);
        ctx.fillStyle = '#7f1d1d'; ctx.fill();            // ujung pegangan
    }
    ctx.beginPath(); ctx.arc(0, 2, 7, 0, 6.3);            // engsel (pivot)
    ctx.fillStyle = '#cbd5e1'; ctx.fill();
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 2, 2.5, 0, 6.3); ctx.fillStyle = '#475569'; ctx.fill();
    rr(-14, -58, 28, 26, 6);                              // kepala alat
    const hg = ctx.createLinearGradient(0, -58, 0, -32);
    hg.addColorStop(0, '#e2e8f0'); hg.addColorStop(.5, '#94a3b8'); hg.addColorStop(1, '#475569');
    ctx.fillStyle = hg; ctx.fill();
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 2; ctx.stroke();
    txt('CRIMP', 0, -43, { s: 7, a: 'center', c: '#1e293b', w: 800 });
    for (let side = -1; side <= 1; side += 2) {           // rahang crimp
        const a = side * jaw;
        const sx = Math.sin(a), cy = Math.cos(a);
        ctx.beginPath(); ctx.moveTo(side * 2, -32); ctx.lineTo(sx * 26 + side * 2, -32 + cy * 26);
        ctx.lineWidth = 9; ctx.strokeStyle = '#64748b'; ctx.stroke();
        ctx.strokeStyle = '#334155'; ctx.lineWidth = 2;
        for (let t = .35; t <= 1; t += .3) {              // gigi rahang
            const tx = sx * 26 * t + side * 2, ty = -32 + cy * 26 * t;
            ctx.beginPath();
            ctx.moveTo(tx - cy * 4.5, ty - sx * 4.5);
            ctx.lineTo(tx + cy * 4.5, ty + sx * 4.5);
            ctx.stroke();
        }
    }
    ctx.restore();
}
function drawPunchTool(x, y, s, press) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const dip = press * 8;                                 // kepala menekan ke bawah
    ctx.save(); ctx.translate(0, dip);
    rr(-13, -56, 26, 24, 5);                              // kepala logam
    const hg = ctx.createLinearGradient(0, -56, 0, -32);
    hg.addColorStop(0, '#e2e8f0'); hg.addColorStop(.5, '#94a3b8'); hg.addColorStop(1, '#475569');
    ctx.fillStyle = hg; ctx.fill();
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-7, -32); ctx.lineTo(7, -32); ctx.lineTo(0, -18); ctx.closePath();
    ctx.fillStyle = '#cbd5e1'; ctx.fill();                // bilah potong
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
    rr(-5, -20, 10, 36, 4);                               // batang logam
    const sg = ctx.createLinearGradient(-5, 0, 5, 0);
    sg.addColorStop(0, '#cbd5e1'); sg.addColorStop(.5, '#64748b'); sg.addColorStop(1, '#334155');
    ctx.fillStyle = sg; ctx.fill();
    ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1.5; ctx.stroke();
    rr(-11, 14, 22, 44, 9);                               // pegangan
    const pg = ctx.createLinearGradient(0, 14, 0, 58);
    pg.addColorStop(0, '#facc15'); pg.addColorStop(.6, '#ca8a04'); pg.addColorStop(1, '#854d0e');
    ctx.fillStyle = pg; ctx.fill();
    ctx.strokeStyle = '#713f12'; ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = 'rgba(113,63,18,.55)'; ctx.lineWidth = 1.5;
    for (let r = 0; r < 4; r++) {                         // rusuk pegangan
        ctx.beginPath(); ctx.moveTo(-8.5, 24 + r * 9); ctx.lineTo(8.5, 24 + r * 9); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,.32)'; rr(-8, 17, 5, 36, 3); ctx.fill();
    ctx.restore();
}

/* ==========================================================================
   TANGAN KERJA + SARUNG TANGAN KERJA JARINGAN  (dipakai Level 2 & Level 3)
   --------------------------------------------------------------------------
   Satu desain untuk kedua level supaya tampilannya tidak berbeda. Sarung
   bergaya "full finger safety glove" teknisi jaringan: kain oranye
   keselamatan (#F59E0B), coating grip abu-gelap di ujung jari/telapak,
   panel pelindung ringan di punggung tangan, dan manset elastis.

     ncPaintGlove(flex, lite)   -> satu tangan bersarung penuh (dipakai
                                   ikon panel kecil maupun sprite besar)
     ncGloveCuff(lite)          -> manset elastis oranye
     ncPaintHand(flex, ...)     -> tangan telanjang (sebelum bersarung)

     drawWorkHand(x, y, s, rot, cover, flex)
       - tampak PUNGGUNG tangan, jari mengarah ke ATAS (-y),
         titik asal (x, y) = pergelangan tangan.
       - cover = 0  -> tangan masih telanjang (tangan terbuka)
       - cover = 1  -> seluruh tangan sudah bersarung
         Nilai di antaranya memperlihatkan sarung yang sedang ditarik masuk
         (mulai dari ujung jari, manset bergerak turun ke pergelangan).
       - flex = 0..1 -> jari menggenggam (memakai sarung = mudah bergerak).
     drawHandGrip(x, y, s, rot, hold)
       - tangan bersarung dalam POSISI SIAP MENGGENGGAM; `hold` boleh null,
         'cable' (memegang kabel UTP) atau 'crimp' (memegang tang crimping).
     drawGloveProp(x, y, s, rot, lift)
       - sarung tangan terlipat yang tergeletak di meja (aset cadangan).

   Catatan: semua fungsi murni menggambar sesuai argumen; tidak menyimpan
   state, tidak memakai setTimeout / requestAnimationFrame baru. Mesin
   animasi level yang menggerakkannya lewat lv.anim + performance.now().
   ========================================================================== */
function ncLerp(a, b, t) { return a + (b - a) * t; }
/* Separuh lebar siluet tangan pada tinggi lokal y (ujung jari -56, pergelangan +30) */
function ncHandHalfW(y) {
    const T = [[-56, 25], [-40, 28], [-10, 24], [12, 20], [30, 16]];
    if (y <= T[0][0]) return T[0][1];
    for (let i = 0; i < T.length - 1; i++) {
        const a = T[i], b = T[i + 1];
        if (y <= b[0]) return ncLerp(a[1], b[1], (y - a[0]) / (b[0] - a[0]));
    }
    return T[T.length - 1][1];
}
function ncHandFingers(flex) {
    const c = (flex || 0) * 6;
    return [
        { x: -13, w: 11.5, len: 46 - c },     // telunjuk
        { x: -1.5, w: 12, len: 52 - c },      // tengah
        { x: 10.5, w: 11.5, len: 47 - c },    // manis
        { x: 22, w: 10, len: 37 - c * .8 }    // kelingking
    ];
}
/* Siluet dasar: ibu jari, 4 jari, lalu punggung tangan (paling atas). */
function ncPaintHand(flex, fill, stroke, lw) {
    const F = ncHandFingers(flex);
    const put = () => { ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); };
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.save(); ctx.translate(-21, 2); ctx.rotate(-.52);
    rr(-15, -9, 15, 31, 7); put();
    ctx.restore();
    F.forEach(f => { rr(f.x, -f.len - 4, f.w, f.len + 14, Math.min(f.w, 12) / 2); put(); });
    rr(-23, -20, 46, 48, 13); put();
    ctx.restore();
}
/* Lapisan sarung oranye "full finger safety glove" pada satu tangan
   (tampak punggung, jari ke atas, ibu jari di kiri).
     - 4 jari + ibu jari dengan coating karet grip di ujungnya
     - punggung tangan kain oranye + cahaya lembut dari atas
     - panel pelindung ringan (TPR) dengan 3 ruas busa + jahitan
     - tekstur grip halus, garis jahitan, dan lipatan buku jari
   `lite` = true untuk ikon kartu kecil (detail diringkas).               */
function ncPaintGlove(flex, lite) {
    const G = GLOVE_PALETTE, F = ncHandFingers(flex), f = clamp(flex || 0, 0, 1);
    const body = ctx.createLinearGradient(0, -58, 0, 34);
    body.addColorStop(0, G.knitHi); body.addColorStop(.42, G.knit0); body.addColorStop(1, G.knit1);
    const coat = ctx.createLinearGradient(0, -58, 0, -14);
    coat.addColorStop(0, G.coatHi); coat.addColorStop(1, G.coat0);
    const lw = lite ? 1.4 : 1.9;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    /* --- 4 jari: telunjuk, tengah, manis, kelingking --- */
    F.forEach(function (ft) {
        const top = -ft.len - 4, h = ft.len + 14, w = ft.w, r = w * .46;
        rr(ft.x, top, w, h, r);
        ctx.fillStyle = body; ctx.fill();
        ctx.strokeStyle = G.knitLn; ctx.lineWidth = lw; ctx.stroke();
        /* coating karet grip di ujung jari (sedikit turun saat menggenggam) */
        const capH = Math.max(7, (ft.len - 16) * (.26 + f * .12));   // coating ujung jari (makin menggenggam: menutup)
        ctx.save(); rr(ft.x, top, w, h, r); ctx.clip();
        rr(ft.x - 1, top - 2, w + 2, capH, r); ctx.fillStyle = coat; ctx.fill();
        ctx.fillStyle = 'rgba(226,232,240,.16)';                 // tekstur grip halus
        for (let ty = top + 3; ty < top + capH - 2; ty += 3.4)
            for (let tx = ft.x + 2; tx < ft.x + w - 1.5; tx += 3.4)
                ctx.fillRect(tx, ty, 1.4, 1.4);
        ctx.restore();
        ctx.strokeStyle = 'rgba(15,23,42,.55)'; ctx.lineWidth = 1; // batas coating
        ctx.beginPath(); ctx.moveTo(ft.x + 1, top + capH); ctx.lineTo(ft.x + w - 1, top + capH); ctx.stroke();
        if (!lite) {                                               // jahitan tengah jari
            ctx.strokeStyle = G.seam; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(ft.x + w / 2, top + capH + 2); ctx.lineTo(ft.x + w / 2, top + h - 6); ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(124,45,18,.55)'; ctx.lineWidth = 1.1;   // lipatan buku jari
        ctx.beginPath(); ctx.moveTo(ft.x + 1.5, -ft.len * .40); ctx.lineTo(ft.x + w - 1.5, -ft.len * .40); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.22)';                       // cahaya kiri-atas jari
        rr(ft.x + 1.6, top + capH + 2, w * .30, h - capH - 6, w * .16); ctx.fill();
    });

    /* --- ibu jari (kiri); makin menggenggam makin menutup ke dalam --- */
    ctx.save(); ctx.translate(-21, 2); ctx.rotate(-.52 - f * .40);
    rr(-15, -9, 15, 31, 7);
    ctx.fillStyle = body; ctx.fill();
    ctx.strokeStyle = G.knitLn; ctx.lineWidth = lw; ctx.stroke();
    rr(-12.6, -6.8, 11.4, 11, 5); ctx.fillStyle = coat; ctx.fill();
    if (!lite) {
        ctx.strokeStyle = 'rgba(15,23,42,.5)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(-13, 4.2); ctx.lineTo(-.6, 4.2); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,.20)'; rr(-13.6, -7.4, 4, 13, 2); ctx.fill();
    ctx.restore();

    /* --- punggung tangan --- */
    rr(-23, -20, 46, 48, 13);
    ctx.fillStyle = body; ctx.fill();
    ctx.strokeStyle = G.knitLn; ctx.lineWidth = lw + .2; ctx.stroke();

    /* cahaya lembut dari atas + bayangan kanan: memberi volume */
    ctx.save(); rr(-23, -20, 46, 48, 13); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,.24)'; rr(-21, -17, 15, 32, 8); ctx.fill();
    ctx.fillStyle = 'rgba(90,28,4,.22)'; rr(5, -17, 18, 42, 9); ctx.fill();
    ctx.restore();

    /* --- panel pelindung ringan (TPR) di punggung tangan --- */
    const panel = ctx.createLinearGradient(0, -17, 0, 7);
    panel.addColorStop(0, G.panelHi); panel.addColorStop(1, G.panel0);
    rr(-13, -17, 26, 24, 8);
    ctx.fillStyle = panel; ctx.fill();
    ctx.strokeStyle = G.panelLn; ctx.lineWidth = lite ? 1.1 : 1.5; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.13)';                    // 3 ruas busa pelindung
    for (let k = 0; k < 3; k++) { rr(-10, -13 + k * 7.5, 20, 5.2, 2.6); ctx.fill(); }
    if (!lite) {                                                // jahitan keliling panel
        ctx.setLineDash([3, 3]); ctx.strokeStyle = G.seam; ctx.lineWidth = 1;
        rr(-13, -17, 26, 24, 8); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.fillStyle = 'rgba(255,255,255,.18)'; rr(-10, -14, 9, 7, 3); ctx.fill();
    ctx.restore();
}
/* Manset elastis oranye dengan trim gelap + ribbing (kain -> manset).
   Dipakai ikon panel & sprite; pada drawWorkHand manset digambar sendiri
   agar bisa bergerak mengikuti tepi sarung yang sedang ditarik. */
function ncGloveCuff(lite) {
    const G = GLOVE_PALETTE;
    const cg = ctx.createLinearGradient(0, 20, 0, 44);
    cg.addColorStop(0, G.cuffHi); cg.addColorStop(.55, G.cuff0); cg.addColorStop(1, G.cuff1);
    rr(-22, 20, 44, 22, 8);
    ctx.fillStyle = cg; ctx.fill();
    ctx.strokeStyle = G.cuffLn; ctx.lineWidth = lite ? 1.4 : 1.8; ctx.stroke();
    ctx.save(); rr(-22, 20, 44, 22, 8); ctx.clip();
    ctx.fillStyle = 'rgba(15,23,42,.72)'; rr(-22, 20, 44, 4.5, 3); ctx.fill();   // trim gelap tepi kain
    ctx.strokeStyle = 'rgba(124,45,18,.55)'; ctx.lineWidth = 1.2;
    for (let i = 0; i < 5; i++) { const x = -16 + i * 8; ctx.beginPath(); ctx.moveTo(x, 26); ctx.lineTo(x, 41); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,247,224,.5)'; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(-17, 25.5); ctx.lineTo(17, 25.5); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = G.coat0; rr(16, 24, 7, 13, 3); ctx.fill();                   // tab gantung kecil
}
function drawWorkHand(x, y, s, rot, cover, flex) {
    const G = GLOVE_PALETTE;
    const gl = clamp(cover == null ? 1 : cover, 0, 1);
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot || 0); ctx.scale(s || 1, s || 1);
    // 1) Tangan telanjang selalu digambar (terlihat di bawah sarung saat dipasang)
    ncPaintHand(flex, G.skin0, G.skinLn, 2);
    ctx.fillStyle = 'rgba(255,255,255,.15)'; rr(-19, -17, 14, 28, 6); ctx.fill();
    if (gl > 0) {
        // 2) Sarung oranye digambar bertahap: clip dari ujung jari ke pergelangan
        const edge = ncLerp(-58, 28, gl);
        ctx.save();
        ctx.beginPath(); ctx.rect(-40, -95, 80, edge + 95); ctx.clip();
        ncPaintGlove(flex, false);
        ctx.restore();
        // 3) Manset elastis tepat di garis tepi sarung (terlihat ditarik masuk)
        const hw = ncHandHalfW(edge) + 4;
        const cg = ctx.createLinearGradient(0, edge - 6, 0, edge + 9);
        cg.addColorStop(0, G.cuffHi); cg.addColorStop(.5, G.cuff0); cg.addColorStop(1, G.cuff1);
        rr(-hw, edge - 6, hw * 2, 15, 6);
        ctx.fillStyle = cg; ctx.fill();
        ctx.strokeStyle = G.cuffLn; ctx.lineWidth = 1.6; ctx.stroke();
        ctx.strokeStyle = 'rgba(124,45,18,.5)'; ctx.lineWidth = 1.2;
        for (let i = -2; i <= 2; i++) { const cx2 = i * (hw / 2.6); ctx.beginPath(); ctx.moveTo(cx2, edge - 3); ctx.lineTo(cx2, edge + 8); ctx.stroke(); }
        ctx.strokeStyle = 'rgba(15,23,42,.6)'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(-hw + 1, edge - 6); ctx.lineTo(hw - 1, edge - 6); ctx.stroke();
        // 4) Bayangan lembut dari tepi sarung ke kulit (kesan bahan menutup)
        ctx.save();
        rr(-hw, edge + 9, hw * 2, 11, 5); ctx.clip();
        const sg = ctx.createLinearGradient(0, edge + 9, 0, edge + 20);
        sg.addColorStop(0, 'rgba(0,0,0,.30)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = sg; ctx.fillRect(-hw, edge + 9, hw * 2, 11);
        ctx.restore();
    }
    ctx.restore();
}
/* Tangan bersarung dalam POSISI SIAP MENGGENGGAM (memegang kabel / tang
   crimping). Pola argumen sama dengan drawWorkHand supaya gampang
   dianimasikan: transisi "tangan terbuka -> menggenggam" cukup dengan
   mengubah `flex` pada drawWorkHand; fungsi ini adalah pose akhir siap
   kerja. `hold` opsional:
     null    -> hanya pose menggenggam (tangan kosong)
     'cable' -> menggenggam sepotong kabel UTP
     'crimp' -> menggenggam tang crimping                               */
function drawHandGrip(x, y, s, rot, hold) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot || 0); ctx.scale(s || 1, s || 1);
    if (hold === 'cable') {                                // kabel dijepit di belakang tangan
        const cg = ctx.createLinearGradient(0, 2, 0, 26);
        cg.addColorStop(0, '#8ea2b8'); cg.addColorStop(1, '#5b6f88');
        rr(-30, 2, 60, 24, 9); ctx.fillStyle = cg; ctx.fill();
        ctx.strokeStyle = '#3f4f63'; ctx.lineWidth = 2; ctx.stroke();
        ['#e2e8f0', '#f97316', '#22c55e', '#3b82f6'].forEach(function (c, i) {
            ctx.fillStyle = c; rr(-24 + i * 13, 8, 9, 5, 2); ctx.fill();
        });
    }
    drawWorkHand(0, 0, 1, 0, 1, .72);                      // tangan bersarung menggenggam
    if (hold === 'crimp') drawSprite('crimp', 0, 16, 150, .1);
    ctx.restore();
}
function drawGloveProp(x, y, s, rot, lift) {
    const lf = clamp(lift || 0, 0, 1);
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot || 0); ctx.scale(s || 1, s || 1);
    if (lf < .98) {                                        // bayangan saat masih di meja
        ctx.save(); ctx.globalAlpha = .32 * (1 - lf);
        ctx.beginPath(); ctx.ellipse(2, 34, 30, 9, 0, 0, 6.3);
        ctx.fillStyle = '#040b14'; ctx.fill();
        ctx.restore();
    }
    ncPaintGlove(.22);                                     // jari sedikit menggulung: terlihat kosong
    const G = GLOVE_PALETTE;
    const cg = ctx.createLinearGradient(0, 28, 0, 46);
    cg.addColorStop(0, G.cuffHi); cg.addColorStop(.5, G.cuff0); cg.addColorStop(1, G.cuff1);
    rr(-20, 28, 40, 18, 7);
    ctx.fillStyle = cg; ctx.fill();
    ctx.strokeStyle = G.cuffLn; ctx.lineWidth = 1.8; ctx.stroke();
    rr(-14, 31, 28, 11, 5);                                // bukaan manset (gelap: kosong)
    ctx.fillStyle = 'rgba(6,12,20,.82)'; ctx.fill();
    ctx.restore();
}
