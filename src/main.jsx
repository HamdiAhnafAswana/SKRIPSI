
import React, { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import SinovaConfigError from './components/SinovaConfigError.jsx';
import { isAdminRoute } from './admin/adminRoute.js';
import {
  isSupabaseConfigured,
  supabaseMissingVars,
} from './lib/supabase.js';
import './styles/global.css';

// Area ADMIN dipisahkan dari game siswa lewat rute hash (#/admin).
// - Bundel game siswa tidak memuat kode admin (impor dinamis / lazy).
// - Area admin tidak memuat skrip engine public/game/** (tidak lewat App.jsx).
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'));

function ruteAdmin() {
  try {
    return isAdminRoute(window.location.hash);
  } catch {
    return false;
  }
}

const akar = createRoot(document.getElementById('root'));

// Jaring pengaman konfigurasi: bila variabel build Supabase tidak tersedia,
// JANGAN render aplikasi (yang akan gagal menghubungi server tanpa penjelasan).
// Tampilkan pesan yang jelas agar pengguna tidak melihat halaman kosong.
// `src/lib/supabase.js` sengaja TIDAK melempar error saat diimpor.
if (!isSupabaseConfigured) {
  akar.render(
    <React.StrictMode>
      <SinovaConfigError missingVars={supabaseMissingVars} />
    </React.StrictMode>
  );
} else if (ruteAdmin()) {
  akar.render(
    <React.StrictMode>
      <Suspense
        fallback={
          <div
            style={{
              padding: 32,
              minHeight: '100vh',
              background: '#0b1220',
              color: '#e7eefc',
            }}
          >
            Memuat halaman admin…
          </div>
        }
      >
        <AdminApp />
      </Suspense>
    </React.StrictMode>
  );
} else {
  akar.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
