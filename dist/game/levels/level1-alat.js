// ==========================================================================
// levels/level1-alat.js
// Diambil dari backup/netcrimp2.ORI.html baris 735-1347. File ini digabung otomatis oleh build.mjs
// ke index.html -- JANGAN diedit langsung di index.html.
// ==========================================================================

/* ================================================================
   LEVEL 1 — 3 STUDI KASUS
   ================================================================ */
const CASES = [
    {
        kode: 'A', judul: 'Instalasi Kabel LAN Laboratorium Komputer', lokasi: 'Lab Komputer', lokasiIcon: 'loc_lab',
        cerita: 'Laboratorium komputer memiliki 20 unit PC yang belum terhubung jaringan. Kamu diminta mempersiapkan alat untuk membuat kabel LAN jenis straight-through.',
        tugas: 'Ambil 6 peralatan yang dibutuhkan untuk membuat kabel LAN straight-through!',
        dialog: [
            'Halo! Saya Andi, teknisi jaringan SMK Nusantara. Hari ini tugasmu di Lab Komputer — kita harus bikin kabel LAN straight-through untuk 20 PC baru.',
            'Kabel straight-through butuh alat dan bahan khusus. Pilih yang benar ya, jangan asal ambil.'
        ],
        andiDone: 'Luar biasa! Semua peralatan sudah tepat. Kamu siap melakukan crimping kabel di Lab Komputer.',
        benar: [
            { id: 'utp', label: 'Kabel UTP Cat5e', why: 'Kabel UTP Cat5e adalah media transmisi utama pada jaringan LAN.' },
            { id: 'rj45', label: 'Konektor RJ-45', why: 'Konektor RJ-45 dipasang di kedua ujung kabel UTP.' },
            { id: 'crimp', label: 'Crimping Tool', why: 'Crimping tool menekan kontak RJ-45 agar menembus serat kabel.' },
            { id: 'tester', label: 'LAN Tester', why: 'LAN tester memeriksa urutan dan kontinuitas kabel hasil crimping.' },
            { id: 'strip', label: 'Cable Stripper', why: 'Cable stripper mengupas selubung luar kabel tanpa melukai isinya.' },
            { id: 'sarung_tangan', label: 'Sarung Tangan', why: 'Sarung tangan melindungi tangan dari potongan kabel saat bekerja.' }
        ],
        salah: [
            { id: 'hdmi', label: 'Kabel HDMI', why: 'Kabel HDMI untuk sinyal video/audio, bukan kabel jaringan.' },
            { id: 'solder', label: 'Solder', why: 'Konektor RJ-45 tidak disolder, tetapi di-crimp.' },
            { id: 'speaker', label: 'Speaker', why: 'Speaker bukan perlengkapan instalasi jaringan.' },
            { id: 'flashdisk', label: 'Flashdisk', why: 'Flashdisk adalah media penyimpanan, bukan alat instalasi.' },
            { id: 'obeng', label: 'Obeng', why: 'Obeng bukan alat yang dipakai saat membuat kabel UTP.' },
            { id: 'switch', label: 'Switch Jaringan', why: 'Switch adalah perangkat jaringan, bukan alat untuk membuat kabel.' },
            { id: 'tang', label: 'Tang Kombinasi', why: 'Tang kombinasi bukan alat khusus untuk crimping RJ-45.' }
        ]
    },
    {
        kode: 'C', judul: 'Perbaikan Kabel LAN Putus di Lab 2', lokasi: 'Lab Komputer 2', lokasiIcon: 'loc_repair',
        cerita: 'Kabel LAN di Lab 2 putus digigit tikus. Kamu harus menyambung ulang kabel tersebut agar jaringan kembali normal.',
        tugas: 'Ambil 6 peralatan yang dibutuhkan untuk menyambung ulang kabel LAN yang putus!',
        dialog: [
            'Halo, teknisi junior! Hari ini ada masalah di Lab 2 — kabel LAN-nya putus digigit tikus. Kita harus sambung ulang.',
            'Perbaikan kabel butuh ketelitian. Alat yang dipakai sebagian sama dengan pasang baru, tapi ada beberapa alat yang justru tidak boleh dipakai.'
        ],
        andiDone: 'Bagus! Peralatan sudah siap. Sekarang kita bisa sambung ulang kabel yang putus di Lab 2.',
        benar: [
            { id: 'utp', label: 'Kabel UTP Cat5e', why: 'Kabel UTP pengganti untuk bagian yang putus.' },
            { id: 'rj45', label: 'Konektor RJ-45', why: 'RJ-45 baru dipasang setelah sambungan dirapikan.' },
            { id: 'crimp', label: 'Crimping Tool', why: 'Crimping tool mengunci RJ-45 baru di ujung kabel.' },
            { id: 'tester', label: 'LAN Tester', why: 'LAN tester memastikan sambungan ulang bekerja normal.' },
            { id: 'strip', label: 'Cable Stripper', why: 'Cable stripper mengupas selubung kabel dengan rapi.' },
            { id: 'sarung_tangan', label: 'Sarung Tangan', why: 'Sarung tangan melindungi tangan saat memperbaiki kabel.' }
        ],
        salah: [
            { id: 'gunting', label: 'Gunting Kertas', why: 'Gunting kertas tidak dirancang untuk memotong kabel UTP.' },
            { id: 'isolasi', label: 'Isolasi Listrik', why: 'Isolasi bukan pengganti konektor RJ-45 yang benar.' },
            { id: 'tang', label: 'Tang Kombinasi', why: 'Tang kombinasi bukan alat khusus crimping RJ-45.' },
            { id: 'multimeter', label: 'Multimeter', why: 'Multimeter untuk listrik, LAN diuji pakai LAN tester.' },
            { id: 'solder', label: 'Solder', why: 'Sambungan kabel UTP tidak disolder.' },
            { id: 'switch', label: 'Switch Jaringan', why: 'Switch adalah perangkat jaringan, bukan alat perbaikan kabel.' },
            { id: 'obeng', label: 'Obeng', why: 'Obeng bukan alat untuk menyambung kabel UTP.' }
        ]
    },
    {
        kode: 'H', judul: 'Jalur Kabel LAN Outdoor antar Gedung', lokasi: 'Luar Ruangan', lokasiIcon: 'loc_outdoor',
        cerita: 'Hubungkan Lab TKJ ke ruang UKS yang berbeda gedung, jarak 40 meter. Kabel akan terkena panas dan hujan setiap hari.',
        tugas: 'Pilih 6 peralatan yang tepat untuk instalasi kabel LAN outdoor!',
        dialog: [
            'Halo! Kali ini tantangannya lebih seru — kita harus hubungkan Lab TKJ ke ruang UKS yang beda gedung, jarak 40 meter.',
            'Kabelnya kena panas dan hujan langsung. Jadi harus pilih kabel outdoor, bukan kabel indoor biasa. Yuk siapkan alatnya!'
        ],
        andiDone: 'Mantap! Kabel outdoor-nya sudah ada. Sekarang kita bisa hubungkan Lab TKJ ke UKS tanpa takut kena hujan.',
        benar: [
            { id: 'utp_out', label: 'Kabel UTP Outdoor', why: 'Kabel UTP outdoor tahan panas, hujan, dan sinar UV.' },
            { id: 'rj45', label: 'Konektor RJ-45', why: 'RJ-45 tetap dipakai di kedua ujung kabel outdoor.' },
            { id: 'crimp', label: 'Crimping Tool', why: 'Crimping tool mengunci RJ-45 pada kabel outdoor.' },
            { id: 'tester', label: 'LAN Tester', why: 'LAN tester memverifikasi kabel sebelum dipasang permanen.' },
            { id: 'strip', label: 'Cable Stripper', why: 'Cable stripper mengupas jaket luar kabel outdoor.' },
            { id: 'sarung_tangan', label: 'Sarung Tangan', why: 'Sarung tangan melindungi dari serpihan kabel outdoor.' }
        ],
        salah: [
            { id: 'utp_in', label: 'Kabel UTP Indoor Biasa', why: 'Kabel indoor tidak tahan panas & hujan, cepat rusak di luar ruangan.' },
            { id: 'coaxial', label: 'Kabel Coaxial', why: 'Coaxial adalah kabel lama (TV/BNC), bukan standar LAN modern.' },
            { id: 'bnc', label: 'Konektor BNC', why: 'BNC untuk coaxial, bukan kabel UTP.' },
            { id: 'solder', label: 'Solder', why: 'Sambungan kabel UTP tidak menggunakan solder.' },
            { id: 'palu', label: 'Palu', why: 'Palu bukan alat pemasangan kabel UTP.' },
            { id: 'tang', label: 'Tang Kombinasi', why: 'Tang kombinasi bukan alat khusus crimping RJ-45.' },
            { id: 'switch', label: 'Switch Jaringan', why: 'Switch adalah perangkat jaringan, bukan alat instalasi.' }
        ]
    }
];

