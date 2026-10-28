# Debug Guide for Satellite Tracker

## Quick Start
1. Open `http://localhost:8000`
2. Look for **"Show Debug Logs"** button in the left sidebar
3. Click it to see detailed initialization logs

## What You Should See

### Success Scenario (Earth + 5 Demo Satellites):
```
[HH:MM:SS] INFO: App script starting...
[HH:MM:SS] INFO: ✅ Cesium library loaded successfully
[HH:MM:SS] INFO: Setting up Cesium Ion token...
[HH:MM:SS] INFO: ✅ Ion token set
[HH:MM:SS] INFO: Creating Cesium Viewer...
[HH:MM:SS] INFO: ✅ Cesium Viewer created
[HH:MM:SS] INFO: ✅ Lighting enabled
[HH:MM:SS] INFO: Fetching satellite data...
[HH:MM:SS] INFO:   Trying: https://celestrak.org/NORAD/elements/active.txt
[HH:MM:SS] WARN:   ❌ Failed: (or ✅ Success, if API working)
[HH:MM:SS] WARN: All live APIs failed, using demo data...
[HH:MM:SS] INFO: Parsing satellite data...
[HH:MM:SS] INFO: ✅ Loaded 5 satellites
[HH:MM:SS] INFO: Displaying 5 satellites
[HH:MM:SS] INFO: Satellite Tracker starting...
[HH:MM:SS] INFO: ✅ App initialized successfully!
```

## Common Issues & Solutions

### Issue: Blank Page
**Check Debug Logs For:**
- "ERROR: CesiumJS library not loaded" → CDN failed to load
  - **Solution:** Check internet connection, refresh page
- "ERROR: cesiumContainer not found" → HTML element missing
  - **Solution:** HTML file corrupted, check in browser console

### Issue: No Earth Visible
**Check Debug Logs For:**
- "✅ Cesium Viewer created" → Viewer initialized OK
- Check if 3D canvas is actually loading (look for gray/dark area)
- **Solution:** Wait 2-3 seconds, it takes time to load

### Issue: No Satellites Visible (0 satellites)
**Check Debug Logs For:**
- "Loaded 0 satellites" → Data parsing failed
- "ERROR: Error parsing satellite data" → TLE format issue
  - **Solution:** Check CelesTrak API or use demo data
- "Displaying 0 satellites" → Propagation failed
  - **Solution:** SGP4 error, check TLE data validity

### Issue: Cesium CDN Error
**Check Debug Logs For:**
- "Waiting for Cesium to load..." → Stuck trying to load
  - **Causes:** No internet, CDN blocked, very slow network
  - **Solution:** 
    1. Check internet: `ping google.com`
    2. Try refreshing page
    3. Check if corporate firewall blocks CDN
    4. Try alternative CDN in index.html

## Browser Developer Console (F12)

For more detailed errors, open F12 and check:
1. **Console tab** → Shows detailed stack traces
2. **Network tab** → Shows which requests failed (red = failed)
3. **Application tab** → Check window.APP_LOGS array

## Manual Testing

### Test Cesium CDN
```bash
curl -s https://cdn.jsdelivr.net/npm/cesium@1.115.0/Build/Cesium/Cesium.js | head -20
```
Should return JavaScript code, not HTML error page.

### Test CelesTrak API
```bash
curl -s https://celestrak.org/NORAD/elements/gps.txt | head -6
```
Should show satellite name and TLE data:
```
GPS BIIA-21  (PRN 13)
1 22014U 93042A   26010.54445277 -.00000256  00000-0  00000+0 0  9996
2 22014  55.0032   29.6485 0136188  10.7383 349.6381  2.00559201287421
```

## Interactive Features

Once loaded, try:
1. **Click a satellite** → Shows details (altitude, velocity, orbital period)
2. **Search** → Type satellite name in search box
3. **Filter** → Toggle category checkboxes (GPS, Weather, Communication, etc.)
4. **Reset** → Click "Reset Filters" to show all again
5. **Close Info** → Click "✕" on satellite details panel

## Performance Notes

- **First load:** 2-3 seconds (Cesium initialization)
- **Satellite data fetch:** Depends on internet (live: <1s, demo: instant)
- **Refresh interval:** Data updates every 60 seconds
- **Rendering:** ~5 satellites visible at once (depends on screen size)

## Demo Satellites

If live CelesTrak API is unavailable, demo includes:
1. **ISS (ZARYA)** - International Space Station (ISS category)
2. **GPS BIIA-21** - GPS constellation (GPS category)
3. **NOAA 18** - Weather monitoring (Weather category)
4. **GOES 16** - Geostationary weather (Weather category)
5. **Hubble Space Telescope** - Space observatory (Other category)

All have real TLE (Two-Line Element) data from Oct 2026.

## Reporting Issues

If the app doesn't work:
1. **Screenshot the debug logs** (click Show Debug Logs, then screenshot)
2. **Note the first ERROR line** in logs
3. **Check your internet:** Can you browse normally?
4. **Try in different browser** (Chrome, Firefox, Safari)
5. **Check browser console (F12)** for additional technical details

---

**For Developers:**
- All logging goes to `window.APP_LOGS` array
- Errors stored in `window.APP_ERRORS` array
- Check `app.js` for implementation details
