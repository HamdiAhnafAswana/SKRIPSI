// ==========================================================================
// levels/level5-crossover.js
// LEVEL 5 — Teknologi Jaringan Lanjutan: Simulasi Kabel Crossover
// ------------------------------------------------------------------
// Layout 960x600:
//   Header          y 0..54      — HUD Level
//   Panel Kiri      10..194      — MISI, PILIH KABEL, STATUS
//   Area Tengah     204..736     — PC1 ↔ PC2 (tanpa switch)
//   Panel Kanan     746..950     — KONFIGURASI + PING TEST
//   Footer                      — Andi + Dialog + Bantuan
//
// Alur: brief → play → pingSuccess → quiz → rapor
// Level 5: PC → PC langsung menggunakan kabel crossover.
// ==========================================================================

function makeL5() {
    const lv = baseLevel(5, 'Teknologi Jaringan Lanjutan — Simulasi Kabel Crossover');
    lv.idx = 4;
    lv.limit = 600;
    lv.boardKey = 'board5';

    /* ===== TATA LETAK ===== */
    const HDR_H = 54;
    const TOP = HDR_H + 8;
    const FOOT_H = 64;
    const FOOT_Y = H - FOOT_H;
    const BOTTOM = FOOT_Y - 10;
    const PL = { x: 10, y: TOP, w: 184, h: BOTTOM - TOP };
    const PR = { x: 746, y: TOP, w: 204, h: BOTTOM - TOP };
    const AX = 204, AY = TOP, AW = 532, AH = BOTTOM - TOP;
    const BAR = { x: 10, y: FOOT_Y, w: 940, h: FOOT_H };

    /* ===== PERANGKAT JARINGAN ===== */
    const PC1 = { x: AX + 36, y: AY + 38, w: 132, h: 96 };
    const PC2 = { x: AX + AW - 168, y: AY + 38, w: 132, h: 96 };

    /* ===== WARNA KABEL ===== */
    const CABLE_COLORS = {
        straight: { name: 'Straight-Through', color: '#3b82f6', desc: 'PC → Switch' },
        crossover: { name: 'Crossover', color: '#f59e0b', desc: 'PC → PC' }
    };

    /* ===== BARIS KABEL ===== */
    const CABLE_ROWS = [PL.y + 128, PL.y + 182];

    /* ===== STATE PC ===== */
    const PCS = [
        { id: 'pc1', name: 'PC 1', x: PC1.x, y: PC1.y, w: PC1.w, h: PC1.h, ip: null, cable: null, linkLED: false, actLED: false, negoUntil: 0, plugAnim: null },
        { id: 'pc2', name: 'PC 2', x: PC2.x, y: PC2.y, w: PC2.w, h: PC2.h, ip: null, cable: null, linkLED: false, actLED: false, negoUntil: 0, plugAnim: null }
    ];

    /* ===== KABEL ===== */
    const CABLES = [
        { id: 'c1', index: 0, type: 'straight', pc: null, port: null, free: null },
        { id: 'c2', index: 1, type: 'crossover', pc: null, port: null, free: null }
    ];

    /* ===== KONFIGURASI IP ===== */
    const IP_OPTIONS = {
        pc1: ['192.168.10.10', '192.168.10.20', '192.168.20.10', '10.0.0.10'],
        pc2: ['192.168.10.11', '192.168.10.21', '192.168.20.11', '10.0.0.11'],
        subnet: ['255.255.255.0', '255.255.0.0', '255.0.0.0', '255.255.255.128']
    };

    const FIELDS = [
        { key: 'pc1', label: 'PC1 IP', options: IP_OPTIONS.pc1 },
        { key: 'pc2', label: 'PC2 IP', options: IP_OPTIONS.pc2 },
        { key: 'subnet', label: 'Subnet Mask', options: IP_OPTIONS.subnet }
    ];
    function fieldSelectorY(key) {
        let y = PR.y + 38;
        for (const f of FIELDS) {
            if (f.key === key) return y + 14;
            y += 14 + 28 + 10;
        }
        return y;
    }

    /* ===== STATE PERMAINAN ===== */
    lv.phase = 'brief';
    lv.cables = CABLES;
    lv.drag = null;
    lv.dragStart = null;
    lv.ipConfig = { pc1: null, pc2: null, subnet: null };
    lv.pingResult = null;
    lv.lastPingIp = null;
    lv.lastPingTarget = null;
    lv.pingPc2 = false;
    lv.pingWinAt = 0;
    lv.pingPackets = { sent: 0, received: 0, lost: 0 };
    lv.hintUsed = false;
    lv.helpFree = 1;
    lv.helpUntil = 0;
    lv.badges = [];
    lv.modal = null;
    lv.flash = null;
    lv.anim = null;
    lv.openField = null;
    lv.quiz = null;
    lv.selectedCableType = null;
    lv.cableChoiceCorrect = false;
    lv.cablePickAttempts = 0;
    lv.troubleshootDone = false;

    Object.defineProperty(lv, 'placedCables', {
        get: () => lv.cables.filter(c => c.port != null)
    });

    /* ===== BANK SOAL ===== */
    const QUIZ_BANK = [
        { q: 'Kabel apa yang digunakan untuk menghubungkan PC ke PC secara langsung?', ans: 1, opts: ['Straight-Through', 'Crossover', 'Console', 'Fiber Optic'], why: 'PC ke PC memerlukan kabel crossover karena kedua perangkat sejenis (DTE ke DTE).' },
        { q: 'Apa perbedaan utama antara kabel Straight-Through dan Crossover?', ans: 2, opts: ['Warna kabel', 'Panjang kabel', 'Susunan pin Tx dan Rx', 'Kecepatan transfer'], why: 'Crossover menukar jalur Tx dan Rx, sedangkan Straight-Through tidak.' },
        { q: 'Kapan kabel crossover digunakan?', ans: 0, opts: ['PC ke Switch', 'PC ke PC', 'PC ke Router', 'Switch ke Switch'], why: 'Crossover digunakan untuk menghubungkan dua perangkat sejenis seperti PC ke PC.' },
        { q: 'Apa fungsi dari perintah ping?', ans: 2, opts: ['Mengirim file', 'Mengkonfigurasi IP', 'Menguji koneksi antar perangkat', 'Melihat daftar perangkat'], why: 'Ping mengirim paket ICMP echo request untuk menguji apakah perangkat tujuan dapat dijangkau.' },
        { q: 'Jika ping dari PC1 ke PC2 gagal, apa yang harus diperiksa pertama kali?', ans: 1, opts: ['IP address', 'Kabel dan LED link', 'Subnet mask', 'Gateway'], why: 'Troubleshooting dimulai dari layer fisik: periksa kabel dan LED link sebelum konfigurasi IP.' },
        { q: 'Mengapa gateway tidak diperlukan pada koneksi PC ke PC langsung?', ans: 0, opts: ['Karena tidak ada router', 'Karena kedua PC dalam jaringan lokal yang sama', 'Karena menggunakan kabel crossover', 'Karena IP sudah sama'], why: 'Gateway hanya diperlukan untuk komunikasi antar jaringan. PC ke PC langsung berada dalam satu jaringan lokal.' }
    ];
    lv.quizzes = shuffle(QUIZ_BANK.slice()).slice(0, 4);

    /* ===== TROUBLESHOOTING ===== */
    const TROUBLESHOOT_CASES = [
        {
            id: 'wrong_cable', title: 'Kabel Salah',
            symptom: 'LED mati pada kedua PC.',
            networkInfo: 'Menggunakan kabel Straight-Through untuk PC ke PC.',
            choices: [
                { text: 'Ganti ke kabel Crossover', correct: true },
                { text: 'Ubah IP address', correct: false },
                { text: 'Ubah subnet mask', correct: false }
            ],
            why: 'PC ke PC memerlukan kabel crossover. Straight-Through hanya untuk perangkat berbeda jenis.'
        },
        {
            id: 'ip_diff_network', title: 'IP Berbeda Jaringan',
            symptom: 'LED aktif tetapi ping gagal.',
            networkInfo: 'PC1 dan PC2 memiliki subnet berbeda.',
            choices: [
                { text: 'Ganti kabel', correct: false },
                { text: 'Perbaiki IP agar subnet sama', correct: true },
                { text: 'Restart PC', correct: false }
            ],
            why: 'LED link aktif berarti kabel benar, tetapi IP berbeda jaringan menyebabkan ping gagal.'
        },
        {
            id: 'subnet_wrong', title: 'Subnet Mask Salah',
            symptom: 'Koneksi fisik OK, tapi komunikasi gagal.',
            networkInfo: 'Subnet mask salah (bukan 255.255.255.0).',
            choices: [
                { text: 'Gunakan 255.255.255.0', correct: true },
                { text: 'Gunakan 255.255.0.0', correct: false },
                { text: 'Hapus subnet mask', correct: false }
            ],
            why: 'Subnet mask yang salah membuat PC mengira tujuan berada di jaringan lain.'
        },
        {
            id: 'ip_conflict', title: 'IP Conflict',
            symptom: 'Ping gagal dengan pesan konflik IP.',
            networkInfo: 'PC1 dan PC2 memiliki IP yang sama.',
            choices: [
                { text: 'Ganti kabel', correct: false },
                { text: 'Restart switch', correct: false },
                { text: 'Ganti salah satu IP', correct: true }
            ],
            why: 'Dua perangkat tidak boleh memiliki IP yang sama dalam satu jaringan.'
        }
    ];

    /* ===== HELPER ===== */
    const lerp = (a, b, t) => a + (b - a) * t;
    const easeOut = t => 1 - Math.pow(1 - t, 3);

    function l5Flash(msg, kind) { lv.flash = { msg, kind: kind || 'info', t: performance.now() }; }
    function l5Andi(msg, ms) { lv.andiTip = msg; lv.andiUntil = performance.now() + (ms || 9000); }
    function l5Anim(type, dur, done) { lv.anim = { type, t0: performance.now(), dur, done: done || null }; }
    function l5TickAnim(now) { const a = lv.anim; if (!a || now - a.t0 < a.dur) return; lv.anim = null; if (a.done) a.done(); }

    /* ===== GEOMETRI KABEL ===== */
    function pcJack(pc) { return { x: pc.x + pc.w / 2, y: pc.y + pc.h + 4 }; }
    function trayAnchor(c) { return { x: PL.x + PL.w / 2, y: CABLE_ROWS[c.index] }; }

    function bez(a, b) {
        const dist = Math.hypot(b.x - a.x, b.y - a.y);
        const sag = clamp(dist * 0.28, 24, 90);
        return { c1: { x: a.x, y: a.y + sag }, c2: { x: b.x, y: b.y - sag } };
    }

    function bezPoint(a, c1, c2, b, t) {
        const u = 1 - t;
        return {
            x: u*u*u*a.x + 3*u*u*t*c1.x + 3*u*t*t*c2.x + t*t*t*b.x,
            y: u*u*u*a.y + 3*u*u*t*c1.y + 3*u*t*t*c2.y + t*t*t*b.y
        };
    }

    function cableEnds(c, now) {
        now = now || performance.now();
        const drag = lv.drag && lv.drag.cable === c;
        if (drag) {
            if (c.pc) return { a: pcJack(PCS.find(x => x.id === c.pc)), b: { x: mouse.x, y: mouse.y }, dragging: true };
            return { a: trayAnchor(c), b: { x: mouse.x, y: mouse.y }, dragging: true };
        }
        let a = null, b = null;
        if (c.pc) a = pcJack(PCS.find(x => x.id === c.pc));
        if (c.port) { const port = PCS.find(x => x.id === c.port); if (port) b = pcJack(port); }
        if (!a && !b) { a = trayAnchor(c); b = { x: a.x, y: a.y + 34 }; }
        else if (a && !b) b = c.free ? { x: c.free.x, y: c.free.y } : { x: a.x, y: a.y + 58 };
        else if (!a && b) a = { x: b.x, y: b.y - 58 };
        return { a, b, dragging: false };
    }

    function distToCable(c, p) {
        const { a, b } = cableEnds(c);
        if (!a || !b) return Infinity;
        const ctl = bez(a, b);
        let best = Math.hypot(p.x - a.x, p.y - a.y);
        best = Math.min(best, Math.hypot(p.x - b.x, p.y - b.y));
        for (let t = 0; t <= 1; t += 1/20) {
            const q = bezPoint(a, ctl.c1, ctl.c2, b, t);
            best = Math.min(best, Math.hypot(p.x - q.x, p.y - q.y));
        }
        return best;
    }

    function pcAt(p) {
        for (const pc of PCS) if (inR(p, { x: pc.x - 6, y: pc.y - 6, w: pc.w + 12, h: pc.h + 20 })) return pc;
        return null;
    }

    function pcName(c) { const pc = PCS.find(p => p.id === c.pc); return pc ? pc.name : 'PC'; }
    function placedList() { return lv.cables.filter(c => c.pc && c.port); }

    function linkOK() {
        const c = lv.cables.find(k => k.type === 'crossover');
        if (!c || !c.pc || !c.port) return false;
        const pc1 = PCS.find(p => p.id === c.pc);
        const pc2 = PCS.find(p => p.id === c.port);
        return !!(pc1 && pc2 && pc1.linkLED && pc2.linkLED);
    }

    function canPing() {
        return !!(linkOK() && lv.ipConfig.pc1 && lv.ipConfig.pc2 && lv.ipConfig.subnet);
    }

    /* ===== ATTACH / DETACH ===== */
    function detachPort(c, resetPing) {
        const pc = PCS.find(x => x.cable === c.id);
        if (pc) {
            pc.cable = null; pc.linkLED = false; pc.actLED = false;
            pc.negoUntil = 0; pc.plugAnim = null;
        }
        c.port = null;
        if (resetPing !== false) { lv.pingResult = null; lv.pingPc2 = false; }
    }

    function attachPort(c, pcId) {
        const pc = PCS.find(x => x.id === pcId);
        if (!pc) return;
        pc.cable = c.id; pc.linkLED = false; pc.actLED = false;
        pc.plugAnim = { t0: performance.now(), dur: 420 };
        pc.negoUntil = performance.now() + 900;
        c.port = pcId;
    }

    function attachPc(c, pcId) {
        const pc = PCS.find(x => x.id === pcId);
        if (!pc) return false;
        if (pc.cable && pc.cable !== c.id) return false;
        PCS.forEach(x => { if (x.cable === c.id && x.id !== pcId) x.cable = null; });
        pc.cable = c.id; c.pc = pcId;
        pc.plugAnim = { t0: performance.now(), dur: 420 };
        pc.negoUntil = performance.now() + 900;
        return true;
    }

    function updateLinks(now) {
        for (const pc of PCS) {
            if (!pc.cable) { pc.linkLED = false; pc.actLED = false; pc.negoUntil = 0; continue; }
            if (pc.negoUntil && now >= pc.negoUntil) {
                pc.negoUntil = 0;
                const c = lv.cables.find(k => k.id === pc.cable);
                if (c && c.pc && c.port) { pc.linkLED = true; pc.actLED = true; }
            }
        }
        const crossCable = lv.cables.find(k => k.type === 'crossover');
        if (crossCable && crossCable.pc && crossCable.port) {
            const pc1 = PCS.find(p => p.id === crossCable.pc);
            const pc2 = PCS.find(p => p.id === crossCable.port);
            if (pc1 && pc2 && now >= pc1.negoUntil && now >= pc2.negoUntil) {
                if (!pc1.linkLED || !pc2.linkLED) {
                    pc1.linkLED = true; pc1.actLED = true;
                    pc2.linkLED = true; pc2.actLED = true;
                    l5Flash('Link aktif! LED hijau menyala di PC1 dan PC2.', 'ok');
                    l5Andi('Link aktif! PC1 dan PC2 berhasil terhubung langsung.');
                    SND.klik();
                }
            }
        }
    }

    /* ===== BRIEFING ===== */
    const BRIEF_PAGES = [
        { speaker: 'Andi - Teknisi Senior', text: 'Pada level sebelumnya kamu sudah menggunakan Straight-Through untuk PC ke Switch.' },
        { speaker: 'Andi - Teknisi Senior', text: 'Sekarang kamu akan belajar koneksi langsung antar perangkat menggunakan kabel Crossover.' },
        { speaker: 'Andi - Teknisi Senior', text: 'Perhatikan perbedaan fungsi kedua kabel dan gunakan kabel yang tepat.' },
        { speaker: 'Andi - Teknisi Senior', text: 'Setelah koneksi berhasil, lakukan pengujian jaringan dan evaluasi pemahaman.' }
    ];
    lv.briefPage = 0;
    lv.briefShown = 0;

    function drawBrief(now) {
        const t = now / 1000;
        bg(false); hud(lv);
        const AP = { x: 20, y: 70, w: 270, h: 490 };
        rr(AP.x, AP.y, AP.w, AP.h, 18);
        const ag = ctx.createLinearGradient(0, AP.y, 0, AP.y + AP.h);
        ag.addColorStop(0, '#1b3350'); ag.addColorStop(1, '#0d1a2b');
        ctx.fillStyle = ag; ctx.fill();
        ctx.strokeStyle = 'rgba(56,189,248,.35)'; ctx.lineWidth = 2; ctx.stroke();
        rr(AP.x + 30, AP.y + 18, AP.w - 60, 26, 13);
        ctx.fillStyle = 'rgba(56,189,248,.15)'; ctx.fill();
        ctx.strokeStyle = 'rgba(56,189,248,.5)'; ctx.lineWidth = 1.5; ctx.stroke();
        txt('TEKNISI JARINGAN', AP.x + AP.w / 2, AP.y + 36, { s: 11, a: 'center', c: C.acc, w: 800 });
        const curSlide = BRIEF_PAGES[lv.briefPage];
        const typing = lv.briefPage < BRIEF_PAGES.length && curSlide && curSlide.text && lv.briefShown < curSlide.text.length;
        drawAndi(AP.x + AP.w / 2, AP.y + 260, 0.86, typing ? 'talk' : 'idle', t);
        rr(AP.x + 30, AP.y + 418, AP.w - 60, 44, 10);
        ctx.fillStyle = 'rgba(56,189,248,.12)'; ctx.fill();
        ctx.strokeStyle = 'rgba(56,189,248,.4)'; ctx.lineWidth = 1.5; ctx.stroke();
        txt('Andi', AP.x + AP.w / 2, AP.y + 440, { s: 16, a: 'center', w: 800, c: C.text });
        txt('Teknisi Senior · SMK Nusantara', AP.x + AP.w / 2, AP.y + 455, { s: 10.5, a: 'center', c: C.mute });

        const RP = { x: 306, y: 70, w: 634, h: 490 };
        if (lv.briefPage < BRIEF_PAGES.length) {
            const slide = BRIEF_PAGES[lv.briefPage];
            const full = slide.text || '';
            const shownText = full.slice(0, Math.floor(lv.briefShown));
            if (full.length > 0) {
                rr(RP.x, RP.y, RP.w, RP.h, 18);
                ctx.fillStyle = C.panel; ctx.fill();
                ctx.strokeStyle = 'rgba(56,189,248,.5)'; ctx.lineWidth = 2; ctx.stroke();
                ctx.beginPath(); ctx.moveTo(RP.x, RP.y + 120); ctx.lineTo(RP.x - 18, RP.y + 140); ctx.lineTo(RP.x, RP.y + 160); ctx.closePath();
                ctx.fillStyle = C.panel; ctx.fill(); ctx.strokeStyle = 'rgba(56,189,248,.5)'; ctx.stroke();
                ctx.beginPath(); ctx.arc(RP.x + 30, RP.y + 30, 15, 0, 6.3); ctx.fillStyle = '#1d4ed8'; ctx.fill();
                txt('A', RP.x + 30, RP.y + 36, { s: 15, a: 'center', c: '#fff', w: 800 });
                txt('Andi · Teknisi Senior', RP.x + 54, RP.y + 36, { s: 14, c: C.acc, w: 800 });
                para(shownText, RP.x + 30, RP.y + 95, RP.w - 60, 28, { s: 18, c: C.text, w: 600 });
                if (!typing) {
                    const pulse = 0.5 + 0.5 * Math.sin(t * 4);
                    txt('Klik untuk melanjutkan', RP.x + RP.w - 30, RP.y + RP.h - 30, { s: 12.5, a: 'right', c: 'rgba(157,178,200,' + (0.5 + 0.5 * pulse).toFixed(2) + ')' });
                }
                BRIEF_PAGES.forEach((s, i) => {
                    if (!s.text) return;
                    const cx = RP.x + RP.w / 2 - (BRIEF_PAGES.length - 1) * 11 + i * 22;
                    ctx.beginPath(); ctx.arc(cx, RP.y + RP.h - 22, 5, 0, 6.3);
                    ctx.fillStyle = i === lv.briefPage ? C.acc : '#2a3a4e'; ctx.fill();
                });
            }
        } else {
            const x = RP.x + 14, y = RP.y + 10, w = RP.w - 28, h = RP.h - 20;
            rr(x, y, w, h, 20);
            const cg = ctx.createLinearGradient(0, y, 0, y + h);
            cg.addColorStop(0, '#1e3a5c'); cg.addColorStop(1, '#132639');
            ctx.fillStyle = cg; ctx.fill();
            ctx.strokeStyle = 'rgba(52,211,153,.6)'; ctx.lineWidth = 2; ctx.stroke();
            txt('MISI', x + w / 2, y + 60, { s: 28, f: FONT_H, a: 'center', c: C.ok, w: 600 });
            para('Hubungkan PC1 dan PC2 langsung dengan kabel crossover, konfigurasi IP, lalu uji koneksi.', x + 40, y + 100, w - 80, 24, { s: 16, c: C.text, w: 600 });
            btn(x + w / 2 - 145, y + h - 72, 290, 52, 'Mulai Misi ▸', () => startPlay(), { s: 18, color: C.ok });
        }
    }

    function startPlay() {
        lv.phase = 'play';
        lv.t0 = performance.now();
        lv.tPrev = performance.now();
        l5Andi('Pilih kabel crossover dari panel kiri, lalu seret ke PC1.');
        say('Pilih kabel crossover dari panel kiri, lalu seret ke PC1.', 'info');
    }

    /* ================================================================
       PANEL KIRI — Misi, Pilih Kabel, Status
       ================================================================ */
    function drawLeftPanel(now) {
        const P = PL;
        rr(P.x, P.y, P.w, P.h, 14);
        ctx.fillStyle = 'rgba(11,21,35,.96)'; ctx.fill();
        ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.stroke();

        // Misi
        txt('MISI', P.x + P.w / 2, P.y + 24, { s: 12, a: 'center', c: C.acc, w: 800 });
        txt('Hubungkan PC1 & PC2', P.x + P.w / 2, P.y + 42, { s: 11, a: 'center', c: C.text, w: 700 });
        txt('langsung (crossover)', P.x + P.w / 2, P.y + 57, { s: 11, a: 'center', c: C.text, w: 700 });

        // Pilihan kabel
        txt('PILIH KABEL', P.x + P.w / 2, P.y + 90, { s: 11, a: 'center', c: C.mute, w: 800 });
        CABLES.forEach((c, i) => {
            const cy = CABLE_ROWS[i];
            const hov = over(P.x + 6, cy - 23, P.w - 12, 46);
            const dragging = lv.drag && lv.drag.cable === c;
            const attached = c.pc || c.port;
            const selected = lv.selectedCableType === c.type;

            // Card background
            rr(P.x + 6, cy - 23, P.w - 12, 46, 10);
            ctx.fillStyle = dragging ? '#1a2c42' : (hov ? '#243d5c' : 'rgba(23,41,63,.96)');
            ctx.fill();
            ctx.lineWidth = attached ? 2.5 : (selected ? 2.5 : 1.5);
            ctx.strokeStyle = attached ? C.ok : (selected ? C.acc : C.line);
            ctx.stroke();

            // Ikon kabel
            ctx.beginPath(); ctx.arc(P.x + 24, cy, 8, 0, 6.3);
            ctx.fillStyle = CABLE_COLORS[c.type].color; ctx.fill();
            ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.stroke();

            txt(CABLE_COLORS[c.type].name, P.x + 40, cy - 7, { s: 11, w: 800, c: C.text });
            txt(CABLE_COLORS[c.type].desc, P.x + 40, cy + 11, { s: 10, c: C.mute, w: 700 });

            // Status pemakaian
            if (attached) {
                const pc = PCS.find(p => p.id === c.pc);
                const port = PCS.find(p => p.id === c.port);
                const st = (pc ? pc.name : '—') + (port ? ' ↔ ' + port.name : ' · belum ke PC');
                txt(st, P.x + P.w - 14, cy + 4, { s: 9.5, a: 'right', c: C.ok, w: 800 });
            } else {
                txt('siap', P.x + P.w - 14, cy + 4, { s: 9.5, a: 'right', c: C.mute, w: 800 });
            }
        });

        // Status langkah — urutan sesuai gameplay
        const SY = P.y + 330;
        txt('STATUS', P.x + P.w / 2, SY, { s: 11, a: 'center', c: C.acc, w: 800 });
        const steps = [
            { label: 'Kabel crossover dipilih', done: lv.selectedCableType === 'crossover' },
            { label: 'Kabel terpasang', done: placedList().length >= 1 },
            { label: 'Link aktif', done: linkOK() },
            { label: 'IP terkonfigurasi', done: !!(lv.ipConfig.pc1 && lv.ipConfig.pc2 && lv.ipConfig.subnet) },
            { label: 'Ping PC2 berhasil', done: lv.pingPc2 }
        ];
        steps.forEach((s, i) => {
            const yy = SY + 20 + i * 24;
            ctx.beginPath(); ctx.arc(P.x + 18, yy - 3, 5, 0, 6.3);
            ctx.fillStyle = s.done ? C.ok : '#31465e'; ctx.fill();
            if (s.done) tickIcon(P.x + 18, yy - 3, 7, '#04160f');
            txt(s.label, P.x + 30, yy, { s: 10.5, c: s.done ? C.text : C.mute, w: 700 });
        });
    }

    /* ================================================================
       AREA TENGAH — Simulasi Jaringan PC ↔ PC (tanpa switch)
       ================================================================ */
    function drawNetworkArea(now) {
        rr(AX, AY, AW, AH, 14);
        const g = ctx.createLinearGradient(0, AY, 0, AY + AH);
        g.addColorStop(0, '#0b1626'); g.addColorStop(.55, '#101f33'); g.addColorStop(1, '#13233a');
        ctx.fillStyle = g; ctx.fill();
        ctx.save();
        rr(AX, AY, AW, AH, 14); ctx.clip();

        // Grid halus
        ctx.strokeStyle = 'rgba(120,165,215,.08)'; ctx.lineWidth = 1; ctx.beginPath();
        for (let y = AY + 20; y < AY + AH; y += 20) { ctx.moveTo(AX, y); ctx.lineTo(AX + AW, y); }
        for (let x = AX + 20; x < AX + AW; x += 20) { ctx.moveTo(x, AY); ctx.lineTo(x, AY + AH); }
        ctx.stroke();

        drawPC(PCS[0], now);
        drawPC(PCS[1], now);
        lv.cables.forEach(c => { if ((c.pc || c.port) || (lv.drag && lv.drag.cable === c)) drawCable(c, now); });
        if (lv.drag) drawDropHint();

        // Label kabel crossover di tengah area
        const crossCable = lv.cables.find(k => k.type === 'crossover');
        if (crossCable && crossCable.pc && crossCable.port) {
            const { a, b } = cableEnds(crossCable, now);
            if (a && b) {
                const midX = (a.x + b.x) / 2, midY = (a.y + b.y) / 2 + 20;
                txt('KABEL CROSSOVER', midX, midY, { s: 10, a: 'center', c: C.warn, w: 700 });
            }
        }

        ctx.restore();
    }

    function drawPC(pc, now) {
        const { x, y, w, h } = pc;
        // Label nama di atas monitor
        txt(pc.name, x + w / 2, y - 14, { s: 13, a: 'center', c: C.text, w: 800 });
        // Monitor
        rr(x, y, w, h, 8);
        ctx.fillStyle = '#1e293b'; ctx.fill();
        ctx.strokeStyle = '#475569'; ctx.lineWidth = 2; ctx.stroke();
        // Screen
        rr(x + 8, y + 8, w - 16, h - 22, 4);
        ctx.fillStyle = '#0f172a'; ctx.fill();
        ctx.strokeStyle = '#334155'; ctx.lineWidth = 1; ctx.stroke();
        // IP tampil di layar
        const ip = lv.ipConfig[pc.id];
        txt('IP ' + (ip || '—'), x + w / 2, y + h - 18, { s: 10.5, a: 'center', c: ip ? '#7dd3fc' : C.mute, w: 700 });
        // LED power
        ctx.beginPath(); ctx.arc(x + w - 14, y + h - 10, 3, 0, 6.3);
        ctx.fillStyle = '#4ade80'; ctx.fill();
        // Port RJ45 (lebih besar dan jelas)
        const portX = x + w / 2 - 14, portY = y + h + 2;
        rr(portX, portY, 28, 12, 3);
        ctx.fillStyle = pc.cable ? '#1e40af' : '#0f172a'; ctx.fill();
        ctx.strokeStyle = pc.cable ? '#3b82f6' : '#64748b'; ctx.lineWidth = 2; ctx.stroke();
        // Label port
        txt('RJ45', x + w / 2 + 24, portY + 10, { s: 8, c: pc.cable ? C.acc : C.mute, w: 700 });

        // LED link (hijau) — di bawah port
        const ledX = x + w / 2, ledY = y + h + 24;
        ctx.beginPath(); ctx.arc(ledX, ledY, 4, 0, 6.3);
        if (pc.linkLED) {
            ctx.fillStyle = '#4ade80'; ctx.fill();
            ctx.shadowColor = '#4ade80'; ctx.shadowBlur = 6;
            ctx.fill(); ctx.shadowBlur = 0;
        } else if (pc.negoUntil && now < pc.negoUntil) {
            const blink = 0.5 + 0.5 * Math.sin(now / 120);
            ctx.fillStyle = 'rgba(251,191,36,' + blink.toFixed(2) + ')'; ctx.fill();
        } else {
            ctx.fillStyle = '#1e293b'; ctx.fill();
        }
        ctx.strokeStyle = '#334155'; ctx.lineWidth = 1; ctx.stroke();

        // LED activity (kuning)
        const actX = x + w / 2 + 10, actY = y + h + 24;
        ctx.beginPath(); ctx.arc(actX, actY, 3, 0, 6.3);
        if (pc.actLED) {
            const blink = 0.5 + 0.5 * Math.sin(now / 150);
            ctx.fillStyle = 'rgba(251,191,36,' + blink.toFixed(2) + ')'; ctx.fill();
        } else {
            ctx.fillStyle = '#1e293b'; ctx.fill();
        }
        ctx.strokeStyle = '#334155'; ctx.lineWidth = 1; ctx.stroke();
    }

    function drawConnector(x, y, glow) {
        rr(x - 7, y - 5, 14, 10, 2);
        ctx.fillStyle = '#cbd5e1'; ctx.fill();
        ctx.strokeStyle = glow ? C.acc : '#94a3b8'; ctx.lineWidth = glow ? 2 : 1; ctx.stroke();
    }

    function drawCable(c, now) {
        const { a, b, dragging } = cableEnds(c, now);
        if (!a || !b) return;
        const ctl = bez(a, b);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.bezierCurveTo(ctl.c1.x, ctl.c1.y, ctl.c2.x, ctl.c2.y, b.x, b.y);
        ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.stroke();
        ctx.lineWidth = 5; ctx.strokeStyle = CABLE_COLORS[c.type].color; ctx.stroke();
        ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.stroke();
        drawConnector(a.x, a.y, false);
        drawConnector(b.x, b.y, dragging);
    }

    function drawDropHint() {
        const pc = pcAt(mouse);
        if (pc) {
            rr(pc.x - 4, pc.y - 4, pc.w + 8, pc.h + 28, 8);
            ctx.strokeStyle = C.acc; ctx.lineWidth = 3; ctx.stroke();
        }
    }

    /* ================================================================
       PANEL KANAN — KONFIGURASI + PING TEST
       ================================================================ */
    function toggleField(key) {
        lv.openField = (lv.openField === key) ? null : key;
    }
    function closeField() { lv.openField = null; }

    function drawRightPanel(now) {
        const P = PR;
        rr(P.x, P.y, P.w, P.h, 14);
        ctx.fillStyle = 'rgba(11,21,35,.96)'; ctx.fill();
        ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.stroke();

        // === KONFIGURASI ===
        txt('KONFIGURASI', P.x + P.w / 2, P.y + 22, { s: 13, a: 'center', c: C.acc, w: 800 });

        FIELDS.forEach(f => {
            const ly = fieldSelectorY(f.key) - 14;
            const sy = fieldSelectorY(f.key);
            const cur = lv.ipConfig[f.key];
            const hov = over(P.x + 10, sy, P.w - 20, 28);
            const open = lv.openField === f.key;

            txt(f.label, P.x + 12, ly, { s: 11, c: C.text, w: 700 });
            rr(P.x + 10, sy, P.w - 20, 28, 8);
            ctx.fillStyle = open ? '#24405f' : (hov ? '#2a4565' : 'rgba(23,41,63,.96)');
            ctx.fill();
            ctx.strokeStyle = cur ? C.acc : C.line;
            ctx.lineWidth = open ? 2 : 1.5;
            ctx.stroke();
            txt(cur || '— Pilih —', P.x + 22, sy + 19, { s: 12, c: cur ? C.text : C.mute, w: 700 });
            txt(open ? '▲' : '▼', P.x + P.w - 24, sy + 19, { s: 10, a: 'center', c: C.acc, w: 800 });
            hit(P.x + 10, sy, P.w - 20, 28, () => toggleField(f.key));
        });

        // Penjelasan gateway
        const divY = fieldSelectorY('subnet') + 42;
        ctx.beginPath(); ctx.moveTo(P.x + 12, divY); ctx.lineTo(P.x + P.w - 12, divY);
        ctx.strokeStyle = 'rgba(56,189,248,.25)'; ctx.lineWidth = 1; ctx.stroke();

        // Info gateway tidak diperlukan
        txt('Gateway: tidak diperlukan', P.x + P.w / 2, divY + 14, { s: 9, a: 'center', c: C.mute, w: 700 });
        txt('(koneksi lokal PC ke PC)', P.x + P.w / 2, divY + 26, { s: 8.5, a: 'center', c: C.mute, w: 700 });

        // === PING TEST ===
        const PY = divY + 40;
        txt('PING TEST', P.x + P.w / 2, PY, { s: 13, a: 'center', c: C.acc, w: 800 });
        const can = canPing();
        const pingReady = linkOK() && lv.ipConfig.pc1 && lv.ipConfig.pc2 && lv.ipConfig.subnet;
        btn(P.x + 10, PY + 16, P.w - 20, 32, 'Ping PC2', () => { closeField(); doPing('pc2'); }, { s: 13, color: C.ok, disabled: !can });

        // Output ping
        const ry = PY + 56;
        if (lv.pingResult) {
            rr(P.x + 10, ry, P.w - 20, 84, 8);
            ctx.fillStyle = 'rgba(6,14,26,.9)'; ctx.fill();
            ctx.strokeStyle = lv.pingResult === 'ok' ? C.ok : C.bad; ctx.lineWidth = 1.5; ctx.stroke();
            const resultText = lv.pingResult === 'ok' ? ('Reply from ' + (lv.lastPingIp || '192.168.10.11')) : 'Request timed out';
            const subText = lv.pingResult === 'ok' ? 'bytes=32 time=1ms TTL=128' : 'Destination unreachable';
            txt(resultText, P.x + P.w / 2, ry + 22, { s: 11.5, a: 'center', c: lv.pingResult === 'ok' ? C.ok : C.bad, w: 700 });
            txt(subText, P.x + P.w / 2, ry + 42, { s: 10, a: 'center', c: C.mute, w: 700 });
            txt('Paket: ' + lv.pingPackets.sent + ' terkirim, ' + lv.pingPackets.received + ' diterima', P.x + P.w / 2, ry + 60, { s: 9.5, a: 'center', c: C.mute, w: 700 });
        } else {
            txt('Hasil ping akan tampil di sini', P.x + P.w / 2, ry + 24, { s: 11, a: 'center', c: C.mute, w: 700 });
        }

        // === DROPDOWN ===
        if (lv.openField) {
            const f = FIELDS.find(x => x.key === lv.openField);
            const sy = fieldSelectorY(f.key);
            const ox = P.x + 10, ow = P.w - 20;
            const oy0 = sy + 28 + 6;
            rr(ox - 1, oy0 - 2, ow + 2, f.options.length * 30 + 2, 10);
            ctx.fillStyle = 'rgba(10,20,34,.98)'; ctx.fill();
            ctx.strokeStyle = 'rgba(56,189,248,.5)'; ctx.lineWidth = 1.5; ctx.stroke();
            f.options.forEach((opt, i) => {
                const oy = oy0 + i * 30;
                const sel = lv.ipConfig[f.key] === opt;
                const hov = over(ox + 1, oy + 1, ow - 2, 28);
                rr(ox + 1, oy + 1, ow - 2, 28, 7);
                ctx.fillStyle = sel ? '#1d4f74' : (hov ? '#2a4565' : 'rgba(23,41,63,.96)');
                ctx.fill();
                ctx.strokeStyle = sel ? C.acc : C.line; ctx.lineWidth = 1; ctx.stroke();
                txt(opt, ox + 14, oy + 20, { s: 12, c: sel ? C.text : C.mute, w: 700 });
                if (sel) tickIcon(ox + ow - 22, oy + 15, 9, C.ok);
                hit(ox + 1, oy + 1, ow - 2, 28, () => {
                    lv.ipConfig[f.key] = opt;
                    lv.openField = null;
                    l5Flash(f.label + ': ' + opt, 'info');
                    SND.klik();
                });
            });
        }
    }

    /* ================================================================
       FOOTER — Andi + Dialog + Bantuan
       ================================================================ */
    function drawAndiBar(now) {
        const B = BAR;
        rr(B.x, B.y, B.w, B.h, 12);
        ctx.fillStyle = 'rgba(11,21,35,.97)'; ctx.fill();
        ctx.strokeStyle = C.line; ctx.lineWidth = 1.5; ctx.stroke();

        const mood = lv.andiTip ? 'talk' : 'idle';
        drawAndi(B.x + 40, B.y + 23, 0.26, mood, now / 1000);

        const tipX = B.x + 78;
        const tipW = B.w - 78 - 108;
        const tipText = (lv.andiTip && now < lv.andiUntil)
            ? lv.andiTip
            : 'Andi siap membantu. Klik Bantuan jika perlu langkah.';
        rr(tipX, B.y + 17, tipW, 30, 9);
        ctx.fillStyle = C.panel; ctx.fill();
        ctx.strokeStyle = 'rgba(56,189,248,.35)'; ctx.lineWidth = 1; ctx.stroke();
        const lines = wrapLines(tipText, tipW - 18, 11, 700);
        lines.slice(0, 2).forEach((l, i) => {
            txt(l, tipX + 9, B.y + 30 + i * 14, { s: 11, c: C.text, w: 700 });
        });

        btn(B.x + B.w - 104, B.y + 17, 94, 30, 'Bantuan', () => useHint(), { s: 12, color: lv.hintUsed ? '#334155' : C.warn, disabled: lv.hintUsed });
    }

    /* ================================================================
       FLASH MESSAGE
       ================================================================ */
    function drawFlash(now) {
        const f = lv.flash;
        if (!f || now - f.t > 5200) return;
        const col = f.kind === 'bad' ? C.bad : f.kind === 'ok' ? C.ok : C.acc;
        const x = AX + 15, y = AY + AH - 44, w = AW - 30, h = 32;
        rr(x, y, w, h, 6);
        ctx.fillStyle = 'rgba(7,16,28,.96)'; ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = col; ctx.stroke();
        ctx.fillStyle = col; ctx.fillRect(x + 1, y + 8, 3, h - 16);
        const lines = wrapLines(f.msg, w - 25, 10, 700);
        lines.slice(0, 2).forEach((l, i) => txt(l, x + 12, y + 14 + i * 12, { s: 10, c: C.text, w: 700 }));
    }

    /* ================================================================
       INTERAKSI — KABEL DINAMIS
       ================================================================ */
    function startDrag(cable, from, p) {
        lv.drag = { cable: cable, from: from, x0: p.x, y0: p.y };
        lv.dragStart = { x: p.x, y: p.y };
    }

    function endDrag(d, p) {
        const c = d.cable;
        const moved = Math.hypot(p.x - (d.x0 || p.x), p.y - (d.y0 || p.y));
        const pc = pcAt(p);

        // Klik tanpa geser dari tray
        if (d.from === 'tray' && moved < 6 && !pc) {
            // Pilih kabel
            if (c.type === 'crossover') {
                lv.selectedCableType = 'crossover';
                lv.cableChoiceCorrect = true;
                l5Flash('Kabel crossover dipilih!', 'ok');
                SND.klik();
            } else {
                lv.selectedCableType = 'straight';
                lv.cableChoiceCorrect = false;
                lv.cablePickAttempts++;
                l5Flash('PC ke PC membutuhkan kabel crossover karena kedua perangkat memiliki tipe yang sama.', 'bad');
                l5Andi('Straight-Through tidak cocok untuk PC ke PC. Gunakan kabel crossover.');
                SND.salah();
            }
            return;
        }

        if (pc) {
            if (pc.cable && pc.cable !== c.id) {
                l5Flash(pc.name + ' sudah punya kabel.', 'bad');
                SND.salah();
                return;
            }
            // Tolak kabel straight untuk PC ke PC
            if (c.type !== 'crossover') {
                l5Flash('PC ke PC membutuhkan kabel crossover karena kedua perangkat memiliki tipe yang sama.', 'bad');
                l5Andi('Kabel straight untuk PC ke PC tidak cocok. Gunakan kabel crossover untuk menukar jalur Tx dan Rx.');
                SND.salah();
                return;
            }
            // Tentukan apakah ini ujung pertama atau kedua
            if (!c.pc) {
                // Ujung pertama
                detachPort(c, true);
                attachPc(c, pc.id);
                c.free = { x: clamp(p.x, AX + 8, AX + AW - 8), y: clamp(p.y, AY + 8, AY + AH - 8) };
                l5Flash('Kabel tersambung ke ' + pc.name + '. Seret ujung satunya ke PC lain.', 'ok');
            } else if (!c.port && c.pc !== pc.id) {
                // Ujung kedua
                attachPort(c, pc.id);
                const originPc = PCS.find(p => p.id === c.pc);
                if (originPc && !originPc.negoUntil) {
                    originPc.plugAnim = { t0: performance.now(), dur: 420 };
                    originPc.negoUntil = performance.now() + 900;
                }
                l5Flash('Kabel crossover terpasang! PC1 ↔ PC2 terhubung.', 'ok');
                SND.benar();
            } else {
                l5Flash('Kabel sudah terhubung.', 'info');
            }
            return;
        }

        // Lepas kabel
        if (d.from === 'port' || d.from === 'pc') {
            detachPort(c, true);
            c.free = { x: clamp(p.x, AX + 8, AX + AW - 8), y: clamp(p.y, AY + 8, AY + AH - 8) };
            l5Flash('Kabel dilepas. Link mati.', 'info');
        }
    }

    /* ================================================================
       PING
       ================================================================ */
    function doPing(target) {
        if (lv.phase !== 'play') return;
        if (lv.modal) return;
        if (!canPing()) {
            l5Flash('Belum bisa ping. Pastikan kabel, link, dan IP sudah siap.', 'bad');
            return;
        }

        const targetIp = target === 'pc2' ? lv.ipConfig.pc2 : null;
        lv.lastPingIp = targetIp;
        lv.pingPackets = { sent: 4, received: 0, lost: 0 };

        const sameNetwork = target === 'pc2' &&
            lv.ipConfig.pc1.substring(0, lv.ipConfig.pc1.lastIndexOf('.')) ===
            lv.ipConfig.pc2.substring(0, lv.ipConfig.pc2.lastIndexOf('.'));
        const subnetOk = lv.ipConfig.subnet === '255.255.255.0';
        const noConflict = lv.ipConfig.pc1 !== lv.ipConfig.pc2;

        if (target === 'pc2' && (!sameNetwork || !subnetOk || !noConflict)) {
            lv.pingResult = 'fail';
            lv.pingPackets.lost = 4;
            l5Flash('Ping gagal! Periksa konfigurasi IP.', 'bad');
            l5Andi('Ping gagal. Cek apakah IP PC1 dan PC2 dalam subnet yang sama.');
            SND.salah();
            return;
        }

        lv.pingResult = 'ok';
        lv.pingPackets.received = 4;
        lv.lastPingTarget = target;
        l5Flash('Ping berhasil!', 'ok');
        SND.benar();

        if (target === 'pc2') {
            lv.pingPc2 = true;
            lv.pingWinAt = performance.now() + 900;
            l5Andi('Excellent! Ping berhasil. PC1 dan PC2 bisa berkomunikasi langsung.');
        }
    }

    /* ================================================================
       PING SUCCESS MODAL
       ================================================================ */
    function showPingSuccessModal() {
        lv.phase = 'pingSuccess';
        lv.modal = 'pingSuccess';
    }

    function drawPingSuccessModal(now) {
        btns.length = 0;
        ctx.fillStyle = 'rgba(4,10,20,.85)';
        ctx.fillRect(0, 54, W, H - 54);
        const x = 180, y = 120, w = 600, h = 260;
        rr(x, y, w, h, 18);
        ctx.fillStyle = C.panel; ctx.fill();
        ctx.strokeStyle = C.ok; ctx.lineWidth = 2; ctx.stroke();
        txt('Jaringan berhasil terhubung!', x + w / 2, y + 36, { s: 22, f: FONT_H, a: 'center', c: C.ok, w: 600 });
        txt('PC1 dan PC2 berhasil berkomunikasi langsung menggunakan kabel crossover.', x + w / 2, y + 78, { s: 14, a: 'center', c: C.text, w: 560 });
        btn(x + w / 2 - 100, y + h - 60, 200, 36, 'Lanjut Evaluasi', () => {
            startQuiz();
        }, { s: 13, color: C.ok });
    }

    /* ================================================================
       TROUBLESHOOTING
       ================================================================ */
    function drawTroubleshootModal(now) {
        ctx.fillStyle = 'rgba(4,10,20,.85)'; ctx.fillRect(0, 54, W, H - 54);
        const x = 100, y = 60, w = 760, h = 480;
        rr(x, y, w, h, 18);
        ctx.fillStyle = C.panel; ctx.fill();
        ctx.strokeStyle = C.warn; ctx.lineWidth = 2; ctx.stroke();

        txt('TROUBLESHOOTING', x + w / 2, y + 36, { s: 24, f: FONT_H, a: 'center', c: C.warn, w: 600 });

        const ts = TROUBLESHOOT_CASES;
        const caseH = 100;
        ts.forEach((tc, i) => {
            const cy = y + 60 + i * caseH;
            // Symptom
            txt('Gejala: ' + tc.symptom, x + 20, cy + 18, { s: 12, w: 800, c: C.text });
            txt('Penyebab: ' + tc.networkInfo, x + 20, cy + 36, { s: 11, w: 700, c: C.mute });

            // Choices
            tc.choices.forEach((ch, j) => {
                const bx = x + 20 + j * 240, by = cy + 48, bw = 230, bh = 36;
                const hov = over(bx, by, bw, bh);
                const done = lv['ts_' + tc.id] === j;
                const correct = ch.correct;

                rr(bx, by, bw, bh, 8);
                ctx.fillStyle = done ? (correct ? C.ok : C.bad) : (hov ? '#2a4565' : 'rgba(23,41,63,.96)');
                ctx.fill();
                ctx.strokeStyle = done ? (correct ? C.ok : C.bad) : C.line;
                ctx.lineWidth = 1.5; ctx.stroke();
                txt(ch.text, bx + bw / 2, by + 22, { s: 11, a: 'center', c: done ? '#fff' : C.text, w: 700 });
                hit(bx, by, bw, bh, () => {
                    lv['ts_' + tc.id] = j;
                    if (correct) {
                        lv.troubleshootDone = ts.every(t => lv['ts_' + t.id] !== undefined && lv['ts_' + t.id] === t.choices.findIndex(c => c.correct));
                        l5Flash(tc.why, 'ok');
                        SND.benar();
                        if (lv.troubleshootDone) {
                            if (!lv.badges.includes('Network Troubleshooter')) lv.badges.push('Network Troubleshooter');
                        }
                    } else {
                        l5Flash(tc.why, 'bad');
                        SND.salah();
                    }
                });
            });
        });

        btn(x + w / 2 - 70, y + h - 46, 140, 36, 'Tutup', () => { lv.modal = null; }, { s: 14, color: C.acc });
    }

    /* ================================================================
       QUIZ
       ================================================================ */
    function startQuiz() {
        lv.phase = 'quiz';
        lv.modal = null;
        lv.quiz = {
            list: lv.quizzes,
            idx: 0,
            picked: null,
            correct: 0,
            answers: [],
            feedback: null
        };
        l5Andi('Jawab 4 soal evaluasi. Baca dengan teliti.');
    }

    function pickQuiz(i) {
        const qz = lv.quiz;
        if (!qz || qz.picked !== null) return;
        const q = qz.list[qz.idx];
        if (!q) return;
        qz.picked = i;
        qz.answers[qz.idx] = i;
        if (i === q.ans) {
            qz.correct++;
            l5Flash('Jawaban benar!', 'ok');
            SND.benar();
        } else {
            lv.penalize(10, 'Jawaban kuis salah');
            SND.salah();
        }
        qz.feedback = { ok: i === q.ans, why: q.why };
    }

    function nextQuiz() {
        const qz = lv.quiz;
        if (!qz || qz.picked === null) return;
        if (qz.idx < qz.list.length - 1) {
            qz.idx++;
            qz.picked = null;
            qz.feedback = null;
        } else {
            finishQuiz();
        }
    }

    function finishQuiz() {
        const qz = lv.quiz;
        lv.quizCorrect = qz.correct;
        lv.quizTotal = qz.list.length;
        if (!lv.badges.includes('Direct Connection')) lv.badges.push('Direct Connection');
        if (lv.cableChoiceCorrect && !lv.badges.includes('Crossover Expert')) lv.badges.push('Crossover Expert');
        if (!lv.hintUsed && !lv.badges.includes('TANPA BANTUAN')) lv.badges.push('TANPA BANTUAN');
        lv.logExtra.bantuan = lv.hintUsed ? 1 : 0;
        lv.logExtra.lencana = lv.badges.join(', ');
        endLevel(lv, true);
    }

    function drawQuizPhase(now) {
        btns.length = 0;
        deskBG();
        ctx.fillStyle = 'rgba(4,10,20,.85)';
        ctx.fillRect(0, 54, W, H - 54);

        const x = 150, y = 78, w = 660, h = 452;
        rr(x, y, w, h, 18);
        ctx.fillStyle = C.panel; ctx.fill();
        ctx.strokeStyle = C.warn; ctx.lineWidth = 2; ctx.stroke();

        const qz = lv.quiz;
        const q = qz.list[qz.idx];
        if (!q) return;

        txt('KUIS LEVEL 5', x + w / 2, y + 30, { s: 22, f: FONT_H, a: 'center', c: C.warn, w: 600 });
        txt('Pertanyaan ' + (qz.idx + 1) + ' dari ' + qz.list.length, x + w / 2, y + 52, { s: 13, a: 'center', c: C.mute, w: 600 });
        para(q.q, x + w / 2, y + 84, w - 80, 22, { s: 16, a: 'center', c: C.text, w: 700 });

        const optY = y + 140, optH = 40, optGap = 8;
        q.opts.forEach((opt, i) => {
            const oy = optY + i * (optH + optGap);
            let color = '#2b4360', tc = C.text, dis = false;
            for (qz.picked !== null) {
                dis = true;
                if (i === q.ans) { color = C.ok; tc = '#04160f'; }
                else if (i === qz.picked) { color = '#5b2530'; tc = '#f5b5bd'; }
                else { color = '#22344a'; tc = C.mute; }
            }
            btn(x + 30, oy, w - 60, optH, opt, () => pickQuiz(i), { color: color, tc: tc, disabled: dis, s: 14 });
        });

        if (qz.picked !== null) {
            const fb = qz.feedback;
            const fy = optY + 4 * (optH + optGap) + 6;
            txt(fb.ok ? '✓ Benar' : '✗ Salah', x + 40, fy, { s: 14, w: 800, c: fb.ok ? C.ok : C.bad });
            para(fb.why, x + 40, fy + 20, w - 80, 16, { s: 12, c: C.text, w: 600 });
            const last = qz.idx === qz.list.length - 1;
            btn(x + w / 2 - 110, y + h - 58, 220, 40, last ? 'Lihat Rapor' : 'Lanjut ▸', () => nextQuiz(), { s: 14, color: C.ok });
        }
    }

    /* ================================================================
       HINT SYSTEM
       ================================================================ */
    function useHint() {
        if (lv.hintUsed) return;
        const now = performance.now();
        if (lv.helpFree > 0) {
            lv.helpFree--; lv.hintUsed = true; lv.modal = 'hint';
            say('Bantuan gratis dipakai.', 'info');
        } else if (now > lv.helpUntil) {
            lv.penalize(5, 'Memakai bantuan −5 poin');
            lv.hintUsed = true; lv.modal = 'hint';
            lv.helpUntil = now + 1200;
        }
    }

    function drawHintModal(now) {
        ctx.fillStyle = 'rgba(4,10,20,.85)'; ctx.fillRect(0, 54, W, H - 54);
        const x = 280, y = 150, w = 400, h = 300;
        rr(x, y, w, h, 18);
        ctx.fillStyle = C.panel; ctx.fill();
        ctx.strokeStyle = C.warn; ctx.lineWidth = 2; ctx.stroke();
        txt('BANTUAN', x + w / 2, y + 40, { s: 24, f: FONT_H, a: 'center', c: C.warn, w: 600 });
        const hints = [
            '1. Pilih kabel Crossover (bukan Straight-Through)',
            '2. Seret kabel dari panel kiri ke port RJ45 PC1',
            '3. Seret ujung lain ke port RJ45 PC2',
            '4. LED hijau = link aktif',
            '5. PC1: 192.168.10.10, PC2: 192.168.10.11',
            '6. Subnet mask: 255.255.255.0',
            '7. Gateway tidak diperlukan untuk PC ke PC langsung'
        ];
        hints.forEach((h, i) => { txt(h, x + 30, y + 80 + i * 30, { s: 13, c: C.text, w: 600 }); });
        btn(x + w / 2 - 70, y + h - 50, 140, 36, 'Tutup', () => { lv.modal = null; }, { s: 14, color: C.acc });
    }

    /* ================================================================
       RAPOR HASIL LEVEL 5
       ================================================================ */
    function infoRow(l, label, val, y) {
        txt(label, l.x, y, { s: 13, c: C.mute, w: 600 });
        txt(val, l.x + l.w, y, { s: 13, c: C.text, w: 700, a: 'right' });
    }

    lv.makeResult = function (l, ok, stars, isNewBest) {
        return {
            draw() {
                bg(false);
                const x = 150, y = 46, w = 660, h = 512;
                rr(x, y, w, h, 20);
                ctx.fillStyle = C.panel; ctx.fill();
                ctx.strokeStyle = ok ? C.ok : C.bad; ctx.lineWidth = 2; ctx.stroke();

                txt(ok ? 'LEVEL 5 SELESAI' : 'WAKTU HABIS', W / 2, y + 48, { s: 30, f: FONT_H, a: 'center', c: ok ? C.ok : C.bad, w: 600 });
                txt('Teknologi Jaringan Lanjutan — Simulasi Kabel Crossover', W / 2, y + 74, { s: 13, a: 'center', c: C.mute });
                if (isNewBest) txt('REKOR BARU!', W / 2, y + 96, { s: 15, f: FONT_H, a: 'center', c: C.warn, w: 600 });

                // Bintang
                for (let i = 0; i < 3; i++) star(W / 2 - 56 + i * 56, y + 128, 22, i < stars);
                txt(l.score, W / 2, y + 196, { s: 56, f: FONT_H, a: 'center', c: C.warn, w: 600 });
                txt('skor akhir', W / 2, y + 216, { s: 12, a: 'center', c: C.mute });

                const rowY = y + 246, dy = 28;
                infoRow(l, 'Waktu', fmt(l.dur), rowY);
                infoRow(l, 'Jawaban benar', (l.quizCorrect || 0) + ' / ' + (l.quizTotal || (l.quizzes ? l.quizzes.length : 0)), rowY + dy);
                infoRow(l, 'Kesalahan', l.mistakes.length, rowY + dy * 2);
                infoRow(l, 'Bantuan', l.hintUsed ? 'Dipakai' : 'Tidak dipakai', rowY + dy * 3);

                txt('Lencana', x + 60, rowY + dy * 4 + 6, { s: 13, c: C.acc, w: 800 });
                const badge = (l.badges && l.badges.length) ? l.badges.join('  •  ') : '—';
                txt('🏅 ' + badge, x + 60, rowY + dy * 4 + 30, { s: 14, c: C.warn, w: 700 });

                btn(x + 40, y + h - 66, 180, 44, 'Ulangi Level', () => startLevel(l.idx), { color: '#334155', tc: C.text, s: 14 });
                if (ok && l.n < levelTotal()) btn(x + w - 40 - 200, y + h - 66, 200, 44, 'Lanjut Level 6', () => startLevel(l.n), { color: C.ok, s: 14 });
                else btn(x + w - 40 - 200, y + h - 66, 200, 44, 'Pilih Level', () => go(levelsScene), { color: C.acc, s: 14 });
            }
        };
    };

    /* ================================================================
       MAIN DRAW
       ================================================================ */
    lv.draw = function () {
        lv.tick();
        const now = performance.now();

        if (lv.limit && !lv.finished && lv.phase === 'play' && lv.elapsed() > lv.limit) {
            lv.finished = true; lv.dur = lv.limit; endLevel(lv, false); return;
        }

        if (lv.phase === 'brief') {
            lv.t0 = now;
            const dt = Math.min(0.05, (now - lv.tPrev) / 1000);
            lv.tPrev = now;
            if (lv.briefPage < BRIEF_PAGES.length && BRIEF_PAGES[lv.briefPage].text && lv.briefShown < BRIEF_PAGES[lv.briefPage].text.length) {
                lv.briefShown = Math.min(BRIEF_PAGES[lv.briefPage].text.length, lv.briefShown + dt * 55);
            }
            drawBrief(now); return;
        }

        if (lv.phase === 'quiz') { drawQuizPhase(now); return; }

        if (lv.phase === 'play' && lv.pingWinAt && now >= lv.pingWinAt) {
            lv.pingWinAt = 0;
            if (lv.pingPc2 && lv.pingResult === 'ok') showPingSuccessModal();
        }

        updateLinks(now);

        deskBG(); hud(lv);
        drawLeftPanel(now);
        drawNetworkArea(now);
        updateLinks(now);
        drawRightPanel(now);
        drawAndiBar(now);
        drawFlash(now);

        if (lv.modal === 'pingSuccess') drawPingSuccessModal(now);
        if (lv.modal === 'hint') drawHintModal(now);
        if (lv.modal === 'troubleshoot') drawTroubleshootModal(now);

        l5TickAnim(now);
    };

    /* ================================================================
       INPUT HANDLING
       ================================================================ */
    lv.down = function (p) {
        if (lv.openField) lv.openField = null;

        if (lv.phase === 'brief') {
            if (lv.briefPage < BRIEF_PAGES.length) {
                if (BRIEF_PAGES[lv.briefPage].text && lv.briefShown < BRIEF_PAGES[lv.briefPage].text.length) { lv.briefShown = BRIEF_PAGES[lv.briefPage].text.length; }
                else { lv.briefPage++; lv.briefShown = 0; }
            }
            return;
        }
        if (lv.phase !== 'play') return;
        if (lv.modal) return;

        // 1) Ambil kabel yang sudah terpasang
        for (let i = lv.cables.length - 1; i >= 0; i--) {
            const c = lv.cables[i];
            if (c.pc || c.port) {
                if (distToCable(c, p) < 12) {
                    startDrag(c, c.port != null ? 'port' : 'pc', p);
                    return;
                }
            }
        }

        // 2) Ambil kabel dari tray (panel kiri)
        for (let i = 0; i < lv.cables.length; i++) {
            const c = lv.cables[i];
            if (!c.pc && !c.port) {
                const cy = CABLE_ROWS[c.index];
                if (inR(p, { x: PL.x + 6, y: cy - 23, w: PL.w - 12, h: 46 })) {
                    startDrag(c, 'tray', p);
                    return;
                }
            }
        }
    };

    lv.move = function () {};

    lv.up = function (p) {
        if (!lv.drag) return;
        const d = lv.drag;
        lv.drag = null;
        endDrag(d, p);
    };

    return lv;
}

/* ---------- pendaftaran level ---------- */
registerLevel(5, {
    t: 'Teknologi Jaringan Lanjutan — Simulasi Kabel Crossover',
    m: 'Hubungkan PC1 dan PC2 langsung dengan kabel crossover, konfigurasi IP, lalu uji koneksi dengan ping.',
    desc: 'Level 5: PC ke PC langsung menggunakan kabel crossover. Pilih kabel crossover, pasang ke port RJ45 PC1 dan PC2, konfigurasi IP (tanpa gateway), uji dengan ping, jawab kuis, dan lihat rapor dengan bintang dan badge.',
    mk: makeL5
});
