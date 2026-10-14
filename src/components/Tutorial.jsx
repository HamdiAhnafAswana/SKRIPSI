import React, { useState } from 'react';

const TUTORIAL_PAGES = [
  {
    title: 'Selamat Datang di SINOVA',
    text: 'Halo, saya Andi.\nSaya akan membimbing kamu melakukan simulasi instalasi jaringan.',
    visual: 'andi'
  },
  {
    title: 'Mengenal Dashboard',
    text: 'Dashboard SINOVA memiliki:\n• Mulai simulasi\n• Pilihan level\n• Profil siswa\n• Riwayat hasil\n• Ranking',
    visual: 'dashboard'
  },
  {
    title: 'Area Simulasi',
    text: 'Area simulasi terdiri dari:\n• Panel Misi\n• Area Kerja\n• Panel Alat\n• Status Progress',
    visual: 'area'
  },
  {
    title: 'Cara Bermain',
    text: 'Kontrol dalam simulasi:\n• Klik objek\n• Drag objek\n• Drop objek\n• Perhatikan indikator',
    visual: 'controls'
  },
  {
    title: 'Peralatan Jaringan',
    text: 'Peralatan yang akan kamu gunakan:\n\nSarung Tangan - Pelindung tangan\nPengupas Kabel - Membuka selubung\nTang Crimping - Memasang konektor\nLAN Tester - Menguji kabel',
    visual: 'tools'
  },
  {
    title: 'Jenis Kabel',
    text: 'Jenis kabel jaringan:\n\nStraight Through\nPC ke Switch\n\nCrossover\nPC ke PC',
    visual: 'cables'
  },
  {
    title: 'Sistem Level',
    text: 'Level dalam SINOVA:\n\nLevel 1: Persiapan Alat\nLevel 2: Straight Through\nLevel 3: Crossover\nLevel 4: Simulasi Jaringan Straight\nLevel 5: Simulasi Jaringan Crossover',
    visual: 'levels'
  },
  {
    title: 'Sistem Penilaian',
    text: 'Penilaian dalam simulasi:\n\nSkor - Nilai berdasarkan performa\nBintang - 1-3 bintang per level\nBadge - Penghargaan khusus\nWaktu - Durasi pengerjaan',
    visual: 'scoring'
  },
  {
    title: 'Siap Memulai',
    text: 'Semua sudah siap.\nMasukkan identitas kamu sebelum memulai.',
    visual: 'andi'
  }
];

export default function Tutorial({ onComplete }) {
  const [page, setPage] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  React.useEffect(() => {
    const fullText = TUTORIAL_PAGES[page].text;
    let i = 0;
    setDisplayedText('');
    setIsTyping(true);
    const interval = setInterval(() => {
      i++;
      setDisplayedText(fullText.slice(0, i));
      if (i >= fullText.length) {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [page]);

  const handleNext = () => {
    if (isTyping) {
      setDisplayedText(TUTORIAL_PAGES[page].text);
      setIsTyping(false);
      return;
    }
    if (page < TUTORIAL_PAGES.length - 1) {
      setPage(page + 1);
    } else {
      onComplete();
    }
  };

  const currentPage = TUTORIAL_PAGES[page];

  return (
    <div className="sinova-tutorial">
      <div className="sinova-tutorial-card">
        <div className="sinova-tutorial-header">
          <span className="sinova-tutorial-step">Halaman {page + 1} dari {TUTORIAL_PAGES.length}</span>
        </div>

        <div className="sinova-tutorial-body">
          <div className="sinova-tutorial-left">
            <div className="sinova-andi-avatar">
              <div className="sinova-andi-placeholder">A</div>
            </div>
            <div className="sinova-andi-name">Andi</div>
            <div className="sinova-andi-role">Teknisi Senior</div>
          </div>

          <div className="sinova-tutorial-right">
            <h2 className="sinova-tutorial-title">{currentPage.title}</h2>
            <div className="sinova-tutorial-text">
              {displayedText.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
              {isTyping && <span className="sinova-cursor">|</span>}
            </div>
          </div>
        </div>

        <div className="sinova-tutorial-footer">
          <div className="sinova-tutorial-dots">
            {TUTORIAL_PAGES.map((_, i) => (
              <span
                key={i}
                className={`sinova-dot ${i === page ? 'active' : ''} ${i < page ? 'done' : ''}`}
              />
            ))}
          </div>
          <button className="sinova-btn sinova-btn-primary" onClick={handleNext}>
            {isTyping ? 'Lewati' : page === TUTORIAL_PAGES.length - 1 ? 'Lanjut' : 'Lanjut'}
          </button>
        </div>
      </div>
    </div>
  );
}
