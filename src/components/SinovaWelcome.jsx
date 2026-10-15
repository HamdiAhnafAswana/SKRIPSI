import React from 'react';
import logo from '../assets/sinova/logo.svg';
import AndiAvatar from './AndiAvatar.jsx';

/**
 * Landing / welcome screen SINOVA.
 * Muncul sebelum tutorial pada kunjungan pertama.
 */
export default function SinovaWelcome({ onStart, onSkip }) {
  return (
    <div className="sinova-overlay">
      <div className="sinova-card sinova-welcome">
        <img className="sinova-logo" src={logo} alt="Logo SINOVA" width={92} height={92} />

        <h1 className="sinova-wordmark">SINOVA</h1>
        <p className="sinova-fullname">Simulation Interactive Network Virtual Academy</p>
        <p className="sinova-tagline">
          Media pembelajaran simulasi instalasi &amp; pengkabelan jaringan untuk siswa SMK TKJ.
        </p>

        <div className="sinova-welcome-row">
          <AndiAvatar size={140} />
          <div className="sinova-bubble">
            Halo! Saya <b>Andi</b>. Sebelum mulai bermain, saya akan mengenalkan
            SINOVA dan cara memakai simulasi ini. Yuk, ikuti tutorial singkatnya!
          </div>
        </div>

        <div className="sinova-actions">
          <button type="button" className="sinova-btn sinova-btn-primary" onClick={onStart}>
            Mulai Tutorial
          </button>
          <button type="button" className="sinova-btn sinova-btn-ghost" onClick={onSkip}>
            Lewati Tutorial
          </button>
        </div>
      </div>
    </div>
  );
}
