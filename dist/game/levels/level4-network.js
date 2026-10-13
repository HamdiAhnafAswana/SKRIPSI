// ==========================================================================
// levels/level4-network.js
// LEVEL 4 — Simulasi Penggunaan Kabel Jaringan pada Laboratorium
// ------------------------------------------------------------------
// Layout 960x600 (satu koordinat desain, diskalakan CSS oleh App):
//   Header          y 0..54      — HUD Level (core hud)
//   Panel Kiri      10..194      — MISI, KABEL (2 straight), STATUS
//   Area Tengah     204..736     — PC1, PC2, Switch 8-port, kabel dinamis
//   Panel Kanan     746..950     — KONFIGURASI (dropdown) + PING TEST
//   Footer          10..950, y 536..600 — Andi + Dialog + Bantuan
//
// Alur fase:  brief → play → pingSuccess → quiz → (endLevel) → RAPOR
//   play        : pasang kabel (drag), konfigurasi IP, ping
//   pingSuccess : modal "Jaringan berhasil terhubung!" → tombol Lanjut Evaluasi
//   quiz        : 4 soal dari bank soal (state stabil, feedback per jawaban)
//   RAPOR       : lv.makeResult → LEVEL 4 SELESAI (skor, waktu, benar/salah,
//                 bantuan, bintang, badge) + Ulangi Level / Lanjut Level 5
//
// Kabel dinamis: setiap kabel punya state pc (connectedDevice) & port
// (connectedPort). Kabel bisa di-drag dari tray, dari port, dipindahkan ke
// port lain, atau dilepas (link mati). Visual = hitbox = state koneksi.
// ==========================================================================

