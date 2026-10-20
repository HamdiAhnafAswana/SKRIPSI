import React, { useCallback, useEffect, useRef, useState } from 'react';
import './styles/global.css';
import SinovaWelcome from './components/SinovaWelcome.jsx';
import SinovaTutorial from './components/SinovaTutorial.jsx';
import SinovaIdentityForm from './components/SinovaIdentityForm.jsx';
import SinovaConfirmDialog from './components/SinovaConfirmDialog.jsx';
import SinovaLeaderboard from './components/SinovaLeaderboard.jsx';
import FullscreenButton from './components/FullscreenButton.jsx';
// Jembatan ke engine game klasik (public/game/**) — dipasang ke window sebelum
// skrip engine dimuat. Hanya mengekspos fungsi; token tidak pernah di global.
import { installSinovaBridge } from './lib/sinovaBridge.js';

// Vite menyuntikkan base deployment (mis. '/SKRIPSI/') — dipakai agar skrip
// engine di folder public/ tetap ditemukan saat dipublikasikan di sub-folder.
const BASE_URL = import.meta.env.BASE_URL || '/';

const GAME_SCRIPTS = [
  'game/core/00-registry.js',
  'game/core/01-init.js',
  'game/core/02-storage.js',
  'game/core/03-audio.js',
  'game/core/04-three.js',
  'game/core/05-canvas.js',
  'game/core/06-input.js',
  'game/core/07-draw.js',
  'game/core/08-wire-colors.js',
  'game/core/09-tool-icons.js',
  'game/core/10-sprites.js',
  'game/core/11-room-lemari.js',
  'game/core/12-andi.js',
  'game/core/13-level-core.js',
  'game/levels/level1-alat.js',
  'game/levels/level2-kabel-2d.js',
  'game/levels/level3-crossover.js',
  'game/levels/level4-network.js',
  'game/levels/level5-crossover.js',
  'game/ui/20-scenes.js',
  'game/ui/21-loop.js',
].map((p) => BASE_URL + p);

// Key onboarding SINOVA (terpisah dari data progres engine).
const TUTORIAL_KEY = 'sinova_tutorial_completed';
const STUDENT_KEY = 'sinova_student';
// Key lama engine untuk nama siswa — tetap dipakai agar log hasil tetap tercatat.
const LEGACY_NAME_KEY = 'netcrimp_v1_nama';

function readInitialStage() {
  try {
    const student = localStorage.getItem(STUDENT_KEY);
    if (student) return 'game';
    const tutorialDone = localStorage.getItem(TUTORIAL_KEY) === 'true';
    return tutorialDone ? 'identity' : 'welcome';
  } catch (e) {
    return 'welcome';
  }
}

