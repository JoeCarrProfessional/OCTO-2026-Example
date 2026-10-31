import { useState } from 'react';
import {
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  FormGroup,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Icon } from '@stratakit/mui';
import { svgSearch } from '@stratakit/icons/search';
import { svgDismiss } from '@stratakit/icons/dismiss';
import { svgUndo } from '@stratakit/icons/undo';
import { CATEGORIES } from '../lib/tle.js';
import { DETAIL_LIMIT } from '../globe/SatelliteGlobe.jsx';
import SatelliteInfo from './SatelliteInfo.jsx';
import DebugLog from './DebugLog.jsx';

export default function Sidebar({
  total,
  shown,
  status,
  categories,
  onCategoriesChange,
  search,
  onSearch,
  showOrbits,
  onShowOrbitsChange,
  onReset,
  selected,
  onCloseSelected,
}) {
  const [draft, setDraft] = useState(search);
  const denseMode = shown > DETAIL_LIMIT;

  function toggleCategory(id, checked) {
    onCategoriesChange(checked ? [...categories, id] : categories.filter((c) => c !== id));
  }

  function submitSearch(e) {
    e.preventDefault();
    onSearch(draft);
  }

  function clearSearch() {
    setDraft('');
    onSearch('');
  }

  return (
    <aside className="sidebar">
      <Stack spacing={3} className="sidebar-content">
        <header className="app-header">
          <Typography variant="h3" render={<h1 />} className="app-title">
            <span aria-hidden="true">🛰️</span> Satellite Tracker
          </Typography>
          <Typography variant="body1" className="muted">
            Live view of orbiting satellites
          </Typography>
          <Typography variant="caption" className="muted">
            OCTO 2026 example project
          </Typography>
        </header>

        <Stack direction="row" spacing={4}>
          <Stat label="Showing" value={status.state === 'ready' ? `${shown.toLocaleString()} / ${total.toLocaleString()}` : '—'} />
          <Stat label="Data loaded" value={status.loadedAt ? status.loadedAt.toLocaleTimeString() : '—'} />
        </Stack>

        <Divider />

        <section>
          <Typography variant="subtitle2" render={<h2 />} className="section-title">
            Filter by category
          </Typography>
          <FormGroup>
            {CATEGORIES.map((c) => (
              <FormControlLabel
                key={c.id}
                label={c.label}
                control={
                  <Checkbox checked={categories.includes(c.id)} onChange={(e) => toggleCategory(c.id, e.target.checked)} />
                }
              />
            ))}
          </FormGroup>
          <Tooltip title={denseMode ? `Above ${DETAIL_LIMIT} satellites, orbits are drawn only for the selected one` : ''}>
            <div className="orbit-toggle">
              <FormControlLabel
                label={denseMode ? 'Show orbit paths (selected only)' : 'Show orbit paths'}
                control={<Switch checked={showOrbits} onChange={(e) => onShowOrbitsChange(e.target.checked)} />}
              />
            </div>
          </Tooltip>
        </section>

        <section>
          <Typography variant="subtitle2" render={<h2 />} className="section-title">
            Search
          </Typography>
          <form onSubmit={submitSearch}>
            <TextField
              fullWidth
              size="small"
              placeholder="Name, e.g. ISS or STARLINK"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              slotProps={{
                htmlInput: { 'aria-label': 'Search satellites by name', id: 'search-box' },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Icon href={svgSearch} />
                    </InputAdornment>
                  ),
                  endAdornment: draft ? (
                    <InputAdornment position="end">
                      <IconButton aria-label="Clear search" size="small" onClick={clearSearch}>
                        <Icon href={svgDismiss} />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                },
              }}
            />
            <Stack direction="row" spacing={1} className="button-row">
              <Button type="submit" variant="contained" id="search-btn">
                Search
              </Button>
              <Button variant="outlined" startIcon={<Icon href={svgUndo} />} onClick={() => { clearSearch(); onReset(); }}>
                Reset filters
              </Button>
            </Stack>
          </form>
        </section>

        {selected && <SatelliteInfo satellite={selected} onClose={onCloseSelected} />}

        <DebugLog />

        <footer className="footer">
          <Typography variant="caption" className="muted" render={<p />}>
            Data: {describeSource(status.source)}
          </Typography>
          <Typography variant="caption" className="muted" render={<p />}>
            Built with{' '}
            <Link href="https://cesium.com/" target="_blank" rel="noreferrer">
              CesiumJS
            </Link>{' '}
            and{' '}
            <Link href="https://stratakit.bentley.com/" target="_blank" rel="noreferrer">
              StrataKit
            </Link>
          </Typography>
        </footer>
      </Stack>
    </aside>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <Typography variant="caption" className="muted">
        {label}
      </Typography>
      <Typography variant="h6" render={<p />}>
        {value}
      </Typography>
    </div>
  );
}

function describeSource(source) {
  if (!source) return 'CelesTrak';
  if (/^https?:\/\//.test(source)) return source.replace(/^https?:\/\//, '').split('/')[0];
  if (source.startsWith('built-in')) return source;
  return 'bundled snapshot (offline)';
}