function makeL4() {
    const lv = baseLevel(4, 'Simulasi Penggunaan Kabel Jaringan');
    lv.idx = 3;
    lv.limit = 600;
    lv.boardKey = 'board4';

    /* ================================================================
       TATA LETAK — Canvas 960x600
       ================================================================ */
    const HDR_H = 54;
    const TOP = HDR_H + 8;                       // 62
    const FOOT_H = 64;                           // footer selebar dasar layar
    const FOOT_Y = H - FOOT_H;                   // 536
    const BOTTOM = FOOT_Y - 10;                  // 526 — tepi bawah area permainan
    const PL = { x: 10, y: TOP, w: 184, h: BOTTOM - TOP };
    const PR = { x: 746, y: TOP, w: 204, h: BOTTOM - TOP };
    const AX = 204, AY = TOP, AW = 532, AH = BOTTOM - TOP;
    const BAR = { x: 10, y: FOOT_Y, w: 940, h: FOOT_H };

    /* --- Perangkat jaringan (proporsional terhadap area tengah) --- */
    const PC1 = { x: AX + 36, y: AY + 38, w: 132, h: 96 };
    const PC2 = { x: AX + AW - 168, y: AY + 38, w: 132, h: 96 };
    const SWITCH = { x: AX + 64, y: AY + 270, w: AW - 128, h: 148 };
    const PORT_Y = SWITCH.y + 76;
    const PORT_W = 26, PORT_H = 28, PORT_GAP = 20;
    const PORT_START_X = SWITCH.x + Math.round((SWITCH.w - (8 * PORT_W + 7 * PORT_GAP)) / 2);

    /* --- Warna kabel --- */
    const CABLE_COLORS = {
        straight: { name: 'Straight-Through', color: '#3b82f6', desc: 'PC ⇄ Switch' }
    };

    /* --- Baris kartu kabel di panel kiri: 2 kabel straight --- */
    const CABLE_ROWS = [PL.y + 128, PL.y + 182];

    /* --- State port switch --- */
    const PORTS = Array(8).fill(null).map((_, i) => ({
        id: i + 1,
        x: PORT_START_X + i * (PORT_W + PORT_GAP),
        y: PORT_Y,
        cable: null,
        occupied: false,
        linkLED: false,
        actLED: false,
        negoUntil: 0,
        plugAnim: null
    }));

    /* --- State PC --- */
    const PCS = [
        { id: 'pc1', name: 'PC 1', x: PC1.x, y: PC1.y, w: PC1.w, h: PC1.h, ip: null, cable: null },
        { id: 'pc2', name: 'PC 2', x: PC2.x, y: PC2.y, w: PC2.w, h: PC2.h, ip: null, cable: null }
    ];

    /* --- Kabel dinamis: 2 kabel straight, masing-masing bisa dipindah --- */
    const CABLES = [
        { id: 'c1', index: 0, type: 'straight', pc: null, port: null, free: null },
        { id: 'c2', index: 1, type: 'straight', pc: null, port: null, free: null }
    ];

    /* --- Pilihan konfigurasi --- */
    const IP_OPTIONS = {
        pc1: ['192.168.1.10', '192.168.1.20', '192.168.2.10', '10.0.0.10'],
        pc2: ['192.168.1.11', '192.168.1.21', '192.168.2.11', '10.0.0.11'],
        subnet: ['255.255.255.0', '255.255.0.0', '255.0.0.0', '255.255.255.128'],
        gateway: ['192.168.1.1', '192.168.1.254', '10.0.0.1', '172.16.0.1']
    };

    /* --- Kolom konfigurasi panel kanan (urutan: PC1 IP, PC2 IP, Subnet, Gateway) --- */
    const FIELDS = [
        { key: 'pc1', label: 'PC1 IP', options: IP_OPTIONS.pc1 },
        { key: 'pc2', label: 'PC2 IP', options: IP_OPTIONS.pc2 },
        { key: 'subnet', label: 'Subnet Mask', options: IP_OPTIONS.subnet },
        { key: 'gateway', label: 'Gateway', options: IP_OPTIONS.gateway }
    ];
    function fieldSelectorY(key) {
        let y = PR.y + 38;
        for (const f of FIELDS) {
            if (f.key === key) return y + 14;
            y += 14 + 28 + 10;
        }
        return y;
    }

    /* --- State permainan --- */
    lv.phase = 'brief';
    lv.cables = CABLES;
    lv.drag = null;
    lv.dragStart = null;
    lv.ipConfig = { pc1: null, pc2: null, subnet: null, gateway: null };
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

    /* --- Kompatibilitas: daftar kabel yang sudah terpasang di port --- */
    Object.defineProperty(lv, 'placedCables', {
        get: () => lv.cables.filter(c => c.port != null)
    });

    /* --- Bank soal kuis --- */
    const QUIZ_BANK = [
        { q: 'Kabel apa yang digunakan untuk menghubungkan PC ke Switch?', ans: 0, opts: ['Straight-Through', 'Crossover', 'Console', 'Coaxial'], why: 'PC ke Switch memerlukan kabel Straight-Through karena perangkat berbeda jenis (DTE ke DCE).' },
        { q: 'Apa fungsi LED hijau pada port switch?', ans: 1, opts: ['Menunjukkan aktivitas data', 'Menunjukkan koneksi link aktif', 'Menunjukkan daya listrik', 'Menunjukkan error'], why: 'LED hijau menunjukkan link aktif — kabel terhubung dengan benar dan koneksi fisik berhasil.' },
        { q: 'Jika ping dari PC1 ke PC2 gagal, apa yang harus diperiksa pertama kali?', ans: 2, opts: ['IP address', 'Subnet mask', 'Kabel dan LED link', 'Gateway'], why: 'Troubleshooting dimulai dari layer fisik: periksa kabel dan LED link sebelum konfigurasi IP.' },
        { q: 'Apa yang dimaksud dengan IP address?', ans: 0, opts: ['Alamat unik perangkat di jaringan', 'Nama komputer', 'Alamat MAC', 'Port number'], why: 'IP address adalah alamat logis unik yang digunakan perangkat untuk berkomunikasi di jaringan.' },
        { q: 'Subnet mask 255.255.255.0 berarti...', ans: 1, opts: ['254 host per jaringan', '256 host per jaringan', '255 host per jaringan', '253 host per jaringan'], why: 'Subnet mask 255.255.255.0 (/24) menyediakan 254 host (2^8 - 2) per jaringan.' },
        { q: 'Apa fungsi dari perintah ping?', ans: 2, opts: ['Mengirim file', 'Mengkonfigurasi IP', 'Menguji koneksi antar perangkat', 'Melihat daftar perangkat'], why: 'Ping mengirim paket ICMP echo request untuk menguji apakah perangkat tujuan dapat dijangkau.' }
    ];
    lv.quizzes = shuffle(QUIZ_BANK.slice()).slice(0, 4);

    /* ================================================================
       HELPER FUNCTIONS
       ================================================================ */
    const lerp = (a, b, t) => a + (b - a) * t;
    const easeOut = t => 1 - Math.pow(1 - t, 3);

    function l4Flash(msg, kind) { lv.flash = { msg, kind: kind || 'info', t: performance.now() }; }
    function l4Andi(msg, ms) { lv.andiTip = msg; lv.andiUntil = performance.now() + (ms || 9000); }
    function l4Anim(type, dur, done) { lv.anim = { type, t0: performance.now(), dur, done: done || null }; }
    function l4TickAnim(now) { const a = lv.anim; if (!a || now - a.t0 < a.dur) return; lv.anim = null; if (a.done) a.done(); }

    /* --- Geometri kabel & port --- */
    function pcJack(pc) { return { x: pc.x + pc.w / 2, y: pc.y + pc.h + 4 }; }
    function trayAnchor(c) { return { x: PL.x + PL.w / 2, y: CABLE_ROWS[c.index] }; }
    function portCenter(p) { return { x: p.x + PORT_W / 2, y: p.y + PORT_H / 2 }; }

    function portAnchor(p, now) {
        const base = portCenter(p);
        if (p.plugAnim) {
            const t = clamp((now - p.plugAnim.t0) / p.plugAnim.dur, 0, 1);
            base.y -= (1 - easeOut(t)) * 22;
            if (t >= 1) p.plugAnim = null;
        }
        return base;
    }

    function bez(a, b) {
        const dist = Math.hypot(b.x - a.x, b.y - a.y);
        const sag = clamp(dist * 0.28, 24, 90);
        return { c1: { x: a.x, y: a.y + sag }, c2: { x: b.x, y: b.y - sag } };
    }

    function bezPoint(a, c1, c2, b, t) {
        const u = 1 - t;
        return {
            x: u * u * u * a.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * b.x,
            y: u * u * u * a.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * b.y
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
        if (c.port) { const port = PORTS.find(x => x.id === c.port); if (port) b = portAnchor(port, now); }
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
        for (let t = 0; t <= 1; t += 1 / 20) {
            const q = bezPoint(a, ctl.c1, ctl.c2, b, t);
            best = Math.min(best, Math.hypot(p.x - q.x, p.y - q.y));
        }
        return best;
    }

    function portAt(p) {
        for (const port of PORTS) {
            if (p.x >= port.x - 8 && p.x <= port.x + PORT_W + 8 && p.y >= port.y - 18 && p.y <= port.y + PORT_H + 18) return port;
        }
        return null;
    }

    function pcAt(p) {
        for (const pc of PCS) if (inR(p, { x: pc.x - 6, y: pc.y - 6, w: pc.w + 12, h: pc.h + 20 })) return pc;
        return null;
    }

    function pcName(c) { const pc = PCS.find(p => p.id === c.pc); return pc ? pc.name : 'PC'; }

    function placedList() { return lv.cables.filter(c => c.pc && c.port); }

    function linkOK() {
        return lv.cables.length === 2 && lv.cables.every(c => {
            if (!c.pc || !c.port) return false;
            const port = PORTS.find(p => p.id === c.port);
            return port && port.linkLED;
        });
    }

    function canPing() {
        return linkOK() && lv.ipConfig.pc1 && lv.ipConfig.pc2 && lv.ipConfig.subnet;
    }

    /* --- Attach / detach kabel --- */
    function detachPort(c, resetPing) {
        const port = PORTS.find(x => x.cable === c.id);
        if (port) {
            port.cable = null; port.occupied = false;
            port.linkLED = false; port.actLED = false;
            port.negoUntil = 0; port.plugAnim = null;
        }
        c.port = null;
        if (resetPing !== false) { lv.pingResult = null; lv.pingPc2 = false; }
    }

    function attachPort(c, portId) {
        const port = PORTS.find(x => x.id === portId);
        if (!port) return;
        port.cable = c.id; port.occupied = true;
        port.linkLED = false; port.actLED = false;
        port.plugAnim = { t0: performance.now(), dur: 420 };
        port.negoUntil = performance.now() + 900;
        c.port = portId;
    }

    function attachPc(c, pcId) {
        const pc = PCS.find(x => x.id === pcId);
        if (!pc) return false;
        if (pc.cable && pc.cable !== c.id) return false;
        PCS.forEach(x => { if (x.cable === c.id && x.id !== pcId) x.cable = null; });
        pc.cable = c.id; c.pc = pcId;
        return true;
    }

    function updateLinks(now) {
        for (const p of PORTS) {
            if (!p.occupied) { p.linkLED = false; p.actLED = false; p.negoUntil = 0; continue; }
            if (p.negoUntil && now >= p.negoUntil) {
                p.negoUntil = 0;
                const c = lv.cables.find(k => k.id === p.cable);
                if (c && c.pc) {
                    p.linkLED = true; p.actLED = true;
                    l4Flash('Link aktif! LED hijau menyala di port ' + p.id, 'ok');
                    l4Andi('Link aktif di port ' + p.id + '. Koneksi fisik berhasil.');
                    SND.klik();
                }
            }
        }
    }

    /* ================================================================
       BRIEFING
       ================================================================ */
    const BRIEF_PAGES = [
        'Halo! Saya Andi. Hari ini kita akan mensimulasikan konfigurasi jaringan dasar di laboratorium komputer.',
        'Kita memiliki 2 PC dan switch. Tugasmu: menghubungkan kabel straight-through ke port switch, mengkonfigurasi IP, lalu menguji koneksi dengan ping.',
        'Misi: Hubungkan PC 1 dan PC 2 ke switch menggunakan kabel straight-through, konfigurasi jaringan, lalu pastikan koneksi berhasil.',
        'Perhatikan LED link di switch — LED hijau menyala berarti koneksi fisik berhasil. Klik "Ping" untuk menguji koneksi antar PC. Selamat bekerja!'
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
        const typing = lv.briefPage < BRIEF_PAGES.length && lv.briefShown < BRIEF_PAGES[lv.briefPage].length;
        drawAndi(AP.x + AP.w / 2, AP.y + 260, 0.86, typing ? 'talk' : 'idle', t);
        rr(AP.x + 30, AP.y + 418, AP.w - 60, 44, 10);
        ctx.fillStyle = 'rgba(56,189,248,.12)'; ctx.fill();
        ctx.strokeStyle = 'rgba(56,189,248,.4)'; ctx.lineWidth = 1.5; ctx.stroke();
        txt('Andi', AP.x + AP.w / 2, AP.y + 440, { s: 16, a: 'center', w: 800, c: C.text });
        txt('Teknisi Senior · SMK Nusantara', AP.x + AP.w / 2, AP.y + 455, { s: 10.5, a: 'center', c: C.mute });

        const RP = { x: 306, y: 70, w: 634, h: 490 };
        if (lv.briefPage < BRIEF_PAGES.length) {
            const full = BRIEF_PAGES[lv.briefPage];
            const shownText = full.slice(0, lv.briefShown);
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
            BRIEF_PAGES.forEach((_, i) => {
                const cx = RP.x + RP.w / 2 - (BRIEF_PAGES.length - 1) * 11 + i * 22;
                ctx.beginPath(); ctx.arc(cx, RP.y + RP.h - 22, 5, 0, 6.3);
                ctx.fillStyle = i === lv.briefPage ? C.acc : '#2a3a4e'; ctx.fill();
            });
        } else {
            const x = RP.x + 14, y = RP.y + 10, w = RP.w - 28, h = RP.h - 20;
            rr(x, y, w, h, 20);
            const cg = ctx.createLinearGradient(0, y, 0, y + h);
            cg.addColorStop(0, '#1e3a5c'); cg.addColorStop(1, '#132639');
            ctx.fillStyle = cg; ctx.fill();
            ctx.strokeStyle = 'rgba(52,211,153,.6)'; ctx.lineWidth = 2; ctx.stroke();
            txt('MISI', x + w / 2, y + 60, { s: 28, f: FONT_H, a: 'center', c: C.ok, w: 600 });
            para('Hubungkan PC 1 dan PC 2 ke switch menggunakan kabel yang benar, konfigurasi jaringan, lalu pastikan koneksi berhasil.', x + 40, y + 100, w - 80, 24, { s: 16, c: C.text, w: 600 });
            btn(x + w / 2 - 145, y + h - 72, 290, 52, 'Mulai Misi ▸', () => startPlay(), { s: 18, color: C.ok });
        }
    }

    function startPlay() {
        lv.phase = 'play';
        lv.t0 = performance.now();
        lv.tPrev = performance.now();
        l4Andi('Pilih kabel dari panel kiri, lalu seret ke port switch.');
        say('Pilih kabel dari panel kiri, lalu seret ke port switch.', 'info');
    }

    /* ================================================================
       PANEL KIRI — Misi, Kabel, Status
       ================================================================ */
    function drawLeftPanel(now) {
        const P = PL;
        rr(P.x, P.y, P.w, P.h, 14);
        ctx.fillStyle = 'rgba(11,21,35,.96)'; ctx.fill();
        ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.stroke();

        // Misi
        txt('MISI', P.x + P.w / 2, P.y + 24, { s: 12, a: 'center', c: C.acc, w: 800 });
        txt('Hubungkan PC1 & PC2', P.x + P.w / 2, P.y + 42, { s: 11, a: 'center', c: C.text, w: 700 });
        txt('ke Switch (port bebas)', P.x + P.w / 2, P.y + 57, { s: 11, a: 'center', c: C.text, w: 700 });

        // Daftar kabel — kartu dipakai sebagai titik asal seret (hit ditangani lv.down)
        txt('KABEL', P.x + P.w / 2, P.y + 90, { s: 11, a: 'center', c: C.mute, w: 800 });
        CABLES.forEach((c, i) => {
            const cy = CABLE_ROWS[i];
            const hov = over(P.x + 6, cy - 23, P.w - 12, 46);
            const dragging = lv.drag && lv.drag.cable === c;
            const attached = c.pc || c.port;
            rr(P.x + 6, cy - 23, P.w - 12, 46, 10);
            ctx.fillStyle = dragging ? '#1a2c42' : (hov ? '#243d5c' : 'rgba(23,41,63,.96)');
            ctx.fill();
            ctx.lineWidth = attached ? 2.5 : 1.5;
            ctx.strokeStyle = attached ? C.ok : C.line;
            ctx.stroke();

            // Ikon kabel
            ctx.beginPath(); ctx.arc(P.x + 24, cy, 8, 0, 6.3);
            ctx.fillStyle = CABLE_COLORS[c.type].color; ctx.fill();
            ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.stroke();

            txt(CABLE_COLORS[c.type].name + ' #' + (i + 1), P.x + 40, cy - 7, { s: 11, w: 800, c: C.text });
            txt(CABLE_COLORS[c.type].desc, P.x + 40, cy + 11, { s: 10, c: C.mute, w: 700 });

            // Status pemakaian
            if (attached) {
                const pc = PCS.find(p => p.id === c.pc);
                const port = PORTS.find(p => p.id === c.port);
                const st = (pc ? pc.name : '—') + (port ? ' · Port ' + port.id : ' · belum ke port');
                txt(st, P.x + P.w - 14, cy + 4, { s: 9.5, a: 'right', c: C.ok, w: 800 });
            } else {
                txt('siap', P.x + P.w - 14, cy + 4, { s: 9.5, a: 'right', c: C.mute, w: 800 });
            }
        });

        // Status langkah — selalu utuh di dalam panel
        const SY = P.y + 330;
        txt('STATUS', P.x + P.w / 2, SY, { s: 11, a: 'center', c: C.acc, w: 800 });
        const steps = [
            { label: 'Kabel terpasang', done: placedList().length >= 2 },
            { label: 'Link aktif', done: linkOK() },
            { label: 'IP terkonfigurasi', done: !!(lv.ipConfig.pc1 && lv.ipConfig.pc2 && lv.ipConfig.subnet) },
            { label: 'Ping PC2 berhasil', done: lv.pingPc2 }
        ];
        steps.forEach((s, i) => {
            const yy = SY + 20 + i * 28;
            ctx.beginPath(); ctx.arc(P.x + 18, yy - 3, 5, 0, 6.3);
            ctx.fillStyle = s.done ? C.ok : '#31465e'; ctx.fill();
            if (s.done) tickIcon(P.x + 18, yy - 3, 7, '#04160f');
            txt(s.label, P.x + 30, yy, { s: 11, c: s.done ? C.text : C.mute, w: 700 });
        });
    }

    /* ================================================================
       AREA TENGAH — Simulasi Jaringan
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
        drawSwitch(now);
        lv.cables.forEach(c => { if ((c.pc || c.port) || (lv.drag && lv.drag.cable === c)) drawCable(c, now); });
        if (lv.drag) drawDropHint();

        ctx.restore();
    }

    function drawPC(pc, now) {
        const { x, y, w, h } = pc;
        // Label nama di atas monitor (tidak tertutup kabel)
        txt(pc.name, x + w / 2, y - 14, { s: 13, a: 'center', c: C.text, w: 800 });
        // Monitor
        rr(x, y, w, h, 8);
        ctx.fillStyle = '#1e293b'; ctx.fill();
        ctx.strokeStyle = '#475569'; ctx.lineWidth = 2; ctx.stroke();
        // Screen
        rr(x + 8, y + 8, w - 16, h - 22, 4);
        ctx.fillStyle = '#0f172a'; ctx.fill();
        ctx.strokeStyle = '#334155'; ctx.lineWidth = 1; ctx.stroke();
        // IP tampil di layar monitor
        const ip = lv.ipConfig[pc.id];
        txt('IP ' + (ip || '—'), x + w / 2, y + h - 18, { s: 10.5, a: 'center', c: ip ? '#7dd3fc' : C.mute, w: 700 });
        // LED power
        ctx.beginPath(); ctx.arc(x + w - 14, y + h - 10, 3, 0, 6.3);
        ctx.fillStyle = '#4ade80'; ctx.fill();
        // Port RJ45 (bawah monitor)
        const portX = x + w / 2 - 12, portY = y + h - 6;
        rr(portX, portY, 24, 10, 3);
        ctx.fillStyle = pc.cable ? '#1e40af' : '#0f172a'; ctx.fill();
        ctx.strokeStyle = pc.cable ? '#3b82f6' : '#334155'; ctx.lineWidth = 1.5; ctx.stroke();
    }

    function drawSwitch(now) {
        const { x, y, w, h } = SWITCH;
        // Body
        rr(x, y, w, h, 10);
        const sg = ctx.createLinearGradient(0, y, 0, y + h);
        sg.addColorStop(0, '#1e3a5c'); sg.addColorStop(1, '#0f1f33');
        ctx.fillStyle = sg; ctx.fill();
        ctx.strokeStyle = '#4a6a8f'; ctx.lineWidth = 2; ctx.stroke();

        // Label di atas port (tidak tertutup)
        txt('SWITCH 8-PORT', x + w / 2, y + 22, { s: 12, a: 'center', c: C.acc, w: 800 });
        txt('PC → Switch butuh Straight-Through', x + w / 2, y + 38, { s: 9.5, a: 'center', c: C.mute, w: 700 });

        // Ports
        PORTS.forEach((p, i) => {
            const px = p.x, py = p.y;
            const draggingThis = lv.drag && lv.drag.from === 'port' && p.cable === lv.drag.cable.id;
            // Port body
            rr(px, py, PORT_W, PORT_H, 3);
            ctx.fillStyle = (p.cable && !draggingThis) ? '#1e40af' : '#0f172a'; ctx.fill();
            ctx.strokeStyle = (p.cable && !draggingThis) ? '#3b82f6' : '#334155'; ctx.lineWidth = 1.5; ctx.stroke();

            // LED link (hijau) — di atas port
            const ledX = px + PORT_W / 2, ledY = py - 7;
            const nego = p.occupied && p.negoUntil && now < p.negoUntil;
            ctx.beginPath(); ctx.arc(ledX, ledY, 3.5, 0, 6.3);
            if (p.linkLED) {
                ctx.fillStyle = '#4ade80'; ctx.fill();
                ctx.shadowColor = '#4ade80'; ctx.shadowBlur = 6;
                ctx.fill(); ctx.shadowBlur = 0;
            } else if (nego) {
                const blink = 0.5 + 0.5 * Math.sin(now / 120 + i);
                ctx.fillStyle = 'rgba(251,191,36,' + blink.toFixed(2) + ')'; ctx.fill();
            } else {
                ctx.fillStyle = '#1e293b'; ctx.fill();
            }
            ctx.strokeStyle = '#334155'; ctx.lineWidth = 1; ctx.stroke();

            // LED activity (kuning) — di bawah port
            const actX = px + PORT_W / 2, actY = py + PORT_H + 8;
            ctx.beginPath(); ctx.arc(actX, actY, 2.5, 0, 6.3);
            if (p.actLED) {
                const blink = 0.5 + 0.5 * Math.sin(now / 150 + i);
                ctx.fillStyle = 'rgba(251,191,36,' + blink.toFixed(2) + ')'; ctx.fill();
            } else {
                ctx.fillStyle = '#1e293b'; ctx.fill();
            }
            ctx.strokeStyle = '#334155'; ctx.lineWidth = 1; ctx.stroke();

            // Nomor port
            txt(String(p.id), px + PORT_W / 2, py + PORT_H + 20, { s: 10, a: 'center', c: C.mute, w: 700 });
        });
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
        const p = portAt(mouse);
        if (p) {
            const bad = p.cable && p.cable !== lv.drag.cable.id;
            rr(p.x - 6, p.y - 10, PORT_W + 12, PORT_H + 20, 5);
            ctx.strokeStyle = bad ? C.bad : C.ok; ctx.lineWidth = 3; ctx.stroke();
        } else {
            const pc = pcAt(mouse);
            if (pc) {
                rr(pc.x - 4, pc.y - 4, pc.w + 8, pc.h + 16, 8);
                ctx.strokeStyle = C.acc; ctx.lineWidth = 3; ctx.stroke();
            }
        }
    }

    /* ================================================================
       PANEL KANAN — KONFIGURASI (dropdown) + PING TEST
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

        // === SECTION A — KONFIGURASI ===
        txt('KONFIGURASI', P.x + P.w / 2, P.y + 22, { s: 13, a: 'center', c: C.acc, w: 800 });

        FIELDS.forEach(f => {
            const ly = fieldSelectorY(f.key) - 14;
            const sy = fieldSelectorY(f.key);
            const cur = lv.ipConfig[f.key];
            const hov = over(P.x + 10, sy, P.w - 20, 28);
            const open = lv.openField === f.key;

            // Label kolom
            txt(f.label, P.x + 12, ly, { s: 11, c: C.text, w: 700 });
            // Kotak pilihan (ringkas; dropdown hanya membuka saat dipilih)
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

        // Garis pemisah setelah seluruh konfigurasi
        const divY = fieldSelectorY('gateway') + 42;
        ctx.beginPath(); ctx.moveTo(P.x + 12, divY); ctx.lineTo(P.x + P.w - 12, divY);
        ctx.strokeStyle = 'rgba(56,189,248,.25)'; ctx.lineWidth = 1; ctx.stroke();

        // === SECTION B — PING TEST ===
        const PY = divY + 18;
        txt('PING TEST', P.x + P.w / 2, PY, { s: 13, a: 'center', c: C.acc, w: 800 });
        const can = canPing();
        btn(P.x + 10, PY + 16, P.w - 20, 32, 'Ping PC2', () => { closeField(); doPing('pc2'); }, { s: 13, color: C.ok, disabled: !can });
        btn(P.x + 10, PY + 56, P.w - 20, 32, 'Ping Gateway', () => { closeField(); doPing('gateway'); }, { s: 13, color: C.acc, disabled: !can });

        // Output ping + ringkasan paket
        const ry = PY + 98;
        if (lv.pingResult) {
            rr(P.x + 10, ry, P.w - 20, 84, 8);
            ctx.fillStyle = 'rgba(6,14,26,.9)'; ctx.fill();
            ctx.strokeStyle = lv.pingResult === 'ok' ? C.ok : C.bad; ctx.lineWidth = 1.5; ctx.stroke();
            const resultText = lv.pingResult === 'ok' ? ('Reply from ' + (lv.lastPingIp || '192.168.1.11')) : 'Request timed out';
            const subText = lv.pingResult === 'ok' ? 'bytes=32 time=2ms TTL=128' : 'Destination unreachable';
            txt(resultText, P.x + P.w / 2, ry + 22, { s: 11.5, a: 'center', c: lv.pingResult === 'ok' ? C.ok : C.bad, w: 700 });
            txt(subText, P.x + P.w / 2, ry + 42, { s: 10, a: 'center', c: C.mute, w: 700 });
            txt('Paket: ' + lv.pingPackets.sent + ' terkirim, ' + lv.pingPackets.received + ' diterima, ' + lv.pingPackets.lost + ' hilang', P.x + P.w / 2, ry + 60, { s: 9.5, a: 'center', c: C.mute, w: 700 });
        } else {
            txt('Hasil ping akan tampil di sini', P.x + P.w / 2, ry + 24, { s: 11, a: 'center', c: C.mute, w: 700 });
        }

        // === DROPDOWN (overlay, digambar paling akhir agar menang klik) ===
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
                    l4Flash(f.label + ': ' + opt, 'info');
                    SND.klik();
                });
            });
        }
    }

    /* ================================================================
       FOOTER — Karakter Andi + Dialog + Bantuan
       ================================================================ */
    function drawAndiBar(now) {
        const B = BAR;
        rr(B.x, B.y, B.w, B.h, 12);
        ctx.fillStyle = 'rgba(11,21,35,.97)'; ctx.fill();
        ctx.strokeStyle = C.line; ctx.lineWidth = 1.5; ctx.stroke();

        // Karakter Andi — seluruh tubuh (skala 0.26 ≈ 59px) pas di dalam footer
        const mood = lv.andiTip ? 'talk' : 'idle';
        drawAndi(B.x + 40, B.y + 23, 0.26, mood, now / 1000);

        // Dialog Andi (stabil, maks 2 baris)
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

        // Tombol Bantuan (kanan, di dalam footer)
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
        const port = portAt(p);
        const pc = pcAt(p);

        // Klik tanpa geser = tidak ada aksi
        if (d.from === 'tray' && moved < 6 && !port && !pc) {
            l4Flash('Seret kabel ke port switch.', 'info');
            return;
        }

        if (port) {
            if (port.cable && port.cable !== c.id) {
                l4Flash('Port ' + port.id + ' sudah terpakai kabel lain. Pilih port lain.', 'bad');
                SND.salah();
                return;
            }
            if (c.port === port.id) return; // tidak berubah
            if (!c.pc) {
                const free = PCS.find(x => !x.cable);
                if (!free) {
                    l4Flash('Kedua PC sudah punya kabel.', 'bad');
                    SND.salah();
                    return;
                }
                attachPc(c, free.id);
            }
            detachPort(c, true);
            attachPort(c, port.id);
            l4Flash('Kabel ' + pcName(c) + ' terpasang di port ' + port.id + '. Menunggu link...', 'info');
            SND.klik();
            return;
        }

        if (pc) {
            if (pc.cable && pc.cable !== c.id) {
                l4Flash(pc.name + ' sudah punya kabel.', 'bad');
                SND.salah();
                return;
            }
            detachPort(c, true);
            attachPc(c, pc.id);
            c.free = { x: clamp(p.x, AX + 8, AX + AW - 8), y: clamp(p.y, AY + 8, AY + AH - 8) };
            l4Flash('Kabel tersambung ke ' + pc.name + '. Seret ujung satunya ke port switch.', 'ok');
            return;
        }

        // Lepas ke area kosong
        if (d.from === 'port' || d.from === 'pc') {
            detachPort(c, true);
            c.free = { x: clamp(p.x, AX + 8, AX + AW - 8), y: clamp(p.y, AY + 8, AY + AH - 8) };
            l4Flash('Kabel dilepas dari port. Link mati.', 'info');
        } else {
            l4Flash('Kabel belum terpasang. Coba lagi.', 'info');
        }
    }

    /* ================================================================
       PING
       ================================================================ */
    function doPing(target) {
        if (lv.phase !== 'play') return;
        if (lv.modal) return;
        if (!canPing()) {
            l4Flash('Belum bisa ping. Pastikan kabel, link, dan IP sudah siap.', 'bad');
            return;
        }

        const targetIp = target === 'pc2' ? lv.ipConfig.pc2 : lv.ipConfig.gateway;
        lv.lastPingIp = targetIp;
        lv.pingPackets = { sent: 4, received: 0, lost: 0 };

        const sameNetwork = target === 'pc2' &&
            lv.ipConfig.pc1.substring(0, lv.ipConfig.pc1.lastIndexOf('.')) ===
            lv.ipConfig.pc2.substring(0, lv.ipConfig.pc2.lastIndexOf('.'));
        const subnetOk = lv.ipConfig.subnet === '255.255.255.0';
        const noConflict = lv.ipConfig.pc1 !== lv.ipConfig.pc2;
        const gatewayOk = target === 'gateway' && lv.ipConfig.gateway === '192.168.1.1';

        if (target === 'pc2' && (!sameNetwork || !subnetOk || !noConflict)) {
            lv.pingResult = 'fail';
            lv.pingPackets.lost = 4;
            l4Flash('Ping gagal! Periksa konfigurasi IP.', 'bad');
            l4Andi('Ping gagal. Cek apakah IP PC1 dan PC2 dalam subnet yang sama.');
            SND.salah();
            return;
        }
        if (target === 'gateway' && !gatewayOk) {
            lv.pingResult = 'fail';
            lv.pingPackets.lost = 4;
            l4Flash('Ping gateway gagal! Periksa gateway.', 'bad');
            l4Andi('Gateway tidak bisa dijangkau. Pastikan gateway diatur dengan benar.');
            SND.salah();
            return;
        }

        lv.pingResult = 'ok';
        lv.pingPackets.received = 4;
        lv.lastPingTarget = target;
        l4Flash('Ping berhasil!', 'ok');
        SND.benar();

        if (target === 'pc2') {
            lv.pingPc2 = true;
            lv.pingWinAt = performance.now() + 900;
            l4Andi('Excellent! Ping berhasil. PC1 dan PC2 bisa berkomunikasi.');
        } else {
            l4Andi('Gateway berhasil dijangkau!');
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
        // Hapus tombol game di belakang modal agar klik hanya ke modal
        btns.length = 0;
        // Dark overlay
        ctx.fillStyle = 'rgba(4,10,20,.85)';
        ctx.fillRect(0, 54, W, H - 54);
        const x = 180, y = 120, w = 600, h = 260;
        rr(x, y, w, h, 18);
        ctx.fillStyle = C.panel; ctx.fill();
        ctx.strokeStyle = C.ok; ctx.lineWidth = 2; ctx.stroke();
        txt('Jaringan berhasil terhubung!', x + w / 2, y + 36, { s: 22, f: FONT_H, a: 'center', c: C.ok, w: 600 });
        txt('Semua koneksi fisik dan konfigurasi jaringan sudah benar. Lanjutkan evaluasi pemahaman.', x + w / 2, y + 78, { s: 14, a: 'center', c: C.text, w: 560 });
        btn(x + w / 2 - 100, y + h - 60, 200, 36, 'Lanjut Evaluasi', () => {
            startQuiz();
        }, { s: 13, color: C.ok });
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
        l4Andi('Jawab 4 soal evaluasi. Baca dengan teliti.');
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
            l4Flash('Jawaban benar!', 'ok');
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
        if (!lv.badges.includes('Jaringan Hidup')) lv.badges.push('Jaringan Hidup');
        if (!lv.hintUsed && !lv.badges.includes('TANPA BANTUAN')) lv.badges.push('TANPA BANTUAN');
        lv.logExtra.bantuan = lv.hintUsed ? 1 : 0;
        lv.logExtra.lencana = lv.badges.join(', ');
        endLevel(lv, true);
    }

    function drawQuizPhase(now) {
        // Hapus tombol game agar klik hanya ke kuis
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

        txt('KUIS LEVEL 4', x + w / 2, y + 30, { s: 22, f: FONT_H, a: 'center', c: C.warn, w: 600 });
        txt('Pertanyaan ' + (qz.idx + 1) + ' dari ' + qz.list.length, x + w / 2, y + 52, { s: 13, a: 'center', c: C.mute, w: 600 });
        para(q.q, x + w / 2, y + 84, w - 80, 22, { s: 16, a: 'center', c: C.text, w: 700 });

        const optY = y + 140, optH = 40, optGap = 8;
        q.opts.forEach((opt, i) => {
            const oy = optY + i * (optH + optGap);
            let color = '#2b4360', tc = C.text, dis = false;
            if (qz.picked !== null) {
                dis = true;
                if (i === q.ans) { color = C.ok; tc = '#04160f'; }
                else if (i === qz.picked) { color = '#5b2530'; tc = '#f5b5bd'; }
                else { color = '#22344a'; tc = C.mute; }
            }
            btn(x + 30, oy, w - 60, optH, opt, () => pickQuiz(i), { color: color, tc: tc, disabled: dis, s: 14 });
        });

        // Feedback setelah menjawab
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
            '1. Kabel straight-through untuk PC ke Switch',
            '2. LED hijau = link aktif, kuning = aktivitas',
            '3. IP harus dalam subnet yang sama',
            '4. Subnet mask 255.255.255.0 untuk kelas C',
            '5. Ping berhasil jika kabel, link, dan IP benar'
        ];
        hints.forEach((h, i) => { txt(h, x + 30, y + 80 + i * 36, { s: 14, c: C.text, w: 600 }); });
        btn(x + w / 2 - 70, y + h - 50, 140, 36, 'Tutup', () => { lv.modal = null; }, { s: 14, color: C.acc });
    }

    /* ================================================================
       RAPOR HASIL LEVEL 4
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

                txt(ok ? 'LEVEL 4 SELESAI' : 'WAKTU HABIS', W / 2, y + 48, { s: 30, f: FONT_H, a: 'center', c: ok ? C.ok : C.bad, w: 600 });
                txt('Simulasi Penggunaan Kabel Jaringan', W / 2, y + 74, { s: 13, a: 'center', c: C.mute });
                if (isNewBest) txt('REKOR BARU!', W / 2, y + 96, { s: 15, f: FONT_H, a: 'center', c: C.warn, w: 600 });

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
                if (ok && l.n < levelTotal()) btn(x + w - 40 - 200, y + h - 66, 200, 44, 'Lanjut Level 5', () => startLevel(l.n), { color: C.ok, s: 14 });
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
            if (lv.briefPage < BRIEF_PAGES.length && lv.briefShown < BRIEF_PAGES[lv.briefPage].length) {
                lv.briefShown = Math.min(BRIEF_PAGES[lv.briefPage].length, lv.briefShown + dt * 55);
            }
            drawBrief(now); return;
        }

        if (lv.phase === 'quiz') { drawQuizPhase(now); return; }

        // Transisi otomatis: ping PC2 sukses → modal
        if (lv.phase === 'play' && lv.pingWinAt && now >= lv.pingWinAt) {
            lv.pingWinAt = 0;
            if (lv.pingPc2 && lv.pingResult === 'ok') showPingSuccessModal();
        }

        updateLinks(now);

        deskBG(); hud(lv);
        drawLeftPanel(now);
        drawNetworkArea(now);
        drawRightPanel(now);
        drawAndiBar(now);
        drawFlash(now);

        if (lv.modal === 'pingSuccess') drawPingSuccessModal(now);
        if (lv.modal === 'hint') drawHintModal(now);

        l4TickAnim(now);
    };

    /* ================================================================
       INPUT HANDLING
       ================================================================ */
    lv.down = function (p) {
        // Klik di luar pilihan menutup dropdown (pilihan punya hit sendiri)
        if (lv.openField) lv.openField = null;

        if (lv.phase === 'brief') {
            if (lv.briefPage < BRIEF_PAGES.length) {
                if (lv.briefShown < BRIEF_PAGES[lv.briefPage].length) { lv.briefShown = BRIEF_PAGES[lv.briefPage].length; }
                else { lv.briefPage++; lv.briefShown = 0; }
            }
            return;
        }
        if (lv.phase !== 'play') return;
        if (lv.modal) return;

        // 1) Ambil kabel yang sudah terpasang (bisa dipindah / dilepas)
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
            if (!c.pc && !c.port && inR(p, { x: PL.x + 6, y: CABLE_ROWS[c.index] - 23, w: PL.w - 12, h: 46 })) {
                startDrag(c, 'tray', p);
                l4Flash('Kabel ' + CABLE_COLORS[c.type].name + ' dipilih. Seret ke port switch.', 'info');
                SND.klik();
                return;
            }
        }
    };

    lv.move = function (p) {
        if (lv.drag) { lv.dragStart = { x: p.x, y: p.y }; }
    };

    lv.up = function (p) {
        if (!lv.drag) return;
        const d = lv.drag;
        lv.drag = null;
        endDrag(d, p);
    };

    /* ================================================================
       BADGE & SCORE
       ================================================================ */
    lv.logExtra = { kabel_cm: 0, rj45: 0, bantuan: 0, lencana: '' };

    // Handle debug/test agar port & kabel bisa diverifikasi dari luar
    lv.PORTS = PORTS;
    lv.CABLES = CABLES;
    lv.PCS = PCS;
    lv.lg = { PL, PR, AX, AY, AW, AH, BAR, CABLE_ROWS, PORT_Y, PORT_START_X, PORT_W, PORT_H, PORT_GAP, FIELDS, fieldSelectorY };

    return lv;
}

/* ---------- pendaftaran level ---------- */
registerLevel(4, {
    t: 'Simulasi Kabel Jaringan',
    m: 'Pilih kabel, hubungkan PC ke Switch, konfigurasi IP, ping',
    desc: 'Simulasi penggunaan kabel jaringan di laboratorium. Pilih kabel yang tepat, hubungkan PC ke Switch, konfigurasi IP, lakukan ping, lalu jawab kuis evaluasi.',
    mk: makeL4
});
