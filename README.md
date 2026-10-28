# 🛰️ Real-Time Satellite Tracker

> A live interactive 3D visualization of satellites orbiting Earth, built with **CesiumJS** and real-time data from **CelesTrak**. Showcasing how to build impressive data visualizations using AI-assisted development and free, open-source technologies.

## 🎯 About This Project

This is an **example project** for the **OCTO 2026 Hackathon**, demonstrating:

- ✅ **Bentley Tech Integration** — Uses CesiumJS (Bentley's open-source 3D mapping library)
- ✅ **Open Data** — Real satellite positions from free CelesTrak API
- ✅ **GitHub Pages Ready** — Fully deployable static site (no backend required)
- ✅ **Best Practices** — Clean code, good documentation, constraint compliance
- ✅ **AI-Friendly** — Built with AI assistance; shows what's possible in a few weeks

**See it live:** https://your-github-pages-url.com/example-project

---

## 🚀 Live Demo Features

### Interactive 3D Globe
- Real-time positions of 3,000+ active satellites
- Smooth animations as satellites orbit
- Click any satellite for detailed orbital information

### Smart Filtering
- Filter by category: GPS, Communication, Weather, ISS/Stations, Other
- Search by satellite name (e.g., "ISS", "HUBBLE")
- Real-time satellite count and last-updated timestamp

### Rich Satellite Info
When you click a satellite, see:
- **Name** — Official satellite designation
- **Category** — Type (GPS, communication, weather, etc.)
- **Altitude** — Height above Earth (meters)
- **Velocity** — Orbital speed (km/s)
- **Inclination** — Orbital angle (degrees)
- **Orbital Period** — Time to complete one orbit (hours)

### Beautiful UI
- Dark theme optimized for nighttime viewing
- Color-coded satellites by category
- Legend in corner
- Responsive sidebar with controls
- Smooth animations and hover effects

---

## 🛠️ Tech Stack

| Technology | Purpose | Why It's Great |
|-----------|---------|-----------------|
| **CesiumJS** | 3D globe & visualization | Bentley tech, WebGL, no backend needed |
| **CelesTrak API** | Satellite data | Free, real-time, 3000+ satellites |
| **HTML5/CSS3/JS** | Frontend | Lightweight, runs in browser |
| **GitHub Pages** | Hosting | Free, built-in to GitHub, zero config |

**Total dependencies:** 0 npm packages. Pure vanilla JavaScript.

---

## 📋 Project Structure

```
example-project/
├── index.html          # Main HTML page
├── styles.css          # Styling (dark theme, sidebar, legend)
├── app.js              # Main application logic
├── scripts/
│   └── screenshot.py   # Headless-Chrome smoke test (console log + screenshot)
├── README.md           # This file
└── .gitignore         # (Git ignore patterns)
```

**Lines of code:**
- `index.html`: ~140 lines (well-commented semantic HTML)
- `styles.css`: ~280 lines (organized sections with comments)
- `app.js`: ~320 lines (modular functions, clear logic)
- **Total: ~740 lines** (surprisingly compact for this functionality!)

---

## 🔧 Installation & Setup

### Option 1: Run Locally (Quick Preview)

```bash
# Clone or download the project
cd example-project

# Start a simple HTTP server (Python 3)
python -m http.server 8000

# Or use Node.js http-server
npx http-server

# Open in browser
# http://localhost:8000
```

### Option 2: Deploy to GitHub Pages

1. **Create a GitHub repository** (e.g., `my-satellite-tracker`)

2. **Copy project files** into your repo root (or in a subfolder)

3. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add satellite tracker"
   git push origin main
   ```

4. **Enable GitHub Pages**
   - Go to repo **Settings** → **Pages**
   - Set source to `main` branch (or subfolder)
   - Your site will be live at `https://username.github.io/my-satellite-tracker`

5. **Share the link!**
   ```
   https://username.github.io/my-satellite-tracker
   ```

### Option 3: Let your AI assistant test it (headless screenshot)

If you're building with an AI coding agent, give it a way to *see* the page
instead of guessing. `scripts/screenshot.py` loads the app in headless Chrome,
waits for satellites to appear, and prints the browser console, any page errors,
where each satellite landed on screen, and the path to a PNG screenshot.

```bash
pip install pyppeteer                  # drives Chrome over DevTools protocol, no Node needed
python -m http.server 8765 &           # serve the app
cd scripts && python3 -m screenshot http://localhost:8765/ 30
```

Set `CHROME_BIN` if Chrome isn't at `/usr/bin/google-chrome`, and
`SCREENSHOT_DIR` to change where PNGs go. Exit code is non-zero on JS errors,
so it also works as a CI check.

---

## 💡 How It Works

### Data Flow

```
CelesTrak API (3000+ active satellites)
         ↓
    Parse TLE (Two-Line Elements)
         ↓
    Sgp4 Orbit Propagation (calculate position)
         ↓
    CesiumJS 3D Visualization
         ↓
    Interactive WebGL Globe (run in browser)
```

### Key Functions

| Function | Purpose |
|----------|---------|
| `fetchSatelliteData()` | Downloads TLE data from CelesTrak |
| `classifySatellite()` | Categorizes satellites (GPS, weather, etc.) |
| `getSatellitePosition()` | Uses SGP4 math to calculate current position |
| `createSatelliteEntity()` | Creates Cesium entity for 3D rendering |
| `applyFilters()` | Filters & re-renders on category/search |
| `showSatelliteInfo()` | Displays details when clicking satellite |

---

## 📊 Data Sources

### Sources, in fallback order

| Source | Satellites | Notes |
|---|---|---|
| [CelesTrak](https://celestrak.org) `gp.php?GROUP=active` | ~16,000 | Public domain. **Rate-limited: one download per group per IP every 2 h**; anything more gets HTTP 403. The app caches a successful download in `localStorage` for 2 h to stay within that. |
| [tle.ivanstanojevic.me](https://tle.ivanstanojevic.me) | 50 (paginated) | Free community mirror with CORS; occasionally slow or down. |
| `data/tle-snapshot.txt` (bundled) | 100 | Works offline / on GitHub Pages. Positions drift as the file ages. |

Force a source with `?source=snapshot` or `?source=<url-to-tle-file>`, e.g.
`?source=data/starlink-test.tle` loads ~10,000 Starlink satellites to exercise
dense mode (above 300 satellites, points shrink and orbit rings / labels are drawn
only for the selected satellite).

**Why you may see fewer satellites than expected:** if CelesTrak 403s (you or
someone on your IP downloaded within 2 h) and the cache is empty, you get the
50-satellite mirror page or the 100-satellite snapshot.

**Example TLE:**
```
ISS (ZARYA)
1 25544U 98067A   23001.00000000  .00005182  00000-0  10270-3 0  9005
2 25544  51.6416 339.5187 0002571  34.5857 120.4689 15.54142834380074
```

The two lines encode the satellite's orbital elements. This demo uses a simplified Kepler propagator (no SGP4), so positions are approximate; the orbit rings are one sampled revolution of that propagator.

---

## 🎮 Usage Examples

### Searching for a Specific Satellite

1. Type "ISS" in search box
2. Click **Search**
3. Filter shows only ISS + zooms to it
4. Click the satellite point for details

### Exploring GPS Constellations

1. Uncheck all filters except **GPS**
2. Watch 30+ GPS satellites orbit
3. See how they're spread across orbital planes
4. Notice the repeating patterns (GPS design!)

### Finding Weather Satellites

1. Uncheck all, check **Weather**
2. ~10-15 weather satellites appear
3. Most in polar orbits (see high inclination)
4. These feed weather models worldwide

---

## 🚀 Customization & Extensions

### Easy Wins (1-2 hours)

- **Add more info:** Launch date, country of origin, TLE epoch (look up in TLE fields)
- **Color scheme:** Edit `categoryColors` in `app.js`
- **More categories:** Add to `classifySatellite()` function
- **Ground tracks:** Draw satellite path on Earth surface (CesiumJS polyline)

### Medium Enhancements (3-5 hours)

- **Satellite trails:** Show last orbit path (polyline, refresh every minute)
- **Passing predictions:** Calculate next overhead pass for your location
- **Export data:** Download satellite list as CSV
- **Mobile app:** Wrap in React Native or Flutter
- **Multiplayer:** WebSocket sync showing what others are viewing

### Advanced Projects (1-2 weeks)

- **Multi-source data:** Add ISS real-time crew feed, TLE history
- **Custom orbital mechanics:** Visualize orbital decay, collision predictions
- **3D models:** Load realistic satellite models (gltf)
- **Real-time alerts:** Notify when satellites pass overhead
- **IoT integration:** Feed ground station data into visualization

---

## 🛡️ OCTO 2026 Compliance Checklist

✅ **Bentley Technology** — CesiumJS (Apache 2.0)  
✅ **Open Data** — CelesTrak (public domain)  
✅ **GitHub Pages Deployment** — Static site, no backend  
✅ **No Paid APIs** — CelesTrak is free, no rate limits  
✅ **No Local Databases** — Everything in browser/API  
✅ **Code Quality** — Clean, modular, documented  
✅ **Good Documentation** — This README + inline comments  
✅ **Working Demo** — Live on GitHub Pages  

---

## 📚 Learning Resources

### CesiumJS Docs
- **Cesium 3D Mapping Platform:** https://cesium.com/platform/cesiumjs/
- **API Reference:** https://cesium.com/learn/cesiumjs/
- **Gallery:** https://sandcastle.cesium.com/

### Orbital Mechanics
- **SGP4/SDP4 Algorithm:** https://celestrak.org/NORAD/documentation/
- **TLE Format:** https://en.wikipedia.org/wiki/Two-line_element_set
- **Orbital Elements:** https://www.space-track.org/documentation

### APIs & Data
- **CelesTrak:** https://celestrak.org/
- **Space-Track.org:** https://www.space-track.org/ (requires free account)
- **NORAD TLE Archive:** Historical satellite data

---

## 🐛 Troubleshooting

### "Satellites not showing up"
- Check browser console (F12) for errors
- Verify internet connection (CelesTrak API needs access)
- Try refreshing page (data fetched on load)
- Check that JavaScript is enabled

### "Globe doesn't load"
- Cesium Ion token in `app.js` may be rate-limited
- Generate your own free token at https://cesium.com/ion/
- Replace `Cesium.Ion.defaultAccessToken` value

### "Very slow performance"
- Too many satellites (3000+ can strain older GPUs)
- Uncheck some filters to reduce load
- Use Chrome/Firefox (better WebGL support than Safari)
- Lower resolution screen/disable lighting

---

## 🎓 What You Can Learn Building This

1. **APIs & Data Parsing**
   - Fetching real-time data
   - Parsing TLE format
   - Error handling

2. **3D Graphics**
   - WebGL fundamentals
   - Camera controls
   - Entity rendering

3. **Orbital Mechanics** (Optional Deep Dive)
   - SGP4 propagation algorithm
   - Satellite orbital elements
   - Coordinate transformations

4. **Web Development**
   - Vanilla JavaScript (no frameworks!)
   - CSS styling & layout
   - Event handling & interactivity
   - GitHub Pages deployment

5. **AI-Assisted Development**
   - Using Copilot/ChatGPT to understand complex code
   - Rapid prototyping
   - Debugging strategies

---

## 📄 License

This project is in the **public domain** — free to use, modify, and share.

- **CesiumJS:** Apache 2.0
- **CelesTrak Data:** Public domain
- **This code:** Public domain (do whatever you want!)

---

## 🤝 Contributing & Feedback

Have ideas? Found a bug? Want to extend this?

1. **Fork the repository** on GitHub
2. **Make your changes** (add features, fix bugs, improve docs)
3. **Submit a pull request** with a description
4. **Share in the OCTO 2026 community channel!**

---

## 🎯 For OCTO 2026 Participants

This example shows you **what's possible** in 2-3 weeks with:

- ✨ A compelling idea
- 🔧 Free, open-source tools (CesiumJS)
- 📊 Free, public data (CelesTrak)
- 🚀 Confident deployment (GitHub Pages)
- 🤖 AI assistance (GitHub Copilot)

**Your challenge:** Pick an idea from the BENTLEY-TECH-COMPREHENSIVE guide, find good data, and build something **even better**!

Start small. Iterate. Deploy. Have fun.

---

## 📞 Questions?

- 📖 **OCTO 2026 Challenge Guide:** See `challenge-design-doc.md`
- 🔧 **Tech Resources:** See `brainstorming/BENTLEY-TECH-COMPREHENSIVE.md`
- 💬 **Community:** Join the OCTO channel and share ideas!

---

**Built with ❤️ for OCTO 2026**  
*Showing what's possible with Bentley tech + AI + Free data*
