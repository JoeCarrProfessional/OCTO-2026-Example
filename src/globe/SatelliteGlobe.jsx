import { useEffect, useRef } from 'react';
import { CATEGORY_COLORS, getSatellitePosition } from '../lib/tle.js';
import { logApp } from '../lib/log.js';

// Above this many satellites, orbit rings and labels are drawn only for the selected one.
export const DETAIL_LIMIT = 300;
const GEO_RADIUS_M = 42164000;
const IDLE_SPIN_RAD_PER_S = 0.08; // one revolution in ~80 seconds

// Owns the Cesium viewer. React tells it *what* to show (satellites, selection,
// orbit toggle); it manages the entities imperatively for performance.
export default function SatelliteGlobe({ satellites, showOrbits, selectedId, onSelect }) {
  const containerRef = useRef(null);
  const state = useRef(null); // { viewer, entities, rings, colors, detailMode, framed }

  // Create the viewer once.
  useEffect(() => {
    const Cesium = window.Cesium;
    if (!Cesium) {
      logApp('CesiumJS library not loaded - Cesium is undefined', 'error');
      return;
    }
    // Token-free: Natural Earth II imagery bundled with Cesium, plain ellipsoid terrain.
    const viewer = new Cesium.Viewer(containerRef.current, {
      baseLayer: Cesium.ImageryLayer.fromProviderAsync(
        Cesium.TileMapServiceImageryProvider.fromUrl(Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII')),
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
    viewer.scene.globe.enableLighting = false;
    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#0b2a4a');
    viewer.camera.setView({ destination: Cesium.Cartesian3.fromDegrees(-30, 20, 45000000) });
    window.viewer = viewer; // handy for debugging from the browser console
    logApp('Cesium Viewer created');

    const colors = Object.fromEntries(
      Object.entries(CATEGORY_COLORS).map(([k, v]) => [k, Cesium.Color.fromCssColorString(v)]),
    );
    state.current = { viewer, entities: {}, rings: {}, sats: [], colors, detailMode: true, framed: false, showOrbits };

    viewer.screenSpaceEventHandler.setInputAction((click) => {
      const picked = viewer.scene.pick(click.position);
      if (Cesium.defined(picked) && Cesium.defined(picked.id)) {
        onSelect(String(picked.id.id).replace(/::orbit$/, ''));
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // Slow idle spin around Earth's axis until the user drags (zooming with the
    // wheel or right-drag keeps spinning) or a satellite is selected.
    const spin = { active: true, dragFrom: null, lastMs: performance.now() };
    const onSpin = (scene) => {
      const now = performance.now();
      const seconds = Math.min((now - spin.lastMs) / 1000, 0.1); // clamp after tab was hidden
      spin.lastMs = now;
      if (spin.active) scene.camera.rotate(Cesium.Cartesian3.UNIT_Z, -IDLE_SPIN_RAD_PER_S * seconds);
    };
    viewer.scene.postUpdate.addEventListener(onSpin);
    const stopSpin = () => {
      if (spin.active) logApp('Idle spin stopped');
      spin.active = false;
    };
    const handler = viewer.screenSpaceEventHandler;
    handler.setInputAction((e) => { spin.dragFrom = e.position.clone(); }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
    handler.setInputAction(() => { spin.dragFrom = null; }, Cesium.ScreenSpaceEventType.LEFT_UP);
    handler.setInputAction((e) => {
      // Only a real drag stops the spin; a plain click (to pick a satellite) does not.
      if (spin.dragFrom && Cesium.Cartesian2.distance(spin.dragFrom, e.endPosition) > 4) stopSpin();
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    handler.setInputAction(stopSpin, Cesium.ScreenSpaceEventType.PINCH_START);
    state.current.stopSpin = stopSpin;

    // Bulk position refresh: far cheaper than a CallbackProperty per entity.
    const timer = setInterval(() => {
      const s = state.current;
      if (!s) return;
      const now = Date.now();
      for (const sat of s.sats) {
        const entity = s.entities[sat.noradId];
        if (entity) entity.position = toCartesian(getSatellitePosition(sat, now));
      }
    }, 2000);

    return () => {
      clearInterval(timer);
      viewer.scene.postUpdate.removeEventListener(onSpin);
      viewer.destroy();
      state.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rebuild entities when the satellite list changes.
  useEffect(() => {
    const s = state.current;
    if (!s) return;
    const { viewer, colors } = s;
    const Cesium = window.Cesium;

    viewer.entities.removeAll();
    s.entities = {};
    s.rings = {};
    s.sats = satellites;
    s.detailMode = satellites.length <= DETAIL_LIMIT;

    let maxRadius = 0;
    for (const sat of satellites) {
      const p = getSatellitePosition(sat);
      const radius = Math.hypot(p.x, p.y, p.z);
      maxRadius = Math.max(maxRadius, radius);
      const altitudeKm = radius / 1000 - 6371;
      const color = colors[sat.category] || colors.other;
      const labelByDefault = s.detailMode && altitudeKm > 2000; // LEO is crowded; label MEO/GEO only

      if (s.detailMode) addRing(s, sat, color);
      s.entities[sat.noradId] = viewer.entities.add({
        id: sat.noradId,
        position: toCartesian(p),
        point: {
          pixelSize: s.detailMode ? 16 : 6,
          color,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: s.detailMode ? 2 : 0,
        },
        label: {
          show: labelByDefault,
          text: sat.name,
          font: '13px sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -18),
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        },
        properties: { labelByDefault },
      });
    }
    logApp(`Displaying ${satellites.length}/${satellites.length} satellites`);

    // First load: look at Earth's centre from far enough away that the highest
    // (non-outlier) orbit fits. Later refreshes leave the camera alone.
    if (!s.framed && satellites.length > 0) {
      s.framed = true;
      const earthRadius = Cesium.Ellipsoid.WGS84.maximumRadius;
      const altitude = Math.max(
        Math.min(Math.max(maxRadius, earthRadius), GEO_RADIUS_M) * 2.2 - earthRadius,
        20000000,
      );
      viewer.camera.setView({ destination: Cesium.Cartesian3.fromDegrees(-30, 20, altitude) });
      logApp(`Camera centred on Earth, alt ${(altitude / 1000).toFixed(0)} km`);
    }
  }, [satellites]);

  // Toggle orbit rings.
  useEffect(() => {
    const s = state.current;
    if (!s) return;
    s.showOrbits = showOrbits;
    for (const [id, ring] of Object.entries(s.rings)) {
      if (id !== selectedId) ring.show = showOrbits;
    }
  }, [showOrbits, selectedId]);

  // Highlight the selected satellite and fly to it.
  useEffect(() => {
    const s = state.current;
    if (!s) return;
    const { viewer } = s;
    const entity = selectedId && s.entities[selectedId];
    const sat = entity && s.sats.find((x) => x.noradId === selectedId);
    if (!entity || !sat) return;

    const color = s.colors[sat.category] || s.colors.other;
    entity.point.pixelSize = 24;
    entity.point.outlineWidth = 2;
    entity.label.show = true;
    const ring = addRing(s, sat, color);
    ring.show = true;
    ring.polyline.width = 3;
    ring.polyline.material = color.withAlpha(0.9);
    s.stopSpin?.();
    flyToSatellite(viewer, entity);

    return () => {
      // Restore defaults when selection changes or clears (entity may already be gone).
      if (!s.entities[selectedId]) return;
      entity.point.pixelSize = s.detailMode ? 16 : 6;
      entity.point.outlineWidth = s.detailMode ? 2 : 0;
      entity.label.show = entity.properties.labelByDefault.getValue();
      if (s.detailMode) {
        ring.show = s.showOrbits;
        ring.polyline.width = 1;
        ring.polyline.material = color.withAlpha(0.35);
      } else {
        viewer.entities.remove(ring);
        delete s.rings[selectedId];
      }
    };
  }, [selectedId, satellites]);

  return <div ref={containerRef} className="globe" />;
}

function toCartesian(p) {
  return new window.Cesium.Cartesian3(p.x, p.y, p.z);
}

// Fly to a point directly "above" the satellite, looking back at Earth's centre,
// so the satellite sits in the middle of the view with the globe behind it.
// (viewer.flyTo(entity) would zoom onto the dot and lose all context.)
function flyToSatellite(viewer, entity) {
  const Cesium = window.Cesium;
  const pos = entity.position.getValue(viewer.clock.currentTime);
  if (!pos) return;
  const earthRadius = Cesium.Ellipsoid.WGS84.maximumRadius;
  const radius = Cesium.Cartesian3.magnitude(pos);
  const cameraRadius = Math.max(radius * 1.6, earthRadius * 2.5);
  const outward = Cesium.Cartesian3.normalize(pos, new Cesium.Cartesian3());
  const destination = Cesium.Cartesian3.multiplyByScalar(outward, cameraRadius, new Cesium.Cartesian3());
  const direction = Cesium.Cartesian3.negate(outward, new Cesium.Cartesian3());
  viewer.camera.flyTo({
    destination,
    orientation: { direction, up: Cesium.Cartesian3.UNIT_Z },
    duration: 1.0,
  });
}

// One full revolution sampled at 90 points, drawn as a faint ring.
function addRing(s, sat, color) {
  if (s.rings[sat.noradId]) return s.rings[sat.noradId];
  const Cesium = window.Cesium;
  const positions = [];
  const start = Date.now();
  for (let k = 0; k <= 90; k++) {
    positions.push(toCartesian(getSatellitePosition(sat, start + (sat.elements.periodMs * k) / 90)));
  }
  const ring = s.viewer.entities.add({
    id: `${sat.noradId}::orbit`,
    show: s.showOrbits,
    polyline: { positions, width: 1, material: color.withAlpha(0.35), arcType: Cesium.ArcType.NONE },
  });
  s.rings[sat.noradId] = ring;
  return ring;
}
