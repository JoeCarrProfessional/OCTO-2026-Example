import { useEffect, useState } from 'react';
import { Chip, IconButton, Paper, Typography } from '@mui/material';
import { Icon } from '@stratakit/mui';
import { svgDismiss } from '@stratakit/icons/dismiss';
import { CATEGORIES, CATEGORY_COLORS, describeSatellite } from '../lib/tle.js';

export default function SatelliteInfo({ satellite, onClose }) {
  const [details, setDetails] = useState(() => describeSatellite(satellite));

  // Altitude and speed change along the orbit; refresh them while selected.
  useEffect(() => {
    setDetails(describeSatellite(satellite));
    const timer = setInterval(() => setDetails(describeSatellite(satellite)), 2000);
    return () => clearInterval(timer);
  }, [satellite]);

  const category = CATEGORIES.find((c) => c.id === satellite.category);

  return (
    <Paper variant="outlined" className="info-card" id="info-panel">
      <header className="info-header">
        <div>
          <Typography variant="subtitle1" render={<h2 />}>
            {satellite.name}
          </Typography>
          <Chip
            size="small"
            label={category?.label ?? satellite.category}
            className="category-chip"
            style={{ '--category-color': CATEGORY_COLORS[satellite.category] }}
          />
        </div>
        <IconButton aria-label="Close satellite details" size="small" onClick={onClose} id="close-info">
          <Icon href={svgDismiss} />
        </IconButton>
      </header>
      <dl className="details">
        <Row label="NORAD ID" value={satellite.noradId} />
        <Row label="Altitude" value={`~${Math.round(details.altitudeKm).toLocaleString()} km`} />
        <Row label="Velocity" value={`~${details.velocityKms.toFixed(2)} km/s`} />
        <Row label="Inclination" value={`${details.inclinationDeg.toFixed(2)}°`} />
        <Row label="Eccentricity" value={details.eccentricity.toFixed(4)} />
        <Row label="Period" value={`${details.periodMin.toFixed(1)} min`} />
      </dl>
      <Typography variant="caption" className="muted">
        Simplified Kepler propagation — positions are approximate.
      </Typography>
    </Paper>
  );
}

function Row({ label, value }) {
  return (
    <div className="details-row">
      <Typography variant="body2" render={<dt />} className="muted">
        {label}
      </Typography>
      <Typography variant="body2" render={<dd />}>
        {value}
      </Typography>
    </div>
  );
}
