import React, { useCallback, useEffect, useState } from 'react';

/**
 * Tombol "Layar penuh" untuk panggung SINOVA.
 * - Memakai Fullscreen API (dengan prefiks webkit untuk Safari).
 * - Label berubah masuk/keluar sesuai status.
 * - Bila browser tidak mendukung, tombol tidak dirender (fallback anggun).
 */
function fsElement() {
  if (typeof document === 'undefined') return null;
  return document.fullscreenElement || document.webkitFullscreenElement || null;
}

function fsSupported() {
  if (typeof document === 'undefined') return false;
  const root = document.documentElement;
  const enabled = document.fullscreenEnabled || document.webkitFullscreenEnabled;
  const canRequest = !!(root.requestFullscreen || root.webkitRequestFullscreen);
  return !!enabled && canRequest;
}

export default function FullscreenButton() {
  const [supported] = useState(fsSupported);
  const [isFullscreen, setIsFullscreen] = useState(() => !!fsElement());

  useEffect(() => {
    if (!supported) return undefined;

    const onChange = () => setIsFullscreen(!!fsElement());
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, [supported]);

  const toggle = useCallback(() => {
    try {
      if (fsElement()) {
        const exit = document.exitFullscreen || document.webkitExitFullscreen;
        if (exit) {
          const p = exit.call(document);
          if (p && typeof p.catch === 'function') p.catch(() => {});
        }
      } else {
        const root = document.documentElement;
        const request = root.requestFullscreen || root.webkitRequestFullscreen;
        if (request) {
          const p = request.call(root);
          if (p && typeof p.catch === 'function') p.catch(() => {});
        }
      }
    } catch (e) {
      /* Browser menolak permintaan layar penuh — abaikan. */
    }
  }, []);

  if (!supported) return null;

  return (
    <button
      type="button"
      className="fs-btn"
      onClick={toggle}
      aria-pressed={isFullscreen}
      title={isFullscreen ? 'Keluar dari layar penuh' : 'Tampilkan layar penuh'}
    >
      <span className="fs-ico" aria-hidden="true">{isFullscreen ? '\u2922' : '\u26F6'}</span>
      <span className="fs-btn-label">{isFullscreen ? 'Keluar' : 'Layar penuh'}</span>
    </button>
  );
}
