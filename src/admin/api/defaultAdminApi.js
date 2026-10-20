// ============================================================================
// defaultAdminApi.js — memilih adapter dashboard (DEMO atau LIVE).
//
// Default: DEMO. Mode LIVE hanya aktif bila VITE_SINOVA_ADMIN_API === 'live',
// dan pada mode itu pun TIDAK ada akses tabel langsung dari browser — semua
// lewat Edge Function `admin-data` dengan header Authorization.
// ============================================================================

import { supabase } from '../../lib/supabase.js';
import { getAdminSession } from '../../lib/adminAuth.js';
import { ADMIN_API_MODE, createAdminApi } from './adminApi.js';

export function adminApiMode() {
  try {
    const v = import.meta.env && import.meta.env.VITE_SINOVA_ADMIN_API;
    return v === 'live' ? ADMIN_API_MODE.LIVE : ADMIN_API_MODE.DEMO;
  } catch {
    return ADMIN_API_MODE.DEMO;
  }
}

export function createDefaultAdminApi() {
  const mode = adminApiMode();
  if (mode === ADMIN_API_MODE.LIVE) {
    return createAdminApi({
      mode,
      invoke: (fn, opts) => supabase.functions.invoke(fn, opts),
      getToken: async () => (await getAdminSession()).accessToken,
    });
  }
  return createAdminApi({ mode: ADMIN_API_MODE.DEMO });
}

export default createDefaultAdminApi;
