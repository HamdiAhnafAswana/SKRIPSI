// ==========================================================================
// core/04-three.js
// Diambil dari netcrimp2.html baris 95-111. File ini digabung otomatis oleh build.mjs
// ke dist/netcrimp2.html -- JANGAN diedit langsung di dist/.
// ==========================================================================

/* ---------- pemuat Three.js ---------- */
const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
const threeState = { status: 'new', waiters: [] };
function webglOK() { try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch (e) { return false; } }
function loadThree(cb) {
    if (window.THREE && window.THREE.WebGLRenderer) { cb(null); return; }
    threeState.waiters.push(cb);
    if (threeState.status === 'loading' || threeState.status === 'ok') return;
    threeState.status = 'loading';
    const s = document.createElement('script'); let done = false;
    const finish = err => { if (done) return; done = true; clearTimeout(timer); threeState.status = err ? 'fail' : 'ok'; const list = threeState.waiters.slice(); threeState.waiters.length = 0; list.forEach(f => f(err || null)); };
    const timer = setTimeout(() => finish(new Error('timeout')), 11000);
    s.src = THREE_URL; s.async = true;
    s.onload = () => finish(window.THREE && window.THREE.WebGLRenderer ? null : new Error('no-three'));
    s.onerror = () => finish(new Error('network'));
    document.head.appendChild(s);
}
