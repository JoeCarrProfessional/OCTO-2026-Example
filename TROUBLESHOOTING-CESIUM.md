# Troubleshooting: Cesium Failed to Load

If you see the error **"Uncaught ReferenceError: Cesium is not defined"**, it means the CesiumJS library didn't load before your app tried to use it.

## Common Causes & Fixes

### 1. **Slow Internet or Network Issues** ✅ MOST COMMON
**Symptom:** Page loads, but console shows "Cesium is not defined"

**Fix:** 
- Check your internet connection
- Refresh the page (F5)
- Wait a few seconds, then refresh again
- Try a different browser
- Check your firewall/VPN isn't blocking cdn.jsdelivr.net

### 2. **CDN Blocked**
**Symptom:** Network tab shows jsDelivr CDN requests blocked/failed

**Fix:**
- If behind corporate firewall, contact IT
- Try connecting to public WiFi to test
- Check if ad-blocker is blocking the CDN

### 3. **Browser Cache Issues**
**Symptom:** Works on phone but not desktop (or vice versa)

**Fix:**
- Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Clear browser cache: Settings → Clear browsing data → Cached images/files
- Try incognito/private window

### 4. **Old Version of Browser**
**Symptom:** Nothing loads at all

**Fix:**
- Update your browser to latest version
- Try Chrome or Firefox (best WebGL support)

---

## How to Verify It's Working

### Check 1: Open Browser Console
1. Press `F12` or right-click → Inspect
2. Click "Console" tab
3. Look for error messages (red text)
4. If no errors → It's working! ✅

### Check 2: Look for Success Messages
You should see:
```
Satellite Tracker initializing...
Loaded 3000+ satellites
```

### Check 3: Test Interactive Features
- Click on the 3D globe → should rotate/pan
- Type in search box → should search
- Click checkboxes → should filter

---

## Still Not Working?

### Debugging Steps

1. **Check network tab** (F12 → Network)
   - Reload page
   - Look for red X on any requests
   - If jsDelivr CDN has red X → internet/firewall issue
   - If `assets/index-*.js` has red X → Vite `base` or Pages path problem

2. **Verify file structure**
   Make sure you have:
   ```
   your-repo/
   ├── index.html
   ├── package.json
   ├── vite.config.js
   ├── src/
   └── .github/workflows/deploy.yml
   ```

3. **Check GitHub Pages deployment**
   - Go to repo Settings → Pages
   - Make sure source is set to `main` branch
   - Wait 1-2 minutes for deployment
   - Check that your live URL works

4. **Test locally first**
   ```bash
   cd your-project-folder
   python -m http.server 8000
   # Then open http://localhost:8000
   ```

### Common GitHub Pages Issues

| Error | Solution |
|-------|----------|
| 404 Page Not Found | Files not committed, or wrong branch |
| Blank page | Might be loading, wait 30 seconds |
| CSS/JS not loading | File paths wrong (case-sensitive!) |
| Cesium not loading | Check internet, refresh, check firewall |

---

## Advanced: Using Alternative CDN

If jsDelivr is blocked in your region, try one of these:

**Option 1: Unpkg CDN**
```html
<script src="https://unpkg.com/cesium@1.115.0/Build/Cesium/Cesium.js"></script>
<link rel="stylesheet" href="https://unpkg.com/cesium@1.115.0/Build/Cesium/Widgets/widgets.css">
```

**Option 2: Local Download** (Advanced)
1. Download Cesium from https://cesium.com/downloads/cesiumjs/releases/1.115.0/
2. Extract to project folder
3. Link locally: `<script src="Cesium/Cesium.js"></script>`

---

## Performance Tips

- **First load is slow:** CesiumJS library is large (~10 MB). This is normal.
- **On slow internet:** Can take 10-30 seconds
- **Subsequent loads:** Much faster (cached in browser)

---

## Still Stuck?

1. **Check the FAQ** in README.md
2. **Check console errors** (F12 → Console)
3. **Google the error message** you see
4. **Try a different browser** (Chrome → Firefox → Safari)
5. **Test on a phone** (different network)

---

## For Participants Using This as Reference

If you're building your own project based on this example:

1. **Copy the viewer setup** from `src/globe/SatelliteGlobe.jsx` (it checks `window.Cesium` exists)
2. **Use jsDelivr CDN** for any Cesium
3. **Test on local server** before GitHub Pages
4. **Check browser console** for errors

**Pro Tip:** When something doesn't work:
1. Open F12 (Developer Tools)
2. Go to Console tab
3. Copy the error message
4. Google it (usually tells you exactly what's wrong)

---

**Good luck! 🚀 Most issues resolve by just refreshing the page.**
