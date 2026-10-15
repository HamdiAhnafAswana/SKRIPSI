import React, { useState } from 'react';
import AndiAvatar from './AndiAvatar.jsx';

/**
 * Tutorial global SINOVA (bukan bagian dari level).
 * Ditampilkan sebagai overlay fullscreen sebelum form identitas siswa.
 * Konten mengacu pada spesifikasi: apa itu SINOVA, menu, cara bermain,
 * panel, alat, jenis kabel, dan sistem penilaian.
 */
const PAGES = [
  {
    title: 'Apa itu SINOVA?',
    intro: 'SINOVA adalah ruang latihan jaringan virtualmu.',
    points: [
      'SINOVA (Simulation Interactive Network Virtual Academy) adalah media belajar simulasi jaringan.',
      'Kamu berlatih memasang dan mengkrimping kabel jaringan seperti di laboratorium SMK TKJ.',
      'Semua latihan berjalan langsung di browser — tanpa koneksi internet.',
    ],
  },
  {
    title: 'Menggunakan Menu',
    intro: 'Semua navigasi ada di menu utama.',
    points: [
      'Mulai bermain — membuka daftar level 1 sampai 5.',
      'Cara bermain — ringkasan misi setiap level.',
      'Log hasil — riwayat skor dan hasil latihanmu.',
      'Papan peringkat — peringkat skor terbaik di level 1, 2, dan 3.',
    ],
  },
  {
    title: 'Cara Bermain Simulasi',
    intro: 'Interaksinya sederhana: klik, seret, lalu lepas.',
    points: [
      'Klik alat untuk memilihnya.',
      'Seret objek di area kerja dengan mouse atau sentuhan.',
      'Lepas (drop) objek pada tempat yang benar sesuai misi.',
      'Ikuti urutan langkah pada panel Misi agar tidak salah.',
    ],
  },
  {
    title: 'Mengenal Panel',
    intro: 'Setiap layar permainan punya empat bagian utama.',
    points: [
      'Misi — langkah/target yang harus kamu selesaikan.',
      'Area kerja — tempat kamu memasang dan mengerjakan objek.',
      'Status — informasi skor, waktu, dan progres saat bermain.',
      'Alat — daftar peralatan yang bisa kamu pakai.',
    ],
  },
  {
    title: 'Mengenal Alat',
    intro: 'Ini peralatan yang akan kamu gunakan.',
    chips: ['Sarung tangan', 'Pengupas kabel', 'Tang crimping', 'LAN tester'],
    points: [
      'Sarung tangan — pelindung tangan saat mengerjakan kabel.',
      'Pengupas kabel — membuka kulit luar kabel.',
      'Tang crimping — memasang konektor RJ-45 pada ujung kabel.',
      'LAN tester — memeriksa apakah kabel sudah benar dan tersambung.',
    ],
  },
  {
    title: 'Mengenal Jenis Kabel',
    intro: 'Dua susunan kabel yang akan kamu buat.',
    chips: ['Straight Through', 'Crossover'],
    points: [
      'Straight Through — susunan standar T568B, dipakai untuk kabel lurus.',
      'Crossover — susunan silang, dipakai untuk menghubungkan dua perangkat sejenis.',
      'Warna urutan kabel harus tepat agar koneksi berhasil.',
    ],
  },
  {
    title: 'Sistem Penilaian',
    intro: 'Setiap latihan dinilai secara otomatis.',
    points: [
      'Skor — dimulai dari 100 dan berkurang setiap kesalahan.',
      'Waktu — menyelesaikan lebih cepat membantumu meraih skor lebih baik.',
      'Bintang — 3 bintang untuk skor 85+, 2 bintang untuk 60+, 1 bintang jika level selesai.',
      'Badge — penghargaan yang terbuka saat kamu mencapai target tertentu.',
    ],
  },
  {
    title: 'Siap Memulai!',
    intro: 'Masukkan data siswa sebelum memulai.',
    points: [
      'Isi nama lengkap, kelas, dan nomor absen pada langkah berikutnya.',
      'Data ini dipakai agar hasil latihanmu tercatat di log dan papan peringkat.',
      'Setelah itu kamu langsung masuk ke dashboard dan bisa memilih level.',
    ],
    cta: true,
  },
];

export default function SinovaTutorial({ onFinish, onSkip }) {
  const [page, setPage] = useState(0);
  const total = PAGES.length;
  const data = PAGES[page];
  const isLast = page === total - 1;

  function next() {
    if (isLast) onFinish();
    else setPage((p) => Math.min(p + 1, total - 1));
  }
  function prev() {
    setPage((p) => Math.max(p - 1, 0));
  }

  return (
    <div className="sinova-overlay">
      <div className="sinova-card sinova-tutorial">
        <div className="sinova-tut-head">
          <span className="sinova-tut-badge">Tutorial SINOVA</span>
          <span className="sinova-tut-count">
            Halaman {page + 1} / {total}
          </span>
        </div>

        <div className="sinova-tut-body">
          <div className="sinova-tut-andi">
            <AndiAvatar size={168} />
          </div>

          <div className="sinova-tut-content" key={page}>
            <h2 className="sinova-tut-title">{data.title}</h2>
            {data.intro && <p className="sinova-tut-intro">{data.intro}</p>}

            {data.chips && (
              <div className="sinova-chips">
                {data.chips.map((c) => (
                  <span key={c} className="sinova-chip">
                    {c}
                  </span>
                ))}
              </div>
            )}

            <ul className="sinova-points">
              {data.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="sinova-tut-foot">
          <div className="sinova-dots" aria-hidden="true">
            {PAGES.map((_, i) => (
              <span key={i} className={`sinova-dot${i === page ? ' is-active' : ''}`} />
            ))}
          </div>

          <div className="sinova-actions sinova-actions-inline">
            <button
              type="button"
              className="sinova-btn sinova-btn-ghost sinova-btn-sm"
              onClick={onSkip}
            >
              Lewati Tutorial
            </button>
            <button
              type="button"
              className="sinova-btn sinova-btn-ghost sinova-btn-sm"
              onClick={prev}
              disabled={page === 0}
            >
              Sebelumnya
            </button>
            <button type="button" className="sinova-btn sinova-btn-primary" onClick={next}>
              {isLast ? 'Masukkan Data Siswa' : 'Lanjut'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
