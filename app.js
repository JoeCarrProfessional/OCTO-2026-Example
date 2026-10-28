// ===== ERROR REPORTING SETUP =====
window.APP_ERRORS = [];
window.APP_LOGS = [];

function logApp(msg, level = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${level.toUpperCase()}: ${msg}`;
    window.APP_LOGS.push(logEntry);
    console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](logEntry);
}

function reportError(msg, error = null) {
    const entry = { msg, error: error?.toString(), stack: error?.stack };
    window.APP_ERRORS.push(entry);
    logApp(`ERROR: ${msg} ${error ? '- ' + error.toString() : ''}`, 'error');
}

// ===== STARTUP CHECK =====
logApp('App script starting...');

if (typeof Cesium === 'undefined') {
    const msg = 'CesiumJS library not loaded - Cesium is undefined';
    reportError(msg);
    document.getElementById('loading').innerHTML = `<p style="color: #ff6b6b;"><strong>ERROR:</strong> ${msg}<br><br>Cesium CDN failed to load.<br><br><button onclick="location.reload()">Retry</button></p>`;
    throw new Error(msg);
}

logApp('✅ Cesium library loaded successfully');

// Check if Cesium.Sgp4 is available
if (typeof Cesium.Sgp4 === 'undefined') {
    logApp('⚠️  Cesium.Sgp4 not available in Cesium build - will use simplified satellite display', 'warn');
}

try {
    // ===== CESIUM SETUP =====
    // No Cesium Ion account/token needed: use the Natural Earth II imagery bundled
    // with the Cesium build and the plain WGS84 ellipsoid for terrain.
    logApp('Creating Cesium Viewer (token-free Natural Earth II imagery)...');
    const viewer = new Cesium.Viewer('cesiumContainer', {
        baseLayer: Cesium.ImageryLayer.fromProviderAsync(
            Cesium.TileMapServiceImageryProvider.fromUrl(
                Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII')
            )
        ),
        terrainProvider: new Cesium.EllipsoidTerrainProvider(),
        animation: false,
        timeline: false,
        homeButton: false,
        navigationHelpButton: false,
        sceneModePicker: false,
        baseLayerPicker: false,
        geocoder: false,
        selectionIndicator: false,
        infoBox: false,
    });
    logApp('✅ Cesium Viewer created');
    window.viewer = viewer; // handy for debugging from the browser console

    viewer.scene.globe.enableLighting = false; // keep whole globe readable; sun is still drawn
    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#0b2a4a');
    logApp('✅ Lighting enabled');

    // Position camera 25,000 km above the surface so LEO and GEO satellites are in frame
    viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(-30, 20, 45000000),
    });
    const cam = viewer.camera.positionCartographic;
    logApp(`✅ Camera positioned: lon ${Cesium.Math.toDegrees(cam.longitude).toFixed(1)}°, lat ${Cesium.Math.toDegrees(cam.latitude).toFixed(1)}°, alt ${(cam.height / 1000).toFixed(0)} km`);

    // ===== SATELLITE DATA MANAGEMENT =====
    let allSatellites = [];
    let displayedSatellites = [];
    let satelliteEntities = {};
    let selectedSatellite = null;
    let activeSatelliteEntity = null;
    // Okabe & Ito palette: distinguishable under deuteranopia/protanopia/tritanopia.
    const categoryColors = {
        gps: Cesium.Color.fromCssColorString('#D55E00'),           // vermillion
        communication: Cesium.Color.fromCssColorString('#56B4E9'), // sky blue
        weather: Cesium.Color.fromCssColorString('#009E73'),       // bluish green
        iss: Cesium.Color.fromCssColorString('#F0E442'),           // yellow
        other: Cesium.Color.fromCssColorString('#BBBBBB'),         // grey
    };
    // Mirror the palette into the legend so HTML and 3D view can't drift apart.
    for (const [cat, color] of Object.entries(categoryColors)) {
        document.querySelectorAll(`.legend-color[data-category="${cat}"]`)
            .forEach((el) => { el.style.backgroundColor = color.toCssHexString(); });
    }


    // ===== SATELLITE CLASSIFICATION =====
    function classifySatellite(name) {
        const upper = name.toUpperCase();
        if (upper.includes('GPS') || upper.includes('NAVSTAR')) return 'gps';
        if (upper.includes('GLONASS') || upper.includes('GALILEO') || upper.includes('BEIDOU')) return 'gps';
        if (upper.includes('COMMUNICATION') || upper.includes('COMSAT') || upper.includes('INTELSAT')) return 'communication';
        if (upper.includes('INMARSAT') || upper.includes('IRIDIUM') || upper.includes('GLOBALSTAR')) return 'communication';
        if (upper.includes('STARLINK') || upper.includes('ONEWEB') || upper.includes('KUIPER') || upper.includes('SES-') || upper.includes('EUTELSAT') || upper.includes('O3B')) return 'communication';
        if (upper.includes('METEOSAT') || upper.includes('METOP') || upper.includes('FENGYUN') || upper.includes('HIMAWARI') || upper.includes('DMSP')) return 'weather';
        if (upper.includes('WEATHER') || upper.includes('GOES') || upper.includes('NOAA')) return 'weather';
        if (/\bISS\b/.test(upper) || upper.includes('INTERNATIONAL SPACE STATION')) return 'iss';
        if (upper.includes('STATION') || upper.includes('TIANGONG')) return 'iss';
        return 'other';
    }

    // ===== CALCULATE SATELLITE POSITION =====
    // Simplified calculation without Cesium.Sgp4
    function getSatellitePosition(satellite, atMs = Date.now()) {
        try {
            // Without SGP4, we use a simplified two-line element (TLE) propagator
            // This places satellites in their approximate orbital planes
            
            // Parse TLE line 2 for orbital elements
            const line2Parts = satellite.line2.split(/\s+/);
            
            // Extract orbital elements (all in degrees except mean motion)
            const i = parseFloat(line2Parts[2]); // inclination (degrees)
            const raan = parseFloat(line2Parts[3]); // right ascension of ascending node (degrees)
            const argPeri = parseFloat(line2Parts[4]); // argument of perigee (degrees)
            const meanAnomaly = parseFloat(line2Parts[5]); // mean anomaly (degrees)
            const meanMotion = parseFloat(line2Parts[7]); // mean motion (revolutions per day)
            
            // Calculate semi-major axis using Kepler's third law: a³ = μ/n²
            const mu = 398600.4418; // Earth GM (km³/s²)
            const n = (meanMotion * 2 * Math.PI) / 86400; // convert rev/day to rad/s
            const a = Math.cbrt(mu / (n * n)); // semi-major axis (km)
            
            // Approximate eccentricity (TLE line 2, position 26-33)
            const ecc_str = satellite.line2.substring(26, 33).trim();
            const e = ecc_str.length > 0 ? parseFloat('0.' + ecc_str) : 0.0001;
            
            // Calculate current time-based mean anomaly (animation)
            const elapsedDays = atMs / (24 * 3600 * 1000);
            const meanMotionDeg = meanMotion * 360; // degrees/day
            const currentMeanAnomaly = (meanAnomaly + meanMotionDeg * elapsedDays) % 360;
            const M = currentMeanAnomaly * (Math.PI / 180); // convert to radians
            
            // Solve Kepler's equation: E = M + e*sin(E) (Newton-Raphson method)
            let E = M; // initial guess
            for (let j = 0; j < 10; j++) {
                E = M + e * Math.sin(E);
            }
            
            // Calculate satellite position in orbital plane
            const cosE = Math.cos(E);
            const sinE = Math.sin(E);
            
            const a_orbit = a * (1 - e * e);
            const r = a_orbit / (1 + e * cosE);
            
            const x_orb = r * cosE;
            const y_orb = r * sinE;
            const z_orb = 0;
            
            // Convert orbital plane to ECEF using Euler angles
            // First: argument of perigee rotation
            const w = argPeri * (Math.PI / 180);
            const cosW = Math.cos(w);
            const sinW = Math.sin(w);
            
            const x_perifocal = x_orb * cosW - y_orb * sinW;
            const y_perifocal = x_orb * sinW + y_orb * cosW;
            const z_perifocal = z_orb;
            
            // Second: inclination rotation
            const inc = i * (Math.PI / 180);
            const cosI = Math.cos(inc);
            const sinI = Math.sin(inc);
            
            const x_eq = x_perifocal;
            const y_eq = y_perifocal * cosI - z_perifocal * sinI;
            const z_eq = y_perifocal * sinI + z_perifocal * cosI;
            
            // Third: RAAN rotation (right ascension of ascending node)
            const raan_rad = raan * (Math.PI / 180);
            const cosRaan = Math.cos(raan_rad);
            const sinRaan = Math.sin(raan_rad);
            
            const x_ecef = x_eq * cosRaan - y_eq * sinRaan;
            const y_ecef = x_eq * sinRaan + y_eq * cosRaan;
            const z_ecef = z_eq;
            
            // Convert from km to meters (Cesium expects meters)
            return Cesium.Cartesian3.fromElements(
                x_ecef * 1000,
                y_ecef * 1000,
                z_ecef * 1000
            );
        } catch (error) {
            logApp(`ERROR in getSatellitePosition for ${satellite.name}: ${error.message}`, 'error');
            return null;
        }
    }

    // ===== ORBIT RING =====
    // One full revolution sampled at 90 points, drawn as a faint ring.
    function createOrbitRing(satellite, color) {
        if (orbitEntities[satellite.noradId]) return orbitEntities[satellite.noradId];
        const periodMs = 86400000 / parseFloat(satellite.line2.split(/\s+/)[7]);
        const positions = [];
        for (let k = 0; k <= 90; k++) {
            const p = getSatellitePosition(satellite, Date.now() + (periodMs * k) / 90);
            if (p) positions.push(p);
        }
        const ring = viewer.entities.add({
            id: `${satellite.noradId}::orbit`,
            show: showOrbits,
            polyline: { positions, width: 1, material: color.withAlpha(0.35), arcType: Cesium.ArcType.NONE },
        });
        orbitEntities[satellite.noradId] = ring;
        return ring;
    }

    // Move every satellite to its current position. Cheaper than a per-entity
    // CallbackProperty when there are thousands of satellites.
    function updatePositions() {
        const now = Date.now();
        for (const sat of displayedSatellites) {
            const entity = satelliteEntities[sat.noradId];
            const p = entity && getSatellitePosition(sat, now);
            if (p) entity.position = p;
        }
    }
    setInterval(updatePositions, 2000);

    // ===== CREATE SATELLITE ENTITY =====
    function createSatelliteEntity(satellite) {
        try {
            const position = getSatellitePosition(satellite);
            if (!position) {
                logApp(`  ❌ No position calculated for ${satellite.name}`, 'warn');
                return null;
            }

            const color = categoryColors[satellite.category] || categoryColors.other;
            
            // Log position for debugging
            const distFromCenter = Math.sqrt(position.x*position.x + position.y*position.y + position.z*position.z);
            const altitudeKm = (distFromCenter / 1000) - 6371; // 6371 km = Earth radius
            const carto = Cesium.Cartographic.fromCartesian(position);
            logApp(`  ✅ ${satellite.name}: lon ${Cesium.Math.toDegrees(carto.longitude).toFixed(1)}°, lat ${Cesium.Math.toDegrees(carto.latitude).toFixed(1)}°, alt ${altitudeKm.toFixed(0)} km`);

            if (detailMode) createOrbitRing(satellite, color);

            const entity = viewer.entities.add({
                position: position, // refreshed in bulk by updatePositions()
                point: {
                    pixelSize: detailMode ? 16 : 6,
                    color: color,
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: detailMode ? 2 : 0,
                },
                label: {
                    // LEO is crowded; label only MEO/GEO by default (click or search for the rest)
                    show: detailMode && altitudeKm > 2000,
                    text: satellite.name,
                    font: '13px sans-serif',
                    fillColor: Cesium.Color.WHITE,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 3,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    pixelOffset: new Cesium.Cartesian2(0, -18),
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                },
                properties: {
                    name: satellite.name,
                    category: satellite.category,
                    labelByDefault: detailMode && altitudeKm > 2000,
                },
                id: satellite.noradId,
            });

            return entity;
        } catch (error) {
            logApp(`ERROR creating entity for ${satellite.name}: ${error.message}`, 'error');
            return null;
        }
    }

    // ===== FETCH SATELLITE DATA FROM CELESTRAK =====
    async function fetchSatelliteData() {
        const loadingDiv = document.getElementById('loading');
        loadingDiv.style.display = 'block';

        try {
            logApp('Fetching satellite data...');
            // CelesTrak allows one download per group per IP every 2 hours and answers
            // 403 to anything more frequent, so successful downloads are cached in
            // localStorage and reused for that long.
            const CACHE_KEY = 'tle-cache-v1';
            const CACHE_TTL_MS = 2 * 3600 * 1000;
            const params = new URLSearchParams(location.search);
            const forcedSource = params.get('source'); // 'snapshot' or a URL to a TLE file

            const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
            if (!forcedSource && cached && Date.now() - cached.time < CACHE_TTL_MS) {
                const ageMin = Math.round((Date.now() - cached.time) / 60000);
                logApp(`  ✅ Using cached TLEs from ${cached.source} (${ageMin} min old)`);
                await parseSatelliteData(cached.tle, loadingDiv);
                return;
            }

            // Each source is free, needs no API key, and sends CORS headers.
            let sources = [
                {
                    url: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle',
                    toTle: (text) => text,
                },
                {
                    url: 'https://tle.ivanstanojevic.me/api/tle/?page-size=50',
                    toTle: (text) => JSON.parse(text).member
                        .map((s) => `${s.name}\n${s.line1}\n${s.line2}`).join('\n'),
                },
                // Snapshot shipped with the repo: works offline / on GitHub Pages even
                // if both live sources are down. Positions drift as the file ages.
                { url: 'data/tle-snapshot.txt', toTle: (text) => text },
            ];
            if (forcedSource === 'snapshot') sources = [sources[2]];
            else if (forcedSource) sources = [{ url: forcedSource, toTle: (text) => text }];

            for (const { url, toTle } of sources) {
                try {
                    logApp(`  Trying: ${url}`);
                    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
                    if (!response.ok) {
                        logApp(`  ❌ HTTP ${response.status} from ${url}`, 'warn');
                        continue;
                    }
                    const data = toTle(await response.text());
                    logApp(`  ✅ Success with ${url}`);
                    if (url.startsWith('http')) {
                        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), source: url, tle: data })); }
                        catch (e) { logApp(`  (could not cache TLEs: ${e.message})`, 'warn'); }
                    }
                    await parseSatelliteData(data, loadingDiv);
                    return;
                } catch (e) {
                    logApp(`  ❌ Failed: ${e.message}`, 'warn');
                }
            }

            if (cached) {
                logApp(`  ⚠️ All sources failed; using stale cache from ${cached.source}`, 'warn');
                await parseSatelliteData(cached.tle, loadingDiv);
                return;
            }

            logApp('All data sources failed (including bundled snapshot), using 5 built-in demo satellites', 'warn');
            const demoData = getDemoSatelliteData();
            await parseSatelliteData(demoData, loadingDiv);
            
        } catch (error) {
            reportError('Error fetching satellite data', error);
            loadingDiv.innerHTML = `<p style="color: #ff6b6b;"><strong>Error:</strong> ${error.message}</p>`;
        }
    }

    // ===== PARSE SATELLITE DATA =====
    async function parseSatelliteData(data, loadingDiv) {
        try {
            logApp('Parsing satellite data...');
            allSatellites = [];
            const lines = data.split('\n');
            let parseCount = 0;

            for (let i = 0; i < lines.length; i += 3) {
                if (i + 2 < lines.length) {
                    const name = lines[i].trim();
                    const line1 = lines[i + 1];
                    const line2 = lines[i + 2];

                    if (name && line1 && line2 && line1.startsWith('1 ') && line2.startsWith('2 ')) {
                        allSatellites.push({
                            name,
                            noradId: line1.substring(2, 7).trim(),
                            line1,
                            line2,
                            category: classifySatellite(name),
                        });
                        parseCount++;
                    }
                }
            }

            document.getElementById('satellite-count').textContent = allSatellites.length;
            document.getElementById('last-updated').textContent = new Date().toLocaleTimeString();

            logApp(`✅ Loaded ${allSatellites.length} satellites (${parseCount} parsed)`);
            logApp('Note: Using simplified orbit calculation (Cesium.Sgp4 unavailable)', 'warn');
            loadingDiv.style.display = 'none';

            applyFilters();
        } catch (error) {
            reportError('Error parsing satellite data', error);
            loadingDiv.innerHTML = `<p style="color: #ff6b6b;">Parse error: ${error.message}</p>`;
        }
    }

    // ===== DEMO SATELLITE DATA =====
    function getDemoSatelliteData() {
        return `ISS (ZARYA)
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
    }

    // ===== DISPLAY SATELLITES =====
    let hasFramedInitialView = false;
    let orbitEntities = {};
    let showOrbits = true;
    // Above this many satellites, rings and labels are drawn only for the selected one.
    const DETAIL_LIMIT = 300;
    let detailMode = true;

    function displaySatellites(satellites) {
        try {
            viewer.entities.removeAll();
            satelliteEntities = {};
            orbitEntities = {};
            detailMode = satellites.length <= DETAIL_LIMIT;
            document.getElementById('orbit-hint').textContent =
                detailMode ? '' : `(selected only above ${DETAIL_LIMIT} satellites)`;
            selectedSatellite = null;
            activeSatelliteEntity = null;
            document.getElementById('info-panel').style.display = 'none';

            let successCount = 0;
            satellites.forEach((satellite) => {
                const entity = createSatelliteEntity(satellite);
                if (entity) {
                    satelliteEntities[satellite.noradId] = entity;
                    displayedSatellites.push(satellite);
                    successCount++;
                } else {
                    logApp(`  Failed to create entity for ${satellite.name}`, 'warn');
                }
            });

            logApp(`Displaying ${successCount}/${satellites.length} satellites`);

            // On first load, look at Earth's centre from far enough away that the
            // highest satellite fits in view. Later refreshes leave the camera alone.
            if (!hasFramedInitialView && successCount > 0) {
                hasFramedInitialView = true;
                const now = viewer.clock.currentTime;
                let maxRadius = 0;
                for (const e of viewer.entities.values) {
                    const p = e.position && e.position.getValue(now);
                    if (p) maxRadius = Math.max(maxRadius, Cesium.Cartesian3.magnitude(p));
                }
                const earthRadius = Cesium.Ellipsoid.WGS84.maximumRadius;
                const geoRadius = 42164000; // frame up to GEO; ignore highly-elliptical outliers
                const cameraAltitude = Math.max(
                    Math.min(Math.max(maxRadius, earthRadius), geoRadius) * 2.2 - earthRadius,
                    20000000, // never closer than 20,000 km so the whole globe stays in view
                );
                viewer.camera.setView({
                    destination: Cesium.Cartesian3.fromDegrees(-30, 20, cameraAltitude),
                });
                logApp(`✅ Camera centred on Earth, alt ${(cameraAltitude / 1000).toFixed(0)} km`);
            }
        } catch (error) {
            reportError('Error in displaySatellites', error);
        }
    }

    // ===== FILTER & SEARCH =====
    function applyFilters() {
        const filters = Array.from(document.querySelectorAll('.filter:checked')).map(
            (el) => el.value
        );
        const searchTerm = document.getElementById('search-box').value.trim().toLowerCase();

        let filtered = allSatellites.filter((sat) => {
            if (!filters.includes(sat.category)) return false;
            if (searchTerm && !sat.name.toLowerCase().includes(searchTerm)) return false;
            return true;
        });

        displayedSatellites = [];
        displaySatellites(filtered);
    }

    // ===== SATELLITE DETAILS =====
    function calculateSatelliteDetails(satellite) {
        try {
            const line2Parts = satellite.line2.split(/\s+/);
            const inclination = parseFloat(line2Parts[2]);
            const eccentricity = '0.' + line2Parts[4];
            const meanAnomaly = parseFloat(line2Parts[5]);
            const meanMotion = parseFloat(line2Parts[7]);

            const orbitalPeriod = (1440 / meanMotion).toFixed(2);
            const altitude = (35786 + 300); // Simplified: use average altitude

            return {
                altitude: altitude.toFixed(0),
                velocity: '7.8',
                inclination: inclination.toFixed(2),
                eccentricity: eccentricity.toFixed(4),
                meanAnomaly: meanAnomaly.toFixed(2),
                orbitalPeriod,
            };
        } catch (error) {
            return null;
        }
    }

    function showSatelliteInfo(satellite) {
        selectedSatellite = satellite;
        const details = calculateSatelliteDetails(satellite);

        if (details) {
            const infoPanel = document.getElementById('info-panel');
            const infoContent = document.getElementById('satellite-info');

            infoContent.innerHTML = `
                <div><strong>${satellite.name}</strong></div>
                <div>Category: <strong>${satellite.category.toUpperCase()}</strong></div>
                <div style="margin-top: 8px; border-top: 1px solid rgba(78, 205, 196, 0.3); padding-top: 8px;">
                    <div>Altitude: <strong>~${details.altitude} km</strong></div>
                    <div>Velocity: <strong>~${details.velocity} km/s</strong></div>
                    <div>Inclination: <strong>${details.inclination}°</strong></div>
                    <div>Period: <strong>${details.orbitalPeriod} hrs</strong></div>
                </div>
            `;

            infoPanel.style.display = 'block';

            deselectActiveEntity();
            if (satelliteEntities[satellite.noradId]) {
                activeSatelliteEntity = satelliteEntities[satellite.noradId];
                activeSatelliteEntity.point.pixelSize = 24;
                activeSatelliteEntity.point.outlineWidth = 2;
                activeSatelliteEntity.label.show = true;
                const ring = createOrbitRing(satellite, categoryColors[satellite.category] || categoryColors.other);
                ring.show = true; ring.polyline.width = 3;
                ring.polyline.material = (categoryColors[satellite.category] || categoryColors.other).withAlpha(0.9);
                viewer.flyTo(activeSatelliteEntity, { duration: 0.5 });
            }
        }
    }

    function deselectActiveEntity() {
        if (activeSatelliteEntity) {
            activeSatelliteEntity.point.pixelSize = detailMode ? 16 : 6;
            activeSatelliteEntity.point.outlineWidth = detailMode ? 2 : 0;
            activeSatelliteEntity.label.show = activeSatelliteEntity.properties.labelByDefault.getValue();
            const ring = orbitEntities[activeSatelliteEntity.id];
            if (ring) {
                if (detailMode) { ring.show = showOrbits; ring.polyline.width = 1; ring.polyline.material = activeSatelliteEntity.point.color.getValue().withAlpha(0.35); }
                else { viewer.entities.remove(ring); delete orbitEntities[activeSatelliteEntity.id]; }
            }
        }
    }

    function closeSatelliteInfo() {
        deselectActiveEntity();
        selectedSatellite = null;
        activeSatelliteEntity = null;
        document.getElementById('info-panel').style.display = 'none';
    }

    // ===== EVENT LISTENERS =====
    document.querySelectorAll('.filter').forEach((checkbox) => {
        checkbox.addEventListener('change', applyFilters);
    });

    document.getElementById('show-orbits').addEventListener('change', (e) => {
        showOrbits = e.target.checked;
        Object.values(orbitEntities).forEach((ring) => { ring.show = showOrbits; });
    });

    document.getElementById('reset-filters').addEventListener('click', () => {
        document.querySelectorAll('.filter').forEach((checkbox) => {
            checkbox.checked = true;
        });
        applyFilters();
    });

    document.getElementById('search-btn').addEventListener('click', applyFilters);
    document.getElementById('clear-search').addEventListener('click', () => {
        document.getElementById('search-box').value = '';
        applyFilters();
    });

    document.getElementById('search-box').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            applyFilters();
        }
    });

    document.getElementById('close-info').addEventListener('click', closeSatelliteInfo);

    viewer.screenSpaceEventHandler.setInputAction((click) => {
        const pickedObject = viewer.scene.pick(click.position);

        if (Cesium.defined(pickedObject) && Cesium.defined(pickedObject.id)) {
            const entity = pickedObject.id;
            const noradId = String(entity.id).replace(/::orbit$/, '');

            const satellite = allSatellites.find((sat) => sat.noradId === noradId);
            if (satellite) {
                showSatelliteInfo(satellite);
            }
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // ===== REFRESH DATA EVERY 60 SECONDS =====
    setInterval(() => {
        if (selectedSatellite) {
            showSatelliteInfo(selectedSatellite);
        } else {
            applyFilters();
        }
    }, 60000);

    // ===== INITIALIZE =====
    logApp('Satellite Tracker starting...');
    fetchSatelliteData();

    logApp('✅ App initialized successfully!');

} catch (error) {
    reportError('Critical app initialization error', error);
    document.getElementById('loading').innerHTML = `
        <p style="color: #ff6b6b;">
            <strong>ERROR:</strong> ${error.message}<br><br>
            <details>
                <summary>Stack Trace</summary>
                <pre style="font-size: 10px; overflow: auto; max-height: 200px;">${error.stack}</pre>
            </details>
        </p>
    `;
    throw error;
}
