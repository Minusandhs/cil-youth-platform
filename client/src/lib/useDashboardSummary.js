// ================================================================
// useDashboardSummary — hook around /api/dashboard/summary.
// Admin view passes ldcId when the user filters; LDC view always
// passes nothing (server scopes by JWT).
//
// `forceRefresh` rebuilds every snapshot server-side (super_admin only,
// server-gated) and then re-reads the new payload. Non-super_admin
// callers should hide the trigger UI; the server returns 403 either
// way.
// ================================================================

import { useState, useEffect, useCallback } from 'react';
import api from './api';

export function useDashboardSummary({ ldcId = null } = {}) {
  const [data,       setData      ] = useState(null);
  const [loading,    setLoading   ] = useState(true);
  const [error,      setError     ] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = ldcId ? { ldc_id: ldcId } : {};
      const res = await api.get('/api/dashboard/summary', { params });
      setData(res.data);
    } catch (err) {
      setError(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [ldcId]);

  const forceRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await api.post('/api/dashboard/refresh');
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, refresh: load, forceRefresh, refreshing };
}
