import React, { useCallback, useEffect, useRef, useState } from 'react';
import './styles/global.css';
import SinovaWelcome from './components/SinovaWelcome.jsx';
import SinovaTutorial from './components/SinovaTutorial.jsx';
import SinovaIdentityForm from './components/SinovaIdentityForm.jsx';
import FullscreenButton from './components/FullscreenButton.jsx';

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
  const canvasRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function loadGame() {
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

    setStage('game');
  }, []);

  const showCanvas = stage === 'game';

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-brand">
          <h1>SINOVA</h1>
          <p>Simulation Interactive Network Virtual Academy</p>
        </div>
        <FullscreenButton />
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
    </div>
  );
}