export default function App() {
  const [gameReady, setGameReady] = useState(false);
  const [stage, setStage] = useState(readInitialStage);
  // Nama siswa aktif — dibaca dari penyimpanan identitas yang sama (sinova_student).
  const [studentName, setStudentName] = useState(() => {
    try {
      const raw = localStorage.getItem(STUDENT_KEY);
      const d = raw ? JSON.parse(raw) : null;
      return d && typeof d.nama === 'string' && d.nama.trim() ? d.nama.trim() : '';
    } catch (e) {
      return '';
    }
  });
  const [confirmRestart, setConfirmRestart] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function loadGame() {
      // Pasang jembatan lebih dulu agar sudah tersedia saat engine memanggilnya.
      installSinovaBridge();
      try {
        for (const src of GAME_SCRIPTS) {
          if (cancelled) return;
          await new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = src;
            s.onload = resolve;
            s.onerror = () => reject(new Error(`Gagal memuat ${src}`));
            document.body.appendChild(s);
          });
        }
        if (!cancelled) setGameReady(true);
      } catch (e) {
        console.error('Gagal memuat game engine:', e);
      }
    }

    loadGame();
    return () => { cancelled = true; };
  }, []);

  // Selesai atau lewati tutorial → lanjut ke form bila data siswa belum ada.
  const finishTutorial = useCallback(() => {
    try {
      localStorage.setItem(TUTORIAL_KEY, 'true');
    } catch (e) { /* ignore */ }

    let hasStudent = false;
    try {
      hasStudent = !!localStorage.getItem(STUDENT_KEY);
    } catch (e) { /* ignore */ }

    setStage(hasStudent ? 'game' : 'identity');
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
  }, []);

  // Simpan identitas siswa + sinkronkan nama ke engine agar muncul di log.
  const submitIdentity = useCallback((data) => {
    try {
      localStorage.setItem(STUDENT_KEY, JSON.stringify(data));
    } catch (e) { /* ignore */ }

    try {
      const el = document.getElementById('nama');
      if (el) el.value = data.nama;
      localStorage.setItem(LEGACY_NAME_KEY, data.nama);
    } catch (e) { /* ignore */ }

    // Perbarui nama di navbar dashboard.
    setStudentName(data.nama);
    setStage('game');
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
  }, []);

  // Konfirmasi "Muat Ulang" di dashboard: buang hanya status onboarding
  // (identitas + tutorial) agar alur masuk bisa diulang dari awal, yaitu
  // tutorial → identitas → dashboard. Hasil praktik, nilai, riwayat, dan
  // leaderboard tidak disentuh.
  const handleRestartConfirm = useCallback(() => {
    try {
      localStorage.removeItem(STUDENT_KEY);
      localStorage.removeItem(TUTORIAL_KEY);
      localStorage.removeItem(LEGACY_NAME_KEY);
    } catch (e) { /* ignore */ }

    setStudentName('');
    setConfirmRestart(false);
    setStage('tutorial');
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
  }, []);

  const showCanvas = stage === 'game';

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-brand">
          <h1>SINOVA</h1>
          <p>Simulation Interactive Network Virtual Academy</p>
        </div>
        <div className="app-header-actions">
          <div
            className="student-badge"
            title={studentName ? `Siswa: ${studentName}` : 'Belum ada identitas'}
          >
            <svg
              className="student-badge-icon"
              viewBox="0 0 16 16"
              width="13"
              height="13"
              aria-hidden="true"
            >
              <path
                fill="currentColor"
                d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 1.5c-2.9 0-5.5 1.46-5.5 3.4v1a.6.6 0 0 0 .6.6h9.8a.6.6 0 0 0 .6-.6v-1c0-1.94-2.6-3.4-5.5-3.4Z"
              />
            </svg>
            <span className="student-badge-name">{studentName || 'Tamu'}</span>
          </div>
          {stage === 'game' && (
            <button
              type="button"
              className="fs-btn restart-btn"
              onClick={() => setConfirmRestart(true)}
              title="Mulai ulang alur masuk SINOVA dari awal"
            >
              <span className="fs-ico" aria-hidden="true">{'\u21BB'}</span>
              <span className="fs-btn-label">Muat Ulang</span>
            </button>
          )}
          <FullscreenButton />
        </div>
      </header>

      <main className="app-main">
        <div className="game-container">
          <canvas
            ref={canvasRef}
            id="c"
            width={960}
            height={600}
            aria-label="Area permainan SINOVA"
          />
          <input id="nama" type="text" maxLength={30} placeholder="Isi sebelum bermain" autoComplete="off" />
          {showCanvas && !gameReady && <div className="loading">Memuat game engine...</div>}
          {showCanvas && (
            <p className="note">Kontrol: seret dan lepas dengan mouse atau sentuhan. Progres dan log hasil tersimpan di browser ini.</p>
          )}
        </div>
      </main>

      {stage === 'welcome' && (
        <SinovaWelcome onStart={() => setStage('tutorial')} onSkip={finishTutorial} />
      )}
      {stage === 'tutorial' && (
        <SinovaTutorial onFinish={finishTutorial} onSkip={finishTutorial} />
      )}
      {stage === 'identity' && <SinovaIdentityForm onSubmit={submitIdentity} />}
      {stage === 'game' && <SinovaLeaderboard />}
      {confirmRestart && (
        <SinovaConfirmDialog
          onCancel={() => setConfirmRestart(false)}
          onConfirm={handleRestartConfirm}
        />
      )}
    </div>
  );
}
