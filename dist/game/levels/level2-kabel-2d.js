// ==========================================================================
// levels/level2-kabel-2d.js
// File ini digabung otomatis oleh build.mjs ke index.html
// -- JANGAN diedit langsung di index.html.
// ==========================================================================

/* ================================================================
   LEVEL 2 — Crimping Kabel LAN Straight-Through (T568A / T568B)
   ------------------------------------------------------------------
   Murni 2D. Semua gambar memakai helper canvas yang sudah ada
   (rr, txt, para, btn, hit, say, deskBG, hud, icon, drawSprite,
   drawWire, tickIcon, crossIcon, lock, drawAndiFace, SND).
   TIDAK memakai Three.js / WebGL sama sekali, jadi level ini tetap
   jalan tanpa internet dan tanpa akselerasi grafis.

   Kontras:  area kerja BERLATAR GELAP (biru-slate) + grid tipis
             selubung abu-lilac terang + outline gelap + highlight tepi
             konduktor = KURVA Bezier dari TITIK TAMBAT di mulut jaket
                         ke ujung atasnya; pangkal tidak pernah bergerak,
                         ketebalan konstan, ujung atas membulat
             konduktor belang = dasar putih krem + garis warna diagonal tebal

   Alur (satu ujung kabel):
     0. Layar pembuka  -> tujuan level, 6 alat, arti T568B
     1. Sarung Tangan  -> animasi tangan memakai sarung (area kerja bersih sebelum & sesudah)
     2. Pengupas Kabel -> sprite pengupas bergerak, 8 konduktor mekar keluar
     3. Susun warna    -> seret / klik konduktor ke slot pin 1-8
     4. Pemotong Kabel-> pilih panjang, sprite gunting meratakan ujung
     5. Konektor RJ45  -> konektor meluncur turun, selubung ikut masuk
     6. Tang Crimping -> sprite tang turun & menekan konektor
     7. Tester         -> modal LAN TESTER, LED 1-8, kirim & nilai
     -> kartu "Yang kamu pelajari" -> layar hasil

   Catatan nama fungsi: semua fungsi di dalam level ini diberi prefiks l2…
   karena build.mjs mendeteksi duplikat "function NAMA(" secara global,
   termasuk fungsi yang bersarang.
   ================================================================ */
