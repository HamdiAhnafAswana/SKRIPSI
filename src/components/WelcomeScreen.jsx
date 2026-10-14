import React from 'react';

export default function WelcomeScreen({ onStart, onSkip }) {
  return (
    <div className="sinova-welcome">
      <div className="sinova-welcome-card">
        <div className="sinova-logo">
          <span className="sinova-logo-text">SINOVA</span>
          <span className="sinova-logo-sub">Simulation Interactive<br />Network Virtual Academy</span>
        </div>
        <p className="sinova-welcome-desc">
          Belajar instalasi dan troubleshooting jaringan komputer melalui simulasi interaktif
        </p>
        <button className="sinova-btn sinova-btn-primary" onClick={onStart}>
          Mulai Tutorial
        </button>
        <button className="sinova-btn sinova-btn-link" onClick={onSkip}>
          Lewati Tutorial
        </button>
      </div>
    </div>
  );
}
