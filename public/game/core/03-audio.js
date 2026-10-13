// ==========================================================================
// core/03-audio.js
// Diambil dari backup/netcrimp2.ORI.html baris 61-93. File ini digabung otomatis oleh build.mjs
// ke index.html -- JANGAN diedit langsung di index.html.
// ==========================================================================

/* ---------- suara ---------- */
const SND = {
    ctx: null,
    on() { return save.l2.sound !== false; },
    boot() { if (this.ctx) return; try { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; this.ctx = new AC(); } catch (e) { this.ctx = null; } },
    tone(f, dur, type, vol, f2) {
        if (!this.on()) return; this.boot(); const c = this.ctx; if (!c) return;
        if (c.state === 'suspended') { try { c.resume(); } catch (e) {} }
        const o = c.createOscillator(), g = c.createGain();
        o.type = type || 'sine'; o.frequency.setValueAtTime(f, c.currentTime);
        if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(40, f2), c.currentTime + dur);
        g.gain.setValueAtTime(0.0001, c.currentTime);
        g.gain.exponentialRampToValueAtTime(vol == null ? .12 : vol, c.currentTime + .012);
        g.gain.exponentialRampToValueAtTime(.0001, c.currentTime + dur);
        o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + dur + .02);
    },
    noise(dur, vol, hp) {
        if (!this.on()) return; this.boot(); const c = this.ctx; if (!c) return;
        if (c.state === 'suspended') { try { c.resume(); } catch (e) {} }
        const n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
        const s = c.createBufferSource(); s.buffer = buf;
        const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp || 900;
        const g = c.createGain(); g.gain.value = vol == null ? .16 : vol;
        s.connect(f); f.connect(g); g.connect(c.destination); s.start();
    },
    potong() { this.noise(.14, .22, 1400); this.tone(180, .1, 'square', .05, 90); },
    kupas() { this.noise(.30, .14, 2200); this.tone(520, .16, 'sawtooth', .03, 260); },
    crimp() { this.noise(.07, .30, 2600); this.tone(120, .09, 'square', .14, 60); },
    klik() { this.tone(880, .05, 'triangle', .08); },
    benar() { this.tone(660, .10, 'sine', .12); setTimeout(() => this.tone(990, .16, 'sine', .12), 90); },
    salah() { this.tone(220, .20, 'sawtooth', .10, 120); }
};
