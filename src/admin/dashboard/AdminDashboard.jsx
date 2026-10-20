import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createDefaultAdminApi } from '../api/defaultAdminApi.js';
import { DATA_ERROR } from '../lib/dashboardFormat.js';
import { DemoNotice, LiveBadge } from './DemoBadge.jsx';
import { ErrorBlock, LoadingBlock, EmptyBlock, DeniedBlock } from './StateBlocks.jsx';
import SummaryPanel from './SummaryPanel.jsx';
import StudentList from './StudentList.jsx';
import StudentDetail from './StudentDetail.jsx';
import SessionMonitor from './SessionMonitor.jsx';

export const DASHBOARD_TABS = [
  { id: 'ringkasan', label: 'Ringkasan' },
  { id: 'siswa', label: 'Siswa' },
  { id: 'sesi', label: 'Pemantauan Sesi' },
];

const keadaanAwal = (extra = {}) => ({
  status: 'loading',
  code: null,
  data: null,
  meta: null,
  ...extra,
});

// --- Bagian-bagian MURNI (tanpa hook) — mudah diuji langsung ---------------

// Peringatan kejujuran data: server melaporkan `meta.scanLimited === true` bila
// agregat MUNGKIN belum lengkap (batas pemindaian / `max_rows` REST memotong).
// Ini BUKAN fallback data: hanya pemberitahuan bahwa angka bisa sementara.
export function ScanLimitNotice({ limited }) {
  if (limited !== true) return null;
  return (
    <p className="admin-scan-warning" role="status" data-aksi="scan-limited">
      Sebagian data mungkin belum lengkap karena batas pemindaian server, sehingga
      angka ringkasan/daftar bisa bersifat sementara.
    </p>
  );
}

export function SectionRingkasan({ state, onRetry }) {
  if (!state || state.status === 'loading') return <LoadingBlock label="Memuat ringkasan…" />;
  if (state.status === 'error') {
    if (state.code === DATA_ERROR.FORBIDDEN) return <DeniedBlock />;
    return <ErrorBlock code={state.code} onRetry={onRetry} />;
  }
  if (!state.data) {
    return <EmptyBlock title="Ringkasan kosong" body="Belum ada data untuk diringkas." />;
  }
  return <SummaryPanel summary={state.data} />;
}

export function SectionSiswa({ state, onRetry, classes, filters, onFilters, onOpenStudent, now }) {
  if (!state || state.status === 'loading') return <LoadingBlock label="Memuat daftar siswa…" />;
  if (state.status === 'error') {
    if (state.code === DATA_ERROR.FORBIDDEN) return <DeniedBlock />;
    return <ErrorBlock code={state.code} onRetry={onRetry} />;
  }
  return (
    <StudentList
      students={state.data || []}
      classes={classes || []}
      filters={filters}
      meta={state.meta}
      onFilters={onFilters}
      onOpenStudent={onOpenStudent}
      now={now}
    />
  );
}

export function SectionSesi({ state, onRetry, classes, filters, onFilters, now }) {
  if (!state || state.status === 'loading') return <LoadingBlock label="Memuat sesi…" />;
  if (state.status === 'error') {
    if (state.code === DATA_ERROR.FORBIDDEN) return <DeniedBlock />;
    return <ErrorBlock code={state.code} onRetry={onRetry} />;
  }
  return (
    <SessionMonitor
      sessions={state.data || []}
      classes={classes || []}
      filters={filters}
      meta={state.meta}
      onFilters={onFilters}
      now={now}
    />
  );
}

export function SectionDetail({ state, onBack }) {
  if (!state || state.status === 'loading') {
    return (
      <div className="admin-detail">
        <button
          type="button"
          className="admin-btn admin-btn-ghost admin-btn-sm"
          data-aksi="kembali"
          onClick={() => typeof onBack === 'function' && onBack()}
        >
          &larr; Kembali
        </button>
        <LoadingBlock label="Memuat detail siswa…" />
      </div>
    );
  }
  if (state.status === 'error') {
    return (
      <div className="admin-detail">
        <button
          type="button"
          className="admin-btn admin-btn-ghost admin-btn-sm"
          data-aksi="kembali"
          onClick={() => typeof onBack === 'function' && onBack()}
        >
          &larr; Kembali
        </button>
        {state.code === DATA_ERROR.FORBIDDEN ? (
          <DeniedBlock />
        ) : (
          <ErrorBlock code={state.code} />
        )}
      </div>
    );
  }
  return <StudentDetail detail={state.data} onBack={onBack} />;
}

// --- Container -------------------------------------------------------------

