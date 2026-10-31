// Pure TLE helpers: parsing, classification and a simplified Kepler propagator.
// No React, no Cesium — easy to unit test or reuse.

export const CATEGORIES = [
  { id: 'gps', label: 'GPS & navigation' },
  { id: 'communication', label: 'Communication' },
  { id: 'weather', label: 'Weather' },
  { id: 'iss', label: 'ISS & space stations' },
  { id: 'other', label: 'Other' },
];

// Okabe & Ito palette: distinguishable under deuteranopia/protanopia/tritanopia.
export const CATEGORY_COLORS = {
  gps: '#D55E00',
  communication: '#56B4E9',
  weather: '#009E73',
  iss: '#F0E442',
  other: '#BBBBBB',
};

const EARTH_RADIUS_KM = 6371;
const MU = 398600.4418; // Earth GM (km³/s²)

export function classifySatellite(name) {
  const upper = name.toUpperCase();
  if (/GPS|NAVSTAR|GLONASS|GALILEO|BEIDOU/.test(upper)) return 'gps';
  if (/COMMUNICATION|COMSAT|INTELSAT|INMARSAT|IRIDIUM|GLOBALSTAR/.test(upper)) return 'communication';
  if (/STARLINK|ONEWEB|KUIPER|SES-|EUTELSAT|O3B/.test(upper)) return 'communication';
  if (/METEOSAT|METOP|FENGYUN|HIMAWARI|DMSP|WEATHER|GOES|NOAA/.test(upper)) return 'weather';
  if (/\bISS\b|INTERNATIONAL SPACE STATION|STATION|TIANGONG/.test(upper)) return 'iss';
  return 'other';
}

// Three-line TLE text → [{ name, noradId, line1, line2, category, elements }]
export function parseTle(text) {
  const lines = text.split('\n');
  const sats = [];
  for (let i = 0; i + 2 < lines.length; i += 3) {
    const name = lines[i].trim();
    const line1 = lines[i + 1];
    const line2 = lines[i + 2];
    if (name && line1?.startsWith('1 ') && line2?.startsWith('2 ')) {
      sats.push({
        name,
        noradId: line1.substring(2, 7).trim(),
        line1,
        line2,
        category: classifySatellite(name),
        elements: parseElements(line2),
      });
    }
  }
  return sats;
}

function parseElements(line2) {
  const p = line2.split(/\s+/);
  const meanMotion = parseFloat(p[7]); // rev/day
  const n = (meanMotion * 2 * Math.PI) / 86400; // rad/s
  const eccStr = line2.substring(26, 33).trim();
  return {
    inclination: parseFloat(p[2]),
    raan: parseFloat(p[3]),
    argPerigee: parseFloat(p[4]),
    meanAnomaly: parseFloat(p[5]),
    meanMotion,
    eccentricity: eccStr ? parseFloat('0.' + eccStr) : 0.0001,
    semiMajorAxisKm: Math.cbrt(MU / (n * n)), // Kepler's third law
    periodMs: 86400000 / meanMotion,
  };
}

// Approximate ECEF position in metres at time `atMs`. This is a plain Kepler
// propagation (no SGP4 perturbations, no Earth rotation), so positions are
// illustrative, not navigation-grade.
export function getSatellitePosition(sat, atMs = Date.now()) {
  const el = sat.elements;
  const deg = Math.PI / 180;
  const elapsedDays = atMs / 86400000;
  const M = ((el.meanAnomaly + el.meanMotion * 360 * elapsedDays) % 360) * deg;

  let E = M; // Kepler's equation, fixed-point iteration
  for (let j = 0; j < 10; j++) E = M + el.eccentricity * Math.sin(E);

  const a = el.semiMajorAxisKm;
  const e = el.eccentricity;
  const r = (a * (1 - e * e)) / (1 + e * Math.cos(E));
  const xo = r * Math.cos(E);
  const yo = r * Math.sin(E);

  const w = el.argPerigee * deg;
  const xp = xo * Math.cos(w) - yo * Math.sin(w);
  const yp = xo * Math.sin(w) + yo * Math.cos(w);

  const inc = el.inclination * deg;
  const yq = yp * Math.cos(inc);
  const zq = yp * Math.sin(inc);

  const o = el.raan * deg;
  return {
    x: (xp * Math.cos(o) - yq * Math.sin(o)) * 1000,
    y: (xp * Math.sin(o) + yq * Math.cos(o)) * 1000,
    z: zq * 1000,
  };
}

// Live orbital details for the info panel.
export function describeSatellite(sat, atMs = Date.now()) {
  const p = getSatellitePosition(sat, atMs);
  const rKm = Math.hypot(p.x, p.y, p.z) / 1000;
  const a = sat.elements.semiMajorAxisKm;
  const velocity = Math.sqrt(MU * (2 / rKm - 1 / a)); // vis-viva equation
  return {
    altitudeKm: rKm - EARTH_RADIUS_KM,
    velocityKms: velocity,
    inclinationDeg: sat.elements.inclination,
    eccentricity: sat.elements.eccentricity,
    periodMin: 1440 / sat.elements.meanMotion,
  };
}

export const DEMO_TLE = `ISS (ZARYA)
1 25544U 98067A   26010.50000000  .00016717  00000-0  29770-3 0  9005
2 25544  51.6416  339.5256 0002044  34.5857 120.4689 15.54244747434178
GPS BIIA-21  (PRN 13)
1 22014U 93042A   26010.54445277 -.00000256  00000-0  00000+0 0  9996
2 22014  55.0032   29.6485 0136188  10.7383 349.6381  2.00559201287421
NOAA 18
1 28654U 05018A   26010.49395833  .00000093  00000-0  79050-4 0  9993
2 28654  99.0090  170.4883 0014750 160.2277 199.9375 14.12517690814481
GOES 16
1 41866U 16071A   26010.00000000  .00000129  00000-0  65269-4 0  9998
2 41866   0.0163 261.9960 0001410 105.7819 254.2307  1.00272706 26184
HUBBLE SPACE TELESCOPE
1 20580U 90037B   26010.55069313  .00000892  00000-0  42899-4 0  9996
2 20580  28.4698 103.5691 0002836  84.6825 275.4682 15.09592934914651`;
