
import React, { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { isAdminRoute } from './admin/adminRoute.js';
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

if (ruteAdmin()) {
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