function makeL2() {
    const lv = baseLevel(2, 'Crimping Straight-Through (T568A/T568B)');
    lv.idx = 1;
    lv.limit = 420;

    /* ================================================================
       TATA LETAK (kanvas virtual 960 x 600)
       ================================================================ */
    const AY = 88, AX = 172, AW = 616, AH = 430;          // area kerja 88..518
    const WORK_BOT = 514;                                  // tepi dalam bawah
    const PL = { x: 8, y: 88, w: 156, h: 430 };            // panel kiri  ALAT
    const PR = { x: 796, y: 88, w: 156, h: 430 };          // panel kanan PASANG
    const BAR = { x: 8, y: 526, w: 944, h: 70 };           // bar Pak Andi 526..596
    const CX = AX + AW / 2;                                // 480
    const CARD = { y: 120, h: 80, dy: 88 };                // kartu alat
    const SBOX = { x: PL.x + 8, y: 384, w: 140, h: 130 };  // panel STATUS 16..156
    const MBOX = { x: PR.x + 8, y: 384, w: 140, h: 130 };  // kartu PESAN  804..944

    /* --- kepala RJ-45: judul -> BARIS NOMOR 1-8 -> 8 slot -> ujung kabel ---
       Baris nomor dipindah ke ATAS slot (bukan di bawahnya) supaya kabel yang
       diseret terlihat langsung masuk ke slot tanpa terhalang pita angka.
       Tinggi kotak PIN tetap 140 (92..232): slot dikecilkan sedikit supaya
       baris nomor muat di atas tanpa menimpa banner misi maupun ujung kabel.  */
    const PIN = { x: CX - 200, y: AY + 4, w: 400, h: 140 };   // 92..232
    const HDR_Y = 108;                                        // baseline judul kotak
    const SLOT_W = 40, SLOT_GAP = 8;
    const PIN_PADX = (PIN.w - (SLOT_W * 8 + SLOT_GAP * 7)) / 2;   // 12
    const slotX = i => PIN.x + PIN_PADX + i * (SLOT_W + SLOT_GAP);
    const slotCX = i => slotX(i) + SLOT_W / 2;
    const SLOT_TOP = 146, SLOT_BOT = 200;                    // tinggi slot 54
    const SLOT_SEAT = SLOT_TOP + 16;                          // ujung konduktor duduk di sini
    const CUT_Y = SLOT_BOT + 6;                               // garis potong (rata ujung)
    const BAND = { x: slotX(0) - 8, y: 120, w: SLOT_W * 8 + SLOT_GAP * 7 + 16, h: 22 };
    /* Area klik slot: menutup baris nomor DI ATAS + slot + sedikit di bawah,
       jadi angka 1-8 ikut jadi bagian area klik slotnya. */
    const SLOT_HIT_T = BAND.y - 4, SLOT_HIT_B = SLOT_BOT + 12;
    const CONN = { x: PIN.x, w: PIN.w, y: AY + 12, h: 144 };   // badan RJ-45 100..244

    /* --- kabel --- */
    const JACK_UP = 232;              // tepi atas selubung setelah RJ-45 terpasang
    const JACKET_W = 220;             // lebar selubung datar, 220 px, pusat CX
    const CON_W = 18;                 // lebar batang konduktor 18 px
    const CON_STEP = 24;              // jarak pangkal batang (lebar 18 + gap 6)
    const BASE_X0 = CX - (CON_W * 8 + (CON_STEP - CON_W) * 7) / 2 + CON_W / 2;   // 396
    const WIRE_B = 396;               // tepi atas selubung datar (y=396)
    const TIP_Y = 216;                // ujung konduktor berdiri: 180 px di atas selubung
    const SLOT_SPAN = SLOT_W + SLOT_GAP;               // 48: jarak antar slot pin

    /* ---------- MULUT JAKET & TITIK TAMBAT (anchor) ----------------------
       Mulut jaket = lubang tempat 8 konduktor keluar dari selubung.
         - 8 titik tambat disebar MERATA di lebar mulut, urutannya sama
           dengan urutan acak awal kabel, lalu TETAP selamanya: tidak ikut
           bergeser saat diseret, dipasang di slot, atau ditukar.
         - Hanya ujung atas (tip) yang mengikuti pointer / slot.
         - ANCHOR_DY = berapa px titik tambat tertanam DI DALAM selubung,
           sehingga bagian bawah kabel selalu tertutup jaket (belakangnya)
           dan tidak pernah terlihat menumpuk di atas tepi jaket.
         - MAXLEN  = panjang maksimal kabel diukur dari titik tambat. Kalau
           pointer terlalu jauh, ujung atas berhenti di radius ini.          */
    const MOUTH_H = 20;                                       // tinggi mulut jaket
    const MOUTH_IN = (JACKET_W - (CON_STEP * 7 + CON_W)) / 2;   // 17: jeda mulut ke tepi selubung
    const ANCHOR_DY = 26;                                     // tampat 26 px di dalam selubung
    const MAXLEN = Math.ceil(Math.hypot(
        CON_STEP * 7 / 2 + SLOT_SPAN * 3.5,                  // jangkauan mendatar ke slot terjauh
        (WIRE_B + ANCHOR_DY) - SLOT_SEAT                      // jangkuran vertikal ke slot
    ) * 1.2);                                                // +20% kelonggaran untuk pointer

    const NEED_CM = 40;               // kebutuhan PC -> switch
    const LEN_OPS = [30, 40, 60];

    const lerp = (a, b, t) => a + (b - a) * t;
    const easeOut = t => 1 - Math.pow(1 - t, 3);
    const easeBack = t => { const u = t - 1; return 1 + 2.70158 * u * u * u + 1.70158 * u * u; };

    /* ---------- SARUNG TANGAN: HANYA SAAT ANIMASI PEMAKAIAN ----------
       Area kerja sengaja BEBAS dari objek sarung/tangan saat level dimulai:
       tidak ada sprite sarung tergeletak, tidak ada tangan mengambang.
       Perlengkapan sarung tangan hanya diwakili IKON-nya di panel ALAT.
       Saat kartu Sarung Tangan diklik, animasi lv.anim 'glove' berjalan dan
       barulah sebuah tangan digambar di tengah area kerja: berubah dari
       tangan telanjang (cover=0) menjadi tangan bersarung penuh (cover=1),
       lalu menghilang. Begitu animasi usai (KAB.glove=true) tidak ada lagi
       tangan/sarung yang digambar. Dipas di dalam draw memakai lv.anim +
       performance.now() yang sudah ada, tanpa rAF/setTimeout baru.
       Titik asal HAND = pergelangan tangan (jari mengarah ke atas).         */
    const HAND = { x: CX, y: 342, s: 1.28, rot: -0.08 };

    /* ================================================================
       ISI PEMBELAJARAN
       ================================================================ */
    const TOOL_INFO = [
        { id: 'sarung_tangan', name: 'Sarung Tangan', why: 'Melindungi tangan dari kawat tembaga yang tajam.' },
        { id: 'strip', name: 'Pengupas Kabel', why: 'Membuka selubung (jaket) tanpa melukai kawat di dalamnya.' },
        { id: 'gunting', name: 'Pemotong Kabel', why: 'Memotong panjang kabel lalu meratakan ujung konduktor.' },
        { id: 'rj45', name: 'Konektor RJ-45', why: 'Tempat 8 konduktor bertemu 8 pin emas pada port LAN.' },
        { id: 'crimp', name: 'Tang Crimping', why: 'Menekan konektor sampai pin emas mengunci pada konduktor.' },
        { id: 'tester', name: 'LAN Tester', why: 'Mengirim sinyal ke tiap pin untuk cek sambungan kabel.' }
    ];
    const STEPS = [
        { id: 'glove', label: '1. Pakai sarung tangan', tool: 'sarung_tangan' },
        { id: 'strip', label: '2. Kupas selubung kabel', tool: 'strip' },
        { id: 'order', label: '3. Susun warna ke pin 1\u20138', tool: null },
        { id: 'trim', label: '4. Potong panjang & ratakan ujung', tool: 'gunting' },
        { id: 'conn', label: '5. Pasang konektor RJ-45', tool: 'rj45' },
        { id: 'crimp', label: '6. Crimp dengan tang', tool: 'crimp' },
        { id: 'test', label: '7. Uji dengan LAN Tester', tool: 'tester' }
    ];
    /* Bar Andi: APA (instruksi) / KENAPA (alasan) / AWAS (kesalahan umum).
       Semua kolom dibungkus para() dengan x = titik tengah kotak (bukan tepi
       kiri), supaya tidak ada teks yang keluar dari kotaknya. */
    const PED = {
        glove: ['Klik kartu Sarung Tangan di panel ALAT (kiri).',
            'Kawat tembaga terbuka bisa menusuk tangan; sarung tangan jadi pelindung.',
            'Bekerja tanpa sarung tangan berisiko tertusuk kawat tajam.'],
        strip: ['Klik Pengupas Kabel. Kupas selubung sekitar 1,2 cm dari ujung.',
            'Supaya 8 konduktor bisa dibentangkan dan disusun tanpa tersekat selubung.',
            'Jangan mengupas terlalu dalam \u2014 tembaga bisa tergores dan putus.'],
        order: ['Seret konduktor ke slot pin 1\u20138. Bisa juga klik konduktor lalu klik slotnya.',
            'Urutan warna menentukan pin mana yang jadi TX dan RX di dalam jaringan.',
            'T568A dan T568B sah, tapi satu kabel tidak boleh mencampur keduanya.'],
        trim: ['Klik Pemotong Kabel, pilih panjang ' + NEED_CM + ' cm, lalu ratakan ujungnya.',
            'Ujung rata membuat setiap konduktor tepat menyentuh pin emas di RJ-45.',
            'Konduktor kepanjangan saling bersentuhan (short); yang kependek tidak sampai pin.'],
        conn: ['Klik Konektor RJ-45. Selubung ikut masuk sekitar 1,2 cm ke dalam konektor.',
            'Konektor menahan susunan warna supaya tidak bergeser saat ditekan tang.',
            'Pasang RJ-45 hanya setelah ujung rata, kalau tidak konektor ikut terbuang.'],
        crimp: ['Klik Tang Crimping. Tekan kuat sampai kontak emas menembus selubung konduktor.',
            'Crimping mengunci pin emas pada kawat sehingga sambungan kuat dan tidak goyah.',
            'Kurang ditekan kabel tidak nyambung; terlalu keras selubung konduktor bisa retak.'],
        test: ['Klik Tester lalu tekan JALANKAN. Perhatikan LED 1 sampai 8.',
            'Tester mengirim sinyal lewat tiap pin untuk mengecek sambungan kabel.',
            'LED merah berarti ada pin yang tertukar \u2014 ulangi dari menyusun warnanya.']
    };
    const HINT = {
        glove: 'Kartu "Sarung Tangan" di panel ALAT, titik merahnya menyala.',
        strip: 'Kartu "Pengupas Kabel" di panel ALAT, titik merahnya menyala.',
        order: 'Seret konduktor ke slot pin 1\u20138, atau klik konduktor lalu klik slotnya.',
        trim: 'Kartu "Pemotong Kabel" di panel ALAT: pilih panjang, lalu ujung diratakan.',
        conn: 'Kartu "Konektor RJ-45" di panel PASANG, titik merahnya menyala.',
        crimp: 'Kartu "Tang Crimping" di panel PASANG, titik merahnya menyala.',
        test: 'Kartu "Tester" di panel PASANG untuk menjalankan uji sambungan.'
    };
    /* Nama warna versi pendek untuk mode mudah (dipakai di dalam slot 36 px) */
    const LOKAL = {
        wo: ['Putih-', 'Oranye'], o: ['Oranye'], wg: ['Putih-', 'Hijau'], b: ['Biru'],
        wb: ['Putih-', 'Biru'], g: ['Hijau'], wbr: ['Putih-', 'Coklat'], br: ['Coklat']
    };
    const curStep = () => STEPS[lv.step];
    const ped = () => PED[curStep().id];

    /* ================================================================
       KEADAAN
       ================================================================ */
    const WIRE_IDS = ['wo', 'o', 'wg', 'b', 'wb', 'g', 'wbr', 'br'];
    const KAB = {
        /* Siklus pemakaian sarung tangan (lihat l2Tangan / l2ActGlove):
             gloveSelected  = pemain menekan kartu Sarung Tangan
             gloveEquipping = animasi "memakai sarung" sedang berjalan
             glovesEquipped = sarung sudah terpasang penuh (alias glove) */
        gloveSelected: false, gloveEquipping: false, glovesEquipped: false,
        glove: false, stripped: false, lenChosen: false, usedCm: 0,
        trimmed: false, conn: false, crimped: false,
        rj45Used: 0, helpUsed: 0,
        loose: shuffle(WIRE_IDS.slice()),
        slots: new Array(8).fill(null),
        /* ujung tiap konduktor: x/y posisi UJUNG ATAS (bagian yang boleh
           bergerak mengikuti pointer), vx/vy kecepatan frame ini */
        tip: {}, mov: {},
        /* titik tambat di mulut jaket: TETAP, tidak pernah ikut bergerak */
        anchor: {}
    };
    WIRE_IDS.forEach(function (id) { KAB.tip[id] = { x: 0, y: 0, vx: 0, vy: 0 }; });
    /* Sebar 8 titik tambat merata di lebar mulut jaket, urutannya sama
       dengan urutan acak awal kabel supaya tidak saling bertumpuk di dasar.
       Setelah baris ini anchor tidak pernah berubah lagi. */
    KAB.loose.forEach(function (id, i) {
        KAB.anchor[id] = { x: BASE_X0 + i * CON_STEP, y: WIRE_B + ANCHOR_DY };
    });

    lv.KAB = KAB; lv.steps = STEPS; lv.tools = TOOL_INFO; lv.needCm = NEED_CM;
    lv.phase = 'brief';
    lv.briefPage = 0; lv.briefShown = 0; lv.tPrev = performance.now();
    lv.step = 0; lv.tool = null; lv.anim = null; lv.flash = null; lv.modal = null;
    lv.sel = null; lv.drag = null; lv.inBox = 0;
    lv.test = null; lv.helpFree = 1; lv.helpUntil = 0;
    lv.lastAct = performance.now();
    lv.modeMudah = !!save.l2.mudah;

    const l2Andi = (t, ms) => { lv.andiTip = t; lv.andiUntil = performance.now() + (ms || 9000); };
    function l2Flash(msg, kind) {
        lv.flash = { msg: msg, kind: kind || 'info', t: performance.now() };
    }

    /* ================================================================
       ANIMASI (dipas di dalam draw, tanpa setTimeout)
       ================================================================ */
    function l2Anim(type, dur, done) { lv.anim = { type: type, t0: performance.now(), dur: dur, done: done || null }; }
    function l2AnimP(now, type) {
        const a = lv.anim;
        if (!a || a.type !== type) return 1;
        return clamp((now - a.t0) / a.dur, 0, 1);
    }
    function l2TickAnim(now) {
        const a = lv.anim;
        if (!a || now - a.t0 < a.dur) return;
        lv.anim = null;
        if (a.done) a.done();
    }
    function l2Step() {
        if (lv.step >= STEPS.length - 1) return;
        lv.step++; lv.tool = null; lv.sel = null; lv.drag = null;
        l2Andi(HINT[curStep().id]);
    }
    function l2CableTop(now) {
        if (lv.anim && lv.anim.type === 'conn') return lerp(WIRE_B, JACK_UP, easeOut(l2AnimP(now, 'conn')));
        return KAB.conn ? JACK_UP : WIRE_B;
    }

    /* ================================================================
       1 — SARUNG TANGAN (animasi memakai, TANPA objek permanen)
       ----------------------------------------------------------------
       Saat level dimulai area kerja BENAR-BENAR bersih: tidak ada sprite
       sarung maupun tangan. Hanya ketika kartu Sarung Tangan diklik,
       animasi lv.anim 'glove' berjalan dan menggambar satu tangan manusia:
         tahap 1  tangan telanjang (cover=0, sarung masih di samping)
         tahap 2  sarung muncul DARI SAMPING (slide -38 -> 0)
         tahap 3  tangan masuk ke sarung (cover naik: kain menutup badan tangan)
         tahap 4  sarung terpasang penuh (cover=1)
         tahap 5  jari menggenggam sebentar (flex), lalu memudar.
       Setelah selesai (KAB.glove=true) area kerja kembali bersih. Dipas di
       dalam draw memakai lv.anim + performance.now(); tanpa rAF/setTimeout. */
    function l2Tangan(now) {
        const a = lv.anim;
        if (!a || a.type !== 'glove') return;     // diam: tidak ada objek apa pun
        const p = l2AnimP(now, 'glove');
        const appear = clamp(p / .12, 0, 1);                  // muncul cepat di awal
        const slide = (1 - easeOut(clamp(p / .30, 0, 1))) * -38;   // sarung dari samping
        const cover = easeOut(clamp((p - .14) / .52, 0, 1));  // tangan masuk -> kain menutup
        const flex = Math.sin(clamp((p - .40) / .40, 0, 1) * Math.PI) * .5;   // menggenggam sebentar
        const out = clamp((p - .86) / .14, 0, 1);             // memudar menjelang akhir
        ctx.save();
        ctx.globalAlpha = Math.min(appear, 1 - out);
        ctx.translate(0, (1 - appear) * 10);                  // naik sedikit saat muncul
        drawWorkHand(HAND.x, HAND.y, HAND.s, HAND.rot, cover, flex, slide);
        ctx.restore();
    }
    /* Klik kartu Sarung Tangan: mulai animasi 'glove' (1,7 dtk).
       KAB.glove baru diset true saat animasi selesai, lalu l2Step()
       memajukan ke langkah kupas. Penjaga di awal mencegah animasi dobel
       kalau kartu diklik lagi selagi animasi berjalan. */
    function l2ActGlove() {
        if (KAB.glove || lv.anim) return;
        KAB.gloveSelected = true;                 // pemain memilih sarung tangan
        l2Flash('Sarung tangan HIDUP. Tangan aman dari kawat tajam.', 'ok');
        say('Sarung tangan HIDUP', 'ok');
        SND.klik();
        KAB.gloveEquipping = true;                // animasi memakai sarung berjalan
        l2Anim('glove', 1700, () => {
            KAB.gloveEquipping = false;
            KAB.glovesEquipped = true;            // sarung terpasang penuh
            KAB.glove = true;                     // alias lama (dipakai uji & status)
            l2Step();
        });
    }

    /* ================================================================
       2 — PENGUPAS KABEL (sprite bergerak, konduktor mekar keluar)
       ================================================================ */
    function l2ActStrip() {
        KAB.stripped = true;
        l2Flash('Selubung terkupas. 8 konduktor keluar dengan urutan acak.', 'ok');
        SND.kupas();
        l2Anim('strip', 1500, () => {
            l2Andi('Klik atau seret konduktor ke slot pin 1\u20138. Sentuh konduktor untuk membaca nama warnanya.');
        });
        l2Step();
    }

    /* ================================================================
       3 — MENYUSUN WARNA: konduktor elastis (bezier)
       ================================================================ */
    /* Posisi kipas awal ujung atas: tepat di atas titik tambat sendiri,
       sehingga kabel yang belum dipasang tegak dari jaket. */
    function l2LooseX(id) { return KAB.anchor[id].x; }
    function l2Home(id) { return { x: l2LooseX(id), y: TIP_Y }; }
    /* Posisi tujuan ujung atas: kalau sudah di slot -> duduk di tengah slot,
       kalau belum -> di atas jaket pada titik tambatnya sendiri. */
    function l2Goal(id, now) {
        const s = KAB.slots.indexOf(id);
        if (s >= 0) return { x: slotCX(s), y: SLOT_SEAT };
        const h = l2Home(id);
        const a = lv.anim;
        if (a && a.type === 'strip') {                     // konduktor mekar keluar dari jaket
            const i = Math.max(0, KAB.loose.indexOf(id));
            const q = easeOut(clamp((l2AnimP(now, 'strip') - 0.20 - i * 0.022) / 0.55, 0, 1));
            return { x: h.x, y: lerp(l2CableTop(now) + ANCHOR_DY, TIP_Y, q) };
        }
        return h;
    }
    /* Mulai gerak ujung ke suatu titik dengan pegas (ease-out + sedikit memantul). */
    function l2MoveTo(id, tx, ty, dur, now) {
        const t = KAB.tip[id];
        KAB.mov[id] = { sx: t.x, sy: t.y, tx: tx, ty: ty, t0: now, dur: dur || 480, bounce: true };
    }
    function l2PutWire(id, slot) {
        const cur = KAB.slots[slot];
        if (cur === id) return;
        const now = performance.now();
        const from = KAB.slots.indexOf(id);
        if (from >= 0) {
            KAB.slots[from] = cur;
            if (cur && cur !== id) l2MoveTo(cur, slotCX(from), SLOT_SEAT, 460, now);
        }
        KAB.slots[slot] = id;
        l2MoveTo(id, slotCX(slot), SLOT_SEAT, 520, now);
        SND.klik();
        if (KAB.slots.every(Boolean) && lv.inBox < 1) {
            lv.inBox = 1;
            l2Flash('8 slot terisi. Semua konduktor sudah duduk di kotak RJ-45.', 'ok');
            l2Andi('Susunan selesai. Lanjut: potong panjang kabel lalu ratakan ujungnya.');
            l2Step();
        }
    }
    function l2SwapLoose(a, b) {
        const i = KAB.loose.indexOf(a), j = KAB.loose.indexOf(b);
        KAB.loose[i] = b; KAB.loose[j] = a;
        const now = performance.now();
        /* Yang tertukar hanya urutan di kipas; TITIK TAMBAT di jaket tetap
           di tempat. Ujung atas a dan b saling bertukar tempat supaya
           perpindahan terlihat jelas, lalu kembali ke titik tambatnya. */
        l2MoveTo(a, l2LooseX(b), TIP_Y, 420, now);
        l2MoveTo(b, l2LooseX(a), TIP_Y, 420, now);
        SND.klik();
    }
    function l2SlotAt(p) {
        for (let i = 0; i < 8; i++) {
            if (inR(p, { x: slotX(i) - 7, y: SLOT_HIT_T, w: SLOT_W + 14, h: SLOT_HIT_B - SLOT_HIT_T })) return i;
        }
        return -1;
    }
    /* Apakah titik pointer ini dekat dengan salah satu ujung kurva? */
    function l2NearCurve(c, p, reach, n) {
        for (let k = 0; k <= n; k++) {
            const q = l2Bez(c.p0, c.p1, c.p2, c.p3, k / n);
            if (Math.abs(q.x - p.x) <= reach && Math.abs(q.y - p.y) <= reach) return true;
        }
        return false;
    }
    /* Kurva kipas saat kabel sedang di tempatnya: tegak dari titik tambat
       ke ujung atas di atas jaket. */
    function l2HomeCtrl(id, now) {
        const h = l2Home(id), ay = l2CableTop(now) + ANCHOR_DY, H = ay - h.y;
        return {
            p0: { x: h.x, y: ay }, p1: { x: h.x, y: ay - H * 0.46 },
            p2: { x: h.x, y: h.y + H * 0.414 }, p3: { x: h.x, y: h.y }
        };
    }
    /* Area klik kabel:
       1) dulu posisi kipas di atas titik tambat: di sanalah pemain
          mengira kabelnya ada, dan di situ kabel tetap tertangkap meski
          masih dalam perjalanan pulang dari slot;
       2) kalau tidak kena, kurva yang benar-benar sedang digambar, supaya
          kabel yang sudah melengkung / diseret bisa dipegang di mana saja. */
    function l2LooseAt(p) {
        if (lv.inBox >= 1 || !KAB.stripped) return null;
        const now = performance.now(), reach = CON_W / 2 + 5, n = 14;
        for (let i = 0; i < KAB.loose.length; i++) {
            const id = KAB.loose[i];
            if (KAB.slots.indexOf(id) >= 0) continue;
            if (l2NearCurve(l2HomeCtrl(id, now), p, reach, n)) return id;
        }
        for (let i = 0; i < KAB.loose.length; i++) {
            const id = KAB.loose[i];
            if (KAB.slots.indexOf(id) >= 0) continue;
            if (l2NearCurve(l2Ctrl(id, now), p, reach, n)) return id;
        }
        return null;
    }
    function l2SlotHover(i) {
        return mouse.x >= slotX(i) - 7 && mouse.x <= slotX(i) + SLOT_W + 7 &&
            mouse.y >= SLOT_HIT_T && mouse.y <= SLOT_HIT_B;
    }
    function l2HoverWire() { return lv.sel || l2LooseAt(mouse); }

    /* ================================================================
       4 — PEMOTONG KABEL (panjang + ratakan)
       ================================================================ */
    function l2ActCut() {
        if (!KAB.lenChosen) { lv.modal = 'len'; SND.klik(); return; }
        l2RunTrim();
    }
    function l2ChooseLen(cm) {
        lv.modal = null;
        KAB.lenChosen = true;
        KAB.usedCm += cm;
        SND.potong();
        l2Flash('Kabel dipotong ' + cm + ' cm. Total terpakai ' + KAB.usedCm + ' cm.', 'ok');
        if (cm !== NEED_CM && !lv.modeMudah) {
            lv.penalize(4, 'Kabel ' + cm + ' cm padahal kebutuhan ' + NEED_CM + ' cm \u2014 bahan terbuang, pilih ' + NEED_CM + ' cm untuk PC ke switch');
            l2Andi('Panjang ' + cm + ' cm lebih ' + (cm > NEED_CM ? 'panjang' : 'pendek') + ' dari kebutuhan. Kabel straight-through PC ke switch tepatnya ' + NEED_CM + ' cm.');
        } else {
            l2Andi(cm === NEED_CM ? 'Panjang tepat ' + NEED_CM + ' cm. Kabelmu tidak mubazir.' : 'Panjang ' + cm + ' cm dipakai. Kebutuhan sebenarnya ' + NEED_CM + ' cm.');
        }
        l2Anim('cut', 700, () => l2RunTrim());
    }
    function l2RunTrim() {
        KAB.trimmed = true;
        SND.potong();
        l2Flash('Ujung sudah rata. Semua konduktor sama panjang dan siap masuk RJ-45.', 'ok');
        l2Andi('Bagus. Ujung rata membuat setiap konduktor tepat menyentuh pin emas. Lanjut pasang konektor.');
        l2Anim('trim', 1100, () => l2Step());
    }

    /* ================================================================
       5 — KONEKTOR RJ-45
       ================================================================ */
    function l2ActConn() {
        KAB.rj45Used++;
        if (!KAB.trimmed) {
            lv.tool = null;
            lv.penalize(8, 'Konektor dipasang pada ujung yang belum diratakan \u2014 ratakan dulu dengan Pemotong Kabel, baru pasang RJ-45');
            l2Flash('Konektor dibuang \u2014 ujung konduktor belum rata.', 'bad');
            l2Andi('Ujung yang belum rata membuat konduktor tidak menyentuh pin emas. Ratakan dulu, konektor lain bisa dipasang.');
            return;
        }
        KAB.conn = true;
        SND.klik();
        l2Flash('Sudah pasang! Selubung ikut masuk ke dalam konektor.', 'ok');
        l2Andi('Konektor sudah menutupi konduktor. Sekarang tekan Tang Crimping sampai kontak emas mengunci.');
        l2Anim('conn', 900, () => l2Step());
    }

    /* ================================================================
       6 — TANG CRIMPING
       ================================================================ */
    function l2ActCrimp() {
        SND.crimp();
        l2Flash('Kabel berhasil di-crimping! \u2705', 'ok');
        shake = 7;
        l2Anim('crimp', 1900, () => {
            KAB.crimped = true;
            SND.crimp();
            shake = 5;
            l2Andi('Kontak emas sudah menembus selubung konduktor. Kabel siap diuji.');
            l2Step();
        });
    }

    /* ================================================================
       7 — LAN TESTER
       ================================================================ */
    function l2ActTester() { lv.modal = 'test'; lv.test = { phase: 'siap', t0: 0, res: [] }; SND.klik(); }

    function l2Same(a, b) { for (let i = 0; i < 8; i++) if (a[i] !== b[i]) return false; return true; }
    function l2WrongCount(a, ref) { let n = 0; for (let i = 0; i < 8; i++) if (a[i] !== ref[i]) n++; return n; }
    function l2AllTrue(a) { for (let i = 0; i < a.length; i++) if (!a[i]) return false; return true; }
    function l2RefStd() { return l2WrongCount(KAB.slots, T568B) <= l2WrongCount(KAB.slots, T568A) ? T568B : T568A; }

    function l2Jalankan() {
        const ref = l2RefStd();
        lv.test = { phase: 'run', t0: performance.now(), res: KAB.slots.map((id, i) => id === ref[i]), ref: ref.slice() };
        SND.klik();
    }
    function l2SelesaiTes() {
        const t = lv.test, ref = l2RefStd(), bad = [];
        if (!l2AllTrue(t.res)) {
            for (let i = 0; i < 8; i++) if (KAB.slots[i] !== ref[i]) bad.push(i + 1);
            t.phase = 'fail'; t.bad = bad; t.ref = ref.slice();
            const ket = bad.map(i => 'pin ' + i + ' harus ' + WC[ref[i - 1]].n).join(', ');
            lv.penalize(10, 'Gagal uji tester di pin ' + bad.join(', ') + ' \u2014 ' + ket + '. Ulangi menyusun warna sesuai T568A atau T568B');
            KAB.rj45Used++;
            l2ResetUlang();
            l2Andi('LED merah di pin ' + bad.join(', ') + '. Urutan di sana tertukar \u2014 buka Bantuan Kabel lalu susun ulang dari awal.');
            return;
        }
        t.phase = 'ok';
        t.std = l2Same(KAB.slots, T568B) ? 'T568B' : 'T568A';
        SND.benar();
        l2Flash('LULUS: ' + t.std + '. Semua LED hijau 1\u20138.', 'ok');
        l2Andi('Semua LED hijau. Tekan KIRIM & NILAI untuk melanjutkan.');
    }
    function l2ResetUlang() {
        KAB.slots = new Array(8).fill(null);
        KAB.conn = false; KAB.crimped = false; KAB.trimmed = false;
        lv.inBox = 0; lv.sel = null; lv.drag = null;
        lv.step = 2; lv.tool = null;
        WIRE_IDS.forEach(function (id) { KAB.mov[id] = null; });
        l2Flash('Konektor lama dibuang \u2014 RJ45 +1. Susun ulang warna dari awal.', 'bad');
    }

    /* ================================================================
       GAMBAR — kurva konduktor: dari TITIK TAMBAT di jaket ke ujung atas
       ------------------------------------------------------------------
       Tiap konduktor digambar sebagai kurva Bezier dari anchor (di DALAM
       mulut jaket) ke ujung atasnya, bukan batang lurus yang ikut geser.
       Akibatnya ujung bawah kabel selalu tertambat di jaket, tidak pernah
       ikut bergerak mengikuti pointer, dan tidak pernah terlihat menumpuk
       di atas tepi selubung (jaket digambar SETELAH kabel).
       Bentuk kawat dibuat sebagai POLIGON tabung dari titik tengah kurva
       + normal, jadi:
         - ketebalan kabel KONSTAN di setiap titik (tidak menebal/menipis)
         - bisa dipakai sebagai clip() untuk garis diagonal kabel
           putih-berwarna
       ================================================================ */
    function l2Bez(p0, p1, p2, p3, t) {
        const m = 1 - t, a = m * m * m, b = 3 * m * m * t, c = 3 * m * t * t, d = t * t * t;
        return { x: a * p0.x + b * p1.x + c * p2.x + d * p3.x, y: a * p0.y + b * p1.y + c * p2.y + d * p3.y };
    }
    function l2BezD(p0, p1, p2, p3, t) {
        const m = 1 - t;
        return {
            x: 3 * m * m * (p1.x - p0.x) + 6 * m * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x),
            y: 3 * m * m * (p1.y - p0.y) + 6 * m * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y)
        };
    }
    /* Empat titik kendali kurva kawat:
         - p1.x = anchor.x  -> garis keluar dari jaket selalu TEGAK
         - p2 -> ujung atas approached mendekati tegak supaya ujung terlihat
           duduk rapi di dalam slot
         - bow = 0.46 x panjang: 0.42 berarti lurus, di bawah 0.42 kawat
           menggantung / melengkung seperti kawat nyata yang ditarik
         - leneng kecil `out` mengikuti posisi slot (kiri ke kiri, kanan ke
           kanan) supaya kipas terpasang terlihat teratur dan tidak saling
           menimpa. */
    function l2Ctrl(id, now) {
        const a = KAB.anchor[id], t = KAB.tip[id];
        const ax = a.x, ay = l2CableTop(now) + ANCHOR_DY;
        const dx = t.x - ax, dy = ay - t.y;
        const L = Math.min(Math.hypot(dx, dy), MAXLEN) || 1;   // panjang dibatasi MAXLEN
        const f = KAB.slots.indexOf(id);
        const bow = L * 0.46, out = (f >= 0 ? (f - 3.5) / 3.5 : dx / (CON_STEP * 7)) * L * 0.05;
        return {
            p0: { x: ax, y: ay },
            p1: { x: ax, y: ay - bow },
            p2: { x: ax + dx + out, y: ay - dy + bow * 0.9 },
            p3: { x: ax + dx, y: ay - dy }
        };
    }
    /* Poligon tabung dari titik tengah kurva + normal. Ujung atas dibulat;
       ujung bawah (di dalam jaket) boleh rata karena tertutup jaket. */
    function l2Tube(c, r, n) {
        const L = [], R = [];
        let ux = 0, uy = -1;
        for (let i = 0; i <= n; i++) {
            const p = l2Bez(c.p0, c.p1, c.p2, c.p3, i / n);
            const d = l2BezD(c.p0, c.p1, c.p2, c.p3, i / n);
            const m = Math.hypot(d.x, d.y) || 1;
            ux = d.x / m; uy = d.y / m;
            L.push({ x: p.x - uy * r, y: p.y + ux * r });
            R.push({ x: p.x + uy * r, y: p.y - ux * r });
        }
        const pts = L.slice();
        for (let k = 1; k < 8; k++) {                    // ujung atas membulat
            const th = k / 8 * Math.PI, co = Math.cos(th), si = Math.sin(th);
            pts.push({
                x: c.p3.x + r * (-uy * co + ux * si),
                y: c.p3.y + r * (ux * co + uy * si)
            });
        }
        for (let i = n; i >= 0; i--) pts.push(R[i]);
        return { pts: pts, L: L, R: R, n: n };
    }
    function l2Poly(pts) {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.closePath();
    }
    /* Satu konduktor: kurva dari anchor di jaket ke ujung atas. Belang =
       dasar krem #f6efe0 + garis diagonal tebal (~40% lebar kabel). Polos =
       warna pekat + highlight tipis di tepi kiri. */
    function l2Conductor(id, now) {
        const w = CON_W, r = w / 2;
        const c = l2Ctrl(id, now), d = WC[id], st = !!d.st;
        const T = l2Tube(c, r, 26);
        ctx.save();
        l2Poly(T.pts);
        ctx.fillStyle = st ? '#f6efe0' : d.c;             // belang: krem, polos: warna
        /* Terpilih: halo putih dipakai sebagai GLOW di luar kabel (shadow),
           bukan sapuan putih di atas kabel. Kalau kabelnya sendiri dicat putih,
           warna kabel ikut berubah saat diseret. */
        if (lv.sel === id) {
            ctx.shadowColor = 'rgba(255,255,255,.9)';
            ctx.shadowBlur = 11;
        }
        ctx.fill();
        ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
        if (st) {                                          // belang: garis diagonal tebal
            ctx.save();
            l2Poly(T.pts); ctx.clip();
            /* Jangkar diagonal di TITIK TAMBAT yang TETAP (c.p0), bukan di kotak
               pembatas kurva yang bentuknya ikut berubah. Kalau jangkarnya ikut
               bergerak, garis belangnya meloncat-loncat tiap frame sehingga
               warna kabel terlihat berubah-ubah saat diseret. */
            const ax = c.p0.x, ay = c.p0.y, G = Math.ceil(MAXLEN) + 90;
            ctx.strokeStyle = d.c;
            ctx.lineWidth = Math.max(6, w * 0.4);          // ~40% lebar kabel
            ctx.beginPath();
            for (let k = -G; k <= G; k += 15) {            // diagonal 45 derajat
                ctx.moveTo(ax - G + k, ay + G);
                ctx.lineTo(ax - G + k + 2 * G, ay - G);
            }
            ctx.stroke();
            ctx.restore();
        } else {                                           // polos: highlight tipis tepi kiri
            ctx.beginPath();
            for (let i = 1; i < T.n; i++) {
                const q = T.L[i], o = T.R[i];
                const dx = o.x - q.x, dy = o.y - q.y, m = Math.hypot(dx, dy) || 1;
                const px = q.x + dx / m * 3.5, py = q.y + dy / m * 3.5;
                if (i === 1) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.lineWidth = 2; ctx.lineCap = 'round';
            ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.stroke();
        }
        l2Poly(T.pts);                                    // outline gelap 1.5 px
        ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(6,10,18,.85)'; ctx.stroke();
        ctx.restore();
    }

    /* Semua UJUNG ATAS konduktor dihitung ulang tiap frame: diseret (ikut
       pointer dengan easing), ditween ke slot, atau kembali ke kipas awal.
       TITIK TAMBAT di jaket tidak pernah ikut bergerak; hanya ujung atas
       yang berpindah. Panjang kabel dibatasi MAXLEN dari titik tambat. */
    function l2UpdateTips(now) {
        const drag = lv.drag;
        const strip = !!(lv.anim && lv.anim.type === 'strip');
        const ay = l2CableTop(now) + ANCHOR_DY;
        for (let i = 0; i < WIRE_IDS.length; i++) {
            const id = WIRE_IDS[i], t = KAB.tip[id], g = l2Goal(id, now);
            if (drag && drag.id === id) {
                /* Easing (lerp): ujung atas menyusul pointer, tidak melompat,
                   jadi kabel melengkung lembut selagi diseret. */
                t.vx = drag.x - t.x; t.vy = drag.y - t.y;
                t.x = lerp(t.x, drag.x, 0.42); t.y = lerp(t.y, drag.y, 0.42);
                KAB.mov[id] = null;
            } else if (strip) {
                t.vx = g.x - t.x; t.vy = g.y - t.y;
                t.x = g.x; t.y = g.y;
                KAB.mov[id] = null;
            } else {
                const m = KAB.mov[id];
                if (m) {                                    // tween halus ke slot / kipas
                    const p = clamp((now - m.t0) / m.dur, 0, 1);
                    const e = easeBack(p);
                    t.vx = lerp(m.sx, m.tx, e) - t.x;
                    t.vy = lerp(m.sy, m.ty, e) - t.y;
                    t.x += t.vx; t.y += t.vy;
                    if (p >= 1) KAB.mov[id] = null;
                } else {                                    // merapat pelan ke tujuan
                    t.vx = (g.x - t.x) * 0.22; t.vy = (g.y - t.y) * 0.22;
                    t.x += t.vx; t.y += t.vy;
                }
            }
            /* Batas panjang: kalau pointer terlalu jauh dari titik tambat,
               ujung atas berhenti di radius MAXLEN. Titik tambatnya sendiri
               tetap diam di dalam jaket, jadi kabel tidak pernah lepas. */
            const dx = t.x - KAB.anchor[id].x, dy = ay - t.y;
            const dd = Math.hypot(dx, dy);
            if (dd > MAXLEN) {
                const k = MAXLEN / dd;
                t.x = KAB.anchor[id].x + dx * k; t.y = ay - dy * k;
            }
        }
    }

    function l2Konduktor(now) {
        if (!KAB.stripped) return;
        const dragId = lv.drag ? lv.drag.id : null;
        for (let i = 0; i < KAB.loose.length; i++) {
            const id = KAB.loose[i];
            if (id === dragId) continue;
            l2Conductor(id, now);
        }
        if (dragId) l2Conductor(dragId, now);           // yang diseret paling atas
        if (curStep().id === 'order' && lv.inBox < 1) {       // panah arahkan ke kotak pin
            const p = .5 + .5 * Math.sin(now / 300);
            const ax = CX + 150, ay0 = WIRE_B - 16, ay1 = 252;
            ctx.save();
            ctx.setLineDash([7, 7]); ctx.lineWidth = 3;
            ctx.strokeStyle = 'rgba(125,211,252,' + (.30 + .45 * p) + ')';
            ctx.beginPath(); ctx.moveTo(ax, ay0); ctx.lineTo(ax, ay1); ctx.stroke();
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(ax, ay1 - 10); ctx.lineTo(ax - 10, ay1 + 4); ctx.lineTo(ax + 10, ay1 + 4);
            ctx.closePath(); ctx.fillStyle = 'rgba(125,211,252,' + (.45 + .5 * p) + ')'; ctx.fill();
            txt('susun ke pin 1\u20138', ax + 14, ay1 - 2,
                { s: 11, a: 'left', c: 'rgba(186,230,253,' + (.6 + .4 * p) + ')', w: 800 });
            ctx.restore();
        }
    }
    /* ---------- label nama warna, kecil dan menempel dekat ujung atas ----------
       Dicari posisi yang tidak menutupi slot tujuan: kandidat di atas /
       bawah / kiri / kanan ujung atas, yang luas tumpang tindihnya dengan
       kotak slot paling kecil yang dipilih.                              */
    function l2LabelPos(w, h, tx, ty) {
        const cand = [[0, -h - 10], [0, h + 10], [0, -h - 32], [0, h + 32],
        [w + 12, -h / 2], [-(w + 12), -h / 2], [w + 12, -h - 10], [-(w + 12), -h - 10],
        [w + 12, h + 10], [-(w + 12), h + 10]];
        let bx = tx - w / 2, by = ty - h - 10, bs = Infinity;
        for (let i = 0; i < cand.length; i++) {
            const x = clamp(tx - w / 2 + cand[i][0], AX + 6, AX + AW - w - 6);
            const y = clamp(ty + cand[i][1], AY + 6, AY + AH - h - 6);
            let pen = 0;
            for (let s = 0; s < 8; s++) {
                const ox = Math.min(x + w, slotX(s) + SLOT_W) - Math.max(x, slotX(s));
                const oy = Math.min(y + h, SLOT_BOT) - Math.max(y, BAND.y);
                if (ox > 0 && oy > 0) pen += ox * oy;
            }
            const sc = pen * 8 + Math.hypot(tx - (x + w / 2), ty - (y + h / 2));
            if (sc < bs) { bs = sc; bx = x; by = y; }
        }
        return { x: bx, y: by };
    }
    function l2LabelWadah() {
        const id = l2HoverWire();
        if (!id || KAB.slots.indexOf(id) >= 0) return;
        const t = KAB.tip[id], nm = WC[id].n;
        ctx.font = '700 11.5px ' + FONT_B;
        const w = ctx.measureText(nm).width + 20;
        const p = l2LabelPos(w, 24, t.x, t.y);
        rr(p.x, p.y, w, 24, 12);
        ctx.fillStyle = 'rgba(5,12,22,.97)'; ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = WC[id].c; ctx.stroke();
        txt(nm, p.x + w / 2, p.y + 16, { s: 11.5, a: 'center', c: '#ffffff', w: 700 });
    }

    /* ================================================================
       GAMBAR — strip atas
       ================================================================ */
    function l2DrawStripAtas() {
        ctx.fillStyle = '#0a1524'; ctx.fillRect(0, 54, W, 30);
        ctx.fillStyle = C.line; ctx.fillRect(0, 83, W, 1);
        btn(10, 57, 128, 26, 'Langkah-langkah', () => { lv.modal = lv.modal === 'steps' ? null : 'steps'; },
            { color: lv.modal === 'steps' ? C.acc : '#334155', tc: lv.modal === 'steps' ? '#06131f' : C.text, s: 12 });
        btn(144, 57, 128, 26, 'Bantuan Kabel', () => l2OpenHelp(),
            { color: lv.modal === 'help' ? C.acc : '#334155', tc: lv.modal === 'help' ? '#06131f' : C.text, s: 12 });
        btn(278, 57, 122, 26, 'Mode mudah: ' + (lv.modeMudah ? 'ON' : 'OFF'), () => {
            lv.modeMudah = !lv.modeMudah; save.l2.mudah = lv.modeMudah; persist();
            l2Andi(lv.modeMudah ? 'Mode mudah aktif: target warna dan garis potong ditampilkan, pilihan panjang yang meleset tidak dikurangi skor.'
                : 'Mode mudah mati: semua kesalahan mengurangi skor.');
        }, { color: lv.modeMudah ? C.ok : '#334155', tc: lv.modeMudah ? '#04160f' : C.text, s: 11.5 });
        const nm = (nameEl.value || '(tanpa nama)').trim() || '(tanpa nama)';
        txt('Nama: ' + (nm.length > 12 ? nm.slice(0, 11) + '\u2026' : nm), 416, 76, { s: 12, c: C.mute, w: 700 });
        txt('Waktu ' + fmt(lv.phase === 'fin' ? lv.dur : lv.elapsed()), 706, 76, { s: 12.5, a: 'right', c: C.text, w: 800 });
        txt('Terpakai: ' + KAB.usedCm + ' cm', 836, 76, { s: 12.5, a: 'right', c: C.text, w: 800 });
        txt('RJ45: ' + KAB.rj45Used, 950, 76, { s: 12.5, a: 'right', c: C.text, w: 800 });
    }
    function l2OpenHelp() {
        if (lv.modal === 'help') { lv.modal = null; return; }
        const now = performance.now();
        if (lv.helpFree > 0) {
            lv.helpFree--; KAB.helpUsed++; lv.modal = 'help';
            say('Bantuan gratis dipakai. Tabel T568A / T568B terbuka.', 'info');
        } else if (now > lv.helpUntil) {
            lv.penalize(5, 'Membuka Bantuan Kabel di luar jatah gratis \u2014 simulator ini menyediakan 1 kali buka gratis');
            KAB.helpUsed++; lv.modal = 'help'; lv.helpUntil = now + 1200;
        }
    }

    /* ================================================================
       GAMBAR — panel alat (kiri ALAT / kanan PASANG)
       ================================================================ */
    function l2DrawPanelAlat(P, list, title) {
        rr(P.x, P.y, P.w, P.h, 14); ctx.fillStyle = 'rgba(11,21,35,.96)'; ctx.fill();
        ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.stroke();
        txt(title, P.x + P.w / 2, P.y + 24, { s: 13, a: 'center', c: C.acc, w: 800 });
        list.forEach(function (t, i) {
            const bx = P.x + 8, by = CARD.y + i * CARD.dy, bw = P.w - 16, bh = CARD.h;
            const st = t.step < lv.step ? 'done' : (t.step === lv.step ? 'next' : 'lock');
            const act = lv.tool === t.id;
            const hov = over(bx, by, bw, bh) && st !== 'lock';
            if (hov) hoverBtn = true;
            if (st === 'next' && performance.now() - lv.lastAct > 15000) {   // hint: denyut kalau diam > 15 detik
                const p = .5 + .5 * Math.sin(performance.now() / 190);
                ctx.save(); ctx.globalAlpha = .25 + .55 * p;
                rr(bx - 5, by - 5, bw + 10, bh + 10, 16);
                ctx.lineWidth = 3; ctx.strokeStyle = C.acc; ctx.stroke(); ctx.restore();
            }
            rr(bx, by, bw, bh, 12);
            ctx.fillStyle = st === 'lock' ? 'rgba(15,24,38,.9)' : (hov ? '#2b4864' : 'rgba(23,41,63,.96)');
            ctx.fill();
            ctx.lineWidth = act ? 3 : 2;
            ctx.strokeStyle = act ? '#ffffff' : (st === 'lock' ? '#1b2838' : C.line);
            ctx.stroke();
            if (act) {
                rr(bx - 3, by - 3, bw + 6, bh + 6, 15);
                ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.stroke();
            }
            ctx.save(); ctx.globalAlpha = st === 'lock' ? .35 : 1;
            icon(t.id, bx + 32, by + 34, .56);
            ctx.restore();
            para(t.name, bx + 58, by + 30, bw - 70, 15, { s: 12, w: 800, c: st === 'lock' ? '#5f7389' : C.text });
            if (st === 'lock') lock(bx + bw - 22, by + bh - 20, .5);
            const dx = bx + bw - 18, dy = by + 18;
            if (st === 'next') {                 // titik MERAH = alat yang dipakai sekarang
                const pulse = .55 + .45 * Math.sin(performance.now() / 220);
                ctx.save(); ctx.globalAlpha = .35 * pulse;
                ctx.beginPath(); ctx.arc(dx, dy, 15, 0, 6.3); ctx.fillStyle = C.bad; ctx.fill(); ctx.restore();
                ctx.beginPath(); ctx.arc(dx, dy, 8, 0, 6.3); ctx.fillStyle = C.bad; ctx.fill();
                ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke();
            } else if (st === 'done') {          // titik HIJAU = sudah dipakai
                ctx.beginPath(); ctx.arc(dx, dy, 8, 0, 6.3); ctx.fillStyle = C.ok; ctx.fill();
                tickIcon(dx, dy, 10, '#04160f');
            }
            hit(bx, by, bw, bh, () => l2PakaiAlat(t));
        });
    }
    function l2PakaiAlat(t) {
        if (lv.modal || lv.anim) return;
        lv.lastAct = performance.now();
        if (t.step < lv.step) { l2Flash('Alat "' + t.name + '" sudah dipakai di langkah sebelumnya.', 'info'); SND.klik(); return; }
        if (t.step > lv.step) {
            if (t.id === 'rj45' && lv.step <= 3) { l2ActConn(); return; }
            lv.penalize(2, 'Alat "' + t.name + '" belum waktunya \u2014 ikuti urutan di panel Langkah-langkah, titik merah = alat yang dipakai sekarang');
            l2Andi('Ikuti urutan langkah. Titik merah di kartu alat berarti alat itu yang dipakai sekarang.');
            return;
        }
        lv.tool = t.id;
        if (t.id === 'sarung_tangan') l2ActGlove();
        else if (t.id === 'strip') l2ActStrip();
        else if (t.id === 'gunting') l2ActCut();
        else if (t.id === 'rj45') l2ActConn();
        else if (t.id === 'crimp') l2ActCrimp();
        else if (t.id === 'tester') l2ActTester();
    }
    const TOOLS_L = [
        { id: 'sarung_tangan', name: 'Sarung Tangan', step: 0 },
        { id: 'strip', name: 'Pengupas Kabel', step: 1 },
        { id: 'gunting', name: 'Pemotong Kabel', step: 3 }
    ];
    const TOOLS_R = [
        { id: 'rj45', name: 'Konektor RJ-45', step: 4 },
        { id: 'crimp', name: 'Tang Crimping', step: 5 },
        { id: 'tester', name: 'Tester', step: 6 }
    ];

    /* ================================================================
       GAMBAR — panel STATUS (kiri bawah) & kartu PESAN (kanan bawah)
       ================================================================ */
    function l2DrawStatus() {
        const b = SBOX;
        rr(b.x, b.y, b.w, b.h, 12); ctx.fillStyle = 'rgba(10,19,32,.96)'; ctx.fill();
        ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.stroke();
        txt('STATUS', b.x + b.w / 2, b.y + 20, { s: 11, a: 'center', c: C.acc, w: 800 });
        const rows = [
            ['Sarung tangan', KAB.glove],
            ['Selubung kupas', KAB.stripped],
            ['Warna tersusun', lv.inBox >= 1],
            ['Ujung rata', KAB.trimmed],
            ['Konektor RJ-45', KAB.conn],
            ['Sudah di-crimp', KAB.crimped],
            ['Lulus tester', !!lv.test && lv.test.phase === 'ok']
        ];
        rows.forEach(function (r, i) {
            const yy = b.y + 38 + i * 13;
            ctx.beginPath(); ctx.arc(b.x + 15, yy - 4, 5, 0, 6.3);
            ctx.fillStyle = r[1] ? C.ok : '#31465e'; ctx.fill();
            if (r[1]) tickIcon(b.x + 15, yy - 4, 6, '#04160f');
            txt(r[0], b.x + 26, yy, { s: 11, c: r[1] ? C.text : C.mute, w: 700 });
        });
    }
    /* Kartu pesan muncul HANYA kalau ada l2Flash yang masih segar (5,2 dtk),
       supaya pesan tidak pernah menutupi teks lain di area kerja.            */
    function l2DrawPesan(now) {
        const f = lv.flash;
        if (!f || now - f.t > 5200) return;
        const b = MBOX;
        const col = f.kind === 'bad' ? C.bad : f.kind === 'ok' ? C.ok : C.acc;
        rr(b.x, b.y, b.w, b.h, 12);
        ctx.fillStyle = 'rgba(7,16,28,.96)'; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = col; ctx.stroke();
        ctx.fillStyle = col; ctx.fillRect(b.x + 1, b.y + 10, 4, b.h - 20);
        txt('PESAN', b.x + 14, b.y + 22, { s: 10, c: C.mute, w: 800 });
        const all = wrapLines(f.msg, b.w - 28, 11, 700);
        const L = all.length > 7 ? all.slice(0, 7) : all;
        if (all.length > 7) L[6] = L[6].slice(0, 15) + '\u2026';
        L.forEach(function (l, i) { txt(l, b.x + 14, b.y + 40 + i * 13.5, { s: 11, c: C.text, w: 700 }); });
    }

    /* ================================================================
       GAMBAR — area kerja
       ================================================================ */
    function l2DrawAreaKerja(now) {
        rr(AX, AY, AW, AH, 14);
        const g = ctx.createLinearGradient(0, AY, 0, AY + AH);
        g.addColorStop(0, '#0b1626'); g.addColorStop(.55, '#101f33'); g.addColorStop(1, '#13233a');
        ctx.fillStyle = g; ctx.fill();
        ctx.save();
        rr(AX, AY, AW, AH, 14); ctx.clip();
        ctx.strokeStyle = 'rgba(120,165,215,.09)'; ctx.lineWidth = 1; ctx.beginPath();
        for (let y = AY + 24; y < AY + AH; y += 24) { ctx.moveTo(AX, y); ctx.lineTo(AX + AW, y); }
        for (let x = AX + 24; x < AX + AW; x += 24) { ctx.moveTo(x, AY); ctx.lineTo(x, AY + AH); }
        ctx.stroke();

        const cabTop = l2CableTop(now);
        l2UpdateTips(now);
        l2Tangan(now);         // 0) animasi pakai sarung tangan (hanya saat lv.anim 'glove') paling belakang
        l2KotakPin(now);
        l2Konduktor(now);      // 1) konduktor digambar paling dulu
        l2Jaket(now, cabTop);  // 2) jaket DI ATAS konduktor: pangkal yang tertanam otomatis tertutup
        l2Konektor(now);
        l2BandaPin();
        l2AlatAnim(now);
        l2LabelWadah();
        ctx.restore();
        rr(AX, AY, AW, AH, 14);                     // bingkai putus-putus
        ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(125,170,215,.55)'; ctx.setLineDash([8, 6]); ctx.stroke();
        ctx.setLineDash([]);
    }

    /* ---------- selubung (jaket) + mulut jaket ----------
       Digambar SESUDAH seluruh konduktor (lihat l2DrawAreaKerja), jadi
       bagian kabel yang tertanam di selubung tertutup rapat dan terlihat
       masuk ke dalam, tidak pernah menumpuk di atas tepi jaket.
       Gaya selubung datar: semua sudut membulat radius 12. Warna solid
       #64748b (tidak tembus pandang), outline 3px #475569, garis tepi
       terang 1.5px rgba(255,255,255,.28). */
    function l2Jaket(now, cabTop) {
        const jw = JACKET_W, x = CX - jw / 2;
        const y = cabTop, h = (AY + AH) - y;
        if (h < 2) return;
        const r = 12;
        ctx.save();
        rr(AX, AY, AW, AH, 14); ctx.clip();
        rr(x, y, jw, h, r);                        // semua sudut membulat
        ctx.fillStyle = '#64748b'; ctx.fill();    // solid slate
        ctx.lineWidth = 3; ctx.strokeStyle = '#475569'; ctx.stroke();
        rr(x - 2, y - 2, jw + 4, h + 4, r);       // garis tepi terang di luar outline
        ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.stroke();
        /* Garis horizontal: tekstur selubung seperti kabel asli */
        ctx.save();
        rr(x, y, jw, h, r); ctx.clip();
        ctx.strokeStyle = 'rgba(30,41,59,.35)';
        ctx.lineWidth = 2;
        for (let yy = y + 24; yy < y + h - 14; yy += 24) {
            ctx.beginPath();
            ctx.moveTo(x + 10, yy);
            ctx.lineTo(x + jw - 10, yy);
            ctx.stroke();
        }
        ctx.restore();

        /* ---------- MULUT JAKET (lubang keluar konduktor) ----------
           Lebarnya pas di antara 8 titik tambat, jadi seluruh kawat terlihat
           keluar dari lubang yang sama. Gambar ini menimpa konduktor, jadi
           kabel langsung hilang di dalam mulut: kesan keluar dari dalam
           selubung, bukan ditempel di atasnya.                              */
        const mw = jw - MOUTH_IN * 2, mx = CX - mw / 2, my = y - 4, mh = MOUTH_H + 6;
        ctx.save();
        rr(mx, my, mw, mh, 8);
        const mg = ctx.createLinearGradient(0, my, 0, my + mh);
        mg.addColorStop(0, '#0a1220');           // lubang gelap
        mg.addColorStop(.45, '#26364e');
        mg.addColorStop(1, '#64748b');          // larut ke warna selubung, tanpa sambungan
        ctx.fillStyle = mg; ctx.fill();
        ctx.restore();
        /* Bayangan tipis di dalam mulut: kawat seem keluar dari kegelapan */
        ctx.save();
        rr(mx, my, mw, mh, 8); ctx.clip();
        const sg = ctx.createLinearGradient(0, my, 0, my + 9);
        sg.addColorStop(0, 'rgba(0,0,0,.6)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = sg; ctx.fillRect(mx, my, mw, 9);
        ctx.restore();

        txt('SELUBUNG (JAKET)', CX, y + h - 10, { s: 11, a: 'center', c: 'rgba(18,26,40,.92)', w: 800 });

        if (lv.anim && lv.anim.type === 'strip') {       // potongan jaket lepas & jatuh
            const p = l2AnimP(now, 'strip');
            if (p > .18) {
                const q = clamp((p - .18) / .55, 0, 1);
                ctx.save();
                ctx.globalAlpha = Math.max(0, 1 - q * q * 1.15);
                ctx.translate(CX + q * 20, WIRE_B - 12 + q * q * 130);
                ctx.rotate(q * 1.2);
                rr(-jw / 2, -14, jw, 28, 12);       // membulat juga
                ctx.fillStyle = '#64748b'; ctx.fill();
                ctx.lineWidth = 2.5; ctx.strokeStyle = '#475569'; ctx.stroke();
                ctx.restore();
            }
        }
        if (lv.anim && lv.anim.type === 'cut') {         // potongan panjang jatuh
            const q = l2AnimP(now, 'cut');
            ctx.save();
            ctx.globalAlpha = Math.max(0, 1 - q * q);
            ctx.translate(CX + q * 14, (AY + AH) - 24 + q * q * 110);
            ctx.rotate(q * .9);
            rr(-jw / 2 + 8, -16, jw - 16, 32, 12);
            ctx.fillStyle = '#64748b'; ctx.fill();
            ctx.lineWidth = 2.5; ctx.strokeStyle = '#475569'; ctx.stroke();
            ctx.restore();
        }
    }

    /* ---------- kotak RJ45 PIN 1-8 ---------- */
    function l2KotakPin(now) {
        if (!KAB.stripped) return;
        const ordering = curStep().id === 'order' && lv.inBox < 1;
        const pulse = .45 + .35 * Math.sin(now / 260);
        rr(PIN.x, PIN.y, PIN.w, PIN.h, 12);
        ctx.fillStyle = 'rgba(9,18,32,.90)'; ctx.fill();
        ctx.lineWidth = ordering ? 3 : 2;
        ctx.strokeStyle = ordering ? 'rgba(248,113,113,' + pulse + ')' : 'rgba(110,150,190,.65)';
        ctx.stroke();
        if (!KAB.conn) txt('RJ45 PIN 1\u20138', PIN.x + 16, HDR_Y, { s: 13, c: '#7dd3fc', w: 800 });
        const st = KAB.trimmed ? 'ujung sudah rata' : 'ujung belum rata';
        const scol = KAB.trimmed ? '#4ade80' : C.warn;
        if (!KAB.conn) {                                  // saat RJ-45 terpasang, chip ini ditutup konektor
            rr(PIN.x + PIN.w - 130, PIN.y + 3, 114, 18, 9);
            ctx.fillStyle = 'rgba(4,10,20,.85)'; ctx.fill();
            ctx.lineWidth = 1.5; ctx.strokeStyle = scol; ctx.stroke();
            txt(st, PIN.x + PIN.w - 73, PIN.y + 16, { s: 10.5, a: 'center', c: scol, w: 800 });
        }
        for (let i = 0; i < 8; i++) {
            const id = KAB.slots[i], hot = ordering && !id && l2SlotHover(i);
            rr(slotX(i), SLOT_TOP, SLOT_W, SLOT_BOT - SLOT_TOP, 8);
            ctx.fillStyle = id ? 'rgba(20,34,54,.9)' : (hot ? 'rgba(56,189,248,.18)' : 'rgba(14,24,40,.9)');
            ctx.fill();
            ctx.lineWidth = hot ? 2.5 : 1.5;
            ctx.strokeStyle = hot ? C.acc : (id ? 'rgba(150,190,220,.75)' : 'rgba(120,160,200,.55)');
            ctx.stroke();
            if (!id && lv.modeMudah && ordering) {      // mode mudah: target warna per slot
                const parts = LOKAL[T568B[i]];
                const y0 = (SLOT_TOP + SLOT_BOT) / 2 - (parts.length - 1) * 6 + 3;
                parts.forEach(function (w2, k) {
                    txt(w2, slotCX(i), y0 + k * 12, { s: 10, a: 'center', c: 'rgba(253,224,71,.92)', w: 700 });
                });
            }
        }
        if (curStep().id === 'trim' || (lv.anim && lv.anim.type === 'trim')) {
            ctx.save();                                   // garis potong menempel di ujung slot
            ctx.setLineDash([9, 7]); ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(251,191,36,.95)';
            ctx.beginPath(); ctx.moveTo(BAND.x + 2, CUT_Y); ctx.lineTo(BAND.x + BAND.w - 2, CUT_Y); ctx.stroke();
            ctx.setLineDash([]);
            [BAND.x + 2, BAND.x + BAND.w - 2].forEach(function (ax) {
                ctx.beginPath(); ctx.moveTo(ax, CUT_Y - 7); ctx.lineTo(ax, CUT_Y + 7); ctx.stroke();
            });
            ctx.restore();
        }
    }
    /* ---------- baris nomor pin 1-8, DI ATAS slot ----------
       Baris ini dipindah dari bawah slot ke atas slot, jadi kabel yang diseret
       terlihat langsung masuk ke slot. Tiap angka tetap persis di tengah
       horizontal slotnya (slotCX) dan ikut berubah biru kalau slotnya disorot. */
    function l2BandaPin() {
        if (!KAB.stripped) return;
        const ordering = curStep().id === 'order' && lv.inBox < 1;
        rr(BAND.x, BAND.y, BAND.w, BAND.h, 6);
        ctx.fillStyle = 'rgba(4,10,20,.95)'; ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(125,165,205,.6)'; ctx.stroke();
        ctx.strokeStyle = 'rgba(125,165,205,.35)'; ctx.lineWidth = 1;
        for (let i = 1; i < 8; i++) {
            const tx = slotX(i) - SLOT_GAP / 2;
            ctx.beginPath(); ctx.moveTo(tx, BAND.y + 4); ctx.lineTo(tx, BAND.y + BAND.h - 4); ctx.stroke();
        }
        for (let i = 0; i < 8; i++) {
            const hot = ordering && !KAB.slots[i] && l2SlotHover(i);
            txt(i + 1, slotCX(i), BAND.y + 15, {
                s: 14, a: 'center',
                c: hot ? C.acc : '#eaf2fb', w: 800
            });
        }
    }

    /* ---------- konektor RJ-45 (badan transparan menutup 8 slot) ---------- */
    function l2Konektor(now) {
        if (!KAB.conn) return;
        const k = easeOut(l2AnimP(now, 'conn'));
        ctx.save();
        ctx.translate(0, lerp(-180, 0, k));
        const crimpP = lv.anim && lv.anim.type === 'crimp' ? l2AnimP(now, 'crimp') : (KAB.crimped ? 1 : 0);
        if (crimpP > .2) {                                   // kilatan emas saat ditekan
            ctx.save();
            ctx.globalAlpha = Math.min(.30, (crimpP - .2) * .30);
            const rg = ctx.createRadialGradient(CX, 170, 10, CX, 170, 190);
            rg.addColorStop(0, '#ffe9a8'); rg.addColorStop(1, 'rgba(255,233,168,0)');
            ctx.fillStyle = rg; ctx.fillRect(CONN.x - 60, 70, CONN.w + 120, CONN.h + 80);
            ctx.restore();
        }
        rr(CONN.x, CONN.y, CONN.w, CONN.h, 16);
        ctx.fillStyle = 'rgba(196,224,242,.32)'; ctx.fill();                 // badan transparan
        ctx.lineWidth = 3; ctx.strokeStyle = KAB.crimped ? '#4a9fd0' : '#7fb4d6'; ctx.stroke();
        rr(CONN.x + 12, SLOT_TOP - 8, CONN.w - 24, (SLOT_BOT + 16) - (SLOT_TOP - 8), 10);
        ctx.fillStyle = 'rgba(232,246,255,.26)'; ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(150,190,215,.75)'; ctx.stroke();
        for (let i = 0; i < 8; i++) {                                          // 8 pin emas
            if (!KAB.slots[i]) continue;
            const px = slotCX(i) - 2, pierce = crimpP >= 1 ? 9 : Math.round(9 * crimpP);
            ctx.fillStyle = C.gold; ctx.fillRect(px, SLOT_TOP + 4, 4, (SLOT_BOT + 4) - (SLOT_TOP + 4));
            if (pierce > 0) {
                ctx.beginPath();
                ctx.moveTo(px - 2, SLOT_TOP + 4); ctx.lineTo(px + 6, SLOT_TOP + 4);
                ctx.lineTo(px + 2, SLOT_TOP + 4 - pierce); ctx.closePath();
                ctx.fillStyle = '#f2c94c'; ctx.fill();
                ctx.lineWidth = 1; ctx.strokeStyle = '#8a6a10'; ctx.stroke();
            }
        }
        // Label RJ-45 + status crimping pindah ke BARIS BAWAH slot (slot 146..200),
        // supaya tidak menimpa baris nomor 1-8 yang sekarang ada di atas slot.
        rr(CONN.x + 12, CONN.y + CONN.h - 30, 62, 19, 6);
        ctx.fillStyle = 'rgba(4,12,22,.85)'; ctx.fill();
        txt('RJ-45', CONN.x + 43, CONN.y + CONN.h - 16, { s: 12, a: 'center', c: '#cfe8f7', w: 800 });
        lock(CONN.x + CONN.w - 152, CONN.y + CONN.h - 12, .4);
        txt(KAB.crimped ? 'TERKUNCI' : 'BELUM DI-CRIMP', CONN.x + CONN.w - 134, CONN.y + CONN.h - 5,
            { s: 11.5, c: KAB.crimped ? '#4ade80' : C.warn, w: 800 });
        ctx.restore();
    }

    /* ---------- animasi alat (SEMUA memakai sprite, tanpa kotak polos) ---------- */
    function l2AlatAnim(now) {
        const a = lv.anim;
        if (!a) return;
        if (a.type === 'strip') {
            const p = l2AnimP(now, 'strip');
            const dip = p < .30 ? 0 : p < .46 ? easeOut((p - .30) / .16) : p < .62 ? 1 - easeOut((p - .46) / .16) : 0;
            const x = lerp(170, 292, easeOut(clamp(p / .28, 0, 1)));
            const rot = p < .28 ? lerp(-.9, .10, easeOut(p / .28)) : lerp(.10, .04, dip * .3);
            ctx.save(); ctx.globalAlpha = .96;
            drawSprite('strip', x + dip * 6, 424 + dip * 14, 210, rot);
            ctx.restore();
            if (p > .20 && p < .40) {                  // kilatan pisau pada selubung
                ctx.save(); ctx.globalAlpha = (p - .20) / .20 * .5;
                ctx.fillStyle = '#fffbe6'; ctx.fillRect(CX - 6, WIRE_B - 40, 12, 58); ctx.restore();
            }
        }
        if (a.type === 'trim') {
            const p = l2AnimP(now, 'trim');
            const close = p < .30 ? 0 : p < .46 ? easeOut((p - .30) / .16) : p < .70 ? 1 : Math.max(0, 1 - (p - .70) / .18);
            const x = lerp(210, 402, easeOut(clamp(p / .30, 0, 1)));
            ctx.save(); ctx.globalAlpha = .96;
            drawSprite('gunting', x, CUT_Y + 4 + close * 10, 230,
                lerp(-.8, -.06, easeOut(clamp(p / .30, 0, 1))) + close * .05);
            ctx.restore();
            if (close > .5) {                          // Serpihan konduktor jatuh
                ctx.save();
                ctx.globalAlpha = (close - .5) * 1.4;
                for (let i = 0; i < 8; i++) {
                    const q = (close - .5) * 86 + (i % 3) * 6;
                    ctx.fillStyle = WC[KAB.slots[i] || KAB.loose[i]].c;
                    ctx.fillRect(slotCX(i) - 7 + (i % 2 ? 3 : -3), CUT_Y + q, 14, 7);
                }
                ctx.restore();
            }
        }
        if (a.type === 'crimp') {
            const p = l2AnimP(now, 'crimp');
            let y, sq = 0;
            if (p < .22) {                                    // tang muncul dari atas
                y = lerp(-120, 108, easeOut(p / .22));
            } else if (p < .40) {                             // turun & menekan konektor
                const u = (p - .22) / .18;
                y = lerp(108, 132, easeOut(u)); sq = u;
            } else if (p < .62) {                             // menahan + getar kecil
                y = 132 + Math.sin(now / 26) * 2.2; sq = 1;
            } else if (p < .80) {                             // melonggarkan
                const u = (p - .62) / .18;
                y = lerp(132, 108, easeOut(u)); sq = 1 - u;
            } else {                                          // naik kembali ke atas
                y = lerp(108, -120, easeOut((p - .80) / .20));
            }
            ctx.save(); ctx.globalAlpha = .97;
            ctx.translate(CX, y); ctx.scale(1, 1 - 0.15 * sq);      // tang terjepit saat ditekan
            drawCrimpTool(0, 0, 1, sq, 0);                          // gagang menutup & rahang menekan
            ctx.restore();
            if (p > .42 && p < .66) {                       // kilatan emas saat menekan
                ctx.save(); ctx.globalAlpha = .6;
                rr(CONN.x, CONN.y, CONN.w, CONN.h, 16);
                ctx.lineWidth = 3; ctx.strokeStyle = '#ffe9a8'; ctx.stroke();
                ctx.restore();
            }
        }
    }

    /* ================================================================
       Bar Pak Andi: satu blok "LANGKAH n DARI 7" + APA / KENAPA / AWAS
       (hanya SATU instruksi langkah yang tampil di layar)
       ================================================================ */
    function l2BarAndi(now) {
        rr(BAR.x, BAR.y, BAR.w, BAR.h, 12); ctx.fillStyle = 'rgba(9,19,33,.97)'; ctx.fill();
        ctx.strokeStyle = 'rgba(56,189,248,.4)'; ctx.lineWidth = 1.5; ctx.stroke();
        drawAndiFace(BAR.x + 34, BAR.y + 34, 17, lv.score < 70 ? 'sad' : 'happy', now / 1000);
        const p = ped();
        const lbx = BAR.x + 6, lbw = 262;
        rr(lbx, BAR.y + 8, lbw, BAR.h - 16, 10);
        ctx.fillStyle = 'rgba(7,16,28,.55)'; ctx.fill();
        ctx.strokeStyle = 'rgba(90,130,175,.45)'; ctx.lineWidth = 1.5; ctx.stroke();
        txt('LANGKAH ' + (lv.step + 1) + ' DARI ' + STEPS.length, lbx + 12, BAR.y + 24, { s: 10, c: C.mute, w: 800 });
        para(HINT[curStep().id], lbx + 12, BAR.y + 40, lbw - 24, 13, { s: 11, c: C.text, w: 700 });
        const cols = [['APA', p[0], C.acc], ['KENAPA', p[1], C.ok], ['AWAS', p[2], C.bad]];
        cols.forEach(function (c, i) {
            const cx = BAR.x + 276 + i * 222, cw = 210;
            rr(cx, BAR.y + 10, 46, 15, 7);
            ctx.fillStyle = 'rgba(56,189,248,.18)'; ctx.fill();
            ctx.strokeStyle = c[2]; ctx.lineWidth = 1.2; ctx.stroke();
            txt(c[0], cx + 23, BAR.y + 21, { s: 10, a: 'center', c: c[2], w: 800 });
            para(c[1], cx, BAR.y + 38, cw, 14, { s: 11, c: C.text, w: 700 });
        });
    }

    /* ================================================================
       MODAL
       ================================================================ */
    function l2Shade() {
        ctx.fillStyle = 'rgba(3,9,18,.9)'; ctx.fillRect(0, 54, W, H - 54);
        hit(0, 0, W, H, () => { });                     // penahan klik supaya tidak tembus
    }
    function l2Panel(x, y, w, h, stroke) {
        rr(x, y, w, h, 18); ctx.fillStyle = 'rgba(12,23,39,.99)'; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = stroke || C.acc; ctx.stroke();
    }

    /* ---------- layar pembuka ---------- */
    function l2ModalIntro() {
        ctx.fillStyle = 'rgba(3,9,18,.9)'; ctx.fillRect(0, 0, W, H);
        hit(0, 0, W, H, () => { });
        const x = 120, y = 52, w = 720, h = 496;                 // 52..548
        l2Panel(x, y, w, h, C.acc);
        txt('LEVEL 2 \u2014 Crimping Kabel LAN Straight-Through', x + w / 2, y + 34,
            { s: 22, f: FONT_H, a: 'center', c: C.acc, w: 600 });
        para('Tujuanmu: membuat satu ujung kabel LAN straight-through untuk PC ke switch \u2014 dari kupas selubung sampai lulus di tester.',
            x + w / 2, y + 60, w - 60, 19, { s: 14, a: 'center', c: C.text, w: 700 });
        txt('6 ALAT YANG KAMU PAKAI', x + w / 2, y + 112, { s: 12, a: 'center', c: C.warn, w: 800 });
        TOOL_INFO.forEach(function (t, i) {
            const tx = x + 28 + (i % 2) * 344, ty = y + 128 + Math.floor(i / 2) * 64;
            rr(tx, ty, 328, 56, 10); ctx.fillStyle = 'rgba(20,34,54,.9)'; ctx.fill();
            ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(80,120,165,.6)'; ctx.stroke();
            icon(t.id, tx + 32, ty + 28, .5);
            txt(t.name, tx + 60, ty + 21, { s: 13, c: C.text, w: 800 });
            para(t.why, tx + 60, ty + 38, 256, 13, { s: 11, c: C.mute, w: 600 });
        });
        rr(x + 28, y + 340, 664, 74, 10);
        ctx.fillStyle = 'rgba(56,189,248,.12)'; ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(56,189,248,.55)'; ctx.stroke();
        txt('APA ITU T568B?', x + 42, y + 358, { s: 12, c: C.acc, w: 800 });
        para('T568B adalah urutan warna baku pada pin 1\u20138: Putih-Oranye di pin 1 sampai Coklat di pin 8. '
            + 'T568A juga sah, asal kedua ujung kabel memakai standar yang sama.',
            x + w / 2, y + 376, 636, 16, { s: 11.5, a: 'center', c: C.text, w: 600 });
        btn(x + w / 2 - 130, y + 430, 260, 46, 'MULAI \u25b8', () => {
            lv.phase = 'play'; lv.t0 = performance.now(); lv.lastAct = performance.now();
            l2Andi(HINT.glove, 9000);
            say('Level 2 dimulai. Sarung tangan dulu \u2014 klik kartunya di panel ALAT.', 'info');
        }, { color: C.ok, s: 17 });
    }

    /* ---------- langkah ---------- */
    function l2ModalLangkah() {
        l2Shade();
        const x = 170, y = 62, w = 620, h = 440;
        l2Panel(x, y, w, h);
        txt('Langkah-langkah', x + w / 2, y + 36, { s: 21, f: FONT_H, a: 'center', c: C.acc, w: 600 });
        STEPS.forEach(function (s, i) {
            const yy = y + 76 + i * 44, done = i < lv.step, cur = i === lv.step;
            if (cur) { rr(x + 22, yy - 24, w - 44, 38, 8); ctx.fillStyle = 'rgba(56,189,248,.14)'; ctx.fill(); }
            ctx.beginPath(); ctx.arc(x + 46, yy - 5, 11, 0, 6.3);
            ctx.fillStyle = done ? C.ok : (cur ? C.bad : '#22344a'); ctx.fill();
            if (done) tickIcon(x + 46, yy - 5, 12, '#04160f');
            else txt(i + 1, x + 46, yy, { s: 11, a: 'center', c: cur ? '#fff' : '#5f7389', w: 800 });
            txt(s.label, x + 70, yy, { s: 13.5, w: cur ? 800 : 600, c: done ? C.ok : (cur ? C.text : C.mute) });
            if (s.tool) icon(s.tool, x + w - 44, yy - 6, .3);
        });
        btn(x + w / 2 - 70, y + h - 52, 140, 38, 'Tutup', () => { lv.modal = null; }, { color: '#334155', tc: C.text, s: 14 });
    }

    /* ---------- bantuan (T568A / T568B + kamus istilah) ---------- */
    /* Sampel warna untuk modal Bantuan: belang = dasar krem + garis
       diagonal tebal (gaya sama dengan batang konduktor),
       polos = warna pekat. Outline gelap 1.5 px.                */
    function l2Sampel(x, y, w, h, id) {
        const d = WC[id], st = !!d.st;
        rr(x, y, w, h, 4);
        ctx.fillStyle = st ? '#f6efe0' : d.c;
        ctx.fill();
        if (st) {
            ctx.save();
            rr(x, y, w, h, 4); ctx.clip();
            ctx.strokeStyle = d.c;
            ctx.lineWidth = Math.max(3, h * 0.4);
            ctx.beginPath();
            for (let k = -h; k < w + h; k += 12) {
                ctx.moveTo(x + k, y + h + 2);
                ctx.lineTo(x + k + h + 2, y - 2);
            }
            ctx.stroke();
            ctx.restore();
        }
        rr(x, y, w, h, 4);
        ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(6,10,18,.85)'; ctx.stroke();
    }

    function l2ModalBantuan() {
        l2Shade();
        const x = 110, y = 52, w = 740, h = 496;                 // 52..548
        l2Panel(x, y, w, h, C.warn);
        txt('Bantuan Kabel \u2014 Standar T568A & T568B', x + w / 2, y + 32,
            { s: 18, f: FONT_H, a: 'center', c: C.warn, w: 600 });
        [{ t: 'T568A', arr: T568A, cx: x + 34 }, { t: 'T568B', arr: T568B, cx: x + 392 }].forEach(function (col) {
            txt(col.t, col.cx + 70, y + 62, { s: 15, f: FONT_H, a: 'center', c: C.acc, w: 600 });
            col.arr.forEach(function (id, i) {
                const yy = y + 76 + i * 23;
                txt(i + 1, col.cx, yy + 13, { s: 11, c: C.mute, w: 800 });
                l2Sampel(col.cx + 16, yy + 1, 48, 15, id);
                txt(WC[id].n, col.cx + 72, yy + 13, { s: 11.5, w: 700 });
            });
        });
        txt('KAMUS ISTILAH', x + w / 2, y + 264, { s: 12, a: 'center', c: C.warn, w: 800 });
        const gl = [
            ['Selubung / jaket', 'lapisan pelindung kabel'],
            ['Konduktor', 'kawat tembaga di dalam selubung'],
            ['Pin', 'kontak emas 1\u20138 di RJ-45'],
            ['Crimping', 'menekan pin emas ke konduktor'],
            ['Straight-through', 'A\u2013A atau B\u2013B, konsisten'],
            ['T568A / T568B', 'dua standar urutan warna']
        ];
        gl.forEach(function (g, i) {
            const gx = x + 34 + (i % 2) * 356, gy = y + 300 + Math.floor(i / 2) * 22;
            txt(g[0], gx, gy, { s: 11.5, c: C.text, w: 800 });
            para(g[1], gx, gy + 13, 340, 12, { s: 10.5, c: C.mute, w: 600 });
        });
        para('Ujung straight-through boleh memakai T568A atau T568B, asal kedua ujung kabel memakai standar yang sama. Tester hanya menerima salah satu dari keduanya.',
            x + 34, y + 372, w - 68, 16, { s: 11, c: C.mute, w: 600 });
        btn(x + w / 2 - 70, y + h - 50, 140, 38, 'Tutup', () => { lv.modal = null; }, { color: '#334155', tc: C.text, s: 14 });
    }

    /* ---------- panjang kabel ---------- */
    function l2ModalPanjang() {
        l2Shade();
        const w = 420, h = 210, x = CX - w / 2, y = 170;          // 170..380
        l2Panel(x, y, w, h, C.acc);
        txt('Panjang kabel PC \u2192 switch', x + w / 2, y + 32, { s: 16, f: FONT_H, a: 'center', c: C.acc, w: 600 });
        txt('Kebutuhan di kelas ini: ' + NEED_CM + ' cm', x + w / 2, y + 58, { s: 13, a: 'center', c: C.warn, w: 700 });
        LEN_OPS.forEach(function (cm, i) {
            btn(x + 26 + i * 120, y + 80, 108, 52, cm + ' cm', () => l2ChooseLen(cm),
                { color: cm === NEED_CM ? C.ok : '#334155', tc: cm === NEED_CM ? '#04160f' : C.text, s: 16 });
        });
        para('Setelah panjang dipilih, Pemotong Kabel juga akan meratakan ujung konduktor (\u00B11,2\u20131,5 cm dari selubung).',
            x + w / 2, y + 156, w - 56, 16, { s: 11, a: 'center', c: C.mute, w: 600 });
    }

    /* ---------- kartu "yang kamu pelajari" ---------- */
    function l2ModalBelajar() {
        l2Shade();
        const x = 150, y = 62, w = 660, h = 452;
        l2Panel(x, y, w, h, C.ok);
        txt('Yang kamu pelajari', x + w / 2, y + 38, { s: 24, f: FONT_H, a: 'center', c: C.ok, w: 600 });
        const items = [
            'Urutan T568B: Putih-Oranye, Oranye, Putih-Hijau, Biru, Putih-Biru, Hijau, Putih-Coklat, Coklat pada pin 1\u20138.',
            'Selubung (jaket) ikut masuk konektor RJ-45 sekitar 1,2 cm \u2014 yang di dalam RJ-45 adalah konduktor, bukan selubung.',
            'Tang crimping menekan kontak emas hingga menembus selubung konduktor, lalu mengunci pin di tempatnya.',
            'LAN tester menyalakan LED 1\u20138; semua hijau berarti setiap pin tersambung benar.',
            'Straight-through dipakai PC ke switch atau PC ke router, dengan urutan T568A\u2013A atau T568B\u2013B yang konsisten.'
        ];
        items.forEach(function (t, i) {
            const yy = y + 88 + i * 60;
            ctx.beginPath(); ctx.arc(x + 42, yy - 5, 11, 0, 6.3); ctx.fillStyle = C.ok; ctx.fill();
            tickIcon(x + 42, yy - 5, 12, '#04160f');
            para(t, x + 68, yy, w - 110, 17, { s: 13, c: C.text, w: 700 });
        });
        btn(x + w / 2 - 120, y + h - 58, 240, 44, 'Lihat Hasil \u25b8', () => {
            lv.modal = null;
            lv.finished = true;
            endLevel(lv, true);
        }, { color: C.ok, s: 15 });
    }

    /* ---------- LAN tester ---------- */
    function l2ModalTester(now) {
        l2Shade();
        const t = lv.test || { phase: 'siap', res: [] };
        const w = 560, h = 380, x = CX - w / 2, y = 120;           // 120..500
        const stroke = t.phase === 'ok' ? C.ok : (t.phase === 'fail' ? C.bad : C.acc);
        l2Panel(x, y, w, h, stroke);
        txt('LAN TESTER', x + w / 2, y + 44, { s: 21, f: FONT_H, a: 'center', c: t.phase === 'ok' ? C.ok : C.acc, w: 600 });
        icon('tester', x + 46, y + 34, .6);                        // di kiri judul, tidak menabrak bingkai
        const el = t.phase === 'run' ? (now - t.t0) / 1000 : (t.phase === 'ok' || t.phase === 'fail' ? 9 : 0);
        for (let i = 0; i < 8; i++) {
            const cx = x + 80 + i * ((w - 160) / 7), cy = y + 112, on = el > (i + 1) * .34;
            const good = on && t.res[i];
            ctx.beginPath(); ctx.arc(cx, cy, 15, 0, 6.3);
            ctx.fillStyle = on ? (good ? C.ok : C.bad) : '#1d2a3d'; ctx.fill();
            if (on) { ctx.save(); ctx.shadowColor = good ? C.ok : C.bad; ctx.shadowBlur = 16; ctx.fill(); ctx.restore(); }
            ctx.lineWidth = 2; ctx.strokeStyle = '#0b1626'; ctx.stroke();
            txt(i + 1, cx, cy + 5, { s: 11, a: 'center', c: on ? '#04160f' : '#5f7389', w: 800 });
        }
        let stat = 'SIAP', scol = C.mute;
        if (t.phase === 'run') { stat = 'MENGETES\u2026'; scol = C.acc; }
        else if (t.phase === 'ok') { stat = 'LULUS: ' + t.std; scol = C.ok; }
        else if (t.phase === 'fail') { stat = 'GAGAL: pin ' + (t.bad || []).join(', '); scol = C.bad; }
        rr(x + 30, y + 146, w - 60, 42, 10);
        ctx.fillStyle = 'rgba(4,12,22,.9)'; ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = scol; ctx.stroke();
        txt(stat, x + w / 2, y + 173, { s: 16, a: 'center', c: scol, w: 800 });
        if (t.phase === 'fail' && t.ref) {               // pin salah + warna yang seharusnya
            const chips = (t.bad || []).map(function (i) { return 'pin ' + i + ': ' + WC[t.ref[i - 1]].n; });
            let cx = x + 36, cy = y + 212;
            chips.forEach(function (ch) {
                ctx.font = '700 11.5px ' + FONT_B;
                const cw = ctx.measureText(ch).width + 20;
                if (cx + cw > x + w - 26) { cx = x + 36; cy += 24; }
                rr(cx, cy - 13, cw, 20, 10);
                ctx.fillStyle = 'rgba(248,113,113,.16)'; ctx.fill();
                ctx.strokeStyle = 'rgba(248,113,113,.7)'; ctx.lineWidth = 1; ctx.stroke();
                txt(ch, cx + cw / 2, cy + 1, { s: 11.5, a: 'center', c: '#fecaca', w: 700 });
                cx += cw + 8;
            });
            if (!chips.length) {
                para('Semua pin cocok, tapi urutannya bukan T568A maupun T568B.',
                    x + w / 2, y + 216, w - 72, 15, { s: 11.5, a: 'center', c: '#fecaca', w: 600 });
            }
        } else {
            para(t.phase === 'ok' ? 'Urutan ' + t.std + ' diterima. Tekan KIRIM & NILAI untuk mengirim hasil ke guru.'
                : 'LED hijau 1\u21928 berarti semua pin cocok. LED merah = pin itu salah.',
                x + w / 2, y + 214, w - 72, 16, { s: 12, a: 'center', c: C.mute, w: 600 });
        }
        const bw = 152, by = y + h - 58;
        btn(x + 24, by, bw, 44, 'Tutup', () => { lv.modal = null; lv.test = null; }, { color: '#334155', tc: C.text, s: 14 });
        btn(x + w / 2 - bw / 2, by, bw, 44, t.phase === 'fail' ? 'Perbaiki & Ulang' : 'JALANKAN', () => {
            if (t.phase === 'fail') { lv.modal = null; lv.test = null; return; }
            l2Jalankan();
        }, { color: C.acc, s: 13.5, disabled: t.phase === 'run' });
        btn(x + w - 24 - bw, by, bw, 44, 'KIRIM & NILAI', () => {
            if (t.phase !== 'ok') return;
            lv.modal = 'learn';
            say('Kabel terkirim. Baca ringkasan berikut ini.', 'ok');
        }, { color: C.ok, s: 13, disabled: t.phase !== 'ok' });
    }

    function l2DrawModal(now) {
        if (lv.modal === 'steps') l2ModalLangkah();
        else if (lv.modal === 'help') l2ModalBantuan();
        else if (lv.modal === 'len') l2ModalPanjang();
        else if (lv.modal === 'learn') l2ModalBelajar();
        else if (lv.modal === 'test') {
            if (lv.test && lv.test.phase === 'run' && (now - lv.test.t0) / 1000 > 8 * .34 + .30) {
                l2SelesaiTes();
                if (lv.modal === 'test') l2ModalTester(now);
                return;
            }
            l2ModalTester(now);
        }
    }

    /* ================================================================
       BRIEFING — Andi Slide System (sama seperti Level 4 & 5)
       ================================================================ */
    const BRIEF_PAGES = [
        'Selamat datang di Level 2.\n\nPada level ini kamu akan membuat kabel Straight-Through untuk menghubungkan perangkat jaringan.',
        'Sebelum melakukan crimping, pahami urutan warna kabel agar koneksi dapat berjalan dengan benar.',
        'Kamu akan melakukan proses pengupasan kabel, penyusunan warna, pemasangan RJ-45, crimping, dan pengujian.',
        'Perhatikan setiap langkah karena kesalahan kecil dapat menyebabkan kabel gagal digunakan.'
    ].filter(function (s) { return s && s.trim() !== ''; });

    function drawBrief(now) {
        while (lv.briefPage < BRIEF_PAGES.length && (!BRIEF_PAGES[lv.briefPage] || BRIEF_PAGES[lv.briefPage].trim() === '')) { lv.briefPage++; lv.briefShown = 0; }
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
            const shownText = full.slice(0, Math.floor(lv.briefShown));
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
            para('Buat kabel Straight-Through: kupas kabel, susun warna T568A/T568B, pasang RJ-45, crimp, lalu uji.', x + 40, y + 100, w - 80, 24, { s: 16, c: C.text, w: 600 });
            btn(x + w / 2 - 145, y + h - 72, 290, 52, 'Mulai Crimping ▸', () => startPlay(), { s: 18, color: C.ok });
        }
    }

    function startPlay() {
        lv.phase = 'intro';
        lv.t0 = performance.now();
        lv.lastAct = performance.now();
    }

    /* ================================================================
       RENDER
       ================================================================ */
    lv.draw = function () {
        lv.tick();
        const now = performance.now();
        deskBG();

        if (lv.phase === 'brief') {
            lv.t0 = now;
            const dt = Math.min(0.05, (now - lv.tPrev) / 1000);
            lv.tPrev = now;
            if (lv.briefPage < BRIEF_PAGES.length && lv.briefShown < BRIEF_PAGES[lv.briefPage].length) {
                lv.briefShown = Math.min(BRIEF_PAGES[lv.briefPage].length, lv.briefShown + dt * 55);
            }
            drawBrief(now); return;
        }

        if (lv.phase === 'intro') { l2ModalIntro(); return; }
        hud(lv);

        if (lv.limit && !lv.finished && lv.phase === 'play' && lv.elapsed() > lv.limit) {
            lv.finished = true; lv.dur = lv.limit; endLevel(lv, false); return;
        }
        if (lv.phase !== 'play') return;

        l2TickAnim(now);
        l2DrawStripAtas();
        l2DrawPanelAlat(PL, TOOLS_L, 'ALAT (KLIK)');
        l2DrawPanelAlat(PR, TOOLS_R, 'PASANG (KLIK)');
        l2DrawStatus();
        l2DrawAreaKerja(now);
        l2DrawPesan(now);
        l2BarAndi(now);
        l2DrawModal(now);
    };

    /* ================================================================
       INTERAKSI — susun warna (klik-klik ATAU seret, mouse & sentuhan)
       ================================================================ */
    function l2Ordering() {
        return lv.phase === 'play' && !lv.modal && !lv.anim && curStep().id === 'order' && lv.inBox < 1;
    }
    function l2StartDrag(id, fromSlot, x, y) {
        lv.sel = id;
        lv.drag = { id: id, fromSlot: fromSlot, x: x, y: y };
    }

    lv.down = function (p) {
        lv.lastAct = performance.now();
        if (lv.phase === 'brief') {
            if (lv.briefPage < BRIEF_PAGES.length) {
                if (lv.briefShown < BRIEF_PAGES[lv.briefPage].length) { lv.briefShown = BRIEF_PAGES[lv.briefPage].length; }
                else { lv.briefPage++; lv.briefShown = 0; }
            }
            return;
        }
        if (!l2Ordering()) return;
        const s = l2SlotAt(p);
        if (s >= 0) {
            if (lv.sel) {                                   // klik konduktor -> klik slot
                if (KAB.slots[s] !== lv.sel) l2PutWire(lv.sel, s);
                lv.sel = null;
            } else if (KAB.slots[s]) {
                l2StartDrag(KAB.slots[s], s, slotCX(s), SLOT_SEAT);
            }
            return;
        }
        const l = l2LooseAt(p);
        if (l) { l2StartDrag(l, null, KAB.tip[l].x, KAB.tip[l].y); return; }
        lv.sel = null;
    };
    lv.move = function (p) {
        lv.lastAct = performance.now();
        if (lv.drag) { lv.drag.x = p.x; lv.drag.y = p.y; }
    };
    lv.up = function (p) {
        lv.lastAct = performance.now();
        if (!lv.drag) return;
        const d = lv.drag; lv.drag = null;
        if (!l2Ordering()) { lv.sel = null; return; }
        const s = l2SlotAt(p), l = l2LooseAt(p);
        if (s >= 0) {
            if (KAB.slots[s] === d.id) { lv.sel = d.id; return; }
            l2PutWire(d.id, s); lv.sel = null; return;
        }
        if (l === d.id) { lv.sel = d.id; return; }
        if (l && d.fromSlot === null) { l2SwapLoose(d.id, l); lv.sel = d.id; return; }
        if (d.fromSlot === null) {                           // dilepas di tempat lain: ujung balik dengan pegas
            const h = l2Home(d.id);
            l2MoveTo(d.id, h.x, h.y, 420, performance.now());
            lv.sel = null; return;
        }
        l2PutWire(d.id, d.fromSlot); lv.sel = null;
    };
    lv.exit = function () { lv.anim = null; lv.drag = null; lv.modal = null; };

    /* ================================================================
       LAYAR HASIL + LOG + PAPAN SKOR L2
       ================================================================ */
    lv.makeResult = function (lv2, ok, stars, isNewBest) {
        const ketepatan = Math.max(0, 100 - lv2.mistakes.length * 4);
        const kerapian = KAB.crimped ? 100 : KAB.conn ? 70 : KAB.trimmed ? 45 : 20;
        const hemat = (KAB.usedCm <= NEED_CM ? 25 : KAB.usedCm <= NEED_CM + 20 ? 15 : 5) +
            (KAB.rj45Used === 1 ? 25 : KAB.rj45Used === 2 ? 15 : 5);
        const kecepatan = lv2.dur <= 150 ? 20 : lv2.dur <= 240 ? 12 : 5;
        const gagalUji = lv2.mistakes.filter(function (m) { return m.indexOf('Gagal uji') >= 0; }).length;
        const badges = [];
        if (ok && gagalUji === 0) badges.push('Crimp Sempurna');
        if (KAB.usedCm <= NEED_CM) badges.push('Hemat Kabel');
        if (KAB.rj45Used === 1) badges.push('Hemat Konektor');
        if (lv2.mistakes.length === 0) badges.push('Tangan Cekatan');
        if (KAB.helpUsed === 0) badges.push('Tanpa Bantuan');
        badges.forEach(function (b) { if (!save.badges.includes(b)) save.badges.push(b); });
        persist();
        lv2.logExtra = {
            kabel_cm: KAB.usedCm, rj45: KAB.rj45Used, bantuan: KAB.helpUsed,
            lencana: badges.join('|') || '-'
        };
        lv2.boardKey = 'board2';
        return {
            draw: function () {
                bg(false);
                const x = 140, y = 44, w = 680, h = 512;
                rr(x, y, w, h, 20); ctx.fillStyle = C.panel; ctx.fill();
                ctx.strokeStyle = ok ? C.ok : C.bad; ctx.lineWidth = 2; ctx.stroke();
                txt(ok ? 'Level 2 selesai' : 'Belum lulus / waktu habis', x + w / 2, y + 40,
                    { s: 27, f: FONT_H, a: 'center', c: ok ? C.ok : C.bad, w: 600 });
                if (isNewBest) txt('REKOR BARU!', x + w / 2, y + 62, { s: 14, f: FONT_H, a: 'center', c: C.warn, w: 600 });
                for (let i = 0; i < 3; i++) star(x + w / 2 - 48 + i * 48, y + 94, 18, i < stars);
                txt(lv2.score, x + w / 2, y + 152, { s: 46, f: FONT_H, a: 'center', c: C.warn, w: 600 });
                txt('skor akhir', x + w / 2, y + 170, { s: 12, a: 'center', c: C.mute });
                txt('Rincian Skor', x + 34, y + 196, { s: 14, c: C.acc, w: 800 });
                [
                    ['Ketepatan urutan & langkah', ketepatan + ' / 100'],
                    ['Kerapian (rata & terkunci)', kerapian + ' / 100'],
                    ['Hemat bahan & konektor', Math.min(50, hemat) + ' / 50'],
                    ['Kecepatan', kecepatan + ' / 20'],
                    ['Kabel terpakai', KAB.usedCm + ' cm'],
                    ['Konektor terpakai', KAB.rj45Used + ' buah'],
                    ['Bantuan dibuka', KAB.helpUsed + '\u00d7'],
                    ['Standar dipakai', (lv.test && lv.test.std) || '-']
                ].forEach(function (r, i) {
                    const yy = y + 218 + i * 21;
                    txt(r[0], x + 34, yy, { s: 12, c: C.mute, w: 700 });
                    txt(r[1], x + w - 34, yy, { s: 12, c: C.text, w: 800, a: 'right' });
                });
                txt('Lencana', x + 34, y + 402, { s: 13, c: C.acc, w: 800 });
                if (!badges.length) txt('Belum ada lencana di sesi ini.', x + 34, y + 424, { s: 12, c: C.mute });
                badges.slice(0, 5).forEach(function (b, i) {
                    const bx = x + 34 + (i % 3) * 200, by = y + 412 + Math.floor(i / 3) * 28;
                    rr(bx, by, 186, 22, 11); ctx.fillStyle = 'rgba(212,167,44,.2)'; ctx.fill();
                    ctx.strokeStyle = 'rgba(212,167,44,.6)'; ctx.lineWidth = 1.5; ctx.stroke();
                    txt('\u2605 ' + b, bx + 93, by + 15, { s: 11, a: 'center', c: C.warn, w: 800 });
                });
                if (ok) {
                    const top = (save.board2 || []).slice(0, 3);
                    txt('Top Level 2:', x + 424, y + 400, { s: 12, c: C.mute, w: 700 });
                    if (!top.length) txt('Belum ada skor L2.', x + 424, y + 418, { s: 11, c: C.mute });
                    top.forEach(function (e, i) {
                        const nm = e.nama.length > 12 ? e.nama.slice(0, 11) + '\u2026' : e.nama;
                        txt((i + 1) + '. ' + nm + ' \u2014 ' + e.skor + ' pts', x + 424, y + 418 + i * 16,
                            { s: 11, c: i === 0 ? C.warn : C.text, w: 700 });
                    });
                }
                const by2 = y + h - 52;
                btn(x + 34, by2, 130, 42, 'Ulangi', () => startLevel(1), { color: '#334155', tc: C.text, s: 14 });
                btn(x + 180, by2, 180, 42, 'Papan skor L2', () => go(levelsScene), { color: '#2b4360', tc: C.text, s: 14 });
                if (ok) btn(x + 376, by2, 270, 42, 'Lanjut ke Level 3 \u25b8', () => startLevel(2), { color: C.ok, s: 15 });
                else btn(x + 376, by2, 270, 42, 'Pilih level', () => go(levelsScene), { color: C.acc, s: 15 });
            }
        };
    };

    return lv;
}

/* ---------- pendaftaran level ---------- */
registerLevel(2, {
    t: 'Crimping Straight-Through (T568A/T568B)',
    m: 'Kupas, susun warna, ratakan, pasang RJ-45, crimp, uji',
    desc: 'Kerjakan satu ujung kabel LAN di area kerja 2D: pakai sarung tangan, kupas selubung, susun 8 konduktor ke pin RJ-45, potong panjang dan ratakan ujung, pasang konektor, tekan tang crimping, lalu uji dengan LAN Tester.',
    mk: makeL2
});