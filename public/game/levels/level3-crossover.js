// ==========================================================================
// levels/level3-crossover.js
// File ini digabung otomatis oleh build.mjs ke index.html
// -- JANGAN diedit langsung di index.html.
// ==========================================================================

/* ================================================================
   LEVEL 3 — Crimping Kabel LAN Crossover (T568A–T568B)
   ------------------------------------------------------------------
   Murni 2D dan memakai helper canvas yang konsisten dengan Level 2:
   area kerja gelap + grid, konduktor kurva Bezier elastis dari TITIK TAMBAT
   di mulut jaket, baris nomor pin 1–8 DI ATAS slot, panel ALAT kiri,
   panel PASANG kanan, panel STATUS & PESAN, dan Bar Pak Andi.
   TIDAK memakai WebGL/Three.js, ringan di HP dan jalan 100% offline.

   Misi:
     "Buat kabel LAN crossover untuk menghubungkan dua PC secara
      langsung (tanpa switch)."

   Alur Langkah Lengkap:
     0. Pilih jenis kabel (pilihan ganda skenario: PC ke PC langsung)
     1. Pakai sarung tangan (animasi tangan memakai sarung; area kerja bersih sebelum & sesudah)
     2. Potong kabel 150 cm (zona hijau + snap)
     3. Kupas jaket Ujung A
     4. Susun Ujung A sebagai T568A (Putih-Hijau, Hijau, dst.)
     5. Ratakan ujung A
     6. Pasang konektor RJ-45 A
     7. Crimp ujung A
     8. Kupas jaket Ujung B (transisi ke Ujung B)
     9. Susun Ujung B sebagai T568B (Putih-Oranye, Oranye, dst.)
     10. Ratakan ujung B
     11. Pasang konektor RJ-45 B
     12. Crimp ujung B
     13. Uji dengan LAN Tester Crossover (Master & Remote, pola silang 1↔3 & 2↔6)
     14. Adegan penutup: PC ke PC langsung, link LED aktif, animasi file sharing
     15. Kuis (4 dari bank 6 soal) + Rapor Pemahaman Crossover
     -> Layar Hasil & Papan Skor Level 3 (board3)

   Semua fungsi di file ini memakai awalan l3... untuk mencegah duplikasi nama.
   ================================================================ */

