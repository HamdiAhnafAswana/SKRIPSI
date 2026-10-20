// ==========================================================================
// levels/level5-crossover.js
// LEVEL 5 — Teknologi Jaringan Lanjutan: Kabel Crossover PC → PC
// ------------------------------------------------------------------
// Layout 960x600 (satu koordinat desain, diskalakan CSS oleh App):
//   Header          y 0..54      — HUD Level (core hud)
//   Panel Kiri      10..194      — MISI, PILIH KABEL, STATUS
//   Area Tengah     204..736     — PC1 ↔ PC2 (tanpa switch), kabel crossover
//   Panel Kanan     746..950     — KONFIGURASI (dropdown) + PING TEST
//   Footer          10..950, y 536..600 — Andi + Dialog + Bantuan
//
// Alur fase:  brief → play → pingSuccess → (endLevel) → RAPOR
//   play        : pilih kabel, pasang kabel crossover, konfigurasi IP, ping
//   pingSuccess : modal "Jaringan berhasil terhubung!" → tombol Lihat Hasil
//   RAPOR       : lv.makeResult → LEVEL 5 SELESAI (skor, waktu, kesalahan,
//                 bantuan, bintang, badge) + Ulangi Level / Lanjut Level 6
//
// Konsep utama:
//   Level 4: PC → Switch  (Straight-Through)
//   Level 5: PC → PC      (Crossover) — perangkat sejenis, tanpa switch
// ==========================================================================

