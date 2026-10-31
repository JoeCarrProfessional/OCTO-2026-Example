import { Paper, Stack, Typography } from '@mui/material';
import { CATEGORIES, CATEGORY_COLORS } from '../lib/tle.js';

export default function Legend() {
  return (
    <Paper variant="outlined" className="legend" render={<ul aria-label="Satellite categories" />}>
      {CATEGORIES.map((c) => (
        <Stack key={c.id} direction="row" spacing={1} alignItems="center" render={<li />}>
          <span className="legend-swatch" style={{ backgroundColor: CATEGORY_COLORS[c.id] }} />
          <Typography variant="caption">{c.label}</Typography>
        </Stack>
      ))}
    </Paper>
  );
}