function makeL3() {
    const lv = baseLevel(3, 'Crimping Crossover (T568A–T568B)');
    lv.idx = 2;
    lv.limit = 420; // 420 detik (7 menit)

    /* ================================================================
       TATA LETAK (kanvas virtual 960 x 600)
       ================================================================ */
    const AY = 88, AX = 172, AW = 616, AH = 430;          // area kerja 88..518
    const WORK_BOT = 514;
    const PL = { x: 8, y: 88, w: 156, h: 430 };            // panel kiri ALAT
    const PR = { x: 796, y: 88, w: 156, h: 430 };          // panel kanan PASANG
    const BAR = { x: 8, y: 526, w: 944, h: 70 };           // Bar Pak Andi 526..596
    const CX = AX + AW / 2;                                // 480
    const CARD = { y: 120, h: 80, dy: 88 };                // kartu alat
    const SBOX = { x: PL.x + 8, y: 384, w: 140, h: 130 };  // panel STATUS 16..156
    const MBOX = { x: PR.x + 8, y: 384, w: 140, h: 130 };  // kartu PESAN 804..944

    /* Kepala RJ-45: Banner Misi di atas, Baris nomor pin 1-8 DI ATAS slot */
    const MISI_H = 22;
    const PIN_W = 400, PIN_H = 140, PIN_Y = AY + 22;      // 110..250
    const HDR_Y = PIN_Y + 16;
    const SLOT_W = 40, SLOT_GAP = 8;
    const PIN_PADX = (PIN_W - (SLOT_W * 8 + SLOT_GAP * 7)) / 2;   // 12
    const slotX = i => PIN.x + PIN_PADX + i * (SLOT_W + SLOT_GAP);
    const slotCX = i => slotX(i) + SLOT_W / 2;
    const SLOT_TOP = PIN_Y + 44, SLOT_BOT = PIN_Y + 98;    // tinggi slot 54
    const SLOT_SEAT = SLOT_TOP + 16;
    const CUT_Y = SLOT_BOT + 6;
    const BAND_Y = PIN_Y + 18, BAND_H = 22;
    const BAND_W = SLOT_W * 8 + SLOT_GAP * 7 + 16;
    const PIN = { x: CX - PIN_W / 2, y: PIN_Y, w: PIN_W, h: PIN_H };
    const BAND = { x: PIN.x + PIN_PADX - 8, y: BAND_Y, w: BAND_W, h: BAND_H };
    const SLOT_HIT_T = BAND.y - 4, SLOT_HIT_B = SLOT_BOT + 12;
    const CONN = { x: PIN.x, y: PIN_Y + 10, w: PIN_W, h: 144 };

    /* Kabel & Konduktor */
    const JACK_UP = PIN_Y + 124;                           // tepi atas selubung setelah RJ-45
    const JACKET_W = 220;
    const CON_W = 18;
    const CON_STEP = 24;
    const BASE_X0 = CX - (CON_W * 8 + (CON_STEP - CON_W) * 7) / 2 + CON_W / 2; // 396
    const WIRE_B = 406;
    const TIP_Y = 236;
    const SLOT_SPAN = SLOT_W + SLOT_GAP;                   // 48
    const MOUTH_H = 20;
    const MOUTH_IN = (JACKET_W - (CON_STEP * 7 + CON_W)) / 2; // 17
    const ANCHOR_DY = 26;
    const MAXLEN = Math.ceil(Math.hypot(
        CON_STEP * 7 / 2 + SLOT_SPAN * 3.5,
        (WIRE_B + ANCHOR_DY) - SLOT_SEAT
    ) * 1.2);

    const NEED_CM = 150; // Kebutuhan kabel PC ke PC langsung: 150 cm
    const LEN_OPS = [100, 150, 250];

    /* Standar per Ujung: Ujung A = T568A, Ujung B = T568B */
    const STD_A = T568A; // ['wg', 'g', 'wo', 'b', 'wb', 'o', 'wbr', 'br']
    const STD_B = T568B; // ['wo', 'o', 'wg', 'b', 'wb', 'g', 'wbr', 'br']
    const WIRE_IDS = ['wo', 'o', 'wg', 'b', 'wb', 'g', 'wbr', 'br'];

    const lerp = (a, b, t) => a + (b - a) * t;
    const easeOut = t => 1 - Math.pow(1 - t, 3);
    const easeBack = t => { const u = t - 1; return 1 + 2.70158 * u * u * u + 1.70158 * u * u; };

    /* ---------- SARUNG TANGAN: HANYA SAAT ANIMASI PEMAKAIAN ----------
       Sama seperti Level 2: area kerja BENAR-BENAR bersih saat level
       dimulai (tidak ada sprite sarung tergeletak, tidak ada tangan
       mengambang). Perlengkapan sarung tangan diwakili IKON-nya di panel
       ALAT. Saat kartu Sarung Tangan diklik, animasi lv.anim 'glove'
       berjalan dan barulah sebuah tangan digambar di tengah area kerja:
       dari tangan telanjang (cover=0) menjadi bersarung penuh (cover=1),
       lalu menghilang. Setelah usai (KAB.glove=true) area kerja kembali
       bersih. Titik asal HAND = pergelangan tangan (jari mengarah ke atas). */
    const HAND = { x: CX, y: 348, s: 1.28, rot: -0.08 };

    /* ================================================================
       ALUR LANGKAH & INSTRUKSI PEDAGOGIS (PAK ANDI)
       ================================================================ */
    const STEPS = [
        { id: 'pick', label: '0. Pilih jenis kabel yang tepat', tool: null },
        { id: 'glove', label: '1. Pakai sarung tangan', tool: 'sarung_tangan' },
        { id: 'len', label: '2. Potong kabel ±150 cm', tool: 'gunting' },
        { id: 'strip_a', label: '3. Kupas selubung Ujung A', tool: 'strip' },
        { id: 'order_a', label: '4. Susun Ujung A — T568A', tool: null },
        { id: 'trim_a', label: '5. Ratakan ujung kawat A', tool: 'gunting' },
        { id: 'conn_a', label: '6. Pasang RJ-45 Ujung A', tool: 'rj45' },
        { id: 'crimp_a', label: '7. Crimp Ujung A dengan tang', tool: 'crimp' },
        { id: 'strip_b', label: '8. Kupas selubung Ujung B', tool: 'strip' },
        { id: 'order_b', label: '9. Susun Ujung B — T568B', tool: null },
        { id: 'trim_b', label: '10. Ratakan ujung kawat B', tool: 'gunting' },
        { id: 'conn_b', label: '11. Pasang RJ-45 Ujung B', tool: 'rj45' },
        { id: 'crimp_b', label: '12. Crimp Ujung B dengan tang', tool: 'crimp' },
        { id: 'test', label: '13. Uji dengan LAN Tester Crossover', tool: 'tester' }
    ];

    const PED = {
        pick: [
            'Pilih jenis kabel yang tepat pada modal pertanyaan di layar.',
            'Dua perangkat sejenis (PC ke PC) butuh jalur TX dan RX yang disilang.',
            'Jangan memilih Straight-Through untuk menghubungkan dua PC langsung tanpa switch.'
        ],
        glove: [
            'Klik kartu Sarung Tangan di panel ALAT kiri.',
            'Kawat tembaga dan pisau pengupas tajam; lindungi jemari sebelum bekerja.',
            'Bekerja tanpa pelindung berisiko tertusuk kawat tembaga.'
        ],
        len: [
            'Klik Pemotong Kabel, pilih panjang 150 cm yang pas untuk dua meja PC.',
            'Kabel yang pas menghemat bahan dan tidak berserakan di lantai lab.',
            'Kabel kepanjangan mubazir bahan, kependekan tidak sampai ke PC kedua.'
        ],
        strip_a: [
            'Klik Pengupas Kabel untuk membuka selubung Ujung A sekitar 1,2 cm.',
            'Membuka selubung agar 8 konduktor bisa diurai dan disusun rapi.',
            'Jangan mengupas terlalu dalam agar kawat tembaga tidak tergores putus.'
        ],
        order_a: [
            'Susun konduktor Ujung A sesuai T568A: Putih-Hijau, Hijau, Putih-Oranye, Biru...',
            'Ujung A wajib T568A agar nantinya pasangan pin 1↔3 dan 2↔6 bersilangan dengan B.',
            'Awas: jangan memakai T568B di Ujung A! Ujung A harus T568A.'
        ],
        trim_a: [
            'Klik Pemotong Kabel untuk meratakan ujung 8 konduktor Ujung A.',
            'Semua konduktor harus sama panjang agar menyentuh pin emas secara serentak.',
            'Kawat yang tidak rata membuat pin emas tidak tersambung (open circuit).'
        ],
        conn_a: [
            'Klik Konektor RJ-45 untuk memasang kepala konektor pada Ujung A.',
            'Selubung kabel harus ikut masuk ~1,2 cm ke dalam badan RJ-45 agar kuat terjepit.',
            'Jangan pasang RJ-45 jika ujung belum rata, konektor akan terbuang sia-sia.'
        ],
        crimp_a: [
            'Klik Tang Crimping untuk menekan konektor Ujung A sampai terkunci.',
            'Bilah tembaga pin emas akan menembus selubung kawat dan menjepit kuat.',
            'Tekan mantap agar seluruh 8 pin terkunci sempurna.'
        ],
        strip_b: [
            'Klik Pengupas Kabel untuk mengupas selubung pada Ujung B.',
            'Sekarang kita mengerjakan ujung kedua dari kabel yang sama.',
            'Kupas rapi sepanjang 1,2 cm seperti pada ujung pertama.'
        ],
        order_b: [
            'Susun konduktor Ujung B sesuai T568B: Putih-Oranye, Oranye, Putih-Hijau, Biru...',
            'Perbedaan urutan di Ujung B inilah yang mengubah kabel menjadi Crossover!',
            'Awas: jangan menyamakan dengan Ujung A. Kalau sama, kabel jadi Straight-Through!'
        ],
        trim_b: [
            'Klik Pemotong Kabel untuk meratakan ujung kawat Ujung B.',
            'Ujung rata memastikan pin 1 sampai 8 Ujung B menyentuh konektor secara tepat.',
            'Potong tepat di garis potong kuning.'
        ],
        conn_b: [
            'Klik Konektor RJ-45 untuk memasang konektor pada Ujung B.',
            'Dorong kabel sampai semua konduktor terlihat di ujung tembus pandang RJ-45.',
            'Pastikan jaket kabel ikut masuk ke leher pengunci konektor.'
        ],
        crimp_b: [
            'Klik Tang Crimping untuk mengunci konektor Ujung B.',
            'Kedua ujung kabel kini telah selesai dirakit dan siap diuji.',
            'Pastikan crimping terkunci sempurna sebelum dites.'
        ],
        test: [
            'Klik LAN Tester lalu tekan JALANKAN. Perhatikan lampu LED Master dan Remote!',
            'Pada crossover, sinyal Master 1 diterima di Remote 3, dan Master 2 di Remote 6.',
            'Jika LED menyala lurus 1→1, berarti kedua ujung sama (straight, bukan crossover)!'
        ]
    };

    const HINT = {
        pick: 'Pilih opsi "Crossover" pada modal pertanyaan untuk menghubungkan 2 PC langsung.',
        glove: 'Kartu "Sarung Tangan" di panel ALAT kiri, titik merah menyala.',
        len: 'Kartu "Pemotong Kabel" di panel ALAT: pilih panjang 150 cm.',
        strip_a: 'Kartu "Pengupas Kabel" di panel ALAT untuk mengupas selubung Ujung A.',
        order_a: 'Susun Ujung A dengan urutan T568A (diawali Putih-Hijau & Hijau).',
        trim_a: 'Kartu "Pemotong Kabel" di panel ALAT untuk meratakan ujung Ujung A.',
        conn_a: 'Kartu "Konektor RJ-45" di panel PASANG kanan untuk Ujung A.',
        crimp_a: 'Kartu "Tang Crimping" di panel PASANG kanan untuk mengunci Ujung A.',
        strip_b: 'Kartu "Pengupas Kabel" di panel ALAT untuk mengupas selubung Ujung B.',
        order_b: 'Susun Ujung B dengan urutan T568B (diawali Putih-Oranye & Oranye).',
        trim_b: 'Kartu "Pemotong Kabel" di panel ALAT untuk meratakan Ujung B.',
        conn_b: 'Kartu "Konektor RJ-45" di panel PASANG kanan untuk Ujung B.',
        crimp_b: 'Kartu "Tang Crimping" di panel PASANG kanan untuk mengunci Ujung B.',
        test: 'Kartu "Tester" di panel PASANG kanan untuk menguji pola silang 1↔3 & 2↔6.'
    };

    const LOKAL = {
        wo: ['Putih-', 'Oranye'], o: ['Oranye'], wg: ['Putih-', 'Hijau'], b: ['Biru'],
        wb: ['Putih-', 'Biru'], g: ['Hijau'], wbr: ['Putih-', 'Coklat'], br: ['Coklat']
    };

    const curStep = () => STEPS[lv.step];
    const ped = () => PED[curStep().id] || PED.pick;

    /* ================================================================
       KEADAAN KABEL & SIMULASI
       ================================================================ */
    const KAB = {
        cablePickDone: false,
        firstPickCorrect: true,
        /* Siklus pemakaian sarung tangan (lihat l3Tangan / l3ActGlove):
           gloveSelected / gloveEquipping / glovesEquipped, dengan `glove`
           sebagai alias lama yang dipakai uji & status. */
        gloveSelected: false, gloveEquipping: false, glovesEquipped: false,
        glove: false,
        lenChosen: false,
        usedCm: 0,
        end: 0, // 0 = Ujung A, 1 = Ujung B

        // Ujung A
        strippedA: false, trimmedA: false, connA: false, crimpedA: false,
        slotsA: new Array(8).fill(null),
        looseA: shuffle(WIRE_IDS.slice()),

        // Ujung B
        strippedB: false, trimmedB: false, connB: false, crimpedB: false,
        slotsB: new Array(8).fill(null),
        looseB: shuffle(WIRE_IDS.slice()),

        // Animasi posisi tip & anchor untuk ujung aktif
        tip: {}, mov: {}, anchor: {},

        rj45Used: 0,
        helpUsed: 0,
        gagalUji: 0
    };

    WIRE_IDS.forEach(function (id) { KAB.tip[id] = { x: 0, y: 0, vx: 0, vy: 0 }; });

    // Inisialisasi anchor kawat di mulut jaket
    function l3InitAnchors(looseArr) {
        looseArr.forEach(function (id, i) {
            KAB.anchor[id] = { x: BASE_X0 + i * CON_STEP, y: WIRE_B + ANCHOR_DY };
        });
    }
    l3InitAnchors(KAB.looseA);

    const curSlots = () => (KAB.end === 0 ? KAB.slotsA : KAB.slotsB);
    const curLoose = () => (KAB.end === 0 ? KAB.looseA : KAB.looseB);
    const curStripped = () => (KAB.end === 0 ? KAB.strippedA : KAB.strippedB);
    const curTrimmed = () => (KAB.end === 0 ? KAB.trimmedA : KAB.trimmedB);
    const curConn = () => (KAB.end === 0 ? KAB.connA : KAB.connB);
    const curCrimped = () => (KAB.end === 0 ? KAB.crimpedA : KAB.crimpedB);

    lv.KAB = KAB;
    lv.steps = STEPS;
    lv.needCm = NEED_CM;
    if (!Array.isArray(save.board3)) save.board3 = [];
    lv.boardKey = 'board3';

    lv.phase = 'brief';
    lv.briefPage = 0; lv.briefShown = 0; lv.tPrev = performance.now();
    lv.step = 0;
    lv.tool = null;
    lv.anim = null;
    lv.flash = null;
    lv.modal = null;
    lv.sel = null;
    lv.drag = null;
    lv.test = null;
    lv.helpFree = 1;
    lv.helpUntil = 0;
    lv.lastAct = performance.now();
    lv.modeMudah = !!save.l2.mudah;
    lv.quizIdx = 0;
    lv.wrongPicks = [];

    // Bank Soal Kuis Crossover (minimal 6 soal komprehensif)
    const QUIZ_BANK = [
        {
            q: 'Ujung A pada kabel crossover standar TIA/EIA umumnya memakai urutan warna...',
            ans: 0,
            opts: ['T568A', 'T568B', 'Rollover', 'Cross-pin bebas'],
            why: 'Standar crossover menetapkan Ujung A memakai T568A dan Ujung B memakai T568B.'
        },
        {
            q: 'Pada kabel crossover 10/100 Mbps, pin berapa saja yang saling bertukar pasangan (TX dan RX)?',
            ans: 1,
            opts: ['Pin 1↔2 dan 3↔6', 'Pin 1↔3 dan 2↔6', 'Pin 4↔5 dan 7↔8', 'Pin 1↔8 dan 2↔7'],
            why: 'Pin 1 bertukar dengan pin 3 (TX+ ke RX+), dan pin 2 bertukar dengan pin 6 (TX- ke RX-).'
        },
        {
            q: 'Skenario manakah yang secara tradisional memerlukan kabel crossover?',
            ans: 2,
            opts: ['Komputer ke Switch', 'Switch ke Router', 'Komputer ke Komputer langsung tanpa switch', 'Access Point ke Switch'],
            why: 'Kabel crossover menghubungkan dua perangkat sejenis (DTE ke DTE) agar sinyal kirim masuk ke penerima.'
        },
        {
            q: 'Mengapa perangkat jaringan modern sering kali tidak lagi memerlukan kabel crossover untuk PC ke PC?',
            ans: 1,
            opts: ['Kabel straight lebih kuat', 'Perangkat modern memiliki fitur Auto MDI-X otomatis', 'Tegangan port LAN sudah dinaikkan', 'Menggunakan protokol nirkabel'],
            why: 'Fitur Auto MDI-X pada port Ethernet modern otomatis mendeteksi dan membalik jalur transmisi.'
        },
        {
            q: 'Jika Ujung A (Master) menyalakan LED 1, 2, 3, 6, bagaimana pola LED Remote pada kabel crossover yang benar?',
            ans: 0,
            opts: ['Menyala 3, 6, 1, 2', 'Menyala 1, 2, 3, 6', 'Menyala 8, 7, 6, 5', 'Menyala 2, 1, 6, 3'],
            why: 'Master 1➔Remote 3, Master 2➔Remote 6, Master 3➔Remote 1, dan Master 6➔Remote 2.'
        },
        {
            q: 'Apa perbedaan mendasar antara kabel straight-through dan crossover?',
            ans: 1,
            opts: [
                'Straight memakai 4 kawat, Crossover memakai 8 kawat',
                'Straight memakai standar sama di kedua ujung (A-A / B-B), Crossover berbeda (A-B)',
                'Straight hanya untuk internet lambat, Crossover untuk gigabit',
                'Straight memakai RJ-45, Crossover memakai RJ-11'
            ],
            why: 'Straight-through memakai standar sama di kedua ujung, sedangkan crossover memakai T568A di satu ujung dan T568B di ujung lainnya.'
        }
    ];

    // Acak 4 soal dari bank kuis
    lv.quizzes = shuffle(QUIZ_BANK.slice()).slice(0, 4);

    const l3Andi = (t, ms) => { lv.andiTip = t; lv.andiUntil = performance.now() + (ms || 9000); };
    function l3Flash(msg, kind) { lv.flash = { msg: msg, kind: kind || 'info', t: performance.now() }; }

    /* ================================================================
       ANIMASI
       ================================================================ */
    function l3Anim(type, dur, done) { lv.anim = { type: type, t0: performance.now(), dur: dur, done: done || null }; }
    function l3AnimP(now, type) {
        const a = lv.anim;
        if (!a || a.type !== type) return 1;
        return clamp((now - a.t0) / a.dur, 0, 1);
    }
    function l3TickAnim(now) {
        const a = lv.anim;
        if (!a || now - a.t0 < a.dur) return;
        lv.anim = null;
        if (a.done) a.done();
    }
    function l3Step() {
        if (lv.step >= STEPS.length - 1) return;
        lv.step++; lv.tool = null; lv.sel = null; lv.drag = null;
        l3Andi(HINT[curStep().id]);
    }
    function l3CableTop(now) {
        if (lv.anim && lv.anim.type === 'conn') return lerp(WIRE_B, JACK_UP, easeOut(l3AnimP(now, 'conn')));
        return curConn() ? JACK_UP : WIRE_B;
    }

    /* ================================================================
       0 — PILIH JENIS KABEL (MODAL SKENARIO AWAL)
       ================================================================ */
    function l3PilihKabel(idx) {
        // Opsi: 0 = Straight-Through, 1 = Crossover, 2 = Rollover, 3 = Coaxial
        if (idx === 1) { // BENAR: Crossover
            KAB.cablePickDone = true;
            lv.modal = null;
            SND.benar();
            l3Flash('Tepat! Kabel Crossover menukar jalur TX dan RX antar 2 PC.', 'ok');
            l3Andi('Bagus sekali! PC ke PC langsung butuh Crossover. Sekarang pakai sarung tangan untuk memulai pekerjaan.');
            l3Step(); // Lanjut ke langkah 1 (glove)
        } else {
            KAB.firstPickCorrect = false;
            const namaOpsi = ['Straight-Through', 'Crossover', 'Rollover', 'Coaxial'][idx];
            lv.penalize(4, 'Salah memilih kabel: ' + namaOpsi);
            SND.salah();
            l3Flash('Salah! ' + namaOpsi + ' tidak cocok untuk PC ke PC langsung tanpa switch.', 'bad');
            l3Andi('Perhatikan: Dua PC adalah perangkat sejenis (DTE). Jika memakai Straight-through, pin TX PC 1 akan bertabrakan dengan pin TX PC 2! Pilih Crossover.');
        }
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
       Setelah selesai (KAB.glove=true) area kerja kembali bersih. Sama
       persis dengan Level 2; dipas di dalam draw memakai lv.anim +
       performance.now(), tanpa rAF baru.                               */
    function l3Tangan(now) {
        const a = lv.anim;
        if (!a || a.type !== 'glove') return;     // diam: tidak ada objek apa pun
        const p = l3AnimP(now, 'glove');
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
    /* Klik kartu Sarung Tangan: animasi 'glove' (1,7 dtk), lalu KAB.glove
       diset true dan l3Step() memajukan langkah. Penjaga mencegah animasi
       dobel bila kartu diklik lagi selagi animasi berjalan. */
    function l3ActGlove() {
        if (KAB.glove || lv.anim) return;
        KAB.gloveSelected = true;                 // pemain memilih sarung tangan
        l3Flash('Sarung tangan HIDUP. Tangan terlindungi dari kawat tembaga tajam.', 'ok');
        say('Sarung tangan HIDUP', 'ok');
        SND.klik();
        KAB.gloveEquipping = true;                // animasi memakai sarung berjalan
        l3Anim('glove', 1700, () => {
            KAB.gloveEquipping = false;
            KAB.glovesEquipped = true;            // sarung terpasang penuh
            KAB.glove = true;                     // alias lama (dipakai uji & status)
            l3Step();
        });
    }

    /* ================================================================
       2 — PEMOTONG KABEL (PANJANG 150 CM)
       ================================================================ */
    function l3ActCut() {
        lv.modal = 'len';
        SND.klik();
    }
    function l3ChooseLen(cm) {
        lv.modal = null;
        KAB.lenChosen = true;
        KAB.usedCm += cm;
        SND.potong();
        l3Flash('Kabel dipotong ' + cm + ' cm. Total terpakai ' + KAB.usedCm + ' cm.', 'ok');
        if (cm !== NEED_CM && !lv.modeMudah) {
            lv.penalize(4, 'Panjang ' + cm + ' cm kurang tepat. Kebutuhan jarak PC ke PC di meja lab adalah ' + NEED_CM + ' cm');
            l3Andi('Panjang ' + cm + ' cm kurang ideal. Kabel PC ke PC langsung pada meja lab berdekatan butuh tepat ' + NEED_CM + ' cm.');
        } else {
            l3Andi('Panjang ' + cm + ' cm sangat tepat. Sekarang kupas selubung luar pada Ujung A.');
        }
        l3Anim('cut', 700, () => l3Step());
    }

    /* ================================================================
       3 & 8 — PENGUPAS KABEL (UJUNG A & UJUNG B)
       ================================================================ */
    function l3ActStrip() {
        SND.kupas();
        if (KAB.end === 0) {
            KAB.strippedA = true;
            l3Flash('Selubung Ujung A terkupas. 8 konduktor siap disusun (T568A).', 'ok');
            l3Anim('strip', 1400, () => {
                l3Andi('Susun Ujung A dengan standar T568A: Putih-Hijau, Hijau, Putih-Oranye, Biru, Putih-Biru, Oranye, Putih-Coklat, Coklat.');
                l3Step();
            });
        } else {
            KAB.strippedB = true;
            l3Flash('Selubung Ujung B terkupas. Susun sebagai T568B untuk membuat pola silang!', 'ok');
            l3Anim('strip', 1200, () => {
                l3Andi('Susun Ujung B dengan standar T568B: Putih-Oranye, Oranye, Putih-Hijau, Biru, Putih-Biru, Hijau, Putih-Coklat, Coklat.');
                l3Step();
            });
        }
    }

    /* ================================================================
       4 & 9 — MENYUSUN WARNA (KURVA BEZIER DARI TITIK TAMBAT)
       ================================================================ */
    function l3LooseX(id) { return KAB.anchor[id] ? KAB.anchor[id].x : CX; }
    function l3Home(id) { return { x: l3LooseX(id), y: TIP_Y }; }
    function l3Goal(id, now) {
        const slots = curSlots();
        const s = slots.indexOf(id);
        if (s >= 0) return { x: slotCX(s), y: SLOT_SEAT };
        const h = l3Home(id);
        const a = lv.anim;
        if (a && a.type === 'strip') {
            const loose = curLoose();
            const i = Math.max(0, loose.indexOf(id));
            const q = easeOut(clamp((l3AnimP(now, 'strip') - 0.20 - i * 0.022) / 0.55, 0, 1));
            return { x: h.x, y: lerp(l3CableTop(now) + ANCHOR_DY, TIP_Y, q) };
        }
        return h;
    }

    function l3MoveTo(id, tx, ty, dur, now) {
        const t = KAB.tip[id];
        KAB.mov[id] = { sx: t.x, sy: t.y, tx: tx, ty: ty, t0: now, dur: dur || 480, bounce: true };
    }

    function l3PutWire(id, slot) {
        const slots = curSlots();
        const cur = slots[slot];
        if (cur === id) return;
        const now = performance.now();
        const from = slots.indexOf(id);
        if (from >= 0) {
            slots[from] = cur;
            if (cur && cur !== id) l3MoveTo(cur, slotCX(from), SLOT_SEAT, 460, now);
        }
        slots[slot] = id;
        l3MoveTo(id, slotCX(slot), SLOT_SEAT, 520, now);
        SND.klik();

        // Cek kesalahan umum: siswa menyusun Ujung A dengan T568B
        if (KAB.end === 0 && slot === 0 && id === 'wo') {
            l3Andi('Ingat: Ujung A harus standar T568A (dimulai Putih-Hijau), bukan T568B!');
        }
        // Cek kesalahan umum: siswa menyusun Ujung B dengan T568A
        if (KAB.end === 1 && slot === 0 && id === 'wg') {
            l3Andi('Ingat: Ujung B harus standar T568B (dimulai Putih-Oranye) agar jalur TX dan RX bersilangan!');
        }

        // Jika semua 8 slot sudah terisi
        if (slots.every(Boolean)) {
            SND.benar();
            if (KAB.end === 0) {
                l3Flash('8 slot Ujung A terisi. Lanjut: ratakan ujung kawat dengan Pemotong Kabel.', 'ok');
                l3Andi('Ujung A terisi semua. Sekarang klik Pemotong Kabel untuk meratakan ujung kawat.');
            } else {
                l3Flash('8 slot Ujung B terisi. Lanjut: ratakan ujung kawat B.', 'ok');
                l3Andi('Ujung B terisi semua. Ratakan ujung kawat B sebelum memasang konektor RJ-45.');
            }
            l3Step();
        }
    }

    function l3SwapLoose(a, b) {
        const loose = curLoose();
        const i = loose.indexOf(a), j = loose.indexOf(b);
        loose[i] = b; loose[j] = a;
        const now = performance.now();
        l3MoveTo(a, l3LooseX(b), TIP_Y, 420, now);
        l3MoveTo(b, l3LooseX(a), TIP_Y, 420, now);
        SND.klik();
    }

    function l3SlotAt(p) {
        for (let i = 0; i < 8; i++) {
            if (inR(p, { x: slotX(i) - 7, y: SLOT_HIT_T, w: SLOT_W + 14, h: SLOT_HIT_B - SLOT_HIT_T })) return i;
        }
        return -1;
    }

    function l3NearCurve(c, p, reach, n) {
        for (let k = 0; k <= n; k++) {
            const q = l3Bez(c.p0, c.p1, c.p2, c.p3, k / n);
            if (Math.abs(q.x - p.x) <= reach && Math.abs(q.y - p.y) <= reach) return true;
        }
        return false;
    }

    function l3HomeCtrl(id, now) {
        const h = l3Home(id), ay = l3CableTop(now) + ANCHOR_DY, H = ay - h.y;
        return {
            p0: { x: h.x, y: ay }, p1: { x: h.x, y: ay - H * 0.46 },
            p2: { x: h.x, y: h.y + H * 0.414 }, p3: { x: h.x, y: h.y }
        };
    }

    function l3LooseAt(p) {
        if (!curStripped()) return null;
        const slots = curSlots();
        if (slots.every(Boolean)) return null;
        const now = performance.now(), reach = CON_W / 2 + 5, n = 14;
        const loose = curLoose();
        for (let i = 0; i < loose.length; i++) {
            const id = loose[i];
            if (slots.indexOf(id) >= 0) continue;
            if (l3NearCurve(l3HomeCtrl(id, now), p, reach, n)) return id;
        }
        for (let i = 0; i < loose.length; i++) {
            const id = loose[i];
            if (slots.indexOf(id) >= 0) continue;
            if (l3NearCurve(l3Ctrl(id, now), p, reach, n)) return id;
        }
        return null;
    }

    function l3SlotHover(i) {
        return mouse.x >= slotX(i) - 7 && mouse.x <= slotX(i) + SLOT_W + 7 &&
            mouse.y >= SLOT_HIT_T && mouse.y <= SLOT_HIT_B;
    }
    function l3HoverWire() { return lv.sel || l3LooseAt(mouse); }

    /* ================================================================
       5 & 10 — MERATAKAN UJUNG KAWAT
       ================================================================ */
    function l3ActTrim() {
        SND.potong();
        if (KAB.end === 0) {
            KAB.trimmedA = true;
            l3Flash('Ujung A sudah rata! Siap dipasang ke konektor RJ-45.', 'ok');
            l3Andi('Ujung A rata sempurna. Lanjut pasang Konektor RJ-45 di panel PASANG.');
        } else {
            KAB.trimmedB = true;
            l3Flash('Ujung B sudah rata! Siap dipasang ke konektor RJ-45.', 'ok');
            l3Andi('Ujung B rata sempurna. Pasang konektor RJ-45 kedua.');
        }
        l3Anim('trim', 1100, () => l3Step());
    }

    /* ================================================================
       6 & 11 — PASANG KONEKTOR RJ-45
       ================================================================ */
    function l3ActConn() {
        KAB.rj45Used++;
        const trimmed = curTrimmed();
        if (!trimmed) {
            lv.tool = null;
            lv.penalize(8, 'Konektor dipasang sebelum ujung kawat diratakan — konektor rusak dan terbuang');
            l3Flash('Konektor dibuang! Ratakan kawat terlebih dahulu.', 'bad');
            l3Andi('Kawat yang belum rata tidak boleh dipasangi RJ-45 karena pin tidak akan menyentuh sempurna. Ratakan dulu!');
            return;
        }
        SND.klik();
        if (KAB.end === 0) {
            KAB.connA = true;
            l3Flash('Konektor RJ-45 A terpasang. Selubung kabel masuk ke badan konektor.', 'ok');
            l3Andi('Konektor Ujung A terpasang. Sekarang tekan dengan Tang Crimping sampai terkunci.');
        } else {
            KAB.connB = true;
            l3Flash('Konektor RJ-45 B terpasang. Siap untuk di-crimp.', 'ok');
            l3Andi('Konektor Ujung B terpasang. Tekan dengan Tang Crimping.');
        }
        l3Anim('conn', 900, () => l3Step());
    }

    /* ================================================================
       7 & 12 — TANG CRIMPING & TRANSISI KE UJUNG B
       ================================================================ */
    function l3ActCrimp() {
        SND.crimp();
        shake = 7;
        l3Anim('crimp', 1900, () => {
            shake = 5;
            SND.crimp();
            if (KAB.end === 0) {
                KAB.crimpedA = true;
                l3Flash('Ujung A berhasil di-crimp (T568A)! Sekarang balik kabel ke Ujung B.', 'ok');
                SND.benar();
                // Transisi ke Ujung B: ganti state kabel, luncurkan kawat baru
                l3Anim('turn', 1200, () => {
                    KAB.end = 1;
                    l3InitAnchors(KAB.looseB);
                    WIRE_IDS.forEach(function (id) {
                        KAB.tip[id] = { x: l3LooseX(id), y: TIP_Y, vx: 0, vy: 0 };
                        KAB.mov[id] = null;
                    });
                    l3Andi('Kabel dibalik ke Ujung B. Sekarang klik Pengupas Kabel untuk membuka selubung Ujung B.');
                    l3Step(); // Lanjut ke langkah 8 (strip_b)
                });
            } else {
                KAB.crimpedB = true;
                l3Flash('Ujung B berhasil di-crimp (T568B)! Kedua ujung siap diuji di LAN Tester.', 'ok');
                SND.benar();
                l3Andi('Kedua ujung kabel selesai di-crimp! Sekarang klik LAN Tester di panel kanan untuk menguji sambungan.');
                l3Step(); // Lanjut ke langkah 13 (test)
            }
        });
    }

    /* ================================================================
       13 — LAN TESTER CROSSOVER (MASTER UJUNG A & REMOTE UJUNG B)
       ================================================================ */
    // Pemetaan kabel crossover T568A (Ujung A) ke T568B (Ujung B):
    // Pin 1 (wg) -> Pin 3 (wg pada T568B)
    // Pin 2 (g)  -> Pin 6 (g pada T568B)
    // Pin 3 (wo) -> Pin 1 (wo pada T568B)
    // Pin 4 (b)  -> Pin 4 (b pada T568B)
    // Pin 5 (wb) -> Pin 5 (wb pada T568B)
    // Pin 6 (o)  -> Pin 2 (o pada T568B)
    // Pin 7 (wbr)-> Pin 7 (wbr pada T568B)
    // Pin 8 (br) -> Pin 8 (br pada T568B)
    const CROSS_MAP = [3, 6, 1, 4, 5, 2, 7, 8]; // 0-indexed: index pin Master -> nomor pin Remote

    function l3ActTester() {
        lv.modal = 'test';
        lv.test = { phase: 'siap', t0: 0, step: 0, res: [] };
        SND.klik();
    }

    function l3JalankanTes() {
        lv.test = {
            phase: 'run',
            t0: performance.now(),
            step: 0,
            res: []
        };
        SND.klik();
    }

    function l3SelesaiTes() {
        const t = lv.test;
        const okA = KAB.slotsA.every((id, i) => id === STD_A[i]);
        const okB = KAB.slotsB.every((id, i) => id === STD_B[i]);
        const isStraightA = KAB.slotsA.every((id, i) => id === STD_A[i]) && KAB.slotsB.every((id, i) => id === STD_A[i]);
        const isStraightB = KAB.slotsA.every((id, i) => id === STD_B[i]) && KAB.slotsB.every((id, i) => id === STD_B[i]);

        if (isStraightA || isStraightB) {
            // Diagnosis: Kedua ujung sama (Straight-through)
            t.phase = 'fail';
            t.reason = 'straight';
            t.badDesc = 'Pola Straight-Through terdeteksi (1➔1, 2➔2, dst). Bukan Crossover!';
            lv.penalize(10, 'Kabel terdeteksi Straight-Through, bukan Crossover. Ujung A harus T568A dan Ujung B harus T568B');
            KAB.gagalUji++;
            KAB.rj45Used++;
            KAB.usedCm += 5;
            l3Andi('Ini pola straight-through (1→1, 2→2, dst), bukan crossover. Cek lagi standar tiap ujung: Ujung A wajib T568A dan Ujung B wajib T568B.');
            return;
        }

        if (!okA || !okB) {
            // Diagnosis: Ada pin yang salah susun
            t.phase = 'fail';
            t.reason = 'wrong_pin';
            const badA = [], badB = [];
            for (let i = 0; i < 8; i++) {
                if (KAB.slotsA[i] !== STD_A[i]) badA.push(i + 1);
                if (KAB.slotsB[i] !== STD_B[i]) badB.push(i + 1);
            }
            t.badA = badA;
            t.badB = badB;

            let desc = '';
            if (badA.length) desc += 'Ujung A pin ' + badA.join(', ') + ' salah. ';
            if (badB.length) desc += 'Ujung B pin ' + badB.join(', ') + ' salah.';
            t.badDesc = desc;

            lv.penalize(10, 'Gagal uji LAN Tester: ' + desc);
            KAB.gagalUji++;
            KAB.rj45Used++;
            KAB.usedCm += 5;
            l3Andi('LED merah menyala! ' + desc + ' Ujung yang salah dipotong dan harus disusun ulang.');
            return;
        }

        // Lulus Crossover!
        t.phase = 'ok';
        t.reason = 'pass';
        SND.benar();
        l3Flash('LULUS: Kabel Crossover Sempurna! Pola silang 1↔3 dan 2↔6 terverifikasi.', 'ok');
        l3Andi('Hebat! Semua LED Master dan Remote menyala hijau sesuai pola silang crossover. Sekarang uji hubungkan kedua PC di lab!');
    }

    function l3ResetUjungSalah() {
        lv.modal = null;
        lv.test = null;

        // Ujung yang dipotong ditentukan dari perbandingan isi slot ke standar
        // masing-masing. Diagnosis straight-through tidak menyimpan daftar pin
        // salah, jadi harus dihitung ulang di sini -- kalau tidak, Ujung A
        // (yang kadang sudah benar) terus diulang dan Ujung B yang salah tidak
        // pernah terperbaiki.
        const badA = [], badB = [];
        for (let i = 0; i < 8; i++) {
            if (KAB.slotsA[i] !== STD_A[i]) badA.push(i + 1);
            if (KAB.slotsB[i] !== STD_B[i]) badB.push(i + 1);
        }
        // Kedua ujung salah -> ulangi A dulu (B menyusul pada uji berikutnya).
        const ulangA = badA.length > 0 || badB.length === 0;

        if (ulangA) {
            // Ulang Ujung A
            KAB.end = 0;
            KAB.slotsA = new Array(8).fill(null);
            KAB.trimmedA = false; KAB.connA = false; KAB.crimpedA = false;
            lv.step = 4; // kembali ke susun Ujung A
            l3InitAnchors(KAB.looseA);
            WIRE_IDS.forEach(function (id) { KAB.mov[id] = null; });
            l3Flash('Konektor A dipotong (RJ-45 +1). Susun ulang Ujung A sebagai T568A.', 'bad');
        } else {
            // Ulang Ujung B saja
            KAB.end = 1;
            KAB.slotsB = new Array(8).fill(null);
            KAB.trimmedB = false; KAB.connB = false; KAB.crimpedB = false;
            lv.step = 9; // kembali ke susun Ujung B
            l3InitAnchors(KAB.looseB);
            WIRE_IDS.forEach(function (id) { KAB.mov[id] = null; });
            l3Flash('Konektor B dipotong (RJ-45 +1). Susun ulang Ujung B sebagai T568B.', 'bad');
        }
    }

    /* ================================================================
       KURVA BEZIER & PENGGAMBARAN KAWAT
       ================================================================ */
    function l3Bez(p0, p1, p2, p3, t) {
        const m = 1 - t, a = m * m * m, b = 3 * m * m * t, c = 3 * m * t * t, d = t * t * t;
        return { x: a * p0.x + b * p1.x + c * p2.x + d * p3.x, y: a * p0.y + b * p1.y + c * p2.y + d * p3.y };
    }
    function l3BezD(p0, p1, p2, p3, t) {
        const m = 1 - t;
        return {
            x: 3 * m * m * (p1.x - p0.x) + 6 * m * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x),
            y: 3 * m * m * (p1.y - p0.y) + 6 * m * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y)
        };
    }
    function l3Ctrl(id, now) {
        const a = KAB.anchor[id] || { x: CX, y: WIRE_B + ANCHOR_DY };
        const t = KAB.tip[id] || { x: CX, y: TIP_Y };
        const ax = a.x, ay = l3CableTop(now) + ANCHOR_DY;
        const dx = t.x - ax, dy = ay - t.y;
        const L = Math.min(Math.hypot(dx, dy), MAXLEN) || 1;
        const slots = curSlots();
        const f = slots.indexOf(id);
        const bow = L * 0.46, out = (f >= 0 ? (f - 3.5) / 3.5 : dx / (CON_STEP * 7)) * L * 0.05;
        return {
            p0: { x: ax, y: ay },
            p1: { x: ax, y: ay - bow },
            p2: { x: ax + dx + out, y: ay - dy + bow * 0.9 },
            p3: { x: ax + dx, y: ay - dy }
        };
    }
    function l3Tube(c, r, n) {
        const L = [], R = [];
        let ux = 0, uy = -1;
        for (let i = 0; i <= n; i++) {
            const p = l3Bez(c.p0, c.p1, c.p2, c.p3, i / n);
            const d = l3BezD(c.p0, c.p1, c.p2, c.p3, i / n);
            const m = Math.hypot(d.x, d.y) || 1;
            ux = d.x / m; uy = d.y / m;
            L.push({ x: p.x - uy * r, y: p.y + ux * r });
            R.push({ x: p.x + uy * r, y: p.y - ux * r });
        }
        const pts = L.slice();
        for (let k = 1; k < 8; k++) {
            const th = k / 8 * Math.PI, co = Math.cos(th), si = Math.sin(th);
            pts.push({
                x: c.p3.x + r * (-uy * co + ux * si),
                y: c.p3.y + r * (ux * co + uy * si)
            });
        }
        for (let i = n; i >= 0; i--) pts.push(R[i]);
        return { pts: pts, L: L, R: R, n: n };
    }
    function l3Poly(pts) {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.closePath();
    }
    function l3Conductor(id, now) {
        const w = CON_W, r = w / 2;
        const c = l3Ctrl(id, now), d = WC[id], st = !!d.st;
        const T = l3Tube(c, r, 26);
        ctx.save();
        l3Poly(T.pts);
        ctx.fillStyle = st ? '#f6efe0' : d.c;
        if (lv.sel === id) {
            ctx.shadowColor = 'rgba(255,255,255,.9)';
            ctx.shadowBlur = 11;
        }
        ctx.fill();
        ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
        if (st) {
            ctx.save();
            l3Poly(T.pts); ctx.clip();
            const ax = c.p0.x, ay = c.p0.y, G = Math.ceil(MAXLEN) + 90;
            ctx.strokeStyle = d.c;
            ctx.lineWidth = Math.max(6, w * 0.4);
            ctx.beginPath();
            for (let k = -G; k <= G; k += 15) {
                ctx.moveTo(ax - G + k, ay + G);
                ctx.lineTo(ax - G + k + 2 * G, ay - G);
            }
            ctx.stroke();
            ctx.restore();
        } else {
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
        l3Poly(T.pts);
        ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(6,10,18,.85)'; ctx.stroke();
        ctx.restore();
    }

    function l3UpdateTips(now) {
        const drag = lv.drag;
        const strip = !!(lv.anim && lv.anim.type === 'strip');
        const ay = l3CableTop(now) + ANCHOR_DY;
        for (let i = 0; i < WIRE_IDS.length; i++) {
            const id = WIRE_IDS[i], t = KAB.tip[id], g = l3Goal(id, now);
            if (drag && drag.id === id) {
                t.vx = drag.x - t.x; t.vy = drag.y - t.y;
                t.x = lerp(t.x, drag.x, 0.42); t.y = lerp(t.y, drag.y, 0.42);
                KAB.mov[id] = null;
            } else if (strip) {
                t.vx = g.x - t.x; t.vy = g.y - t.y;
                t.x = g.x; t.y = g.y;
                KAB.mov[id] = null;
            } else {
                const m = KAB.mov[id];
                if (m) {
                    const p = clamp((now - m.t0) / m.dur, 0, 1);
                    const e = easeBack(p);
                    t.vx = lerp(m.sx, m.tx, e) - t.x;
                    t.vy = lerp(m.sy, m.ty, e) - t.y;
                    t.x += t.vx; t.y += t.vy;
                    if (p >= 1) KAB.mov[id] = null;
                } else {
                    t.vx = (g.x - t.x) * 0.22; t.vy = (g.y - t.y) * 0.22;
                    t.x += t.vx; t.y += t.vy;
                }
            }
            const a = KAB.anchor[id] || { x: CX, y: ay };
            const dx = t.x - a.x, dy = ay - t.y;
            const dd = Math.hypot(dx, dy);
            if (dd > MAXLEN) {
                const k = MAXLEN / dd;
                t.x = a.x + dx * k; t.y = ay - dy * k;
            }
        }
    }

    function l3Konduktor(now) {
        if (!curStripped()) return;
        const dragId = lv.drag ? lv.drag.id : null;
        const loose = curLoose();
        for (let i = 0; i < loose.length; i++) {
            const id = loose[i];
            if (id === dragId) continue;
            l3Conductor(id, now);
        }
        if (dragId) l3Conductor(dragId, now);

        const isOrderStep = curStep().id === 'order_a' || curStep().id === 'order_b';
        if (isOrderStep && !curSlots().every(Boolean)) {
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
            txt('susun ke pin 1–8', ax + 14, ay1 - 2,
                { s: 11, a: 'left', c: 'rgba(186,230,253,' + (.6 + .4 * p) + ')', w: 800 });
            ctx.restore();
        }
    }

    function l3LabelPos(w, h, tx, ty) {
        const cand = [
            [0, -h - 10], [0, h + 10], [0, -h - 32], [0, h + 32],
            [w + 12, -h / 2], [-(w + 12), -h / 2], [w + 12, -h - 10], [-(w + 12), -h - 10]
        ];
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

    function l3LabelWadah() {
        const id = l3HoverWire();
        const slots = curSlots();
        if (!id || slots.indexOf(id) >= 0) return;
        const t = KAB.tip[id], nm = WC[id].n;
        ctx.font = '700 11.5px ' + FONT_B;
        const w = ctx.measureText(nm).width + 20;
        const p = l3LabelPos(w, 24, t.x, t.y);
        rr(p.x, p.y, w, 24, 12);
        ctx.fillStyle = 'rgba(5,12,22,.97)'; ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = WC[id].c; ctx.stroke();
        txt(nm, p.x + w / 2, p.y + 16, { s: 11.5, a: 'center', c: '#ffffff', w: 700 });
    }

    /* ================================================================
       GAMBAR SELUBUNG (JAKET) & MULUT JAKET
       ================================================================ */
    function l3Jaket(now, cabTop) {
        const jw = JACKET_W, x = CX - jw / 2;
        const y = cabTop, h = (AY + AH) - y;
        if (h < 2) return;
        const r = 12;
        ctx.save();
        rr(AX, AY, AW, AH, 14); ctx.clip();
        rr(x, y, jw, h, r);
        ctx.fillStyle = '#64748b'; ctx.fill(); // Slate jacket
        ctx.lineWidth = 3; ctx.strokeStyle = '#475569'; ctx.stroke();
        rr(x - 2, y - 2, jw + 4, h + 4, r);
        ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.stroke();

        // Tekstur horizontal
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

        // Mulut jaket
        const mw = jw - MOUTH_IN * 2, mx = CX - mw / 2, my = y - 4, mh = MOUTH_H + 6;
        ctx.save();
        rr(mx, my, mw, mh, 8);
        const mg = ctx.createLinearGradient(0, my, 0, my + mh);
        mg.addColorStop(0, '#0a1220');
        mg.addColorStop(.45, '#26364e');
        mg.addColorStop(1, '#64748b');
        ctx.fillStyle = mg; ctx.fill();
        ctx.restore();

        // Bayangan dalam mulut
        ctx.save();
        rr(mx, my, mw, mh, 8); ctx.clip();
        const sg = ctx.createLinearGradient(0, my, 0, my + 9);
        sg.addColorStop(0, 'rgba(0,0,0,.6)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = sg; ctx.fillRect(mx, my, mw, 9);
        ctx.restore();

        txt('SELUBUNG UTP (' + (KAB.end === 0 ? 'UJUNG A' : 'UJUNG B') + ')', CX, y + h - 10,
            { s: 11, a: 'center', c: 'rgba(18,26,40,.92)', w: 800 });

        // Animasi potongan lepas
        if (lv.anim && lv.anim.type === 'strip') {
            const p = l3AnimP(now, 'strip');
            if (p > .18) {
                const q = clamp((p - .18) / .55, 0, 1);
                ctx.save();
                ctx.globalAlpha = Math.max(0, 1 - q * q * 1.15);
                ctx.translate(CX + q * 20, WIRE_B - 12 + q * q * 130);
                ctx.rotate(q * 1.2);
                rr(-jw / 2, -14, jw, 28, 12);
                ctx.fillStyle = '#64748b'; ctx.fill();
                ctx.lineWidth = 2.5; ctx.strokeStyle = '#475569'; ctx.stroke();
                ctx.restore();
            }
        }
        if (lv.anim && lv.anim.type === 'cut') {
            const q = l3AnimP(now, 'cut');
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

    /* ================================================================
       KOTAK RJ-45 & PIN 1-8
       ================================================================ */
    function l3KotakPin(now) {
        if (!curStripped()) return;
        const isOrderStep = curStep().id === 'order_a' || curStep().id === 'order_b';
        const slots = curSlots();
        const ordering = isOrderStep && !slots.every(Boolean);
        const pulse = .45 + .35 * Math.sin(now / 260);

        rr(PIN.x, PIN.y, PIN.w, PIN.h, 12);
        ctx.fillStyle = 'rgba(9,18,32,.90)'; ctx.fill();
        ctx.lineWidth = ordering ? 3 : 2;
        ctx.strokeStyle = ordering ? 'rgba(248,113,113,' + pulse + ')' : 'rgba(110,150,190,.65)';
        ctx.stroke();

        // Label Standar Ujung (Ujung A — T568A / Ujung B — T568B)
        const stdLabel = KAB.end === 0 ? 'UJUNG A — STANDAR T568A' : 'UJUNG B — STANDAR T568B';
        const stdColor = KAB.end === 0 ? '#4ade80' : '#38bdf8';
        if (!curConn()) {
            txt(stdLabel, PIN.x + 16, HDR_Y, { s: 12.5, c: stdColor, f: FONT_H, w: 800 });
        }

        const trimmed = curTrimmed();
        const st = trimmed ? 'ujung sudah rata' : 'ujung belum rata';
        const scol = trimmed ? '#4ade80' : C.warn;
        if (!curConn()) {
            rr(PIN.x + PIN.w - 130, PIN.y + 3, 114, 18, 9);
            ctx.fillStyle = 'rgba(4,10,20,.85)'; ctx.fill();
            ctx.lineWidth = 1.5; ctx.strokeStyle = scol; ctx.stroke();
            txt(st, PIN.x + PIN.w - 73, PIN.y + 16, { s: 10.5, a: 'center', c: scol, w: 800 });
        }

        const targetStd = KAB.end === 0 ? STD_A : STD_B;
        for (let i = 0; i < 8; i++) {
            const id = slots[i], hot = ordering && !id && l3SlotHover(i);
            rr(slotX(i), SLOT_TOP, SLOT_W, SLOT_BOT - SLOT_TOP, 8);
            ctx.fillStyle = id ? 'rgba(20,34,54,.9)' : (hot ? 'rgba(56,189,248,.18)' : 'rgba(14,24,40,.9)');
            ctx.fill();
            ctx.lineWidth = hot ? 2.5 : 1.5;
            ctx.strokeStyle = hot ? C.acc : (id ? 'rgba(150,190,220,.75)' : 'rgba(120,160,200,.55)');
            ctx.stroke();

            // Mode Mudah: Tampilkan target nama warna di tiap slot
            if (!id && lv.modeMudah && ordering) {
                const parts = LOKAL[targetStd[i]];
                const y0 = (SLOT_TOP + SLOT_BOT) / 2 - (parts.length - 1) * 6 + 3;
                parts.forEach(function (w2, k) {
                    txt(w2, slotCX(i), y0 + k * 12, { s: 10, a: 'center', c: 'rgba(253,224,71,.92)', w: 700 });
                });
            }
        }

        // Garis potong rata ujung
        const isTrimStep = curStep().id === 'trim_a' || curStep().id === 'trim_b';
        if (isTrimStep || (lv.anim && lv.anim.type === 'trim')) {
            ctx.save();
            ctx.setLineDash([9, 7]); ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(251,191,36,.95)';
            ctx.beginPath(); ctx.moveTo(BAND.x + 2, CUT_Y); ctx.lineTo(BAND.x + BAND.w - 2, CUT_Y); ctx.stroke();
            ctx.setLineDash([]);
            [BAND.x + 2, BAND.x + BAND.w - 2].forEach(function (ax) {
                ctx.beginPath(); ctx.moveTo(ax, CUT_Y - 7); ctx.lineTo(ax, CUT_Y + 7); ctx.stroke();
            });
            ctx.restore();
        }
    }

    /* Baris nomor pin 1-8 DI ATAS slot */
    function l3BandaPin() {
        if (!curStripped()) return;
        const isOrderStep = curStep().id === 'order_a' || curStep().id === 'order_b';
        const slots = curSlots();
        const ordering = isOrderStep && !slots.every(Boolean);

        rr(BAND.x, BAND.y, BAND.w, BAND.h, 6);
        ctx.fillStyle = 'rgba(4,10,20,.95)'; ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(125,165,205,.6)'; ctx.stroke();
        ctx.strokeStyle = 'rgba(125,165,205,.35)'; ctx.lineWidth = 1;
        for (let i = 1; i < 8; i++) {
            const tx = slotX(i) - SLOT_GAP / 2;
            ctx.beginPath(); ctx.moveTo(tx, BAND.y + 4); ctx.lineTo(tx, BAND.y + BAND.h - 4); ctx.stroke();
        }
        for (let i = 0; i < 8; i++) {
            const hot = ordering && !slots[i] && l3SlotHover(i);
            txt(i + 1, slotCX(i), BAND.y + 15, {
                s: 14, a: 'center',
                c: hot ? C.acc : '#eaf2fb', w: 800
            });
        }
    }

    /* Konektor RJ-45 */
    function l3Konektor(now) {
        if (!curConn()) return;
        const k = easeOut(l3AnimP(now, 'conn'));
        ctx.save();
        ctx.translate(0, lerp(-180, 0, k));
        const crimped = curCrimped();
        const crimpP = lv.anim && lv.anim.type === 'crimp' ? l3AnimP(now, 'crimp') : (crimped ? 1 : 0);
        if (crimpP > .2) {
            ctx.save();
            ctx.globalAlpha = Math.min(.30, (crimpP - .2) * .30);
            const rg = ctx.createRadialGradient(CX, 170, 10, CX, 170, 190);
            rg.addColorStop(0, '#ffe9a8'); rg.addColorStop(1, 'rgba(255,233,168,0)');
            ctx.fillStyle = rg; ctx.fillRect(CONN.x - 60, 70, CONN.w + 120, CONN.h + 80);
            ctx.restore();
        }
        rr(CONN.x, CONN.y, CONN.w, CONN.h, 16);
        ctx.fillStyle = 'rgba(196,224,242,.32)'; ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = crimped ? '#4a9fd0' : '#7fb4d6'; ctx.stroke();
        rr(CONN.x + 12, SLOT_TOP - 8, CONN.w - 24, (SLOT_BOT + 16) - (SLOT_TOP - 8), 10);
        ctx.fillStyle = 'rgba(232,246,255,.26)'; ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(150,190,215,.75)'; ctx.stroke();

        const slots = curSlots();
        for (let i = 0; i < 8; i++) {
            if (!slots[i]) continue;
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

        rr(CONN.x + 12, CONN.y + CONN.h - 30, 84, 19, 6);
        ctx.fillStyle = 'rgba(4,12,22,.85)'; ctx.fill();
        txt('RJ-45 (' + (KAB.end === 0 ? 'A' : 'B') + ')', CONN.x + 54, CONN.y + CONN.h - 16, { s: 11, a: 'center', c: '#cfe8f7', w: 800 });
        lock(CONN.x + CONN.w - 152, CONN.y + CONN.h - 12, .4);
        txt(crimped ? 'TERKUNCI' : 'BELUM DI-CRIMP', CONN.x + CONN.w - 134, CONN.y + CONN.h - 5,
            { s: 11.5, c: crimped ? '#4ade80' : C.warn, w: 800 });
        ctx.restore();
    }

    /* Animasi alat (sprite gerak) */
    function l3AlatAnim(now) {
        const a = lv.anim;
        if (!a) return;
        if (a.type === 'strip') {
            const p = l3AnimP(now, 'strip');
            const dip = p < .30 ? 0 : p < .46 ? easeOut((p - .30) / .16) : p < .62 ? 1 - easeOut((p - .46) / .16) : 0;
            const x = lerp(170, 292, easeOut(clamp(p / .28, 0, 1)));
            const rot = p < .28 ? lerp(-.9, .10, easeOut(p / .28)) : lerp(.10, .04, dip * .3);
            ctx.save(); ctx.globalAlpha = .96;
            drawSprite('strip', x + dip * 6, 424 + dip * 14, 210, rot);
            ctx.restore();
            if (p > .20 && p < .40) {
                ctx.save(); ctx.globalAlpha = (p - .20) / .20 * .5;
                ctx.fillStyle = '#fffbe6'; ctx.fillRect(CX - 6, WIRE_B - 40, 12, 58); ctx.restore();
            }
        }
        if (a.type === 'trim') {
            const p = l3AnimP(now, 'trim');
            const close = p < .30 ? 0 : p < .46 ? easeOut((p - .30) / .16) : p < .70 ? 1 : Math.max(0, 1 - (p - .70) / .18);
            const x = lerp(210, 402, easeOut(clamp(p / .30, 0, 1)));
            ctx.save(); ctx.globalAlpha = .96;
            drawSprite('gunting', x, CUT_Y + 4 + close * 10, 230,
                lerp(-.8, -.06, easeOut(clamp(p / .30, 0, 1))) + close * .05);
            ctx.restore();
            if (close > .5) {
                ctx.save();
                ctx.globalAlpha = (close - .5) * 1.4;
                const slots = curSlots();
                const loose = curLoose();
                for (let i = 0; i < 8; i++) {
                    const q = (close - .5) * 86 + (i % 3) * 6;
                    ctx.fillStyle = WC[slots[i] || loose[i]].c;
                    ctx.fillRect(slotCX(i) - 7 + (i % 2 ? 3 : -3), CUT_Y + q, 14, 7);
                }
                ctx.restore();
            }
        }
        if (a.type === 'crimp') {
            const p = l3AnimP(now, 'crimp');
            let y, sq = 0;
            if (p < .22) {
                y = lerp(-120, 108, easeOut(p / .22));
            } else if (p < .40) {
                const u = (p - .22) / .18;
                y = lerp(108, 132, easeOut(u)); sq = u;
            } else if (p < .62) {
                y = 132 + Math.sin(now / 26) * 2.2; sq = 1;
            } else if (p < .80) {
                const u = (p - .62) / .18;
                y = lerp(132, 108, easeOut(u)); sq = 1 - u;
            } else {
                y = lerp(108, -120, easeOut((p - .80) / .20));
            }
            ctx.save(); ctx.globalAlpha = .97;
            ctx.translate(CX, y); ctx.scale(1, 1 - 0.15 * sq);
            drawCrimpTool(0, 0, 1, sq, 0);              // gagang menutup & rahang menekan
            ctx.restore();
            if (p > .42 && p < .66) {
                ctx.save(); ctx.globalAlpha = .6;
                rr(CONN.x, CONN.y, CONN.w, CONN.h, 16);
                ctx.lineWidth = 3; ctx.strokeStyle = '#ffe9a8'; ctx.stroke();
                ctx.restore();
            }
        }
    }

    /* Banner Misi Permanen */
    function l3DrawMisi() {
        rr(AX + 10, AY + 4, AW - 20, MISI_H, 6);
        ctx.fillStyle = 'rgba(14,28,48,.92)'; ctx.fill();
        ctx.strokeStyle = 'rgba(56,189,248,.5)'; ctx.lineWidth = 1; ctx.stroke();
        txt('Misi: Buat kabel LAN crossover untuk menghubungkan dua PC secara langsung (tanpa switch).',
            CX, AY + 17, { s: 11.5, a: 'center', c: '#e0f2fe', w: 800 });
    }

    /* Area Kerja */
    function l3DrawAreaKerja(now) {
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

        const cabTop = l3CableTop(now);
        l3UpdateTips(now);
        l3Tangan(now);         // 0) animasi pakai sarung tangan (hanya saat lv.anim 'glove') paling belakang
        l3KotakPin(now);
        l3Konduktor(now);
        l3Jaket(now, cabTop);
        l3Konektor(now);
        l3BandaPin();
        l3AlatAnim(now);
        l3LabelWadah();
        l3DrawMisi();
        ctx.restore();

        rr(AX, AY, AW, AH, 14);
        ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(125,170,215,.55)'; ctx.setLineDash([8, 6]); ctx.stroke();
        ctx.setLineDash([]);
    }

    /* Strip Atas */
    function l3DrawStripAtas() {
        ctx.fillStyle = '#0a1524'; ctx.fillRect(0, 54, W, 30);
        ctx.fillStyle = C.line; ctx.fillRect(0, 83, W, 1);
        btn(10, 57, 128, 26, 'Langkah-langkah', () => { lv.modal = lv.modal === 'steps' ? null : 'steps'; },
            { color: lv.modal === 'steps' ? C.acc : '#334155', tc: lv.modal === 'steps' ? '#06131f' : C.text, s: 12 });
        btn(144, 57, 128, 26, 'Bantuan Kabel', () => l3OpenHelp(),
            { color: lv.modal === 'help' ? C.acc : '#334155', tc: lv.modal === 'help' ? '#06131f' : C.text, s: 12 });
        btn(278, 57, 122, 26, 'Mode mudah: ' + (lv.modeMudah ? 'ON' : 'OFF'), () => {
            lv.modeMudah = !lv.modeMudah; save.l2.mudah = lv.modeMudah; persist();
            l3Andi(lv.modeMudah ? 'Mode mudah aktif: target warna dan garis potong ditampilkan.' : 'Mode mudah mati.');
        }, { color: lv.modeMudah ? C.ok : '#334155', tc: lv.modeMudah ? '#04160f' : C.text, s: 11.5 });

        const nm = (nameEl.value || '(tanpa nama)').trim() || '(tanpa nama)';
        txt('Nama: ' + (nm.length > 12 ? nm.slice(0, 11) + '…' : nm), 416, 76, { s: 12, c: C.mute, w: 700 });
        txt('Waktu ' + fmt(lv.phase === 'fin' ? lv.dur : lv.elapsed()), 706, 76, { s: 12.5, a: 'right', c: C.text, w: 800 });
        txt('Terpakai: ' + KAB.usedCm + ' cm', 836, 76, { s: 12.5, a: 'right', c: C.text, w: 800 });
        txt('RJ45: ' + KAB.rj45Used, 950, 76, { s: 12.5, a: 'right', c: C.text, w: 800 });
    }

    function l3OpenHelp() {
        if (lv.modal === 'help') { lv.modal = null; return; }
        const now = performance.now();
        if (lv.helpFree > 0) {
            lv.helpFree--; KAB.helpUsed++; lv.modal = 'help';
            say('Bantuan gratis dipakai. Tabel T568A & T568B terbuka.', 'info');
        } else if (now > lv.helpUntil) {
            lv.penalize(8, 'Membuka Bantuan Kabel di luar jatah gratis (−8 poin)');
            KAB.helpUsed++; lv.modal = 'help'; lv.helpUntil = now + 1200;
        }
    }

    /* Panel Alat & Pasang */
    const TOOLS_L = [
        { id: 'sarung_tangan', name: 'Sarung Tangan', checkStep: () => lv.step === 1 },
        { id: 'strip', name: 'Pengupas Kabel', checkStep: () => lv.step === 3 || lv.step === 8 },
        { id: 'gunting', name: 'Pemotong Kabel', checkStep: () => lv.step === 2 || lv.step === 5 || lv.step === 10 }
    ];
    const TOOLS_R = [
        { id: 'rj45', name: 'Konektor RJ-45', checkStep: () => lv.step === 6 || lv.step === 11 },
        { id: 'crimp', name: 'Tang Crimping', checkStep: () => lv.step === 7 || lv.step === 12 },
        { id: 'tester', name: 'Tester LAN', checkStep: () => lv.step === 13 }
    ];

    function l3DrawPanelAlat(P, list, title) {
        rr(P.x, P.y, P.w, P.h, 14); ctx.fillStyle = 'rgba(11,21,35,.96)'; ctx.fill();
        ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.stroke();
        txt(title, P.x + P.w / 2, P.y + 24, { s: 13, a: 'center', c: C.acc, w: 800 });
        list.forEach(function (t, i) {
            const bx = P.x + 8, by = CARD.y + i * CARD.dy, bw = P.w - 16, bh = CARD.h;
            const isNext = t.checkStep();
            const act = lv.tool === t.id;
            const hov = over(bx, by, bw, bh);
            if (hov) hoverBtn = true;

            rr(bx, by, bw, bh, 12);
            ctx.fillStyle = hov ? '#2b4864' : 'rgba(23,41,63,.96)'; ctx.fill();
            ctx.lineWidth = act ? 3 : 2;
            ctx.strokeStyle = act ? '#ffffff' : C.line; ctx.stroke();

            icon(t.id, bx + 32, by + 34, .56);
            para(t.name, bx + 58, by + 30, bw - 70, 15, { s: 12, w: 800, c: C.text });

            const dx = bx + bw - 18, dy = by + 18;
            if (isNext) {
                // Titik MERAH berkedip: alat aktif saat ini
                const pulse = .55 + .45 * Math.sin(performance.now() / 220);
                ctx.save(); ctx.globalAlpha = .35 * pulse;
                ctx.beginPath(); ctx.arc(dx, dy, 15, 0, 6.3); ctx.fillStyle = C.bad; ctx.fill(); ctx.restore();
                ctx.beginPath(); ctx.arc(dx, dy, 8, 0, 6.3); ctx.fillStyle = C.bad; ctx.fill();
                ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke();
            }

            hit(bx, by, bw, bh, () => l3PakaiAlat(t));
        });
    }

    function l3PakaiAlat(t) {
        if (lv.modal || lv.anim) return;
        lv.lastAct = performance.now();
        const id = t.id;

        if (id === 'sarung_tangan') {
            if (lv.step === 1) l3ActGlove();
            else l3Flash('Sarung tangan sudah dipakai.', 'info');
        } else if (id === 'strip') {
            if (lv.step === 3 || lv.step === 8) l3ActStrip();
            else lv.penalize(2, 'Pengupas Kabel belum/bukan waktunya digunakan');
        } else if (id === 'gunting') {
            if (lv.step === 2) l3ActCut();
            else if (lv.step === 5 || lv.step === 10) l3ActTrim();
            else lv.penalize(2, 'Pemotong Kabel belum waktunya digunakan');
        } else if (id === 'rj45') {
            if (lv.step === 6 || lv.step === 11) l3ActConn();
            else lv.penalize(2, 'Konektor RJ-45 belum waktunya dipasang');
        } else if (id === 'crimp') {
            if (lv.step === 7 || lv.step === 12) l3ActCrimp();
            else lv.penalize(2, 'Tang Crimping belum waktunya digunakan');
        } else if (id === 'tester') {
            if (lv.step === 13) l3ActTester();
            else lv.penalize(2, 'Tester LAN digunakan setelah kedua ujung kabel selesai dicrimp');
        }
    }

    /* Panel Status */
    function l3DrawStatus() {
        const b = SBOX;
        rr(b.x, b.y, b.w, b.h, 12); ctx.fillStyle = 'rgba(10,19,32,.96)'; ctx.fill();
        ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.stroke();
        txt('STATUS', b.x + b.w / 2, b.y + 18, { s: 11, a: 'center', c: C.acc, w: 800 });
        const rows = [
            ['Pilih Crossover', KAB.cablePickDone],
            ['Sarung tangan', KAB.glove],
            ['Potong 150 cm', KAB.lenChosen],
            ['Ujung A T568A', KAB.slotsA.every(Boolean)],
            ['Crimp Ujung A', KAB.crimpedA],
            ['Ujung B T568B', KAB.slotsB.every(Boolean)],
            ['Crimp Ujung B', KAB.crimpedB],
            ['Lulus Tester', !!lv.test && lv.test.phase === 'ok']
        ];
        rows.forEach(function (r, i) {
            const yy = b.y + 32 + i * 12;
            ctx.beginPath(); ctx.arc(b.x + 15, yy - 3, 4, 0, 6.3);
            ctx.fillStyle = r[1] ? C.ok : '#31465e'; ctx.fill();
            if (r[1]) tickIcon(b.x + 15, yy - 3, 5, '#04160f');
            txt(r[0], b.x + 25, yy, { s: 10, c: r[1] ? C.text : C.mute, w: 700 });
        });
    }

    /* Kartu Pesan */
    function l3DrawPesan(now) {
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
        if (all.length > 7) L[6] = L[6].slice(0, 15) + '…';
        L.forEach(function (l, i) { txt(l, b.x + 14, b.y + 40 + i * 13.5, { s: 11, c: C.text, w: 700 }); });
    }

    /* Bar Pak Andi */
    function l3BarAndi(now) {
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
       MODAL & LAYAR KHUSUS
       ================================================================ */
    function l3Shade() {
        ctx.fillStyle = 'rgba(3,9,18,.9)'; ctx.fillRect(0, 54, W, H - 54);
        hit(0, 0, W, H, () => { });
    }
    function l3Panel(x, y, w, h, stroke) {
        rr(x, y, w, h, 18); ctx.fillStyle = 'rgba(12,23,39,.99)'; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = stroke || C.acc; ctx.stroke();
    }

    /* Modal Intro (Cerita Pembuka dari Andi) */
    function l3ModalIntro() {
        ctx.fillStyle = 'rgba(3,9,18,.92)'; ctx.fillRect(0, 0, W, H);
        hit(0, 0, W, H, () => { });
        const x = 110, y = 46, w = 740, h = 508;
        l3Panel(x, y, w, h, C.acc);
        txt('LEVEL 3 — Crimping Kabel LAN Crossover (T568A–T568B)', x + w / 2, y + 34,
            { s: 20, f: FONT_H, a: 'center', c: C.acc, w: 700 });

        drawAndiFace(x + 50, y + 80, 24, 'happy', 0);
        rr(x + 88, y + 60, w - 120, 80, 10); ctx.fillStyle = 'rgba(20,38,62,.9)'; ctx.fill();
        ctx.strokeStyle = 'rgba(56,189,248,.6)'; ctx.lineWidth = 1.5; ctx.stroke();
        txt('Pak Andi berkata:', x + 104, y + 80, { s: 13, f: FONT_H, c: C.warn });
        para('"Halo calon teknisi jaringan! Di lab kita ada dua komputer PC yang perlu bertukar file tugas praktikum secara langsung, tanpa perantara switch atau router. ' +
            'Untuk menghubungkan dua perangkat sejenis ini, kita harus membuat kabel LAN Crossover!"',
            x + 104, y + 98, w - 150, 16, { s: 12.5, c: C.text, w: 700 });

        txt('TUJUAN PEMBELAJARAN LEVEL 3', x + w / 2, y + 162, { s: 13, a: 'center', c: C.acc, w: 800 });
        const obj = [
            '1. Memahami perbedaan fungsi kabel Straight-Through vs Crossover.',
            '2. Menguasai pembuatan Ujung A (T568A) dan Ujung B (T568B).',
            '3. Memahami pertukaran jalur transmit dan receive pada pin 1↔3 dan 2↔6.',
            '4. Mampu membaca dan mendiagnosis pola nyala LAN Tester untuk kabel crossover.'
        ];
        obj.forEach((o, i) => {
            txt(o, x + 40, y + 188 + i * 22, { s: 12.5, c: C.text, w: 700 });
        });

        rr(x + 36, y + 288, w - 72, 126, 12); ctx.fillStyle = 'rgba(245,158,11,.1)'; ctx.fill();
        ctx.strokeStyle = 'rgba(245,158,11,.5)'; ctx.lineWidth = 1.5; ctx.stroke();
        txt('INTI MATERI: PIN 1↔3 & PIN 2↔6 BERSILANGAN', x + 54, y + 312, { s: 13, c: C.warn, f: FONT_H });
        para('Pada jaringan Ethernet 10/100 Mbps, pin 1 & 2 digunakan untuk Transmit (Kirim), sedangkan pin 3 & 6 untuk Receive (Terima). ' +
            'Kabel crossover menyilangkan pin 1 ke 3 dan 2 ke 6, sehingga sinyal kirim PC 1 langsung diterima oleh PC 2 tanpa tabrakan!',
            x + 54, y + 332, w - 108, 17, { s: 12, c: C.text, w: 600 });
        para('Perangkat modern kini memiliki Auto MDI-X yang mendeteksi jalur otomatis, tetapi kemampuan membuat crossover tetap standar kompetensi mutlak teknisi TKJ.',
            x + 54, y + 382, w - 108, 16, { s: 11.5, c: C.mute, w: 600 });

        btn(x + w / 2 - 140, y + 438, 280, 46, 'MULAI MISI CROSSOVER ▸', () => {
            lv.phase = 'play';
            lv.t0 = performance.now();
            lv.lastAct = performance.now();
            lv.modal = 'pick'; // Mulai dari langkah 0: pilih kabel
            l3Andi(HINT.pick);
        }, { color: C.ok, s: 16 });
    }

    /* Modal Langkah 0: Pilih Jenis Kabel */
    function l3ModalPilihKabel() {
        l3Shade();
        const x = 140, y = 72, w = 680, h = 440;
        l3Panel(x, y, w, h, C.acc);
        txt('LANGKAH 0 — PILIH JENIS KABEL', x + w / 2, y + 34, { s: 19, f: FONT_H, a: 'center', c: C.acc, w: 600 });
        para('Dua unit komputer PC di laboratorium TKJ ingin dihubungkan secara langsung tanpa melalui switch/hub. ' +
            'Kabel jaringan apa yang paling tepat untuk kebutuhan ini?',
            x + w / 2, y + 62, w - 80, 18, { s: 13.5, a: 'center', c: C.text, w: 700 });

        const opsi = [
            { t: 'A. Kabel Straight-Through', d: 'Kedua ujung memakai urutan standar yang sama (T568B - T568B)' },
            { t: 'B. Kabel Crossover', d: 'Satu ujung memakai T568A dan ujung lainnya memakai T568B' },
            { t: 'C. Kabel Rollover', d: 'Urutan pin terbalik total 1 sampai 8, untuk port konsol router' },
            { t: 'D. Kabel Coaxial Thinnet', d: 'Kabel tembaga tunggal dengan konektor BNC lama' }
        ];

        opsi.forEach((o, i) => {
            const by = y + 116 + i * 64;
            const hov = over(x + 40, by, w - 80, 54);
            if (hov) hoverBtn = true;
            rr(x + 40, by, w - 80, 54, 10);
            ctx.fillStyle = hov ? '#25405f' : 'rgba(18,32,50,.9)'; ctx.fill();
            ctx.strokeStyle = hov ? C.acc : 'rgba(80,120,165,.5)'; ctx.lineWidth = 1.5; ctx.stroke();
            txt(o.t, x + 60, by + 22, { s: 14, f: FONT_H, c: C.text });
            txt(o.d, x + 60, by + 40, { s: 11.5, c: C.mute });
            hit(x + 40, by, w - 80, 54, () => l3PilihKabel(i));
        });

        para('Pilihlah dengan cermat. Jawaban yang salah akan mengurangi skor dan mendapatkan penjelasan edukatif.',
            x + w / 2, y + h - 22, w - 60, 14, { s: 11, a: 'center', c: C.warn, w: 700 });
    }

    /* Modal Langkah-langkah */
    function l3ModalLangkah() {
        l3Shade();
        const x = 160, y = 56, w = 640, h = 480;
        l3Panel(x, y, w, h);
        txt('Alur Langkah Pengerjaan Kabel Crossover', x + w / 2, y + 32, { s: 19, f: FONT_H, a: 'center', c: C.acc, w: 600 });
        STEPS.forEach(function (s, i) {
            const yy = y + 64 + i * 26, done = i < lv.step, cur = i === lv.step;
            if (cur) {
                rr(x + 22, yy - 14, w - 44, 22, 6);
                ctx.fillStyle = 'rgba(56,189,248,.18)'; ctx.fill();
            }
            ctx.beginPath(); ctx.arc(x + 40, yy - 3, 7, 0, 6.3);
            ctx.fillStyle = done ? C.ok : (cur ? C.bad : '#22344a'); ctx.fill();
            if (done) tickIcon(x + 40, yy - 3, 8, '#04160f');
            else txt(i, x + 40, yy + 1, { s: 9, a: 'center', c: cur ? '#fff' : '#5f7389', w: 800 });
            txt(s.label, x + 60, yy + 1, { s: 11.5, w: cur ? 800 : 600, c: done ? C.ok : (cur ? C.text : C.mute) });
            if (s.tool) icon(s.tool, x + w - 36, yy - 3, .25);
        });
        btn(x + w / 2 - 70, y + h - 42, 140, 32, 'Tutup', () => { lv.modal = null; }, { color: '#334155', tc: C.text, s: 13 });
    }

    /* Modal Bantuan Kabel (T568A & T568B Berdampingan) */
    function l3Sampel(x, y, w, h, id) {
        const d = WC[id], st = !!d.st;
        rr(x, y, w, h, 4); ctx.fillStyle = st ? '#f6efe0' : d.c; ctx.fill();
        if (st) {
            ctx.save(); rr(x, y, w, h, 4); ctx.clip();
            ctx.strokeStyle = d.c; ctx.lineWidth = Math.max(3, h * 0.4);
            ctx.beginPath();
            for (let k = -h; k < w + h; k += 12) {
                ctx.moveTo(x + k, y + h + 2); ctx.lineTo(x + k + h + 2, y - 2);
            }
            ctx.stroke(); ctx.restore();
        }
        rr(x, y, w, h, 4); ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(6,10,18,.85)'; ctx.stroke();
    }

    function l3ModalBantuan() {
        l3Shade();
        const x = 100, y = 52, w = 760, h = 496;
        l3Panel(x, y, w, h, C.warn);
        txt('Bantuan Kabel — Standar T568A (Ujung A) & T568B (Ujung B)', x + w / 2, y + 32,
            { s: 18, f: FONT_H, a: 'center', c: C.warn, w: 700 });

        [
            { t: 'UJUNG A: Standar T568A', arr: STD_A, cx: x + 34, tag: 'Dimulai Putih-Hijau' },
            { t: 'UJUNG B: Standar T568B', arr: STD_B, cx: x + 404, tag: 'Dimulai Putih-Oranye' }
        ].forEach(function (col) {
            txt(col.t, col.cx + 90, y + 62, { s: 14, f: FONT_H, a: 'center', c: C.acc, w: 600 });
            txt(col.tag, col.cx + 90, y + 78, { s: 11, a: 'center', c: C.mute });
            col.arr.forEach(function (id, i) {
                const yy = y + 92 + i * 22;
                const isCross = (i === 0 || i === 1 || i === 2 || i === 5);
                if (isCross) {
                    rr(col.cx - 6, yy, 320, 20, 4);
                    ctx.fillStyle = 'rgba(245,158,11,.15)'; ctx.fill();
                }
                txt(i + 1, col.cx, yy + 13, { s: 11, c: isCross ? C.warn : C.mute, w: 800 });
                l3Sampel(col.cx + 16, yy + 2, 48, 14, id);
                txt(WC[id].n, col.cx + 72, yy + 13, { s: 11.5, w: 700, c: isCross ? '#fef08a' : C.text });
                if (isCross) {
                    const swapWith = i === 0 ? '➔ Pin 3' : i === 1 ? '➔ Pin 6' : i === 2 ? '➔ Pin 1' : '➔ Pin 2';
                    txt(swapWith, col.cx + 260, yy + 13, { s: 10.5, c: C.warn, w: 700 });
                }
            });
        });

        rr(x + 34, y + 280, w - 68, 140, 10); ctx.fillStyle = 'rgba(14,24,38,.9)'; ctx.fill();
        ctx.strokeStyle = 'rgba(56,189,248,.35)'; ctx.lineWidth = 1; ctx.stroke();
        txt('KUNCI MEMBACA KABEL CROSSOVER', x + 50, y + 302, { s: 12, c: C.acc, f: FONT_H });
        para('• Pin 1 Ujung A (Putih-Hijau) ↔ Pin 3 Ujung B (Putih-Hijau)\n' +
            '• Pin 2 Ujung A (Hijau) ↔ Pin 6 Ujung B (Hijau)\n' +
            '• Pin 3 Ujung A (Putih-Oranye) ↔ Pin 1 Ujung B (Putih-Oranye)\n' +
            '• Pin 6 Ujung A (Oranye) ↔ Pin 2 Ujung B (Oranye)\n' +
            '• Pin 4 (Biru), 5 (Putih-Biru), 7 (Putih-Coklat), 8 (Coklat) posisinya SAMA PERSIS (lurus).',
            x + 50, y + 322, w - 100, 15, { s: 11, c: C.text, w: 600 });

        btn(x + w / 2 - 70, y + h - 46, 140, 36, 'Tutup', () => { lv.modal = null; }, { color: '#334155', tc: C.text, s: 14 });
    }

    /* Modal Panjang Kabel */
    function l3ModalPanjang() {
        l3Shade();
        const w = 440, h = 210, x = CX - w / 2, y = 170;
        l3Panel(x, y, w, h, C.acc);
        txt('Potong Panjang Kabel Crossover', x + w / 2, y + 32, { s: 16, f: FONT_H, a: 'center', c: C.acc, w: 600 });
        txt('Jarak antar meja 2 PC di lab komputer: ' + NEED_CM + ' cm', x + w / 2, y + 58, { s: 13, a: 'center', c: C.warn, w: 700 });
        LEN_OPS.forEach(function (cm, i) {
            btn(x + 24 + i * 132, y + 80, 116, 52, cm + ' cm', () => l3ChooseLen(cm),
                { color: cm === NEED_CM ? C.ok : '#334155', tc: cm === NEED_CM ? '#04160f' : C.text, s: 16 });
        });
        para('Pilihlah panjang yang paling efisien agar kabel rapi dan bahan tidak terbuang sia-sia.',
            x + w / 2, y + 160, w - 56, 16, { s: 11, a: 'center', c: C.mute, w: 600 });
    }

    /* Modal LAN Tester Crossover (Master & Remote) */
    function l3ModalTester(now) {
        l3Shade();
        const t = lv.test || { phase: 'siap', res: [] };
        const w = 680, h = 440, x = CX - w / 2, y = 90;
        const stroke = t.phase === 'ok' ? C.ok : (t.phase === 'fail' ? C.bad : C.acc);
        l3Panel(x, y, w, h, stroke);

        txt('LAN TESTER — PENGUJIAN KABEL CROSSOVER', x + w / 2, y + 34,
            { s: 18, f: FONT_H, a: 'center', c: t.phase === 'ok' ? C.ok : C.acc, w: 600 });

        const el = t.phase === 'run' ? (now - t.t0) / 1000 : (t.phase === 'ok' || t.phase === 'fail' ? 99 : 0);
        const curPinActive = Math.min(8, Math.floor(el / 0.45)); // Pin 1..8

        // Box Master (Kiri, Ujung A)
        const mx = x + 34, my = y + 56, bw = 280, bh = 240;
        rr(mx, my, bw, bh, 12); ctx.fillStyle = 'rgba(8,20,34,.95)'; ctx.fill();
        ctx.strokeStyle = '#2b4360'; ctx.lineWidth = 1.5; ctx.stroke();
        txt('MASTER (Ujung A — T568A)', mx + bw / 2, my + 24, { s: 12.5, f: FONT_H, a: 'center', c: '#7dd3fc' });

        // Box Remote (Kanan, Ujung B)
        const rx = x + w - 34 - bw, ry = my;
        rr(rx, ry, bw, bh, 12); ctx.fillStyle = 'rgba(8,20,34,.95)'; ctx.fill();
        ctx.strokeStyle = '#2b4360'; ctx.lineWidth = 1.5; ctx.stroke();
        txt('REMOTE (Ujung B — T568B)', rx + bw / 2, ry + 24, { s: 12.5, f: FONT_H, a: 'center', c: '#7dd3fc' });

        // Gambar 8 LED di Master dan Remote
        for (let i = 0; i < 8; i++) {
            const masterLit = (t.phase === 'run' && curPinActive === (i + 1)) || (t.phase === 'ok') || (t.phase === 'fail');
            const targetRemotePin = CROSS_MAP[i]; // 1-indexed nomor pin remote yang harus menyala
            const remoteLit = masterLit;

            // Koordinat LED Master
            const mly = my + 54 + i * 22;
            ctx.beginPath(); ctx.arc(mx + 30, mly, 7, 0, 6.3);
            ctx.fillStyle = masterLit ? C.ok : '#1d2a3d'; ctx.fill();
            if (masterLit) {
                ctx.save(); ctx.shadowColor = C.ok; ctx.shadowBlur = 10; ctx.fill(); ctx.restore();
            }
            txt('Pin ' + (i + 1), mx + 46, mly + 4, { s: 11, c: masterLit ? '#fff' : C.mute });
            txt(WC[STD_A[i]].n, mx + 110, mly + 4, { s: 10, c: C.mute });

            // Koordinat LED Remote
            const rly = ry + 54 + i * 22;
            const isTargetStepActive = (t.phase === 'run' && curPinActive === (i + 1));
            const remoteColor = (t.phase === 'fail' && t.reason === 'straight') ? C.warn : C.ok;
            ctx.beginPath(); ctx.arc(rx + 30, rly, 7, 0, 6.3);
            ctx.fillStyle = remoteLit ? remoteColor : '#1d2a3d'; ctx.fill();
            if (remoteLit) {
                ctx.save(); ctx.shadowColor = remoteColor; ctx.shadowBlur = 10; ctx.fill(); ctx.restore();
            }
            txt('Pin ' + (i + 1), rx + 46, rly + 4, { s: 11, c: remoteLit ? '#fff' : C.mute });
            txt(WC[STD_B[i]].n, rx + 110, rly + 4, { s: 10, c: C.mute });

            // Garis Sinyal Meluncur antar Master & Remote saat aktif
            if (isTargetStepActive) {
                const remIdx = targetRemotePin - 1;
                const remY = ry + 54 + remIdx * 22;
                ctx.save();
                ctx.strokeStyle = 'rgba(74,222,128,.8)'; ctx.lineWidth = 2.5; ctx.setLineDash([6, 4]);
                ctx.beginPath();
                ctx.moveTo(mx + bw - 10, mly);
                ctx.lineTo(rx + 10, remY);
                ctx.stroke();
                ctx.restore();

                // Highlight teks pemetaan silang di tengah
                txt('Sinyal: Master ' + (i + 1) + ' ➔ Remote ' + targetRemotePin, x + w / 2, y + 170,
                    { s: 12, a: 'center', c: C.warn, f: FONT_H });
            }
        }

        // Status Diagnosis Box
        rr(x + 34, y + bh + 66, w - 68, 52, 10);
        let statCol = C.mute, statTitle = 'SIAP PENGUJIAN', statDesc = 'Tekan JALANKAN untuk menguji sinyal 8 pin.';
        if (t.phase === 'run') {
            statCol = C.acc; statTitle = 'SEDANG MENGETES PIN...';
            statDesc = 'Mengirim pulsa sinyal berurutan dari Master pin 1 ke Remote pin 8.';
        } else if (t.phase === 'ok') {
            statCol = C.ok; statTitle = 'LULUS: KABEL CROSSOVER SEMPURNA';
            statDesc = 'Pola silang terverifikasi: 1➔3, 2➔6, 3➔1, 4➔4, 5➔5, 6➔2, 7➔7, 8➔8. Semua pin cocok!';
        } else if (t.phase === 'fail') {
            statCol = C.bad; statTitle = 'GAGAL: ' + (t.reason === 'straight' ? 'POLA STRAIGHT-THROUGH' : 'URUTAN PIN SALAH');
            statDesc = t.badDesc || 'Urutan pin tidak sesuai standar crossover.';
        }
        ctx.fillStyle = 'rgba(4,12,22,.95)'; ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = statCol; ctx.stroke();
        txt(statTitle, x + w / 2, y + bh + 86, { s: 13, f: FONT_H, a: 'center', c: statCol, w: 800 });
        para(statDesc, x + w / 2, y + bh + 102, w - 90, 14, { s: 11, a: 'center', c: C.text, w: 700 });

        // Tombol Aksi
        const bw2 = 160, by2 = y + h - 46;
        btn(x + 34, by2, bw2, 38, 'Tutup', () => { lv.modal = null; lv.test = null; }, { color: '#334155', tc: C.text, s: 13.5 });

        if (t.phase === 'fail') {
            btn(x + w / 2 - bw2 / 2, by2, bw2, 38, 'Potong & Ulang', () => l3ResetUjungSalah(), { color: C.bad, s: 13.5 });
        } else {
            btn(x + w / 2 - bw2 / 2, by2, bw2, 38, 'JALANKAN', () => l3JalankanTes(),
                { color: C.acc, s: 13.5, disabled: t.phase === 'run' });
        }

        btn(x + w - 34 - bw2, by2, bw2, 38, 'Uji Sambungan PC ▸', () => {
            if (t.phase !== 'ok') return;
            lv.modal = 'pc'; // Masuk ke adegan penutup PC ke PC
            l3Andi('Luar biasa! Sekarang lihat bagaimana kabel crossover ini bekerja pada dua PC di laboratorium.');
        }, { color: C.ok, s: 13, disabled: t.phase !== 'ok' });
    }

    /* Modal Langkah 14: Adegan Penutup (PC ke PC Langsung) */
    function l3ModalPC(now) {
        l3Shade();
        const x = 100, y = 48, w = 760, h = 504;
        l3Panel(x, y, w, h, C.ok);
        txt('SIMULASI SAMBUNGAN: DUA PC TERHUBUNG LANGSUNG', x + w / 2, y + 32,
            { s: 19, f: FONT_H, a: 'center', c: C.ok, w: 700 });

        // Area Simulasi Komputer Lab
        const sy = y + 52, sw = w - 60, sh = 200, sx = x + 30;
        rr(sx, sy, sw, sh, 12); ctx.fillStyle = '#061320'; ctx.fill();
        ctx.strokeStyle = '#1e3a5f'; ctx.lineWidth = 1.5; ctx.stroke();

        // PC 1 (Kiri)
        const pc1X = sx + 80, pcY = sy + 30;
        // Monitor
        rr(pc1X - 40, pcY, 80, 56, 6); ctx.fillStyle = '#1e293b'; ctx.fill();
        ctx.strokeStyle = '#475569'; ctx.lineWidth = 2; ctx.stroke();
        rr(pc1X - 35, pcY + 5, 70, 46, 4); ctx.fillStyle = '#0284c7'; ctx.fill();
        txt('PC 1 (LAB)', pc1X, pcY + 32, { s: 11, f: FONT_H, a: 'center', c: '#fff' });
        // Kaki monitor
        ctx.fillStyle = '#334155'; ctx.fillRect(pc1X - 6, pcY + 56, 12, 14);
        ctx.fillRect(pc1X - 20, pcY + 70, 40, 6);
        // Tower CPU
        rr(pc1X + 50, pcY + 10, 40, 72, 6); ctx.fillStyle = '#0f172a'; ctx.fill();
        ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.5; ctx.stroke();
        // Port NIC & LED Link PC 1
        ctx.fillStyle = '#38bdf8'; ctx.fillRect(pc1X + 80, pcY + 52, 10, 14);
        const blink = Math.sin(now / 150) > 0;
        ctx.beginPath(); ctx.arc(pc1X + 85, pcY + 44, 4, 0, 6.3);
        ctx.fillStyle = blink ? '#4ade80' : '#14532d'; ctx.fill();

        // PC 2 (Kanan)
        const pc2X = sx + sw - 120;
        // Tower CPU
        rr(pc2X - 90, pcY + 10, 40, 72, 6); ctx.fillStyle = '#0f172a'; ctx.fill();
        ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.5; ctx.stroke();
        // Port NIC & LED Link PC 2
        ctx.fillStyle = '#38bdf8'; ctx.fillRect(pc2X - 90, pcY + 52, 10, 14);
        ctx.beginPath(); ctx.arc(pc2X - 85, pcY + 44, 4, 0, 6.3);
        ctx.fillStyle = blink ? '#4ade80' : '#14532d'; ctx.fill();
        // Monitor
        rr(pc2X - 40, pcY, 80, 56, 6); ctx.fillStyle = '#1e293b'; ctx.fill();
        ctx.strokeStyle = '#475569'; ctx.lineWidth = 2; ctx.stroke();
        rr(pc2X - 35, pcY + 5, 70, 46, 4); ctx.fillStyle = '#0284c7'; ctx.fill();
        txt('PC 2 (LAB)', pc2X, pcY + 32, { s: 11, f: FONT_H, a: 'center', c: '#fff' });
        // Kaki monitor
        ctx.fillStyle = '#334155'; ctx.fillRect(pc2X - 6, pcY + 56, 12, 14);
        ctx.fillRect(pc2X - 20, pcY + 70, 40, 6);

        // Kabel Crossover yang Menghubungkan PC 1 ke PC 2
        const kx1 = pc1X + 90, ky1 = pcY + 60;
        const kx2 = pc2X - 90, ky2 = pcY + 60;
        ctx.save();
        ctx.strokeStyle = '#64748b'; ctx.lineWidth = 6; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(kx1, ky1);
        ctx.bezierCurveTo(kx1 + 60, ky1 + 60, kx2 - 60, ky2 + 60, kx2, ky2);
        ctx.stroke();
        ctx.restore();

        // Animasi Paket Data / File Berbagi yang Meluncur Antar PC
        const flowP = (now / 1800) % 1;
        const fx = lerp(kx1 + 30, kx2 - 30, flowP);
        const fy = ky1 + Math.sin(flowP * Math.PI) * 44;
        rr(fx - 24, fy - 14, 48, 22, 6); ctx.fillStyle = 'rgba(245,158,11,.95)'; ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
        txt('📄 File.iso', fx, fy + 2, { s: 9.5, a: 'center', c: '#000', f: FONT_H });

        // Teks Status Link
        txt('Link Gigabit Ethernet: 1000 Mbps Terhubung Penuh (Full-Duplex)', sx + sw / 2, sy + sh - 18,
            { s: 11.5, a: 'center', c: '#4ade80', f: FONT_H });

        // Kotak Penjelasan Edukatif Pak Andi
        rr(x + 30, y + 264, w - 60, 176, 12); ctx.fillStyle = 'rgba(14,28,48,.95)'; ctx.fill();
        ctx.strokeStyle = 'rgba(56,189,248,.4)'; ctx.lineWidth = 1.5; ctx.stroke();
        txt('PENJELASAN TEKNIS DARI PAK ANDI', x + 50, y + 288, { s: 12.5, c: C.warn, f: FONT_H });
        para('1. PC 1 mengirim data lewat Pin 1 & 2 (TX). Berkat kabel crossover, data ini langsung masuk ke Pin 3 & 6 PC 2 (RX).\n' +
            '2. Sebaliknya, saat PC 2 mengirim data lewat Pin 1 & 2 (TX), data diterima dengan tepat oleh Pin 3 & 6 PC 1 (RX).\n' +
            '3. Inilah sebabnya dua komputer sejenis dapat saling berkirim file secara langsung tanpa memerlukan switch jaringan!\n' +
            '4. Catatan penting: Perangkat jaringan modern memiliki teknologi Auto MDI-X yang dapat membalik sinyal secara otomatis, tetapi memahami kabel crossover adalah kompetensi fundamental teknisi jaringan!',
            x + 50, y + 308, w - 100, 16.5, { s: 11.5, c: C.text, w: 600 });

        btn(x + w / 2 - 140, y + h - 52, 280, 42, 'Lanjut ke Kuis & Rapor ▸', () => {
            lv.modal = null;
            lv.phase = 'quiz';
            say('Kuis pemahaman crossover: jawab 4 pertanyaan dengan teliti!', 'info');
        }, { color: C.ok, s: 14.5 });
    }

    /* Modal Langkah 15: Rapor Pemahaman Crossover */
    function l3ModalRapor() {
        l3Shade();
        const x = 90, y = 46, w = 780, h = 508;
        l3Panel(x, y, w, h, C.ok);
        txt('RAPOR PEMAHAMAN — KABEL LAN CROSSOVER', x + w / 2, y + 32,
            { s: 19, f: FONT_H, a: 'center', c: C.ok, w: 700 });

        // Tabel Komparasi Pinout T568A vs T568B dengan Sorotan Silang
        const ty = y + 54;
        rr(x + 24, ty, w - 48, 170, 10); ctx.fillStyle = 'rgba(8,20,34,.9)'; ctx.fill();
        ctx.strokeStyle = 'rgba(74,222,128,.5)'; ctx.lineWidth = 1.5; ctx.stroke();
        txt('Tabel Komparasi Pinout: Pin 1↔3 dan Pin 2↔6 Saling Bertukar', x + 40, ty + 20,
            { s: 12, c: C.warn, f: FONT_H });

        // Baris Pin
        const colW = (w - 100) / 8;
        for (let i = 0; i < 8; i++) {
            const px = x + 40 + i * colW;
            const isSwapped = (i === 0 || i === 1 || i === 2 || i === 5);

            rr(px, ty + 32, colW - 6, 126, 6);
            ctx.fillStyle = isSwapped ? 'rgba(245,158,11,.15)' : 'rgba(255,255,255,.03)'; ctx.fill();
            ctx.strokeStyle = isSwapped ? C.warn : 'rgba(80,120,165,.3)'; ctx.lineWidth = 1; ctx.stroke();

            txt('Pin ' + (i + 1), px + (colW - 6) / 2, ty + 46, { s: 11, f: FONT_H, a: 'center', c: isSwapped ? C.warn : C.mute });
            txt('A:', px + 6, ty + 68, { s: 10, c: C.mute });
            l3Sampel(px + 18, ty + 58, 22, 12, STD_A[i]);
            txt('B:', px + 6, ty + 96, { s: 10, c: C.mute });
            l3Sampel(px + 18, ty + 86, 22, 12, STD_B[i]);

            txt(isSwapped ? 'SILANG ⇄' : 'LURUS =', px + (colW - 6) / 2, ty + 128,
                { s: 9.5, a: 'center', c: isSwapped ? '#fef08a' : '#94a3b8', f: FONT_H });
            if (isSwapped) {
                const targetText = i === 0 ? '1➔3' : i === 1 ? '2➔6' : i === 2 ? '3➔1' : '6➔2';
                txt(targetText, px + (colW - 6) / 2, ty + 144, { s: 10, a: 'center', c: C.warn, f: FONT_H });
            }
        }

        // Catatan Evaluasi Kesalahan Siswa Sendiri
        const ey = ty + 182;
        rr(x + 24, ey, w - 48, 120, 10); ctx.fillStyle = 'rgba(14,24,38,.9)'; ctx.fill();
        ctx.strokeStyle = 'rgba(56,189,248,.3)'; ctx.lineWidth = 1; ctx.stroke();
        txt('EVALUASI PRAKTIKUM SISWA', x + 40, ey + 20, { s: 12, c: C.acc, f: FONT_H });
        if (lv.mistakes.length === 0) {
            txt('✓ Sempurna! Kamu menyelesaikan semua langkah tanpa kesalahan.', x + 40, ey + 44, { s: 12, c: C.ok });
        } else {
            const listM = lv.mistakes.slice(0, 3);
            listM.forEach((m, idx) => {
                txt('• ' + (m.length > 70 ? m.slice(0, 68) + '…' : m), x + 40, ey + 42 + idx * 18, { s: 11, c: '#fca5a5' });
            });
            if (lv.mistakes.length > 3) {
                txt('...dan ' + (lv.mistakes.length - 3) + ' catatan perbaikan lainnya.', x + 40, ey + 98, { s: 10.5, c: C.mute });
            }
        }

        // Box Jembatan ke Level 4
        const by = ey + 130;
        rr(x + 24, by, w - 48, 54, 8); ctx.fillStyle = 'rgba(56,189,248,.12)'; ctx.fill();
        ctx.strokeStyle = 'rgba(56,189,248,.5)'; ctx.lineWidth = 1; ctx.stroke();
        txt('JEMBATAN KE LEVEL 4: PATCH PANEL', x + 40, by + 18, { s: 11, c: C.acc, f: FONT_H });
        para('Setelah mahir membuat kabel Straight-Through (Level 2) dan Crossover (Level 3), ' +
            'pada Level 4 kita akan memasang kabel instalasi permanen ke Patch Panel di ruang server!',
            x + 40, by + 34, w - 80, 15, { s: 11, c: C.text, w: 700 });

        btn(x + w / 2 - 140, y + h - 50, 280, 42, 'Lihat Skor & Papan Peringkat ▸', () => {
            if (lv.finished) return;
            lv.modal = null;
            // lv.win() di fase 'fin' sudah no-op (core/13-level-core.js), jadi
            // tutup level secara eksplisit lewat endLevel() -> layar hasil &
            // papan skor. lv.dur sudah terisi oleh lv.win(2400) saat kuis tamat.
            lv.finished = true;
            endLevel(lv, true);
        }, { color: C.ok, s: 14.5 });
    }

    function l3DrawModal(now) {
        if (lv.modal === 'intro') l3ModalIntro();
        else if (lv.modal === 'pick') l3ModalPilihKabel();
        else if (lv.modal === 'steps') l3ModalLangkah();
        else if (lv.modal === 'help') l3ModalBantuan();
        else if (lv.modal === 'len') l3ModalPanjang();
        else if (lv.modal === 'pc') l3ModalPC(now);
        else if (lv.modal === 'report') l3ModalRapor();
        else if (lv.modal === 'test') {
            if (lv.test && lv.test.phase === 'run' && (now - lv.test.t0) / 1000 > 8 * 0.45 + 0.35) {
                l3SelesaiTes();
                if (lv.modal === 'test') l3ModalTester(now);
                return;
            }
            l3ModalTester(now);
        }
    }

    /* ================================================================
       KUIS KHUSUS LEVEL 3
       ================================================================ */
    function l3DrawQuiz() {
        ctx.fillStyle = 'rgba(4,10,20,.9)'; ctx.fillRect(0, 54, W, H - 54);
        const quizzes = lv.quizzes || [];
        if (lv.quizIdx >= quizzes.length) {
            // Setelah kuis selesai, buka Rapor Pemahaman Crossover sebelum layar hasil
            lv.modal = 'report';
            return;
        }
        const q = quizzes[lv.quizIdx];
        const PW = 660, PAD = 34;
        const qL = wrapLines(q.q, PW - PAD * 2, 17, 700);
        const oL = q.opts.map(function (o) { return wrapLines(o, PW - PAD * 2 - 44, 14.5, 700).slice(0, 2); });
        const oH = oL.map(function (L) { return Math.max(40, L.length * 19 + 16); });
        const h = 62 + qL.length * 24 + 22 + oH.reduce(function (a, b) { return a + b + 10; }, 0) + 14;
        const x = (W - PW) / 2;
        const y = clamp(54 + (H - 54 - h) / 2, 58, Math.max(58, H - 8 - h));
        rr(x, y, PW, h, 18); ctx.fillStyle = C.panel; ctx.fill();
        ctx.strokeStyle = C.acc; ctx.lineWidth = 2; ctx.stroke();
        txt('Kuis Level 3 — Pertanyaan ' + (lv.quizIdx + 1) + ' dari ' + quizzes.length, x + PW / 2, y + 38,
            { s: 20, f: FONT_H, c: C.acc, a: 'center', w: 600 });
        qL.forEach(function (l, i) {
            txt(l, x + PW / 2, y + 72 + i * 24, { s: 16, a: 'center', c: C.text, w: 700 });
        });
        const fin = lv.phase === 'fin';
        let oy = y + 62 + qL.length * 24 + 22;
        q.opts.forEach(function (o, i) {
            const right = i === q.ans;
            const wasWrong = lv.wrongPicks.indexOf(i) >= 0;
            const dis = fin || wasWrong;
            let color = '#2b4360', tc = C.text;
            if (wasWrong) { color = '#5b2530'; tc = '#f5b5bd'; }
            if (fin && right) { color = C.ok; tc = '#04160f'; }
            const hh = oH[i];
            rr(x + PAD, oy, PW - PAD * 2, hh, 12);
            ctx.fillStyle = dis && !right && !wasWrong ? '#22344a' : color; ctx.fill();
            ctx.lineWidth = wasWrong || (fin && right) ? 2.5 : 1.5;
            ctx.strokeStyle = wasWrong ? '#f87171' : (fin && right ? C.ok : 'rgba(120,160,200,.4)');
            ctx.stroke();
            const nL = oL[i];
            const ty0 = oy + hh / 2 - (nL.length - 1) * 9.5 + 5;
            nL.forEach(function (l, k) {
                txt(l, x + PW / 2, ty0 + k * 19, { s: 14.5, a: 'center', c: dis && !wasWrong ? '#5f7389' : tc, w: 700 });
            });
            if (wasWrong) crossIcon(x + PW - PAD - 20, oy + hh / 2, 15, '#fecaca');
            if (!dis) hit(x + PAD, oy, PW - PAD * 2, hh, function () {
                // Jangan menyetel lv.delay = 800 di sini: soal terakhir membuat
                // phase = 'fin' dan membuka layar RAPOR yang menunggu klik siswa,
                // bukan layar hasil. (Di Level 2 baris itu aman karena kuis
                // langsung berujung ke layar hasil.)
                quizPick(lv, i);
            });
            oy += hh + 10;
        });
    }

    /* ================================================================
       BRIEFING — Andi Slide System (sama seperti Level 4 & 5)
       ================================================================ */
    const BRIEF_PAGES = [
        'Selamat datang di Level 3.\n\nPada level sebelumnya kamu membuat kabel Straight-Through. Sekarang kamu akan membuat kabel Crossover.',
        'Kabel Crossover digunakan untuk menghubungkan perangkat sejenis secara langsung.',
        'Perbedaan utama kabel ini terdapat pada susunan warna kedua ujung konektor.',
        'Satu ujung menggunakan standar T568A dan ujung lainnya menggunakan T568B.',
        'Pastikan urutan warna benar sebelum melakukan crimping dan pengujian.'
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
            para('Buat kabel Crossover: susun T568A di Ujung A, T568B di Ujung B, pasang RJ-45, crimp, lalu uji.', x + 40, y + 100, w - 80, 24, { s: 16, c: C.text, w: 600 });
            btn(x + w / 2 - 145, y + h - 72, 290, 52, 'Mulai Crimping ▸', () => startPlay(), { s: 18, color: C.ok });
        }
    }

    function startPlay() {
        lv.phase = 'intro';
        lv.t0 = performance.now();
        lv.lastAct = performance.now();
    }

    /* ================================================================
       LOOP GAMBAR
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

        if (lv.phase === 'intro') { l3ModalIntro(); return; }
        hud(lv);
        if (lv.modal === 'report') {
            // Rapor Pemahaman ditahan sampai siswa menekan tombol di bawah.
            // lv.tick() dipanggil tiap frame, jadi masa tampil digeser jauh ke
            // depan selama modal terbuka (lv.delay = 800 yang lama membuat rapor
            // menutup sendiri dalam ±800 ms sebelum sempat dibaca).
            if (lv.phase === 'fin' && !lv.finished) lv.delay = 1e9;
            l3ModalRapor();
            return;
        }
        if (lv.phase === 'quiz' || lv.phase === 'fin') {
            if (lv.finished) return;
            btns.length = 0;
            l3DrawQuiz();
            return;
        }

        if (lv.limit && !lv.finished && lv.phase === 'play' && lv.elapsed() > lv.limit) {
            lv.finished = true; lv.dur = lv.limit; endLevel(lv, false); return;
        }
        if (lv.phase !== 'play') return;

        l3TickAnim(now);

        // Penjaga anti-macam: langkah "susun warna" yang slotnya sudah penuh
        // langsung dilompati. Ini terjadi setelah Ujung A diulang karena gagal
        // tester, sementara Ujung B masih utuh dari percobaan sebelumnya --
        // tanpa penjaga ini pemain terkunci di langkah 9 (kawat tak bisa
        // diklik, kartu alat hanya memberi penalti).
        if (!lv.anim) {
            const sid = curStep().id;
            if ((sid === 'order_a' || sid === 'order_b') && curSlots().every(Boolean)) l3Step();
        }

        l3DrawStripAtas();
        l3DrawPanelAlat(PL, TOOLS_L, 'ALAT (KLIK)');
        l3DrawPanelAlat(PR, TOOLS_R, 'PASANG (KLIK)');
        l3DrawStatus();
        l3DrawAreaKerja(now);
        l3DrawPesan(now);
        l3BarAndi(now);
        l3DrawModal(now);
    };

    /* ================================================================
       INPUT & INTERAKSI (SUSUN KAWAT KLIK / SERET)
       ================================================================ */
    function l3Ordering() {
        const isOrderStep = curStep().id === 'order_a' || curStep().id === 'order_b';
        return lv.phase === 'play' && !lv.modal && !lv.anim && isOrderStep && !curSlots().every(Boolean);
    }
    function l3StartDrag(id, fromSlot, x, y) {
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
        if (!l3Ordering()) return;
        const s = l3SlotAt(p);
        const slots = curSlots();
        if (s >= 0) {
            if (lv.sel) {
                if (slots[s] !== lv.sel) l3PutWire(lv.sel, s);
                lv.sel = null;
            } else if (slots[s]) {
                l3StartDrag(slots[s], s, slotCX(s), SLOT_SEAT);
            }
            return;
        }
        const l = l3LooseAt(p);
        if (l) { l3StartDrag(l, null, KAB.tip[l].x, KAB.tip[l].y); return; }
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
        if (!l3Ordering()) { lv.sel = null; return; }
        const s = l3SlotAt(p), l = l3LooseAt(p);
        const slots = curSlots();
        if (s >= 0) {
            if (slots[s] === d.id) { lv.sel = d.id; return; }
            l3PutWire(d.id, s); lv.sel = null; return;
        }
        if (l === d.id) { lv.sel = d.id; return; }
        if (l && d.fromSlot === null) { l3SwapLoose(d.id, l); lv.sel = d.id; return; }
        if (d.fromSlot === null) {
            const h = l3Home(d.id);
            l3MoveTo(d.id, h.x, h.y, 420, performance.now());
            lv.sel = null; return;
        }
        l3PutWire(d.id, d.fromSlot); lv.sel = null;
    };
    lv.exit = function () {
        lv.anim = null; lv.drag = null; lv.modal = null; lv.sel = null;
    };

    /* ================================================================
       LAYAR HASIL + LOG + PAPAN SKOR L3
       ================================================================ */
    lv.makeResult = function (lv2, ok, stars, isNewBest) {
        if (!Array.isArray(save.board3)) save.board3 = [];
        const ketepatan = Math.max(0, 100 - lv2.mistakes.length * 4);
        const kerapian = (KAB.crimpedA && KAB.crimpedB) ? 100 : (KAB.crimpedA ? 60 : 30);
        const hematKabel = KAB.usedCm <= NEED_CM ? 25 : (KAB.usedCm <= NEED_CM + 50 ? 15 : 5);
        const hematKonektor = KAB.rj45Used === 2 ? 25 : (KAB.rj45Used === 3 ? 15 : 5);
        const hemat = Math.min(50, hematKabel + hematKonektor);
        const kecepatan = lv2.dur <= 180 ? 20 : (lv2.dur <= 300 ? 12 : 5);

        const badges = [];
        if (ok && KAB.helpUsed === 0) badges.push('Crossover Master');
        if (KAB.firstPickCorrect) badges.push('Mata Elang');
        if (KAB.usedCm <= NEED_CM) badges.push('Hemat Kabel');
        if (KAB.rj45Used === 2) badges.push('Hemat Konektor');
        if (lv2.mistakes.length === 0) badges.push('Tangan Cekatan');
        badges.forEach(function (b) { if (!save.badges.includes(b)) save.badges.push(b); });
        persist();

        lv2.logExtra = {
            kabel_cm: KAB.usedCm, rj45: KAB.rj45Used, bantuan: KAB.helpUsed,
            lencana: badges.join('|') || '-'
        };
        lv2.boardKey = 'board3';

        return {
            draw: function () {
                bg(false);
                const x = 140, y = 44, w = 680, h = 512;
                rr(x, y, w, h, 20); ctx.fillStyle = C.panel; ctx.fill();
                ctx.strokeStyle = ok ? C.ok : C.bad; ctx.lineWidth = 2; ctx.stroke();
                txt(ok ? 'Level 3 Selesai!' : 'Belum Lulus / Waktu Habis', x + w / 2, y + 40,
                    { s: 26, f: FONT_H, a: 'center', c: ok ? C.ok : C.bad, w: 600 });
                if (isNewBest) txt('REKOR BARU!', x + w / 2, y + 62, { s: 14, f: FONT_H, a: 'center', c: C.warn, w: 600 });
                for (let i = 0; i < 3; i++) star(x + w / 2 - 48 + i * 48, y + 94, 18, i < stars);
                txt(lv2.score, x + w / 2, y + 152, { s: 46, f: FONT_H, a: 'center', c: C.warn, w: 600 });
                txt('skor akhir Level 3', x + w / 2, y + 170, { s: 12, a: 'center', c: C.mute });

                txt('Rincian Skor', x + 34, y + 196, { s: 14, c: C.acc, w: 800 });
                [
                    ['Ketepatan Crossover (A & B)', ketepatan + ' / 100'],
                    ['Kerapian Crimping', kerapian + ' / 100'],
                    ['Hemat Bahan (Kabel & RJ-45)', hemat + ' / 50'],
                    ['Kecepatan Waktu', kecepatan + ' / 20'],
                    ['Kabel Terpakai', KAB.usedCm + ' cm (target 150 cm)'],
                    ['Konektor RJ-45', KAB.rj45Used + ' buah (ideal 2 buah)'],
                    ['Bantuan Dibuka', KAB.helpUsed + '×'],
                    ['Uji Tester Gagal', KAB.gagalUji + '×']
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
                    txt('★ ' + b, bx + 93, by + 15, { s: 11, a: 'center', c: C.warn, w: 800 });
                });

                if (ok) {
                    const top = (save.board3 || []).slice(0, 3);
                    txt('Top Level 3:', x + 424, y + 400, { s: 12, c: C.mute, w: 700 });
                    if (!top.length) txt('Belum ada rekor L3.', x + 424, y + 418, { s: 11, c: C.mute });
                    top.forEach(function (e, i) {
                        const nm = e.nama.length > 12 ? e.nama.slice(0, 11) + '…' : e.nama;
                        txt((i + 1) + '. ' + nm + ' — ' + e.skor + ' pts', x + 424, y + 418 + i * 16,
                            { s: 11, c: i === 0 ? C.warn : C.text, w: 700 });
                    });
                }

                const by2 = y + h - 52;
                btn(x + 34, by2, 130, 42, 'Ulangi', () => startLevel(2), { color: '#334155', tc: C.text, s: 14 });
                btn(x + 180, by2, 180, 42, 'Papan skor L3', () => go(levelsScene), { color: '#2b4360', tc: C.text, s: 14 });
                if (ok) btn(x + 376, by2, 270, 42, 'Lanjut ke Level 4 ▸', () => startLevel(3), { color: C.ok, s: 15 });
                else btn(x + 376, by2, 270, 42, 'Pilih level', () => go(levelsScene), { color: C.acc, s: 15 });
            }
        };
    };

    return lv;
}

/* ---------- pendaftaran level ---------- */
registerLevel(3, {
    t: 'Crimping Crossover (T568A–T568B)',
    m: 'Satu kabel: ujung A T568A, ujung B T568B, uji pola silang',
    desc: 'Buat satu kabel LAN crossover untuk menghubungkan dua PC langsung tanpa switch: pilih jenis kabel yang tepat, pakai sarung tangan, potong 150 cm, susun Ujung A sebagai T568A, crimp A, susun Ujung B sebagai T568B, crimp B, lalu buktikan pola silang 1↔3 dan 2↔6 pada LAN Tester.',
    mk: makeL3
});
