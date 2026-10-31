import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, CircularProgress, Stack, Typography } from '@mui/material';
import SatelliteGlobe from './globe/SatelliteGlobe.jsx';
import Sidebar from './components/Sidebar.jsx';
import Legend from './components/Legend.jsx';
import StrataKitBadge from './components/StrataKitBadge.jsx';
import { CATEGORIES, parseTle } from './lib/tle.js';
import { loadTleText } from './lib/dataSources.js';
import { logApp } from './lib/log.js';

const ALL_CATEGORIES = CATEGORIES.map((c) => c.id);

export default function App() {
  const [allSatellites, setAllSatellites] = useState([]);
  const [status, setStatus] = useState({ state: 'loading' }); // loading | ready | error
  const [categories, setCategories] = useState(ALL_CATEGORIES);
  const [search, setSearch] = useState(''); // applied search term
  const [showOrbits, setShowOrbits] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    logApp('Satellite Tracker starting...');
    loadTleText()
      .then(({ tle, source }) => {
        if (cancelled) return;
        const sats = parseTle(tle);
        logApp(`Loaded ${sats.length} satellites from ${source}`);
        setAllSatellites(sats);
        setStatus({ state: 'ready', source, loadedAt: new Date() });
      })
      .catch((e) => {
        logApp(`Failed to load satellites: ${e.message}`, 'error');
        if (!cancelled) setStatus({ state: 'error', message: e.message });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return allSatellites.filter(
      (s) => categories.includes(s.category) && (!term || s.name.toLowerCase().includes(term)),
    );
  }, [allSatellites, categories, search]);

  // Drop the selection if the selected satellite is filtered out.
  useEffect(() => {
    if (selectedId && !visible.some((s) => s.noradId === selectedId)) setSelectedId(null);
  }, [visible, selectedId]);

  const selected = useMemo(
    () => (selectedId ? allSatellites.find((s) => s.noradId === selectedId) : null),
    [allSatellites, selectedId],
  );

  const resetFilters = useCallback(() => {
    setCategories(ALL_CATEGORIES);
    setSearch('');
  }, []);

  return (
    <div className="layout">
      <Sidebar
        total={allSatellites.length}
        shown={visible.length}
        status={status}
        categories={categories}
        onCategoriesChange={setCategories}
        search={search}
        onSearch={setSearch}
        showOrbits={showOrbits}
        onShowOrbitsChange={setShowOrbits}
        onReset={resetFilters}
        selected={selected}
        onCloseSelected={() => setSelectedId(null)}
      />
      <main className="main">
        <SatelliteGlobe
          satellites={visible}
          showOrbits={showOrbits}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
        <Legend />
        <StrataKitBadge />
        {status.state === 'loading' && (
          <Stack className="overlay" direction="row" spacing={2} alignItems="center">
            <CircularProgress size={20} />
            <Typography variant="body2">Loading satellite data…</Typography>
          </Stack>
        )}
        {status.state === 'error' && (
          <Alert className="overlay" severity="error">
            {status.message}
          </Alert>
        )}
      </main>
    </div>
  );
}
