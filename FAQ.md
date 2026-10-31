# FAQ & Troubleshooting

## General Questions

### Q: Do I need to know JavaScript to modify this?
**A:** Not deeply! You can:
- Change colors (CSS)
- Add/remove features (copy-paste patterns from `src/`)
- Use ChatGPT/Copilot to explain confusing code
- Follow the examples in this project

### Q: Can I use this code in my own project?
**A:** **YES!** It's public domain. Modify it however you want. Just improve the docs! 

### Q: How long did this take to build?
**A:** 1 day with AI assistance. But it's very unpolished.

### Q: Do I need a backend server?
**A:** **No!** Everything runs in the browser. GitHub Pages (static hosting) is sufficient.

### Q: Can I add my own data?
**A:** **Absolutely!** Replace CelesTrak with your own API/data source. See [Data Sources](#data-sources) below.

---

## Technical Questions

### Q: What's SGP4?
**A:** The algorithm that calculates satellite positions from orbital elements (TLE). CesiumJS handles it internally; you just feed it the TLE.

### Q: How often is satellite data updated?
**A:** CelesTrak updates daily. The tracker fetches once on load (cached for 2 h in `localStorage`, see `src/lib/dataSources.js`) and recomputes positions every 2 seconds.

### Q: Can I track private satellites?
**A:** Only NORAD-tracked satellites (~3,000 active). There are 100,000+ pieces of space debris not included.

### Q: Is this accurate?
**A:** YES, but with caveats:
- SGP4 predicts positions accurately within ~1 km
- Predictions degrade for days in advance
- For real-time viewing, accuracy is excellent

---

## Deployment Issues

### Q: "My GitHub Pages isn't showing anything"
**A:** 
1. Wait 2-3 minutes after pushing
2. Check **Settings → Pages** for deployment status
3. Make sure `index.html` is in your repo root
4. Open browser console (F12) and check for errors

### Q: "I get a 404"
**A:**
- Your `index.html` isn't in the repo root
- **OR** the branch setting is wrong (should be `main` or `master`)
- **OR** the folder path is wrong if using subfolder

### Q: "GitHub Pages says 'Your site is ready'"... but I don't see it
**A:**
- Wait 30-60 seconds more
- Clear browser cache (Ctrl+Shift+Delete)
- Try incognito/private window
- Try a different browser

### Q: "My scripts/CSS aren't loading"
**A:**
- Check browser console (F12) → Network tab
- Look for 404 errors (red)
- Verify filenames match exactly (case-sensitive on Linux!)
- Make sure all files are committed to Git

---

## Runtime Issues

### Q: "Nothing loads, just blank page"
**A:**
1. Open browser console (F12)
2. Look for red error messages
3. Common causes:
   - Cesium token expired → Get new one at https://cesium.com/ion/
   - Ad blocker blocking Cesium → Disable for this site
   - JavaScript disabled → Enable in browser

### Q: "Satellites show up but movement looks weird"
**A:**
- This usually means clock skew on your computer
- Set your system time to current time
- Or reload page (refetches current time)

### Q: "Search/filter doesn't work"
**A:**
1. Check console for errors
2. Make sure JavaScript is enabled
3. Try refreshing page
4. Try different browser

### Q: "Site is super slow"
**A:**
- Too many satellites loaded (uncheck filters)
- Weak GPU (especially on mobile)
- Browser tab isn't focused (throttles performance)
- Try Chrome instead of Safari (better WebGL)

### Q: "Cesium globe doesn't rotate"
**A:**
- Click on the globe first (needs focus)
- Drag with mouse to pan
- Scroll to zoom
- Right-click to tilt
- Try different browser

---

## Customization Questions

### Q: How do I change the colors?
**A:** Edit `CATEGORY_COLORS` in `src/lib/tle.js`. The values are CSS colour
strings and are used for both the Cesium points and the legend/chips.

### Q: How do I add more satellite categories?
**A:** Add to `classifySatellite()` in `src/lib/tle.js`:
```javascript
if (upper.includes('HUBBLE')) return 'observatory';
if (upper.includes('ASTEROID')) return 'tracking';
```

Then add the new key to `CATEGORIES` and `CATEGORY_COLORS` in the same file; the sidebar checkboxes and legend are generated from those.

### Q: How do I change the satellite data source?
**A:** Replace the fetch URL in `fetchSatelliteData()` (line ~80):
```javascript
const response = await fetch('YOUR-NEW-API-URL-HERE');
```

Your API must return TLE format (or adapt the parsing).

### Q: How do I add satellite names/descriptions?
**A:** In `showSatelliteInfo()` (line ~235), add to the `infoContent.innerHTML`:
```javascript
<div>Your custom info here: <strong>${customData}</strong></div>
```

You'll need to parse that data from your source.

### Q: Can I zoom to a specific location?
**A:** Yes! Use `viewer.camera.flyTo()`:
```javascript
// Zoom to NYC
viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(-74.006, 40.7128, 1000000)
});
```

---

## Data Sources

### Free, Bentley-Friendly Data

| Data | Source | URL | Format |
|------|--------|-----|--------|
| **Satellites** | CelesTrak | https://celestrak.org | TLE |
| **Earthquakes** | USGS | https://earthquake.usgs.gov/earthquakes/feed/ | JSON |
| **Weather** | NOAA | https://www.ncei.noaa.gov/products/weather-and-climate-datasets | NetCDF/CSV |
| **Buildings (3D)** | CityGML | https://3dcitydb.org | GeoJSON |
| **Airports** | OpenFlights | https://openflights.org | CSV |
| **ISS Location** | Open Notify | http://open-notify.org | JSON |
| **Solar Activity** | NOAA SWX | https://www.swpc.noaa.gov | JSON |
| **Ocean Currents** | NOAA ERDDAP | https://coastwatch.pfeg.noaa.gov/erddap/ | NetCDF |

All are **free and open**, no API keys needed (mostly).

---

## Performance Tips

### Make it Faster
1. **Reduce satellite count**
   - Uncheck filters in UI
   - Or modify `displaySatellites()` to limit load

2. **Lazy-load data**
   - Only fetch visible region first
   - Load more as user zooms

3. **Use Web Workers** (advanced)
   - Move SGP4 math to background thread
   - Prevents UI freezing

4. **Cache data**
   - Save TLE to LocalStorage
   - Avoid refetching too often

### Device Compatibility
- **Desktop:** Full performance
- **Tablet:** Good (drag/zoom works)
- **Mobile:** Limited (3D WebGL uses more battery, less VRAM)

---

## Advanced Questions

### Q: Can I export satellite data?
**A:** Yes! Add a button that calls:
```javascript
const csvContent = allSatellites.map(s => `${s.name},${s.category}`).join('\n');
const blob = new Blob([csvContent], { type: 'text/csv' });
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'satellites.csv';
a.click();
```

### Q: Can I add 3D models of satellites?
**A:** Yes! Use CesiumJS `Model` entities with glTF files. See: https://sandcastle.cesium.com/index.html?src=3D%20Models.html

### Q: Can I show satellite ground tracks (paths)?
**A:** Yes! Add a polyline for each satellite's next orbit. More advanced—requires calculating multiple positions.

### Q: Can I predict satellite passes for my location?
**A:** Yes! Add geolocation, calculate when satellite crosses your latitude/longitude. Moderate complexity.

### Q: Can I share this as a mobile app?
**A:** Yes! Use Cordova or React Native to wrap the HTML/JS.

---

## Getting Help

### If You're Stuck:

1. **Check the console** — F12 → Console tab (red = errors)
2. **Google the error message** — Verbatim
3. **Ask ChatGPT/Copilot** — Show it your code + error
4. **Read the docs** — Check CesiumJS docs
5. **Ask in OCTO community** — Share code, explain what you tried

### Useful Resources:
- **CesiumJS Sandbox:** https://sandcastle.cesium.com/
- **MDN Web Docs:** https://developer.mozilla.org/
- **Stack Overflow:** Tag with `cesium` or `javascript`
- **GitHub Issues:** Many projects have Q&A discussions

---

## One More Thing

**This project is intentionally kept simple.** The goal is to show:
- ✅ It's doable
- ✅ It's impressive
- ✅ It's documented
- ✅ It's deployable

**Your project should be even better!** Add more features, better design, cooler data. Go beyond this example.

Good luck! 🚀