export default function AdminDashboard({ onUnauthorized, api: apiProp }) {
  const [api] = useState(() => apiProp || createDefaultAdminApi());

  const [tab, setTab] = useState('ringkasan');
  const [ringkasan, setRingkasan] = useState(keadaanAwal());
  const [siswa, setSiswa] = useState(keadaanAwal({ data: [] }));
  const [sesi, setSesi] = useState(keadaanAwal({ data: [] }));
  const [detail, setDetail] = useState(null);
  const [kelas, setKelas] = useState([]);
  const [filters, setFilters] = useState({ q: '', classId: '', status: '', page: 1, pageSize: 10 });
  const [filterSesi, setFilterSesi] = useState({ status: '', classId: '', page: 1, pageSize: 10 });

  // onUnauthorized disimpan di ref agar callback stabil (tidak memicu
  // pemuatan berulang bila induk mengirim fungsi baru tiap render).
  const unauthorizedRef = useRef(onUnauthorized);
  unauthorizedRef.current = onUnauthorized;

  const terapkan = useCallback((setter, hasil, dataKosong = null) => {
    if (!hasil || !hasil.ok) {
      const kode = hasil ? hasil.code : DATA_ERROR.UNKNOWN;
      if (kode === DATA_ERROR.UNAUTHORIZED) {
        // Sesi admin tidak valid → jangan tampilkan data; minta verifikasi ulang.
        if (typeof unauthorizedRef.current === 'function') unauthorizedRef.current();
        return false;
      }
      setter({ status: 'error', code: kode, data: dataKosong, meta: null });
      return false;
    }
    setter({ status: 'ready', code: null, data: hasil.data, meta: hasil.meta ?? null });
    return true;
  }, []);

  const muatRingkasan = useCallback(async () => {
    setRingkasan(keadaanAwal());
    terapkan(setRingkasan, await api.getSummary());
  }, [api, terapkan]);

  const muatSiswa = useCallback(async () => {
    setSiswa(keadaanAwal({ data: [] }));
    terapkan(setSiswa, await api.listStudents(filters), []);
  }, [api, terapkan, filters]);

  const muatSesi = useCallback(async () => {
    setSesi(keadaanAwal({ data: [] }));
    terapkan(setSesi, await api.listSessions(filterSesi), []);
  }, [api, terapkan, filterSesi]);

  const bukaDetail = useCallback(
    async (studentId) => {
      setDetail({ studentId, status: 'loading', code: null, data: null });
      const hasil = await api.getStudent(studentId);
      if (!hasil.ok) {
        if (hasil.code === DATA_ERROR.UNAUTHORIZED) {
          if (typeof unauthorizedRef.current === 'function') unauthorizedRef.current();
          return;
        }
        setDetail({ studentId, status: 'error', code: hasil.code, data: null });
        return;
      }
      setDetail({ studentId, status: 'ready', code: null, data: hasil.data });
    },
    [api],
  );

  useEffect(() => {
    muatRingkasan();
  }, [muatRingkasan]);

  useEffect(() => {
    muatSiswa();
  }, [muatSiswa]);

  useEffect(() => {
    muatSesi();
  }, [muatSesi]);

  useEffect(() => {
    let dibatalkan = false;
    (async () => {
      const hasil = await api.listClasses();
      if (!dibatalkan && hasil.ok) setKelas(hasil.data || []);
    })();
    return () => {
      dibatalkan = true;
    };
  }, [api]);

  const pilihTab = (id) => {
    setDetail(null);
    setTab(id);
  };

  const sekarang = new Date().toISOString();

  // Kejujuran data: bila salah satu permintaan LIVE melaporkan pemotongan
  // (meta.scanLimited), beri tahu pengguna — jangan sajikan seolah lengkap.
  const dibatasi = Boolean(
    (ringkasan.meta && ringkasan.meta.scanLimited) ||
    (siswa.meta && siswa.meta.scanLimited) ||
    (sesi.meta && sesi.meta.scanLimited),
  );

  return (
    <div className="admin-dashboard">
      {api.isDemo ? <DemoNotice label={api.label} /> : <LiveBadge label={api.label} />}
      <ScanLimitNotice limited={dibatasi} />

      <nav className="admin-tabs" aria-label="Navigasi dashboard">
        {DASHBOARD_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`admin-tab${tab === t.id ? ' admin-tab-active' : ''}`}
            data-aksi="tab"
            data-tab={t.id}
            aria-current={tab === t.id ? 'page' : undefined}
            onClick={() => pilihTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {detail ? (
        <SectionDetail state={detail} onBack={() => setDetail(null)} />
      ) : tab === 'ringkasan' ? (
        <SectionRingkasan state={ringkasan} onRetry={muatRingkasan} />
      ) : tab === 'siswa' ? (
        <SectionSiswa
          state={siswa}
          onRetry={muatSiswa}
          classes={kelas}
          filters={filters}
          onFilters={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
          onOpenStudent={bukaDetail}
          now={sekarang}
        />
      ) : (
        <SectionSesi
          state={sesi}
          onRetry={muatSesi}
          classes={kelas}
          filters={filterSesi}
          onFilters={(patch) => setFilterSesi((prev) => ({ ...prev, ...patch }))}
          now={sekarang}
        />
      )}
    </div>
  );
}
