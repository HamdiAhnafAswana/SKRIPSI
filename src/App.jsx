import React, { useEffect, useRef, useState } from 'react';
import './styles/global.css';

const GAME_SCRIPTS = [
  '/game/core/00-registry.js',
  '/game/core/01-init.js',
  '/game/core/02-storage.js',
  '/game/core/03-audio.js',
  '/game/core/04-three.js',
  '/game/core/05-canvas.js',
  '/game/core/06-input.js',
  '/game/core/07-draw.js',
  '/game/core/08-wire-colors.js',
  '/game/core/09-tool-icons.js',
  '/game/core/10-sprites.js',
  '/game/core/11-room-lemari.js',
  '/game/core/12-andi.js',
  '/game/core/13-level-core.js',
  '/game/levels/level1-alat.js',
  '/game/levels/level2-kabel-2d.js',
  '/game/levels/level3-crossover.js',
  '/game/levels/level4-network.js',
  '/game/levels/level5-crossover.js',
  '/game/ui/20-scenes.js',
  '/game/ui/21-loop.js',
];

export default function App() {
  const [gameReady, setGameReady] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    // Rollback SINOVA: bersihkan key onboarding yang sudah tidak dipakai.
    // Data progres/skor/ranking/log tetap tersimpan di KEY 'netcrimp_v1'.
    try {
      localStorage.removeItem('sinova_tutorial_completed');
      localStorage.removeItem('sinova_student');
    } catch (e) { /* ignore */ }

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

  return (
    <div className="app">
      <header className="app-header">
        <h1>NetCrimp</h1>
        <p>Game edukasi instalasi &amp; pengkabelan jaringan untuk siswa SMK TKJ</p>
      </header>

      <main className="app-main">
        <div className="game-container">
          <canvas
            ref={canvasRef}
            id="c"
            width={960}
            height={600}
            aria-label="Area permainan NetCrimp"
          />
          <input id="nama" type="text" maxLength={30} placeholder="Isi sebelum bermain" autoComplete="off" />
        </div>
        {!gameReady && <div className="loading">Memuat game engine...</div>}
        <p className="note">Kontrol: seret dan lepas dengan mouse atau sentuhan. Progres dan log hasil tersimpan di browser ini.</p>
      </main>
    </div>
  );
}