function makeL1() {
    const K = CASES[Math.floor(Math.random() * CASES.length)];
    const lv = baseLevel(1, 'Persiapan Alat & Bahan');
    lv.kase = K; lv.phase = 'brief'; lv.page = 0; lv.shown = 0; lv.tPrev = performance.now();
    lv.fbMode = false; lv.savedElapsed = 0; lv.fly = null; lv.drag = null; lv.got = [];
    lv.hoverIt = null; lv.reaction = null; lv.reactUntil = 0;
    lv.limit = 75; lv.combo = 0; lv.maxCombo = 0; lv.particles = [];
    const G = CABG;
    const TB = { x: 656, y: 118, w: 288, h: 418 };
    lv.TB = TB;
    /* --- layar lebar (VW > 960): lemari menempel tepi kiri, panel alat menempel tepi kanan --- */
    function rewidth() {
        const OW = wideOX();
        CABG.FX = 36 - OW; CABG.IX = CABG.FX + CABG.T;
        TB.x = 656 + OW;
    }
    lv.tilt = { x: 0, y: 0 }; lv.off = { x: 0, y: 0 }; lv.cabShake = 0;
    lv.wrongCard = null; lv.doorT0 = performance.now(); lv.doorOpen = 0;
    lv.bgSpr = buildRoom(K); lv.cabSpr = cabinetSprite();
    const pool = [];
    K.benar.forEach(t => pool.push({ ...t, ok: true }));
    K.salah.forEach(t => pool.push({ ...t, ok: false }));
    shuffle(pool);
    const rows = [{ n: 5, cy: 230, board: 276, peg: true }, { n: 4, cy: 344, board: 390, peg: false }, { n: 4, cy: 458, board: 500, peg: false }];
    let idx = 0;
    const innerX0 = G.IX + 8, innerW = G.IW - 16;
    for (const row of rows) {
        for (let i = 0; i < row.n && idx < pool.length; i++, idx++) {
            const it = pool[idx];
            it.cx = innerX0 + (i + 0.5) * innerW / row.n; it.cy = row.cy;
            it.board = row.board; it.peg = row.peg; it.depth = Math.random();
            it.scale = 0.94 + Math.random() * 0.12; it.ph = Math.random() * 6.28;
            it.jag = (Math.random() - 0.5) * 0.10;
            it.done = false; it.wrong = false; it.bounce = null;
            it.appearAt = 0; it.sx = it.cx; it.sy = it.cy; it.ss = 1;
        }
    }
    lv.items = pool;
    const spriteBase = 118; const hitR = 60;
    function slotRect(i) {
        const col = i % 2, row = (i / 2) | 0;
        const pw = (TB.w - 44) / 2, ph = 92;
        return { x: TB.x + 16 + col * (pw + 12), y: TB.y + 104 + row * (ph + 12), w: pw, h: ph };
    }
    const inBox = (p) => p.x >= TB.x - 6 && p.x <= TB.x + TB.w + 6 && p.y >= TB.y - 6 && p.y <= TB.y + TB.h + 6;
    function startPlay() {
        lv.phase = 'play'; lv.t0 = performance.now(); lv.tPrev = performance.now(); lv.doorT0 = performance.now();
        const t0 = performance.now();
        lv.items.forEach((it, i) => { it.appearAt = t0 + 620 + i * 42; });
        say('Buka lemari alat, pilih alat yang tepat, lalu masukkan ke kotak peralatan. Batas waktu 75 detik!', 'info');
    }
    function advance() {
        const d = K.dialog;
        if (lv.page < d.length) { if (lv.shown < d[lv.page].length) { lv.shown = d[lv.page].length; return; } lv.page++; lv.shown = 0; }
    }
    function react(mood) { lv.reaction = mood; lv.reactUntil = performance.now() + 1600; }
    function spawnParticles(x, y, color) {
        if (lv.particles.length > 90) return;
        for (let i = 0; i < 12; i++) {
            lv.particles.push({ x, y, vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8 - 3, life: 1, decay: 0.018 + Math.random() * 0.016, size: 2 + Math.random() * 3, c: color });
        }
    }
    function collect(it) {
        if (lv.phase !== 'play' || it.done || it.wrong || lv.doorOpen < 0.8) return;
        if (it.ok) {
            it.done = true; lv.combo++;
            lv.maxCombo = Math.max(lv.maxCombo, lv.combo);
            const bonus = Math.min(10, (lv.combo - 1) * 2);
            lv.score = Math.min(100, lv.score + bonus);
            spawnParticles(it.sx, it.sy, C.ok);
            const slot = lv.got.length; lv.got.push(it);
            const sr = slotRect(slot);
            lv.fly = { id: it.id, t0: performance.now(), from: { x: it.sx, y: it.sy }, to: { x: sr.x + 34, y: sr.y + sr.h / 2 } };
            react('happy');
            if (lv.combo >= 2) say('Combo x' + lv.combo + '! +' + bonus + ' poin bonus', 'ok');
            if (lv.got.length === 6) {
                const elapsed = lv.elapsed();
                let speedBonus = 0;
                if (elapsed < 30) speedBonus = 10;
                else if (elapsed < 45) speedBonus = 5;
                if (speedBonus > 0) { lv.score = Math.min(100, lv.score + speedBonus); say('Bonus kecepatan +' + speedBonus + ' poin!', 'ok'); }
                say('Semua peralatan lengkap! Kotak peralatan siap dipakai.', 'ok');
                lv.fbMode = true; lv.savedElapsed = Math.round(elapsed); lv.phase = 'feedback';
            }
        } else {
            it.wrong = true;
            it.bounce = { t0: performance.now(), fx: it.sx, fy: it.sy };
            lv.combo = 0; lv.cabShake = 11;
            spawnParticles(it.sx, it.sy, C.bad);
            lv.penalize(10, it.label + ': ' + it.why);
            lv.wrongCard = { it, until: performance.now() + 3600 };
            react('sad');
        }
    }
    function toolPos(it, now) {
        const ap = it.appearAt ? clamp((now - it.appearAt) / 280, 0, 1) : 1;
        const ease = 1 - Math.pow(1 - ap, 3);
        const hov = lv.hoverIt === it && !lv.drag;
        const bob = Math.sin(now / 640 + it.ph) * 1.4;
        let x = it.cx, y = it.cy - it.depth * 9 + bob - (1 - ease) * 30 + (hov ? -8 : 0);
        let s = it.scale * (1 - it.depth * 0.09) * (0.55 + 0.45 * ease) * (hov ? 1.10 : 1);
        if (it.bounce) {
            const bp = clamp((now - it.bounce.t0) / 420, 0, 1);
            const be = 1 - Math.pow(1 - bp, 2);
            const tx = it.cx + lv.off.x, ty = it.cy - it.depth * 9 + lv.off.y;
            x = it.bounce.fx + (tx - it.bounce.fx) * be;
            y = it.bounce.fy + (ty - it.bounce.fy) * be - Math.sin(bp * Math.PI) * 46;
            x -= lv.off.x; y -= lv.off.y;
            if (bp >= 1) it.bounce = null;
        }
        return { x, y, s };
    }
    function drawOneTool(it, now, dragging, screenX, screenY) {
        const p = toolPos(it, now);
        const cx = dragging ? screenX : p.x, cy = dragging ? screenY : p.y;
        const size = spriteBase * p.s * (dragging ? 1.05 : 1);
        if (!dragging) { it.sx = cx + lv.off.x; it.sy = cy + lv.off.y; it.ss = p.s; }
        const hov = !dragging && lv.hoverIt === it && !it.wrong;
        ctx.beginPath(); ctx.ellipse(cx, cy + size * 0.30, size * (hov ? 0.34 : 0.27), size * (hov ? 0.085 : 0.065), 0, 0, 6.3);
        ctx.fillStyle = 'rgba(0,0,0,' + (hov ? 0.48 : 0.36) + ')'; ctx.fill();
        if (hov) {
            const gg = ctx.createRadialGradient(cx, cy, 3, cx, cy, size * 0.62);
            gg.addColorStop(0, 'rgba(56,189,248,.32)'); gg.addColorStop(1, 'rgba(56,189,248,0)');
            ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(cx, cy, size * 0.62, 0, 6.3); ctx.fill();
        }
        ctx.save(); if (it.wrong) ctx.globalAlpha = 0.42;
        drawSprite(it.id, cx, cy, size, dragging ? Math.sin(now / 260) * 0.10 : 0);
        ctx.restore();
        if (it.wrong) crossIcon(cx + size * 0.28, cy - size * 0.26, 20, C.bad);
    }
    function drawPlates(now) {
        for (const it of lv.items) {
            if (it.done) continue;
            const pw = 104, ph = 15;
            const px = it.cx - pw / 2, py = it.board + 4;
            rr(px, py, pw, ph, 4);
            ctx.fillStyle = it.wrong ? 'rgba(70,25,30,.85)' : 'rgba(8,17,30,.82)'; ctx.fill();
            ctx.strokeStyle = it.wrong ? 'rgba(248,113,113,.5)' : (lv.hoverIt === it ? C.acc : 'rgba(80,120,160,.5)');
            ctx.lineWidth = 1.2; ctx.stroke();
            const nm = wrapLines(it.label, pw - 8, 9.5, 700)[0];
            txt(nm, it.cx, py + 11, { s: 9.5, a: 'center', w: 700, c: it.wrong ? '#fca5a5' : (lv.hoverIt === it ? '#eaf2fb' : '#9db2c8') });
        }
    }
    function doorLeaf(hx, w, top, h, side) {
        const x0 = Math.min(hx, hx + w), ww = Math.abs(w);
        if (ww < 0.8) return;
        const x1 = x0 + ww;
        const gd = ctx.createLinearGradient(x0, 0, x1, 0);
        if (side < 0) { gd.addColorStop(0, '#4d6f92'); gd.addColorStop(.45, '#3a5875'); gd.addColorStop(1, '#233749'); }
        else { gd.addColorStop(0, '#233749'); gd.addColorStop(.55, '#3a5875'); gd.addColorStop(1, '#4d6f92'); }
        rr(x0, top, ww, h, 5); ctx.fillStyle = gd; ctx.fill();
        ctx.strokeStyle = 'rgba(175,215,255,.30)'; ctx.lineWidth = 2; ctx.stroke();
        if (ww > 14) { rr(x0 + 6, top + 6, ww - 12, h - 12, 4); ctx.strokeStyle = 'rgba(200,232,255,.13)'; ctx.lineWidth = 2; ctx.stroke(); }
        const hxp = side < 0 ? x1 - 9 : x0 + 9;
        rr(hxp - 3.5, top + h * 0.46, 7, 34, 3.5); ctx.fillStyle = '#cfe4f7'; ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 1; ctx.stroke();
    }
    function drawDoors(now) {
        const o = lv.doorOpen;
        if (o >= 0.999) return;
        const e = 1 - Math.pow(1 - o, 3);
        const ang = e * 96 * Math.PI / 180;
        const halfW = G.FW / 2 - 4;
        const w = halfW * Math.cos(ang);
        const sinA = Math.sin(ang);
        const baseH = G.FH - 16;
        const dh = baseH * (1 + 0.06 * sinA);
        const top = G.FY + 8 - (dh - baseH) / 2 + 7 * sinA;
        ctx.save(); ctx.translate(lv.off.x, lv.off.y);
        doorLeaf(G.FX + 4, w, top, dh, -1);
        doorLeaf(G.FX + G.FW - 4, -w, top, dh, +1);
        if (o < 0.9) { ctx.fillStyle = 'rgba(0,0,0,' + (0.28 * (1 - o)) + ')'; ctx.fillRect(G.IX, G.IY, G.IW, G.IH); }
        ctx.restore();
    }
    function drawToolbox(now) {
        const TX = TB.x, TY = TB.y, TW = TB.w, TH = TB.h;
        ctx.beginPath(); ctx.ellipse(TX + TW / 2 + 10, TY + TH + 6, TW * 0.55, 20, 0, 0, 6.3);
        ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fill();
        ctx.beginPath();
        ctx.moveTo(TX + 12, TY + 54); ctx.lineTo(TX + TW - 12, TY + 54);
        ctx.lineTo(TX + TW - 30, TY + 6); ctx.lineTo(TX + 30, TY + 6); ctx.closePath();
        let lg = ctx.createLinearGradient(0, TY + 6, 0, TY + 54);
        lg.addColorStop(0, '#2b4664'); lg.addColorStop(1, '#16263a');
        ctx.fillStyle = lg; ctx.fill(); ctx.strokeStyle = '#4f7296'; ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(TX + TW / 2 - 46, TY + 8); ctx.quadraticCurveTo(TX + TW / 2, TY - 16, TX + TW / 2 + 46, TY + 8);
        ctx.strokeStyle = '#8fb0d0'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.stroke();
        rr(TX, TY + 46, TW, TH - 46, 16);
        let bgd = ctx.createLinearGradient(TX, TY + 46, TX + TW, TY + TH);
        bgd.addColorStop(0, '#28405c'); bgd.addColorStop(.5, '#1b2d43'); bgd.addColorStop(1, '#111e2e');
        ctx.fillStyle = bgd; ctx.fill(); ctx.strokeStyle = '#5b82a8'; ctx.lineWidth = 2.5; ctx.stroke();
        ctx.save(); rr(TX, TY + 46, TW, TH - 46, 16); ctx.clip();
        ctx.fillStyle = 'rgba(255,255,255,.10)'; ctx.fillRect(TX, TY + 46, TW, 4);
        ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(TX, TY + TH - 12, TW, 12);
        ctx.restore();
        txt('KOTAK PERALATAN', TX + 16, TY + 74, { s: 15, f: FONT_H, c: C.acc, w: 600 });
        txt(lv.got.length + ' / 6', TX + TW - 16, TY + 74, { s: 14, a: 'right', c: lv.got.length === 6 ? C.ok : C.mute, w: 800 });
        let mood = 'idle';
        if (now < lv.reactUntil && lv.reaction) mood = lv.reaction;
        drawAndiFace(TX + TW - 26, TY + 96, 15, mood, now / 1000);
        txt(lv.got.length === 6 ? 'Siap!' : mood === 'sad' ? 'Hmm…' : mood === 'happy' ? 'Bagus!' : 'Isi alat', TX + TW - 48, TY + 100, { s: 10.5, a: 'right', c: C.mute, w: 700 });
        for (let i = 0; i < 6; i++) {
            const r = slotRect(i), g = lv.got[i];
            rr(r.x, r.y, r.w, r.h, 10);
            ctx.fillStyle = g ? 'rgba(52,211,153,.13)' : 'rgba(6,14,26,.75)'; ctx.fill();
            ctx.lineWidth = g ? 2 : 1.5;
            ctx.strokeStyle = g ? C.ok : (lv.drag && inBox(mouse) ? C.acc : 'rgba(70,105,145,.65)');
            ctx.stroke();
            rr(r.x + 3, r.y + 3, r.w - 6, 6, 3);
            ctx.fillStyle = 'rgba(255,255,255,.10)'; ctx.fill();
            if (g) {
                drawSprite(g.id, r.x + r.w / 2, r.y + r.h / 2 - 6, 62);
                const nm = wrapLines(g.label, r.w - 12, 10, 700)[0];
                txt(nm, r.x + r.w / 2, r.y + r.h - 8, { s: 10, a: 'center', w: 700, c: '#d7e6f5' });
                tickIcon(r.x + r.w - 16, r.y + 16, 11, C.ok);
            } else {
                txt('Slot ' + (i + 1), r.x + r.w / 2, r.y + r.h / 2 + 4, { s: 12, a: 'center', c: 'rgba(90,120,155,.85)', w: 700 });
            }
        }
        const pbY = TY + TH - 14;
        rr(TX + 16, pbY, TW - 32, 8, 4); ctx.fillStyle = 'rgba(6,14,26,.9)'; ctx.fill();
        if (lv.got.length > 0) { rr(TX + 16, pbY, (TW - 32) * (lv.got.length / 6), 8, 4); ctx.fillStyle = C.ok; ctx.fill(); }
        if (lv.combo >= 2) txt('Combo x' + lv.combo + '!', TX + TW / 2, TY + TH + 26, { s: 15, a: 'center', c: C.warn, f: FONT_H });
    }
    function drawWrongCard(now) {
        if (!lv.wrongCard) return;
        const age = (now - (lv.wrongCard.until - 3600)) / 3600;
        if (age >= 1) { lv.wrongCard = null; return; }
        const a = age > 0.86 ? Math.max(0, (1 - age) / 0.14) : Math.min(1, age / 0.10);
        const cw = 460, ch = 96;
        const cx = G.FX + G.FW / 2 - cw / 2, cy = G.FY + G.FH - ch - 26;
        ctx.save(); ctx.globalAlpha = a;
        rr(cx, cy, cw, ch, 12);
        ctx.fillStyle = 'rgba(38,12,16,.96)'; ctx.fill();
        ctx.strokeStyle = C.bad; ctx.lineWidth = 2; ctx.stroke();
        drawSprite(lv.wrongCard.it.id, cx + 46, cy + ch / 2, 62);
        txt('Kurang tepat: ' + lv.wrongCard.it.label, cx + 86, cy + 32, { s: 14, w: 800, c: '#fecaca' });
        const L = wrapLines(lv.wrongCard.it.why, cw - 104, 12.5, 600).slice(0, 3);
        L.forEach((l, i) => txt(l, cx + 86, cy + 52 + i * 16, { s: 12.5, c: '#f3c9cd', w: 600 }));
        ctx.restore();
    }
    function drawBrief(now) {
        const t = now / 1000;
        bg(false);
        for (let i = 0; i < 30; i++) {
            const x = ((i * 173 + t * 22) % (W + 100)) - 50;
            const y = 72 + ((i * 97) % 470);
            const a = 0.05 + 0.07 * (0.5 + 0.5 * Math.sin(t * 1.4 + i));
            ctx.beginPath(); ctx.arc(x, y, 1.4 + (i % 3), 0, 6.3);
            ctx.fillStyle = 'rgba(56,189,248,' + a.toFixed(3) + ')'; ctx.fill();
        }
        hud(lv);
        const BW = wideOX();
        const AP = { x: 20 - BW, y: 70, w: 270, h: 490 };
        rr(AP.x, AP.y, AP.w, AP.h, 18);
        const ag = ctx.createLinearGradient(0, AP.y, 0, AP.y + AP.h);
        ag.addColorStop(0, '#1b3350'); ag.addColorStop(1, '#0d1a2b');
        ctx.fillStyle = ag; ctx.fill();
        ctx.strokeStyle = 'rgba(56,189,248,.35)'; ctx.lineWidth = 2; ctx.stroke();
        rr(AP.x + 30, AP.y + 18, AP.w - 60, 26, 13); ctx.fillStyle = 'rgba(56,189,248,.15)'; ctx.fill();
        ctx.strokeStyle = 'rgba(56,189,248,.5)'; ctx.lineWidth = 1.5; ctx.stroke();
        txt('TEKNISI JARINGAN', AP.x + AP.w / 2, AP.y + 36, { s: 11, a: 'center', c: C.acc, w: 800 });
        const typing = lv.page < K.dialog.length && lv.shown < K.dialog[lv.page].length;
        drawAndi(AP.x + AP.w / 2, AP.y + 260, 0.86, typing ? 'talk' : 'idle', t);
        rr(AP.x + 30, AP.y + 418, AP.w - 60, 44, 10); ctx.fillStyle = 'rgba(56,189,248,.12)'; ctx.fill();
        ctx.strokeStyle = 'rgba(56,189,248,.4)'; ctx.lineWidth = 1.5; ctx.stroke();
        txt('Andi', AP.x + AP.w / 2, AP.y + 440, { s: 16, a: 'center', w: 800, c: C.text });
        txt('Teknisi Senior \u00b7 SMK Nusantara', AP.x + AP.w / 2, AP.y + 455, { s: 10.5, a: 'center', c: C.mute });
        const RP = { x: 306 - BW, y: 70, w: 634 + 2 * BW, h: 490 };
        if (lv.page < K.dialog.length) {
            const full = K.dialog[lv.page];
            const shownText = full.slice(0, lv.shown);
            rr(RP.x, RP.y, RP.w, RP.h, 18);
            ctx.fillStyle = C.panel; ctx.fill();
            ctx.strokeStyle = 'rgba(56,189,248,.5)'; ctx.lineWidth = 2; ctx.stroke();
            ctx.beginPath(); ctx.moveTo(RP.x, RP.y + 120); ctx.lineTo(RP.x - 18, RP.y + 140); ctx.lineTo(RP.x, RP.y + 160); ctx.closePath();
            ctx.fillStyle = C.panel; ctx.fill(); ctx.strokeStyle = 'rgba(56,189,248,.5)'; ctx.stroke();
            ctx.beginPath(); ctx.arc(RP.x + 30, RP.y + 30, 15, 0, 6.3); ctx.fillStyle = '#1d4ed8'; ctx.fill();
            txt('A', RP.x + 30, RP.y + 36, { s: 15, a: 'center', c: '#fff', w: 800 });
            txt('Andi \u00b7 Teknisi Senior', RP.x + 54, RP.y + 36, { s: 14, c: C.acc, w: 800 });
            const chipW = 150, chipX = RP.x + RP.w - chipW - 16;
            rr(chipX, RP.y + 16, chipW, 30, 15); ctx.fillStyle = 'rgba(212,167,44,.18)'; ctx.fill();
            ctx.strokeStyle = 'rgba(212,167,44,.6)'; ctx.lineWidth = 1.5; ctx.stroke();
            icon(K.lokasiIcon, chipX + 18, RP.y + 31, 0.5);
            txt(K.lokasi, chipX + chipW / 2 + 10, RP.y + 36, { s: 12, a: 'center', c: C.warn, w: 800 });
            para(shownText, RP.x + 30, RP.y + 95, RP.w - 60, 28, { s: 18, c: C.text, w: 600 });
            if (!typing) {
                const pulse = 0.5 + 0.5 * Math.sin(t * 4);
                txt('Klik untuk melanjutkan', RP.x + RP.w - 30, RP.y + RP.h - 30, { s: 12.5, a: 'right', c: 'rgba(157,178,200,' + (0.5 + 0.5 * pulse).toFixed(2) + ')' });
                ctx.beginPath(); ctx.moveTo(RP.x + RP.w - 38, RP.y + RP.h - 42 + 2 * pulse); ctx.lineTo(RP.x + RP.w - 26, RP.y + RP.h - 42 + 2 * pulse); ctx.lineTo(RP.x + RP.w - 32, RP.y + RP.h - 34 + 2 * pulse); ctx.closePath();
                ctx.fillStyle = 'rgba(157,178,200,' + (0.6 + 0.4 * pulse).toFixed(2) + ')'; ctx.fill();
            } else txt('\u2026', RP.x + RP.w - 30, RP.y + RP.h - 30, { s: 14, a: 'right', c: C.mute });
            K.dialog.forEach((_, i) => {
                const cx = RP.x + RP.w / 2 - (K.dialog.length - 1) * 11 + i * 22;
                ctx.beginPath(); ctx.arc(cx, RP.y + RP.h - 22, 5, 0, 6.3);
                ctx.fillStyle = i === lv.page ? C.acc : '#2a3a4e'; ctx.fill();
            });
        } else {
            const x = RP.x + 14, y = RP.y + 10, w = RP.w - 28, h = RP.h - 20;
            rr(x, y, w, h, 20);
            const cg = ctx.createLinearGradient(0, y, 0, y + h);
            cg.addColorStop(0, '#1e3a5c'); cg.addColorStop(1, '#132639');
            ctx.fillStyle = cg; ctx.fill();
            ctx.strokeStyle = 'rgba(212,167,44,.6)'; ctx.lineWidth = 2; ctx.stroke();
            rr(x + 24, y + 22, 180, 30, 15); ctx.fillStyle = 'rgba(212,167,44,.2)'; ctx.fill();
            ctx.strokeStyle = 'rgba(212,167,44,.7)'; ctx.lineWidth = 1.5; ctx.stroke();
            txt('STUDI KASUS ' + K.kode, x + 114, y + 43, { s: 13, a: 'center', c: C.warn, w: 800 });
            const lw = 190, lx = x + w - lw - 24;
            rr(lx, y + 22, lw, 30, 15); ctx.fillStyle = 'rgba(56,189,248,.14)'; ctx.fill();
            ctx.strokeStyle = 'rgba(56,189,248,.45)'; ctx.lineWidth = 1.5; ctx.stroke();
            icon(K.lokasiIcon, lx + 20, y + 37, 0.55);
            txt(K.lokasi, lx + lw / 2 + 12, y + 42, { s: 12.5, a: 'center', c: C.acc, w: 800 });
            txt(K.judul, x + 24, y + 86, { s: 23, f: FONT_H, w: 600, c: C.text });
            ctx.beginPath(); ctx.moveTo(x + 24, y + 106); ctx.lineTo(x + w - 24, y + 106);
            ctx.strokeStyle = 'rgba(157,178,200,.3)'; ctx.lineWidth = 1.5; ctx.stroke();
            txt('Cerita', x + 24, y + 136, { s: 13, c: C.acc, w: 800 });
            para(K.cerita, x + 24, y + 162, w - 48, 23, { s: 14.5, c: C.text, w: 600 });
            rr(x + 24, y + 270, w - 48, 100, 12);
            ctx.fillStyle = 'rgba(52,211,153,.12)'; ctx.fill();
            ctx.strokeStyle = 'rgba(52,211,153,.55)'; ctx.lineWidth = 1.5; ctx.stroke();
            ctx.beginPath(); ctx.arc(x + 52, y + 300, 14, 0, 6.3); ctx.fillStyle = C.ok; ctx.fill();
            tickIcon(x + 52, y + 300, 15, '#04160f');
            txt('TUGAS KAMU', x + 78, y + 296, { s: 11.5, c: C.ok, w: 800 });
            para(K.tugas, x + 78, y + 318, w - 108, 20, { s: 14, c: C.text, w: 700 });
            btn(x + w / 2 - 145, y + h - 72, 290, 52, 'Mulai Misi \u25b8', () => startPlay(), { s: 18, color: C.ok });
        }
    }
    function pickTool(p) {
        let best = null, bd = 1e9;
        for (const it of lv.items) {
            if (it.done || it.wrong) continue;
            const d = Math.hypot(p.x - it.sx, p.y - it.sy);
            if (d < hitR * (it.ss || 1) && d < bd) { bd = d; best = it; }
        }
        return best;
    }
    function drawPlay(now) {
        if (lv.bgSpr) ctx.drawImage(lv.bgSpr, -OX, 0, lv.bgSpr.width, lv.bgSpr.height);
        hud(lv);
        const mxs = mouse.x >= 0 ? mouse.x : W / 2;
        const mys = mouse.y >= 0 ? mouse.y : H / 2;
        const txx = clamp((mxs - W / 2) * 0.020, -9, 9);
        const tyy = clamp((mys - H / 2) * 0.014, -7, 7);
        lv.tilt.x += (txx - lv.tilt.x) * 0.10;
        lv.tilt.y += (tyy - lv.tilt.y) * 0.10;
        lv.cabShake *= 0.84;
        if (lv.cabShake < 0.4) lv.cabShake = 0;
        lv.off.x = lv.tilt.x + (Math.random() - 0.5) * lv.cabShake;
        lv.off.y = lv.tilt.y + (Math.random() - 0.5) * lv.cabShake;
        lv.doorOpen = clamp((now - lv.doorT0) / 950, 0, 1);
        drawCaseStrip();
        lv.hoverIt = null;
        if (lv.phase === 'play' && lv.doorOpen > 0.82 && !lv.drag && mouse.x >= 0) {
            const h = pickTool(mouse);
            if (h) { lv.hoverIt = h; hoverBtn = true; }
        }
        ctx.drawImage(lv.cabSpr.cn, lv.cabSpr.x + lv.off.x, lv.cabSpr.y + lv.off.y);
        ctx.save();
        ctx.translate(lv.off.x, lv.off.y);
        rr(G.IX - 4, G.IY - 4, G.IW + 8, G.IH + 8, 8); ctx.clip();
        const sorted = lv.items.slice().sort((a, b) => b.depth - a.depth);
        for (const it of sorted) { if (it.done || (lv.drag && lv.drag.it === it)) continue; drawOneTool(it, now, false); }
        drawPlates(now);
        ctx.restore();
        drawDoors(now);
        if (lv.phase === 'play') {
            const left = lv.limit - lv.elapsed();
            if (left < 15) {
                const blink = 0.35 + 0.65 * Math.abs(Math.sin(now / 150));
                ctx.save(); ctx.globalCompositeOperation = 'lighter';
                const rg = ctx.createRadialGradient(G.FX + G.FW / 2, G.FY + G.DY - 6, 6, G.FX + G.FW / 2, G.FY + G.DY - 6, 260);
                rg.addColorStop(0, 'rgba(248,80,80,' + (0.42 * blink).toFixed(3) + ')');
                rg.addColorStop(1, 'rgba(248,80,80,0)');
                ctx.fillStyle = rg; ctx.fillRect(G.FX - 40, G.FY - 90, G.FW + 80, 260);
                ctx.restore();
                ctx.fillStyle = 'rgba(255,90,90,' + (0.55 + 0.45 * blink).toFixed(2) + ')';
                rr(G.FX + G.FW / 2 - 88, G.FY + G.DY - 12, 176, 6, 3); ctx.fill();
            }
        }
        if (lv.drag) {
            drawOneTool(lv.drag.it, now, true, mouse.x, mouse.y);
            ctx.beginPath(); ctx.setLineDash([6, 7]); ctx.moveTo(mouse.x, mouse.y); ctx.lineTo(TB.x + 40, TB.y + 150);
            ctx.strokeStyle = 'rgba(56,189,248,.35)'; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
        }
        for (let i = lv.particles.length - 1; i >= 0; i--) {
            const p = lv.particles[i];
            p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life -= p.decay;
            if (p.life <= 0) { lv.particles.splice(i, 1); continue; }
            ctx.globalAlpha = p.life; ctx.fillStyle = p.c;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 6.3); ctx.fill();
        }
        ctx.globalAlpha = 1;
        if (lv.fly) {
            const p = Math.min(1, (now - lv.fly.t0) / 560);
            const e = 1 - Math.pow(1 - p, 3);
            const x = lv.fly.from.x + (lv.fly.to.x - lv.fly.from.x) * e;
            const y = lv.fly.from.y + (lv.fly.to.y - lv.fly.from.y) * e - Math.sin(p * Math.PI) * 86;
            ctx.save(); ctx.globalAlpha = 1 - p * 0.12;
            drawSprite(lv.fly.id, x, y, spriteBase * (1 - p * 0.45), p * 4.2);
            ctx.restore();
            if (p >= 1) lv.fly = null;
        }
        drawToolbox(now);
        drawWrongCard(now);
        const timeLeft = Math.max(0, lv.limit - lv.elapsed());
        const timeFrac = timeLeft / lv.limit;
        const barW = 300, barH = 7;
        const barX = W / 2 - barW / 2, barY = 57;
        rr(barX, barY, barW, barH, 4); ctx.fillStyle = 'rgba(6,14,26,.85)'; ctx.fill();
        rr(barX, barY, barW * timeFrac, barH, 4);
        ctx.fillStyle = timeFrac > 0.5 ? C.ok : timeFrac > 0.25 ? C.warn : C.bad;
        ctx.fill();
    }
    function drawCaseStrip() {
        rr(16, 68, 928, 42, 10);
        ctx.fillStyle = 'rgba(9,18,31,.88)'; ctx.fill();
        ctx.strokeStyle = 'rgba(212,167,44,.4)'; ctx.lineWidth = 1.5; ctx.stroke();
        rr(28, 74, 34, 30, 8); ctx.fillStyle = 'rgba(212,167,44,.18)'; ctx.fill();
        ctx.strokeStyle = 'rgba(212,167,44,.6)'; ctx.lineWidth = 1.5; ctx.stroke();
        icon(K.lokasiIcon, 45, 89, 0.58);
        txt('STUDI KASUS ' + K.kode + '  \u00b7  ' + K.lokasi, 72, 85, { s: 11, c: C.warn, w: 800 });
        txt(K.judul, 72, 103, { s: 14.5, c: C.text, w: 800 });
        txt('Klik alat untuk mengambil, atau seret ke kotak peralatan \u25b8', W - 28, 95, { s: 12, a: 'right', c: C.mute, w: 700 });
    }
    function drawFeedback(now) {
        lv.t0 = now - lv.savedElapsed * 1000;
        const t = now / 1000;
        bg(false);
        for (let i = 0; i < 26; i++) {
            const x = ((i * 211 - t * 16) % (W + 100)) - 50;
            const y = 72 + ((i * 131) % 470);
            ctx.beginPath(); ctx.arc(x, y, 1.4 + (i % 3), 0, 6.3);
            ctx.fillStyle = 'rgba(52,211,153,' + (0.04 + 0.05 * (0.5 + 0.5 * Math.sin(t + i))).toFixed(3) + ')'; ctx.fill();
        }
        hud(lv);
        const card = { x: 120, y: 76, w: 720, h: 448 };
        rr(card.x, card.y, card.w, card.h, 20);
        const cg = ctx.createLinearGradient(0, card.y, 0, card.y + card.h);
        cg.addColorStop(0, '#1e3a5c'); cg.addColorStop(1, '#122436');
        ctx.fillStyle = cg; ctx.fill();
        ctx.strokeStyle = 'rgba(52,211,153,.6)'; ctx.lineWidth = 2; ctx.stroke();
        const errs = lv.mistakes.length;
        const mood = errs === 0 ? 'happy' : (errs <= 2 ? 'idle' : 'sad');
        const line = errs === 0 ? K.andiDone : errs <= 2 ? 'Bagus, sebagian besar sudah tepat. Perhatikan lagi fungsi setiap alat ya.' : 'Perhatikan kembali fungsi alat. Teknisi harus memilih alat berdasarkan kebutuhan pekerjaan.';
        txt('Misi Selesai', card.x + card.w / 2, card.y + 50, { s: 32, f: FONT_H, a: 'center', c: C.ok, w: 600 });
        txt('Studi Kasus ' + K.kode + ' \u00b7 ' + K.judul, card.x + card.w / 2, card.y + 74, { s: 13, a: 'center', c: C.mute });
        drawAndi(222, 310, 0.72, mood, t);
        rr(340, 180, 470, 150, 16); ctx.fillStyle = C.panel; ctx.fill();
        ctx.strokeStyle = 'rgba(52,211,153,.5)'; ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(340, 244); ctx.lineTo(316, 258); ctx.lineTo(340, 272); ctx.closePath();
        ctx.fillStyle = C.panel; ctx.fill(); ctx.strokeStyle = 'rgba(52,211,153,.5)'; ctx.stroke();
        txt('Andi \u00b7 Teknisi Senior', 362, 214, { s: 13, c: C.ok, w: 800 });
        para(line, 362, 246, 426, 24, { s: 16, c: C.text, w: 600 });
        const stats = [['Skor akhir', lv.score, C.warn], ['Waktu', fmt(lv.savedElapsed), C.text], ['Kesalahan', String(errs), errs ? C.bad : C.ok]];
        stats.forEach((s, i) => {
            const sx = 340 + i * 158, sy = 346, sw = 146, sh = 62;
            rr(sx, sy, sw, sh, 12); ctx.fillStyle = 'rgba(8,17,30,.65)'; ctx.fill();
            ctx.strokeStyle = C.line; ctx.lineWidth = 1.5; ctx.stroke();
            txt(s[0], sx + sw / 2, sy + 24, { s: 11.5, a: 'center', c: C.mute });
            txt(s[1], sx + sw / 2, sy + 50, { s: 22, a: 'center', c: s[2], f: FONT_H, w: 600 });
        });
        btn(card.x + card.w / 2 - 140, 436, 280, 52, 'Lihat Ringkasan \u25b8', () => { lv.phase = 'summary'; }, { s: 18, color: C.ok });
    }
    function drawSummary(now) {
        bg(false);
        hud(lv);
        const card = { x: 120, y: 76, w: 720, h: 448 };
        rr(card.x, card.y, card.w, card.h, 20);
        const cg = ctx.createLinearGradient(0, card.y, 0, card.y + card.h);
        cg.addColorStop(0, '#1e3a5c'); cg.addColorStop(1, '#122436');
        ctx.fillStyle = cg; ctx.fill();
        ctx.strokeStyle = 'rgba(56,189,248,.6)'; ctx.lineWidth = 2; ctx.stroke();
        txt('Ringkasan Materi', card.x + card.w / 2, card.y + 44, { s: 28, f: FONT_H, a: 'center', c: C.acc, w: 600 });
        txt('Alat dan bahan untuk ' + K.judul, card.x + card.w / 2, card.y + 68, { s: 13, a: 'center', c: C.mute });
        K.benar.forEach((t, i) => {
            const y = card.y + 100 + i * 56;
            rr(card.x + 30, y, card.w - 60, 48, 10);
            ctx.fillStyle = 'rgba(8,17,30,.65)'; ctx.fill();
            ctx.strokeStyle = C.line; ctx.lineWidth = 1.5; ctx.stroke();
            icon(t.id, card.x + 58, y + 24, 0.4);
            txt(t.label, card.x + 88, y + 20, { s: 14, w: 800, c: C.text });
            const whyLines = wrapLines(t.why, card.w - 180, 11, 600);
            txt(whyLines[0], card.x + 88, y + 38, { s: 11, c: C.mute, w: 600 });
        });
        btn(card.x + card.w / 2 - 120, card.y + card.h - 64, 240, 48, 'Lihat Hasil \u25b8', () => { lv.win(900); }, { s: 16, color: C.acc });
    }
    lv.draw = function () {
        lv.tick();
        const now = performance.now();
        rewidth();
        if (lv.limit && !lv.finished && lv.phase === 'play' && lv.elapsed() > lv.limit) {
            lv.finished = true; lv.dur = lv.limit; endLevel(lv, false); return;
        }
        if (lv.phase === 'brief') {
            lv.t0 = now;
            const dt = Math.min(0.05, (now - lv.tPrev) / 1000); lv.tPrev = now;
            if (lv.page < K.dialog.length && lv.shown < K.dialog[lv.page].length) {
                lv.shown = Math.min(K.dialog[lv.page].length, lv.shown + dt * 55);
            }
            drawBrief(now); return;
        }
        if (lv.fbMode) {
            if (lv.phase === 'summary') { drawSummary(now); return; }
            drawFeedback(now);
            return;
        }
        drawPlay(now);
    };
    lv.down = function (p) {
        if (lv.phase === 'brief') { if (lv.page < K.dialog.length) advance(); return; }
        if (lv.phase !== 'play') return;
        if (lv.wrongCard) {
            const cw = 460, ch = 96;
            const cx = G.FX + G.FW / 2 - cw / 2, cy = G.FY + G.FH - ch - 26;
            if (p.x >= cx && p.x <= cx + cw && p.y >= cy && p.y <= cy + ch) { lv.wrongCard = null; return; }
        }
        if (lv.doorOpen < 0.82) return;
        const it = pickTool(p);
        if (it) { lv.drag = { it, sx: p.x, sy: p.y }; lv.hoverIt = null; }
    };
    lv.move = function () {};
    lv.up = function (p) {
        if (!lv.drag) return;
        const d = lv.drag; lv.drag = null;
        const dist = Math.hypot(p.x - d.sx, p.y - d.sy);
        if (inBox(p) || dist < 14) collect(d.it);
    };
    return lv;
}

/* ---------- pendaftaran level ---------- */
registerLevel(1, {
    t: 'Persiapan Alat & Bahan',
    m: 'Briefing, studi kasus acak, dan pemilihan alat',
    desc: 'Baca briefing dari Pak Andi, lalu buka lemari alat dan ambil alat yang tepat sesuai studi kasus. Ada batas waktu 75 detik dan combo bonus.',
    mk: makeL1
});
