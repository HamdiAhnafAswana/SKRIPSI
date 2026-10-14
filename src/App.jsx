import React, { useEffect, useRef, useState } from 'react';
import './styles/global.css';
import WelcomeScreen from './components/WelcomeScreen';
import Tutorial from './components/Tutorial';
import IdentityForm from './components/IdentityForm';
import Dashboard from './components/Dashboard';

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
  const [screen, setScreen] = useState('welcome');
  const [student, setStudent] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('sinova_student');
    if (saved) {
      try { setStudent(JSON.parse(saved)); } catch (e) { /* ignore */ }
    }
    const tutorialDone = localStorage.getItem('sinova_tutorial_completed');
    if (tutorialDone === 'true' && saved) {
      setScreen('dashboard');
    }

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

  const handleTutorialComplete = () => {
    localStorage.setItem('sinova_tutorial_completed', 'true');
    setScreen('identity');
  };

  const handleIdentitySubmit = (data) => {
    setStudent(data);
    setScreen('dashboard');
  };

  const handleNavigate = (target) => {
    if (target === 'levels') {
      if (window.__NC && window.__NC.go) {
        window.__NC.go(window.__NC.scenes.levelsScene);
      }
      setScreen('game');
    }
  };

  if (screen === 'welcome') {
    return <WelcomeScreen onStart={() => setScreen('tutorial')} onSkip={() => setScreen('identity')} />;
  }

  if (screen === 'tutorial') {
    return <Tutorial onComplete={handleTutorialComplete} />;
  }

  if (screen === 'identity') {
    return <IdentityForm onSubmit={handleIdentitySubmit} />;
  }

  if (screen === 'dashboard' && student) {
    return <Dashboard student={student} onNavigate={handleNavigate} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>SINOVA</h1>
        <p>Simulation Interactive Network Virtual Academy</p>
      </header>
      <main className="app-main">
        <div className="game-container">
          <canvas
            ref={canvasRef}
            id="c"
            width={960}
            height={600}
            aria-label="Area simulasi SINOVA"
          />
          <input id="nama" type="text" maxLength={30} placeholder="Isi sebelum bermain" autoComplete="off" />
        </div>
        {!gameReady && <div className="loading">Memuat SINOVA...</div>}
        <p className="note">Simulasi interaktif instalasi dan troubleshooting jaringan komputer</p>
      </main>
    </div>
  );
}
