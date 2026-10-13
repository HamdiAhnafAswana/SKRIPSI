// ==========================================================================
// core/09-tool-icons.js
// Diambil dari backup/netcrimp2.ORI.html baris 203-362. File ini digabung otomatis oleh build.mjs
// ke index.html -- JANGAN diedit langsung di index.html.
// ==========================================================================

/* ---------- palet sarung tangan kerja (oranye keselamatan) --------------
   Dipakai bersama oleh IKON panel kecil (case 'sarung_tangan' ->
   ncDrawGloveIcon) dan oleh SPRITE ANIMASI di area kerja (drawWorkHand /
   drawHandGrip / drawGloveProp). Keduanya sengaja DIPISAH: ikon = gambar
   kecil yang mudah dikenali pada panel ALAT; sprite = TANGAN MANUSIA
   normal (lima jari proporsional, tanpa panel armor / bagian mekanis).
   Sarung: kain oranye keselamatan (#F59E0B), grip karet abu-gelap di ujung
   jari/telapak, dan manset kain elastis.
     skin*  : kulit tangan telanjang (terlihat sebelum sarung terpasang)
     knit*  : kain sarung oranye keselamatan (#F59E0B) + highlight/shadow
     coat*  : lapisan karet grip abu-gelap (anti-slip) pada jari & telapak
     panel* : panel pelindung ringan (TPR) — cadangan, tidak dipakai lagi
              agar tangan tidak terlihat seperti robot
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
            /* IKON panel ALAT (bukan sprite animasi): satu sarung tangan kerja
               oranye keselamatan, tampak TELAPAK dengan sedikit putaran 3/4,
               jari melengkung santai. Digambar oleh ncDrawGloveIcon() dan
               sengaja dipisah dari sprite animasi tangan (drawWorkHand). */
            ncDrawGloveIcon(0);
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
   TANGAN MANUSIA + SARUNG TANGAN KERJA JARINGAN  (dipakai Level 2 & Level 3)
   --------------------------------------------------------------------------
   Sprite ANIMASI area kerja. Tangan digambar ORGANIK seperti tangan manusia
   sungguhan (siluet telapak + 5 jari mengecil dengan ujung membulat, bukan
   kotak/tabung berpelat) supaya TIDAK terlihat seperti tangan robot / armor.
   Sarung = "full finger safety glove" teknisi jaringan: kain oranye
   keselamatan (#F59E0B), grip karet abu-gelap di ujung jari, manset elastis.
   (Ikon panel kecil memakai ncDrawGloveIcon() yang terpisah.)

     ncPaintGlove(flex, lite)   -> satu tangan bersarung penuh
     ncGloveCuff(lite)          -> manset elastis oranye (aset cadangan)
     ncPaintHand(flex, ...)     -> tangan telanjang (sebelum bersarung)

     drawWorkHand(x, y, s, rot, cover, flex, slide)
       - tampak PUNGGUNG tangan, jari mengarah ke ATAS (-y),
         titik asal (x, y) = pergelangan tangan.
       - cover = 0  -> tangan masih telanjang (tangan terbuka)
       - cover = 1  -> seluruh tangan sudah bersarung
         Nilai di antaranya: sarung sedang ditarik menutupi tangan (mulai
         dari ujung jari, manset bergerak turun ke pergelangan).
       - flex = 0..1 -> jari menggenggam (memakai sarung = mudah bergerak).
       - slide (px)  -> menggeser SARUNG dari samping (tahap "sarung muncul
         dari samping" lalu "tangan masuk ke sarung"); 0 = sudah pas.
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
/* -- Geometri tangan ANIMASI (tampak punggung, jari ke atas, origin di
      pergelangan). Tiap jari = garis tengah kuadratik (b→c→t) + lebar
      pangkal/ujung; ujung membulat. `flex` (0..1) membuat jari menggenggam
      (ujung turun & sedikit menutup). Ini yang membuat tangan terlihat
      manusia, bukan tabung/robot. ------------------------------------------ */
function ncAnimFingers(flex) {
    const c = clamp(flex || 0, 0, 1);
    return [
        { bx: -14.5, by: 5, cx: -17 - c * 3, cy: -20 + c * 5, tx: -18 - c * 3, ty: -47 + c * 13, wb: 13.0, wt: 9.4 }, // telunjuk
        { bx:  -2.5, by: 4, cx:  -3 - c * 2, cy: -26 + c * 5, tx:  -3 - c * 2, ty: -56 + c * 15, wb: 13.6, wt: 9.8 }, // tengah
        { bx:   9.5, by: 4, cx:  12 - c,     cy: -22 + c * 5, tx:  13 - c * 2, ty: -50 + c * 14, wb: 13.0, wt: 9.4 }, // manis
        { bx:  20.5, by: 7, cx:  24 + c,     cy: -16 + c * 4, tx:  25 + c,     ty: -39 + c * 12, wb: 11.4, wt: 8.2 }  // kelingking
    ];
}
function ncAnimThumb(flex) {
    const c = clamp(flex || 0, 0, 1);
    return { bx: -19, by: 10, cx: -32 + c * 6, cy: 2 + c * 6, tx: -34 + c * 9, ty: -14 + c * 10, wb: 14.5, wt: 10.5 };
}
const ncAnimQx = (f, t) => { const u = 1 - t; return u * u * f.bx + 2 * u * t * f.cx + t * t * f.tx; };
const ncAnimQy = (f, t) => { const u = 1 - t; return u * u * f.by + 2 * u * t * f.cy + t * t * f.ty; };
const ncAnimQw = (f, t) => (f.wb + (f.wt - f.wb) * t) * .5;              // setengah lebar jari
const ncAnimQd = (f, t) => {                                            // arah tangen ternormalisasi
    const u = 1 - t;
    const dx = 2 * u * (f.cx - f.bx) + 2 * t * (f.tx - f.cx);
    const dy = 2 * u * (f.cy - f.by) + 2 * t * (f.ty - f.cy);
    const dl = Math.hypot(dx, dy) || 1; return { x: dx / dl, y: dy / dl };
};
/* Satu jari sebagai sub-path tertutup: sisi kiri naik -> ujung membulat
   (busur setengah lingkaran) -> sisi kanan turun. Menyempit ke ujung. */
function ncAnimFingerPath(f) {
    const N = 14, L = [], R = [];
    for (let i = 0; i <= N; i++) {
        const t = i / N, w = ncAnimQw(f, t), d = ncAnimQd(f, t), x = ncAnimQx(f, t), y = ncAnimQy(f, t);
        L.push([x - d.y * w, y + d.x * w]);
        R.push([x + d.y * w, y - d.x * w]);
    }
    const r = ncAnimQw(f, 1), dt = ncAnimQd(f, 1);
    const aL = Math.atan2(L[N][1] - f.ty, L[N][0] - f.tx), aT = Math.atan2(dt.y, dt.x);
    let dd = aT - aL; while (dd > Math.PI) dd -= 2 * Math.PI; while (dd < -Math.PI) dd += 2 * Math.PI;
    const dir = dd < 0 ? -1 : 1;
    ctx.moveTo(L[0][0], L[0][1]);
    for (let i = 1; i <= N; i++) ctx.lineTo(L[i][0], L[i][1]);
    for (let k = 1; k <= 8; k++) { const a = aL + dir * Math.PI * k / 8; ctx.lineTo(f.tx + Math.cos(a) * r, f.ty + Math.sin(a) * r); }
    for (let i = N - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]);
    ctx.closePath();
}
/* Telapak: siluet organik membulat (lebar di buku jari, mengecil ke
   pergelangan) — bukan persegi panjang. */
function ncAnimPalmPath() {
    ctx.moveTo(-25, -10);
    ctx.bezierCurveTo(-29, 6, -27, 22, -17, 30);
    ctx.bezierCurveTo(-6, 36, 8, 36, 18, 29);
    ctx.bezierCurveTo(26, 21, 28, 4, 24, -11);
    ctx.bezierCurveTo(8, -17, -9, -17, -25, -10);
    ctx.closePath();
}
/* Daftar bentuk (telapak + 4 jari + ibu jari) supaya bisa digambar
   berurutan beberapa kali tanpa menggabung path jadi satu. */
function ncAnimShapes(flex) {
    const F = ncAnimFingers(flex), TH = ncAnimThumb(flex), s = [ncAnimPalmPath];
    F.forEach(f => s.push(() => ncAnimFingerPath(f)));
    s.push(() => ncAnimFingerPath(TH));
    return s;
}
function ncAnimEach(shapes, fn) { shapes.forEach(add => { ctx.beginPath(); add(); fn(); }); }
function ncAnimClip(shapes) { ctx.beginPath(); shapes.forEach(add => add()); ctx.clip(); }
/* Tangan TELANJANG (organik). Dua langkah: (1) garis tepi tipis + siluet
   dilebarkan sedikit, (2) isi warna kulit lalu bayangan volume. Tepi dalam
   yang tumpang-tindih tertutup langkah (2) sehingga siluet bersih. */
function ncPaintHand(flex, fill, stroke, lw) {
    const shapes = ncAnimShapes(flex);
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = stroke; ctx.fillStyle = stroke; ctx.lineWidth = lw;
    ncAnimEach(shapes, () => { ctx.stroke(); ctx.fill(); });
    ncAnimEach(shapes, () => { ctx.fillStyle = fill; ctx.fill(); });
    ctx.save(); ncAnimClip(shapes);
    const hl = ctx.createLinearGradient(-30, -50, 10, 30);
    hl.addColorStop(0, 'rgba(255,255,255,.30)');
    hl.addColorStop(.5, 'rgba(255,255,255,.06)');
    hl.addColorStop(1, 'rgba(120,70,30,0)');
    ctx.fillStyle = hl; ctx.fillRect(-40, -70, 90, 120);
    const sd = ctx.createLinearGradient(8, -40, 30, 34);
    sd.addColorStop(0, 'rgba(120,70,30,0)'); sd.addColorStop(1, 'rgba(120,70,30,.24)');
    ctx.fillStyle = sd; ctx.fillRect(6, -60, 34, 100);
    ctx.restore();
    ctx.restore();
}
/* Sarung oranye (organik) pada tangan tampak punggung, jari ke atas,
   ibu jari di kiri. Tangan MANUSIA + kain oranye + grip karet di ujung
   jari + jahitan. TANPA panel armor / ruas mekanis, supaya tidak terlihat
   seperti robot. `lite` = true untuk gambar kecil (detail diringkas). */
function ncPaintGlove(flex, lite) {
    const G = GLOVE_PALETTE;
    const shapes = ncAnimShapes(flex);
    const body = ctx.createLinearGradient(0, -58, 0, 34);
    body.addColorStop(0, G.knitHi); body.addColorStop(.42, G.knit0); body.addColorStop(1, G.knit1);
    const coatTip = ctx.createLinearGradient(0, -58, 0, -18);
    coatTip.addColorStop(0, G.coatHi); coatTip.addColorStop(1, G.coat0);
    const coatKnuck = ctx.createLinearGradient(0, -18, 0, 2);
    coatKnuck.addColorStop(0, G.coatHi); coatKnuck.addColorStop(1, G.coat0);
    const lw = lite ? 1.4 : 1.9;

    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    /* 1) garis tepi tipis + siluet dilebarkan sedikit (lewat stroke) */
    ctx.strokeStyle = G.knitLn; ctx.fillStyle = G.knitLn; ctx.lineWidth = lw;
    ncAnimEach(shapes, () => { ctx.stroke(); ctx.fill(); });
    /* 2) isi kain oranye (gradien koordinat — tetap sealur antar bentuk) */
    ncAnimEach(shapes, () => { ctx.fillStyle = body; ctx.fill(); });

    /* 3) grip karet abu-gelap di UJUNG JARI (mengikuti bentuk tiap jari) */
    ncAnimFingers(flex).concat([ncAnimThumb(flex)]).forEach(f => {
        const ax = ncAnimQx(f, .72), ay = ncAnimQy(f, .72), padW = f.wt + f.wb * .16 + 1.2;
        ctx.save();
        ctx.beginPath(); ncAnimFingerPath(f); ctx.clip();
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(f.tx, f.ty);
        ctx.lineWidth = padW + 1.6; ctx.strokeStyle = 'rgba(15,23,42,.5)'; ctx.stroke();
        ctx.lineWidth = padW; ctx.strokeStyle = coatTip; ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = padW * .34;
        ctx.beginPath(); ctx.moveTo(ax - 1.6, ay); ctx.lineTo(f.tx - 1.6, f.ty); ctx.stroke();
        const y0 = Math.min(ay, f.ty) + 3;
        ncGloveDots(f.tx - f.wt * .8, y0, f.wt * 1.6, Math.abs(f.ty - ay) - 6, 3.0, 1.1, 'rgba(226,232,240,.22)');
        ctx.restore();
    });

    /* 4) bantalan karet lembut di buku jari (mengikuti lengkung pangkal
       jari — bukan lempeng kaku) */
    if (!lite) {
        ctx.save(); ncAnimClip(shapes);
        ctx.beginPath(); ctx.moveTo(-19, -5); ctx.quadraticCurveTo(2, -14, 24, -3);
        ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(15,23,42,.40)'; ctx.stroke();
        ctx.lineWidth = 6; ctx.strokeStyle = coatKnuck; ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(-17, -7); ctx.quadraticCurveTo(2, -16, 22, -5); ctx.stroke();
        ctx.restore();
    }

    /* 5) volume: cahaya kiri-atas, bayangan kanan-bawah, gelap antar jari */
    ctx.save(); ncAnimClip(shapes);
    const hl = ctx.createLinearGradient(-30, -48, 8, 32);
    hl.addColorStop(0, 'rgba(255,255,255,.34)');
    hl.addColorStop(.42, 'rgba(255,255,255,.10)');
    hl.addColorStop(.72, 'rgba(255,255,255,0)');
    hl.addColorStop(1, 'rgba(120,53,15,.16)');
    ctx.fillStyle = hl; ctx.fillRect(-42, -70, 90, 128);
    const sd = ctx.createLinearGradient(6, -40, 32, 34);
    sd.addColorStop(0, 'rgba(124,45,18,0)'); sd.addColorStop(1, 'rgba(124,45,18,.30)');
    ctx.fillStyle = sd; ctx.fillRect(2, -62, 36, 104);
    const cv = ctx.createLinearGradient(0, -34, 0, 8);
    cv.addColorStop(0, 'rgba(90,28,4,0)'); cv.addColorStop(1, 'rgba(90,28,4,.20)');
    ctx.fillStyle = cv; ctx.fillRect(-32, -42, 64, 50);
    ctx.restore();

    /* 6) jahitan + lipatan kain; gelap halus di celah antar jari */
    if (!lite) {
        ctx.save(); ctx.setLineDash([3, 3]); ctx.strokeStyle = G.seam; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(-22, -3); ctx.quadraticCurveTo(0, -11, 23, -2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-14, 10); ctx.quadraticCurveTo(0, 6, 14, 10); ctx.stroke();
        ctx.restore();
    }
    ctx.save(); ctx.strokeStyle = 'rgba(90,28,4,.35)'; ctx.lineWidth = 1.4;
    const F = ncAnimFingers(flex);
    for (let i = 0; i < F.length - 1; i++) {
        const a = F[i], b = F[i + 1];
        const mx = (ncAnimQx(a, .14) + ncAnimQx(b, .14)) / 2, my = (ncAnimQy(a, .14) + ncAnimQy(b, .14)) / 2;
        ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx + mx * .04, my + 9); ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
}
/* Manset elastis oranye dengan trim gelap + ribbing (kain -> manset).
   Aset cadangan; pada drawWorkHand manset digambar sendiri agar bisa
   bergerak mengikuti tepi sarung yang sedang ditarik. */
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

/* ---------- IKON SARUNG TANGAN TEKNISI (vektor semi-realistis) ------------
   Satu sarung tangan kerja oranye keselamatan (#F59E0B) dilihat dari sisi
   TELAPAK dengan sedikit putaran 3/4. Dirancang agar terlihat seperti sarung
   tangan KAIN yang dipakai manusia (teknisi jaringan), BUKAN tangan robot:
     - siluet tangan alami: telapak lentur + 5 jari yang mengecil ke ujung
       dan melengkung santai (bukan tabung/kaku bersegmen)
     - lapisan karet grip abu-gelap di TELAPAK & UJUNG JARI yang mengikuti
       lekuk tangan (bukan lempeng/armor kaku), berpola titik anti-slip
     - jahitan tipis, cahaya lembut kiri-atas, bayangan lembut kanan-bawah
     - manset kain elastis yang menggembung di pergelangan, berkerut halus
     - `pad` = 1 menambahkan alas kotak abu-terang gaya studio (lencana menu)
   Tiap jari = garis tengah kuadratik + lebar pangkal/ujung, dibentuk jadi
   path tertutup yang menyempit dengan ujung membulat. Koordinat lokal:
   telapak di sekitar (0, 0), ujung jari ke arah -y. */
function ncGloveDots(x, y, w, h, step, s, col) {
    ctx.fillStyle = col;
    let row = 0;
    for (let yy = y; yy <= y + h; yy += step) {
        const off = (row++ % 2) ? step / 2 : 0;
        for (let xx = x + off; xx <= x + w; xx += step) ctx.fillRect(xx, yy, s, s);
    }
}
function ncDrawGloveIcon(pad) {
    const G = GLOVE_PALETTE;
    ctx.save();
    ctx.translate(6, 1); ctx.rotate(-.045);                 // sedikit putaran 3/4
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    /* --- alas kotak abu-terang (opsional): nuansa studio --- */
    if (pad) {
        const pg = ctx.createLinearGradient(0, -62, 0, 62);
        pg.addColorStop(0, '#f4f7fa'); pg.addColorStop(1, '#d8dee6');
        rr(-40, -61, 80, 124, 20); ctx.fillStyle = pg; ctx.fill();
        ctx.strokeStyle = 'rgba(148,163,184,.6)'; ctx.lineWidth = 2; ctx.stroke();
        ctx.save(); rr(-40, -61, 80, 124, 20); ctx.clip();
        ctx.fillStyle = 'rgba(255,255,255,.55)'; rr(-40, -61, 80, 42, 20); ctx.fill();
        ctx.fillStyle = 'rgba(100,116,139,.12)'; rr(-40, 30, 80, 33, 20); ctx.fill();
        ctx.restore();
    }

    /* ---------- 1) GEOMETRI TANGAN ---------- */
    // Tiap jari: garis tengah kuadratik (bx,by)->(cx,cy)->(tx,ty) + lebar
    // pangkal (wb) & ujung (wt). Posisi pangkal sedikit MASUK ke telapak agar
    // jari menyatu dengan telapak secara alami (selaput/webbing), bukan
    // menempel seperti tabung terpisah.
    const FR = [                                                     // telunjuk..kelingking
        { bx: -18, by: -4, cx: -22, cy: -30, tx: -23, ty: -49, wb: 13.0, wt: 9.5 },
        { bx: -5,  by: -5, cx: -7,  cy: -34, tx: -6,  ty: -56, wb: 13.5, wt: 10.0 },
        { bx: 7,   by: -4, cx: 9,   cy: -31, tx: 10,  ty: -52, wb: 13.0, wt: 9.5 },
        { bx: 18,  by: -3, cx: 22,  cy: -24, tx: 23,  ty: -41, wb: 11.5, wt: 8.5 }
    ];
    const TH = { bx: -20, by: 10, cx: -33, cy: 2, tx: -34, ty: -14, wb: 15.0, wt: 11.0 }; // ibu jari (kiri)

    const qx = (f, t) => { const u = 1 - t; return u * u * f.bx + 2 * u * t * f.cx + t * t * f.tx; };
    const qy = (f, t) => { const u = 1 - t; return u * u * f.by + 2 * u * t * f.cy + t * t * f.ty; };
    const qw = (f, t) => (f.wb + (f.wt - f.wb) * t) * .5;            // setengah lebar jari
    const qd = (f, t) => {                                           // arah (tangen ternormalisasi)
        const u = 1 - t;
        const dx = 2 * u * (f.cx - f.bx) + 2 * t * (f.tx - f.cx);
        const dy = 2 * u * (f.cy - f.by) + 2 * t * (f.ty - f.cy);
        const dl = Math.hypot(dx, dy) || 1; return { x: dx / dl, y: dy / dl };
    };

    // Bangun satu jari sebagai path tertutup: sisi kiri naik -> ujung membulat
    // (busur setengah lingkaran) -> sisi kanan turun. Lebar menyempit ke ujung.
    const addFinger = f => {
        const N = 12, L = [], R = [];
        for (let i = 0; i <= N; i++) {
            const t = i / N, w = qw(f, t), d = qd(f, t), x = qx(f, t), y = qy(f, t);
            L.push([x - d.y * w, y + d.x * w]);
            R.push([x + d.y * w, y - d.x * w]);
        }
        const r = qw(f, 1), dt = qd(f, 1);
        const aL = Math.atan2(L[N][1] - f.ty, L[N][0] - f.tx);
        const aT = Math.atan2(dt.y, dt.x);
        let dd = aT - aL; while (dd > Math.PI) dd -= 2 * Math.PI; while (dd < -Math.PI) dd += 2 * Math.PI;
        const dir = dd < 0 ? -1 : 1;
        ctx.moveTo(L[0][0], L[0][1]);
        for (let i = 1; i <= N; i++) ctx.lineTo(L[i][0], L[i][1]);
        for (let k = 1; k <= 8; k++) { const a = aL + dir * Math.PI * k / 8; ctx.lineTo(f.tx + Math.cos(a) * r, f.ty + Math.sin(a) * r); }
        for (let i = N - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]);
        ctx.closePath();
    };
    // Telapak: siluet membulat, lebih lebar di buku jari, mengecil ke pergelangan.
    const addPalm = () => {
        ctx.moveTo(-25, -8);
        ctx.bezierCurveTo(-29, 6, -27, 22, -17, 30);
        ctx.bezierCurveTo(-6, 36, 8, 36, 18, 29);
        ctx.bezierCurveTo(26, 21, 28, 4, 24, -10);
        ctx.bezierCurveTo(8, -16, -10, -16, -25, -8);
        ctx.closePath();
    };
    // Daftar bentuk supaya bisa digambar berurutan beberapa kali (bayangan+tepi
    // -> isi kain -> gradien volume) tanpa menggabungkan path jadi satu.
    const SHAPES = [addPalm];
    FR.forEach(f => SHAPES.push(() => addFinger(f)));
    SHAPES.push(() => addFinger(TH));
    const eachShape = fn => SHAPES.forEach(add => { ctx.beginPath(); add(); fn(); });
    const unionClip = () => { ctx.beginPath(); addPalm(); FR.forEach(addFinger); addFinger(TH); ctx.clip(); };

    const body = ctx.createLinearGradient(0, -60, 0, 40);
    body.addColorStop(0, G.knitHi); body.addColorStop(.42, G.knit0); body.addColorStop(1, G.knit1);
    const coatPalm = ctx.createLinearGradient(0, -8, 0, 26);
    coatPalm.addColorStop(0, G.coatHi); coatPalm.addColorStop(1, G.coat0);
    const coatTip = ctx.createLinearGradient(0, -58, 0, -18);
    coatTip.addColorStop(0, G.coatHi); coatTip.addColorStop(1, G.coat0);

    /* ---------- 2) BAYANGAN + GARIS TEPI LUAR ---------- */
    // Tiap bentuk digaris-tepi (lebar 3.2) lalu diisi dengan warna tepi. Hasil:
    // siluet yang melebar ~1.6px -> garis tepi gelap tipis mengikuti lekuk
    // tangan. Tepi dalam yang saling tumpang-tindih tertutup pada langkah 3.
    ctx.save();
    ctx.shadowColor = 'rgba(8,15,26,.30)'; ctx.shadowBlur = 9; ctx.shadowOffsetY = 4;
    ctx.strokeStyle = G.knitLn; ctx.fillStyle = G.knitLn; ctx.lineWidth = 3.2;
    eachShape(() => { ctx.stroke(); ctx.fill(); });
    ctx.restore();

    /* ---------- 3) ISI KAIN (gradien koordinat -> tetap sealur antar bentuk) */
    eachShape(() => { ctx.fillStyle = body; ctx.fill(); });

    /* ---------- 4) VOLUME: cahaya kiri-atas, bayangan kanan-bawah ---------- */
    ctx.save(); unionClip();
    const hl = ctx.createLinearGradient(-34, -48, 8, 32);
    hl.addColorStop(0, 'rgba(255,255,255,.34)');
    hl.addColorStop(.42, 'rgba(255,255,255,.10)');
    hl.addColorStop(.72, 'rgba(255,255,255,0)');
    hl.addColorStop(1, 'rgba(120,53,15,.16)');
    ctx.fillStyle = hl; ctx.fillRect(-44, -72, 92, 132);
    const sd = ctx.createLinearGradient(6, -40, 32, 34);
    sd.addColorStop(0, 'rgba(124,45,18,0)'); sd.addColorStop(1, 'rgba(124,45,18,.30)');
    ctx.fillStyle = sd; ctx.fillRect(2, -62, 36, 104);
    const cv = ctx.createLinearGradient(0, -34, 0, 8);
    cv.addColorStop(0, 'rgba(90,28,4,0)'); cv.addColorStop(1, 'rgba(90,28,4,.20)');
    ctx.fillStyle = cv; ctx.fillRect(-32, -42, 64, 50);       // gelap di rongga antar jari
    ctx.restore();

    /* ---------- 5) LAPISAN GRIP: telapak (bentuk organik, bukan lempeng) -- */
    const palmGrip = () => {
        ctx.beginPath();
        ctx.moveTo(-12, 2);
        ctx.bezierCurveTo(-14, 11, -10, 19, -2, 21);
        ctx.bezierCurveTo(6, 23, 12, 18, 13, 11);
        ctx.bezierCurveTo(14, 4, 11, -2, 5, -5);
        ctx.bezierCurveTo(-1, -7, -10, -5, -12, 2);
        ctx.closePath();
    };
    ctx.save(); unionClip();
    palmGrip(); ctx.fillStyle = coatPalm; ctx.fill();
    ctx.save(); palmGrip(); ctx.clip();
    ncGloveDots(-10, 3, 20, 14, 3.4, 1.2, 'rgba(226,232,240,.20)');
    ctx.fillStyle = 'rgba(255,255,255,.10)'; ctx.fillRect(-10, 2, 20, 4);
    ctx.restore();
    palmGrip(); ctx.strokeStyle = 'rgba(15,23,42,.55)'; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.restore();

    /* ---------- 6) LAPISAN GRIP: ujung jari (mengikuti bentuk tiap jari) -- */
    FR.concat([TH]).forEach(f => {
        const ax = qx(f, .74), ay = qy(f, .74), padW = f.wt + f.wb * .18 + 1.6;
        ctx.save();
        ctx.beginPath(); addFinger(f); ctx.clip();                         // tetap di dalam jari
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(f.tx, f.ty);
        ctx.lineWidth = padW + 1.6; ctx.strokeStyle = 'rgba(15,23,42,.5)'; ctx.stroke();
        ctx.lineWidth = padW; ctx.strokeStyle = coatTip; ctx.stroke();      // bantalan grip
        ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = padW * .34;
        ctx.beginPath(); ctx.moveTo(ax - 1.6, ay); ctx.lineTo(f.tx - 1.6, f.ty); ctx.stroke();
        const dy0 = Math.min(ay, f.ty) + 3;
        ncGloveDots(f.tx - f.wt * .8, dy0, f.wt * 1.6, Math.abs(f.ty - ay) - 6, 3.0, 1.1, 'rgba(226,232,240,.22)');
        ctx.restore();
    });

    /* ---------- 7) JAHITAN + LIPATAN (detail kain) ---------- */
    ctx.save(); ctx.setLineDash([3, 3]); ctx.strokeStyle = G.seam; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-22, -6); ctx.quadraticCurveTo(0, -13, 22, -7); ctx.stroke();  // buku jari
    ctx.beginPath(); ctx.moveTo(-14, -1); ctx.quadraticCurveTo(0, -5, 14, -1); ctx.stroke();   // lipatan telapak
    ctx.restore();
    ctx.save();                                                       // gelap halus di celah antar jari
    ctx.strokeStyle = 'rgba(90,28,4,.35)'; ctx.lineWidth = 1.4;
    for (let i = 0; i < FR.length - 1; i++) {
        const a = FR[i], b = FR[i + 1];
        const mx = (qx(a, .16) + qx(b, .16)) / 2, my = (qy(a, .16) + qy(b, .16)) / 2;
        ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx + mx * .04, my + 9); ctx.stroke();
    }
    ctx.restore();

    /* ---------- 8) MANSET KAIN ELASTIS ---------- */
    const cuffPath = () => {
        ctx.beginPath();
        ctx.moveTo(-19, 25);
        ctx.bezierCurveTo(-22, 35, -22, 47, -20, 54);
        ctx.bezierCurveTo(-10, 58, 10, 58, 20, 54);
        ctx.bezierCurveTo(22, 47, 22, 35, 19, 25);
        ctx.bezierCurveTo(9, 31, -9, 31, -19, 25);
        ctx.closePath();
    };
    const cuffG = ctx.createLinearGradient(0, 24, 0, 56);
    cuffG.addColorStop(0, G.cuffHi); cuffG.addColorStop(.5, G.cuff0); cuffG.addColorStop(1, G.cuff1);
    ctx.save();
    ctx.shadowColor = 'rgba(8,15,26,.28)'; ctx.shadowBlur = 7; ctx.shadowOffsetY = 4;
    cuffPath(); ctx.fillStyle = G.cuffLn; ctx.fill();
    ctx.restore();
    cuffPath(); ctx.fillStyle = cuffG; ctx.fill();
    ctx.save(); cuffPath(); ctx.clip();
    const ct = ctx.createLinearGradient(0, 24, 0, 33);               // bayangan jahitan atas
    ct.addColorStop(0, 'rgba(15,23,42,.5)'); ct.addColorStop(1, 'rgba(15,23,42,0)');
    ctx.fillStyle = ct; ctx.fillRect(-24, 24, 48, 9);
    ctx.strokeStyle = 'rgba(124,45,18,.32)'; ctx.lineWidth = 1.1;     // kerut kain
    for (let i = 0; i < 6; i++) { const x = -15 + i * 6; ctx.beginPath(); ctx.moveTo(x, 30); ctx.quadraticCurveTo(x + 1, 42, x, 54); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,247,224,.35)'; ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) { const x = -12 + i * 6; ctx.beginPath(); ctx.moveTo(x, 30); ctx.quadraticCurveTo(x + 1, 42, x, 54); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.fillRect(-19, 26, 8, 30);   // highlight kiri
    const cb = ctx.createLinearGradient(0, 46, 0, 58);               // volume menggembung
    cb.addColorStop(0, 'rgba(15,23,42,0)'); cb.addColorStop(1, 'rgba(15,23,42,.30)');
    ctx.fillStyle = cb; ctx.fillRect(-24, 44, 48, 18);
    ctx.restore();

    ctx.restore();
}
function drawWorkHand(x, y, s, rot, cover, flex, slide) {
    const G = GLOVE_PALETTE;
    const gl = clamp(cover == null ? 1 : cover, 0, 1);
    const sd = slide || 0;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot || 0); ctx.scale(s || 1, s || 1);
    // 1) Tangan telanjang selalu digambar (terlihat di bawah sarung saat dipasang)
    ncPaintHand(flex, G.skin0, G.skinLn, 2);
    if (gl > 0) {
        // 2) Sarung datang DARI SAMPING lalu menutup: seluruh lapisan sarung
        //    (kain + manset + bayangan) digeser sejauh `slide` px.
        ctx.save();
        ctx.translate(sd, 0);
        const edge = ncLerp(-58, 28, gl);            // tepi sarung: ujung jari -> pergelangan
        ctx.save();
        ctx.beginPath(); ctx.rect(-140, -95, 280, edge + 95); ctx.clip();
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