function makeL5() {
    const lv = baseLevel(5, 'Teknologi Jaringan Lanjutan');
    lv.idx = 4;
    lv.limit = 600;
    lv.boardKey = 'board5';

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
    const AY = TOP, AH = BOTTOM - TOP;
    let AX = 204, AW = 532;
    const BAR = { x: 10, y: FOOT_Y, w: 940, h: FOOT_H };

    /* --- Perangkat jaringan: PC1 dan PC2 langsung terhubung --- */
    const PC1 = { x: AX + 36, y: AY + 38, w: 132, h: 96 };
    const PC2 = { x: AX + AW - 168, y: AY + 38, w: 132, h: 96 };

    /* --- Warna kabel --- */
    const CABLE_COLORS = {
        straight: { name: 'Straight-Through', color: '#3b82f6', desc: 'PC → Switch' },
        crossover: { name: 'Crossover', color: '#f59e0b', desc: 'PC → PC' }
    };

    /* --- Baris kartu kabel di panel kiri --- */
    const CABLE_ROWS = [PL.y + 128, PL.y + 182];

    /* --- State PC --- */
    const PCS = [
        { id: 'pc1', name: 'PC 1', x: PC1.x, y: PC1.y, w: PC1.w, h: PC1.h, ip: null, cable: null },
        { id: 'pc2', name: 'PC 2', x: PC2.x, y: PC2.y, w: PC2.w, h: PC2.h, ip: null, cable: null }
    ];

    /* --- layar lebar (VW > 960): panel & perangkat merentang mengikuti lebar layar --- */
    function rewidth() {
        const OW = wideOX();
        PL.x = 10 - OW; PR.x = 746 + OW; BAR.x = 10 - OW; BAR.w = 940 + 2 * OW;
        AX = 204 - OW; AW = 532 + 2 * OW;
        PC1.x = AX + 36; PC2.x = AX + AW - 168;
        PCS[0].x = PC1.x; PCS[1].x = PC2.x;
    }

    /* --- Kabel: straight (salah) dan crossover (benar) --- */
    const CABLES = [
        { id: 'c1', index: 0, type: 'straight', pc: null, port: null, free: null },
        { id: 'c2', index: 1, type: 'crossover', pc: null, port: null, free: null }
    ];

    /* --- Pilihan konfigurasi --- */
    const IP_OPTIONS = {
        pc1: ['192.168.10.10', '192.168.10.20', '192.168.20.10', '10.0.0.10'],
        pc2: ['192.168.10.11', '192.168.10.21', '192.168.20.11', '10.0.0.11'],
        subnet: ['255.255.255.0', '255.255.0.0', '255.0.0.0', '255.255.255.128']
    };

    /* --- Kolom konfigurasi panel kanan (urutan: PC1 IP, PC2 IP, Subnet) --- */
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

    /* --- State permainan --- */
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
    lv.selectedCableType = null;
    lv.cableChoiceCorrect = false;

    /* --- Kompatibilitas: daftar kabel yang sudah terpasang --- */
    Object.defineProperty(lv, 'placedCables', {
        get: () => lv.cables.filter(c => c.port != null)
    });


    /* --- Kasus troubleshooting --- */
    const TROUBLESHOOT_CASES = [
        {
            id: 'wrong_cable',
            title: 'Kabel Salah',
            symptom: 'LED mati pada kedua PC.',
            networkInfo: 'Menggunakan kabel Straight-Through untuk PC ke PC.',
            diagnosisChoices: [
                { text: 'Kabel Straight-Through tidak cocok untuk PC ke PC', correct: true },
                { text: 'IP address salah', correct: false },
                { text: 'Subnet mask salah', correct: false }
            ],
            explanationBenar: 'Benar, PC ke PC memerlukan kabel crossover. Straight-Through hanya untuk perangkat berbeda jenis.',
            explanationSalah: 'Salah, LED mati menunjukkan masalah pada kabel atau koneksi fisik, bukan konfigurasi IP.'
        },
        {
            id: 'ip_diff_network',
            title: 'IP Berbeda Jaringan',
            symptom: 'LED aktif tetapi ping gagal.',
            networkInfo: 'PC1 dan PC2 memiliki subnet berbeda (misal: 192.168.10.x vs 192.168.20.x).',
            diagnosisChoices: [
                { text: 'Kabel crossover tidak cocok', correct: false },
                { text: 'IP PC1 dan PC2 berada di subnet berbeda', correct: true },
                { text: 'PC mati', correct: false }
            ],
            explanationBenar: 'Benar, koneksi fisik sudah aktif (LED hijau) tetapi alamat IP berada pada jaringan berbeda.',
            explanationSalah: 'Salah, LED link sudah aktif berarti kabel dan koneksi fisik sudah benar.'
        },
        {
            id: 'subnet_wrong',
            title: 'Subnet Mask Salah',
            symptom: 'Koneksi fisik OK, tapi komunikasi gagal.',
            networkInfo: 'Subnet mask yang dimasukkan salah (bukan 255.255.255.0).',
            diagnosisChoices: [
                { text: 'Subnet mask 255.255.255.0', correct: true },
                { text: 'Subnet mask 255.255.0.0', correct: false },
                { text: 'Tidak ada subnet mask', correct: false }
            ],
            explanationBenar: 'Benar, subnet mask 255.255.255.0 (/24) memberikan 254 host per jaringan.',
            explanationSalah: 'Salah, subnet mask yang salah membuat PC mengira tujuan berada di jaringan lain.'
        },
        {
            id: 'ip_conflict',
            title: 'IP Conflict',
            symptom: 'Ping gagal dengan pesan "IP address conflict".',
            networkInfo: 'PC1 dan PC2 memiliki alamat IP yang sama.',
            diagnosisChoices: [
                { text: 'Ganti IP salah satu PC', correct: true },
                { text: 'Ganti kabel', correct: false },
                { text: 'Restart switch', correct: false }
            ],
            explanationBenar: 'Benar, dua perangkat tidak boleh memiliki IP yang sama dalam satu jaringan.',
            explanationSalah: 'Salah, IP conflict bukan masalah kabel atau switch.'
        }
    ];

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
        for (let t = 0; t <= 1; t += 1 / 20) {
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
        if (lv.cables.length < 1) return false;
        const c = lv.cables.find(k => k.type === 'crossover');
        if (!c || !c.pc || !c.port) return false;
        const pc1 = PCS.find(p => p.id === c.pc);
        const pc2 = PCS.find(p => p.id === c.port);
        return !!(pc1 && pc2 && pc1.linkLED && pc2.linkLED);
    }

    function canPing() {
        return !!(linkOK() && lv.ipConfig.pc1 && lv.ipConfig.pc2 && lv.ipConfig.subnet);
    }

    /* --- Attach / detach kabel --- */
    function detachPort(c, resetPing) {
        const pc = PCS.find(x => x.cable === c.id);
        if (pc) {
            pc.cable = null;
            pc.linkLED = false;
            pc.actLED = false;
            pc.negoUntil = 0;
            pc.plugAnim = null;
        }
        c.port = null;
        if (resetPing !== false) { lv.pingResult = null; lv.pingPc2 = false; }
    }

    function attachPort(c, pcId) {
        const pc = PCS.find(x => x.id === pcId);
        if (!pc) return;
        pc.cable = c.id;
        pc.linkLED = false;
        pc.actLED = false;
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
                if (c && c.pc && c.port) {
                    pc.linkLED = true; pc.actLED = true;
                }
            }
        }
        // Cek jika kabel crossover sudah terhubung penuh (kedua ujung)
        const crossCable = lv.cables.find(k => k.type === 'crossover');
        if (crossCable && crossCable.pc && crossCable.port) {
            const pc1 = PCS.find(p => p.id === crossCable.pc);
            const pc2 = PCS.find(p => p.id === crossCable.port);
            if (pc1 && pc2 && now >= pc1.negoUntil && now >= pc2.negoUntil) {
                if (!pc1.linkLED || !pc2.linkLED) {
                    pc1.linkLED = true; pc1.actLED = true;
                    pc2.linkLED = true; pc2.actLED = true;
                    l4Flash('Link aktif! LED hijau menyala di ' + pc1.name + ' dan ' + pc2.name, 'ok');
                    l4Andi('Link aktif! PC1 dan PC2 berhasil terhubung langsung.');
                    SND.klik();
                }
            }
        }
    }

    /* ================================================================
       BRIEFING
       ================================================================ */
    const BRIEF_PAGES = [
        'Halo! Saya Andi. Hari ini kita akan mempelajari koneksi jaringan lanjutan.',
        'Pada kondisi tertentu dua komputer perlu berkomunikasi langsung tanpa switch. Karena kedua perangkat memiliki tipe yang sama, diperlukan kabel crossover.',
        'Misi: Hubungkan PC 1 dan PC 2 secara langsung menggunakan kabel crossover, konfigurasi IP, lalu uji koneksi dengan ping.',
        'Perhatikan perbedaan dengan Level 4: PC ke Switch menggunakan Straight-Through, sedangkan PC ke PC menggunakan Crossover. Selamat bekerja!'
    ].filter(function (s) { return s && s.trim() !== ''; });
    lv.briefPage = 0;
    lv.briefShown = 0;
    lv.tPrev = performance.now();

    function drawBrief(now) {
        while (lv.briefPage < BRIEF_PAGES.length && (!BRIEF_PAGES[lv.briefPage] || BRIEF_PAGES[lv.briefPage].trim() === '')) { lv.briefPage++; lv.briefShown = 0; }
        const t = now / 1000;
        bg(false); hud(lv);
        const BW = wideOX();
        const AP = { x: 20 - BW, y: 70, w: 270, h: 490 };
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

        const RP = { x: 306 - BW, y: 70, w: 634 + 2 * BW, h: 490 };
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
            para('Hubungkan PC 1 dan PC 2 secara langsung menggunakan kabel crossover, konfigurasi jaringan, lalu pastikan koneksi berhasil.', x + 40, y + 100, w - 80, 24, { s: 16, c: C.text, w: 600 });
            btn(x + w / 2 - 145, y + h - 72, 290, 52, 'Mulai Misi ▸', () => startPlay(), { s: 18, color: C.ok });
        }
    }

    function startPlay() {
        lv.phase = 'play';
        lv.t0 = performance.now();
        lv.tPrev = performance.now();
        l4Andi('Pilih kabel crossover dari panel kiri, lalu seret ke PC.');
        say('Pilih kabel crossover dari panel kiri, lalu seret ke PC.', 'info');
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

        // Status langkah
        const SY = P.y + 330;
        txt('STATUS', P.x + P.w / 2, SY, { s: 11, a: 'center', c: C.acc, w: 800 });
        const steps = [
            { label: 'Kabel terpasang', done: placedList().length >= 1 },
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
       AREA TENGAH — Simulasi Jaringan PC ↔ PC
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

        ctx.restore();
    }

    function drawPC(pc, now) {
        const { x, y, w, h } = pc;
        txt(pc.name, x + w / 2, y - 14, { s: 13, a: 'center', c: C.text, w: 800 });
        rr(x, y, w, h, 8);
        ctx.fillStyle = '#1e293b'; ctx.fill();
        ctx.strokeStyle = '#475569'; ctx.lineWidth = 2; ctx.stroke();
        rr(x + 8, y + 8, w - 16, h - 22, 4);
        ctx.fillStyle = '#0f172a'; ctx.fill();
        ctx.strokeStyle = '#334155'; ctx.lineWidth = 1; ctx.stroke();
        const ip = lv.ipConfig[pc.id];
        txt('IP ' + (ip || '—'), x + w / 2, y + h - 18, { s: 10.5, a: 'center', c: ip ? '#7dd3fc' : C.mute, w: 700 });
        ctx.beginPath(); ctx.arc(x + w - 14, y + h - 10, 3, 0, 6.3);
        ctx.fillStyle = '#4ade80'; ctx.fill();
        // Port RJ45
        const portX = x + w / 2 - 12, portY = y + h - 6;
        rr(portX, portY, 24, 10, 3);
        ctx.fillStyle = pc.cable ? '#1e40af' : '#0f172a'; ctx.fill();
        ctx.strokeStyle = pc.cable ? '#3b82f6' : '#334155'; ctx.lineWidth = 1.5; ctx.stroke();

        // LED link & activity
        const ledX = x + w / 2, ledY = y + h + 14;
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

        const actX = x + w / 2 + 10, actY = y + h + 14;
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
            rr(pc.x - 4, pc.y - 4, pc.w + 8, pc.h + 16, 8);
            ctx.strokeStyle = C.acc; ctx.lineWidth = 3; ctx.stroke();
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

        // Garis pemisah
        const divY = fieldSelectorY('subnet') + 42;
        ctx.beginPath(); ctx.moveTo(P.x + 12, divY); ctx.lineTo(P.x + P.w - 12, divY);
        ctx.strokeStyle = 'rgba(56,189,248,.25)'; ctx.lineWidth = 1; ctx.stroke();

        // === SECTION B — PING TEST ===
        const PY = divY + 18;
        txt('PING TEST', P.x + P.w / 2, PY, { s: 13, a: 'center', c: C.acc, w: 800 });
        const can = canPing();
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
            txt('Paket: ' + lv.pingPackets.sent + ' terkirim, ' + lv.pingPackets.received + ' diterima, ' + lv.pingPackets.lost + ' hilang', P.x + P.w / 2, ry + 60, { s: 9.5, a: 'center', c: C.mute, w: 700 });
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

        if (d.from === 'tray' && moved < 6 && !pc) {
            l4Flash('Seret kabel ke port Ethernet PC.', 'info');
            return;
        }

        if (pc) {
            if (pc.cable && pc.cable !== c.id) {
                l4Flash(pc.name + ' sudah punya kabel.', 'bad');
                SND.salah();
                return;
            }
            // Tolak kabel straight untuk PC ke PC
            if (c.type !== 'crossover') {
                l4Flash('Perangkat yang sama membutuhkan pengaturan jalur transmisi berbeda. Gunakan kabel crossover.', 'bad');
                l4Andi('Kabel straight untuk PC ke PC tidak cocok. Gunakan kabel crossover untuk menukar jalur Tx dan Rx.');
                SND.salah();
                return;
            }
            // Tentukan apakah ini ujung pertama atau kedua
            if (!c.pc) {
                // Ujung pertama: simpan sebagai c.pc
                detachPort(c, true);
                attachPc(c, pc.id);
                c.free = { x: clamp(p.x, AX + 8, AX + AW - 8), y: clamp(p.y, AY + 8, AY + AH - 8) };
                l4Flash('Kabel tersambung ke ' + pc.name + '. Seret ujung satunya ke PC lain.', 'ok');
            } else if (!c.port && c.pc !== pc.id) {
                // Ujung kedua: simpan sebagai c.port (jangan detachPort, karena PC1 sudah terhubung)
                attachPort(c, pc.id);
                // Aktifkan negosiasi di PC asal juga
                const originPc = PCS.find(p => p.id === c.pc);
                if (originPc && !originPc.negoUntil) {
                    originPc.plugAnim = { t0: performance.now(), dur: 420 };
                    originPc.negoUntil = performance.now() + 900;
                }
                l4Flash('Kabel tersambung ke ' + pc.name + '. PC1 <-> PC2 terhubung!', 'ok');
                SND.benar();
            } else {
                l4Flash('Kabel sudah terhubung.', 'info');
            }
            return;
        }

        if (d.from === 'port' || d.from === 'pc') {
            detachPort(c, true);
            c.free = { x: clamp(p.x, AX + 8, AX + AW - 8), y: clamp(p.y, AY + 8, AY + AH - 8) };
            l4Flash('Kabel dilepas. Link mati.', 'info');
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

        if (target === 'pc2' && (!sameNetwork || !subnetOk || !noConflict)) {
            lv.pingResult = 'fail';
            lv.pingPackets.lost = 4;
            l4Flash('Ping gagal! Periksa konfigurasi IP.', 'bad');
            l4Andi('Ping gagal. Cek apakah IP PC1 dan PC2 dalam subnet yang sama.');
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
            l4Andi('Excellent! Ping berhasil. PC1 dan PC2 bisa berkomunikasi langsung.');
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
        txt('Semua koneksi fisik dan konfigurasi jaringan sudah benar. Tekan tombol untuk melihat hasil praktikum.', x + w / 2, y + 78, { s: 14, a: 'center', c: C.text, w: 560 });
        btn(x + w / 2 - 100, y + h - 60, 200, 36, 'Lihat Hasil \u25b8', () => {
            l5Selesai();
        }, { s: 13, color: C.ok });
    }

    /* ================================================================
       PENUTUP PRAKTIK
       ================================================================ */
    function l5Selesai() {
        if (lv.finished) return;
        if (!lv.badges.includes('Direct Connection')) lv.badges.push('Direct Connection');
        if (lv.cableChoiceCorrect && !lv.badges.includes('Crossover Expert')) lv.badges.push('Crossover Expert');
        if (!lv.hintUsed && !lv.badges.includes('TANPA BANTUAN')) lv.badges.push('TANPA BANTUAN');
        lv.logExtra.bantuan = lv.hintUsed ? 1 : 0;
        lv.logExtra.lencana = lv.badges.join(', ');
        lv.finished = true;
        endLevel(lv, true);
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
            '1. Kabel crossover untuk PC ke PC langsung',
            '2. LED hijau = link aktif, kuning = negosiasi',
            '3. IP harus dalam subnet yang sama',
            '4. Subnet mask 255.255.255.0 untuk kelas C',
            '5. Gateway tidak diperlukan untuk PC ke PC langsung'
        ];
        hints.forEach((h, i) => { txt(h, x + 30, y + 80 + i * 36, { s: 14, c: C.text, w: 600 }); });
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
                txt('Teknologi Jaringan Lanjutan', W / 2, y + 74, { s: 13, a: 'center', c: C.mute });
                if (isNewBest) txt('REKOR BARU!', W / 2, y + 96, { s: 15, f: FONT_H, a: 'center', c: C.warn, w: 600 });

                for (let i = 0; i < 3; i++) star(W / 2 - 56 + i * 56, y + 128, 22, i < stars);
                txt(l.score, W / 2, y + 196, { s: 56, f: FONT_H, a: 'center', c: C.warn, w: 600 });
                txt('skor akhir', W / 2, y + 216, { s: 12, a: 'center', c: C.mute });

                const rowY = y + 246, dy = 28;
                infoRow(l, 'Waktu', fmt(l.dur), rowY);
                infoRow(l, 'Kesalahan', l.mistakes.length, rowY + dy);
                infoRow(l, 'Bantuan', l.hintUsed ? 'Dipakai' : 'Tidak dipakai', rowY + dy * 2);

                txt('Lencana', x + 60, rowY + dy * 3 + 6, { s: 13, c: C.acc, w: 800 });
                const badge = (l.badges && l.badges.length) ? l.badges.join('  •  ') : '—';
                txt('🏅 ' + badge, x + 60, rowY + dy * 3 + 30, { s: 14, c: C.warn, w: 700 });

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
        rewidth();

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

        if (lv.phase === 'play' && lv.pingWinAt && now >= lv.pingWinAt) {
            lv.pingWinAt = 0;
            if (lv.pingPc2 && lv.pingResult === 'ok') showPingSuccessModal();
        }

        updateLinks(now);

        deskBG(); hud(lv);
        drawLeftPanel(now);
        drawNetworkArea(now);
        updateLinks(now); // updateLinks sebelum drawRightPanel agar canPing() mengevaluasi LED terbaru
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

        // 2) Ambil kabel dari tray
        for (let i = 0; i < lv.cables.length; i++) {
            const c = lv.cables[i];
            if (!c.pc && !c.port && inR(p, { x: PL.x + 6, y: CABLE_ROWS[c.index] - 23, w: PL.w - 12, h: 46 })) {
                startDrag(c, 'tray', p);
                l4Flash('Kabel ' + CABLE_COLORS[c.type].name + ' dipilih. Seret ke port Ethernet PC.', 'info');
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
    lv.PORTS = PCS;
    lv.CABLES = CABLES;
    lv.PCS = PCS;
    lv.lg = { PL, PR, AX, AY, AW, AH, BAR, CABLE_ROWS, FIELDS, fieldSelectorY };
    lv._dbg = { canPing, linkOK, doPing };

    return lv;
}

/* ---------- pendaftaran level ---------- */
registerLevel(5, {
    t: 'Teknologi Jaringan Lanjutan',
    m: 'Pilih kabel crossover, hubungkan PC ke PC langsung, konfigurasi IP, ping',
    desc: 'Simulasi koneksi PC ke PC langsung menggunakan kabel crossover. Pilih kabel yang tepat, hubungkan PC1 ke PC2, konfigurasi IP, lalu lakukan ping.',
    mk: makeL5
});
