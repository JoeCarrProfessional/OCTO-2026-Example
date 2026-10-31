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
| **StrataKit** | UI components & theming | Bentley's open-source (MIT) design system, built on React 19 + MUI |
| **React + Vite** | App framework & build | Fast dev server, one command to build for GitHub Pages |
| **CelesTrak API** | Satellite data | Free, real-time, 3000+ satellites |
| **GitHub Pages + Actions** | Hosting | Free; every push to `main` rebuilds and redeploys |

Cesium is loaded from a CDN (`<script>` tag in `index.html`) so you don't have to
bundle its workers and assets. Everything else is plain npm.

### About StrataKit

[StrataKit](https://stratakit.bentley.com) is Bentley's design system. You get
consistent, accessible, good-looking components for free by wrapping your app
in `<Root>` from `@stratakit/mui` and then using normal `@mui/material`
components (`Button`, `TextField`, `Checkbox`, `Paper`, …). Icons come from
`@stratakit/icons`. Design tokens are plain CSS variables
(`--stratakit-color-bg-page-base`, `--stratakit-space-4`, …) you can use in your
own CSS.

If you build with an AI coding agent, install the StrataKit usage skill so it
knows the rules (e.g. use `render={<h1 />}` instead of MUI's `component` prop,
don't mix in Tailwind/shadcn/iTwinUI):

```bash
gh skill install iTwin/stratakit stratakit-usage
```

---

## 📋 Project Structure

```
example-project/
├── index.html                  # HTML shell: loads Cesium from CDN, mounts React
├── vite.config.js              # Vite config (base: './' so it works at any Pages URL)
├── package.json
├── public/
│   └── data/tle-snapshot.txt   # Offline fallback TLE data (copied to dist/ as-is)
├── src/
│   ├── main.jsx                # Entry: StrataKit <Root colorScheme="dark"> → <App/>
│   ├── App.jsx                 # State: satellites, filters, search, selection
│   ├── App.css                 # Layout using StrataKit tokens
│   ├── globe/
│   │   └── SatelliteGlobe.jsx  # Owns the Cesium viewer; entities, orbits, picking
│   ├── components/
│   │   ├── Sidebar.jsx         # Filters, search, stats, debug log (MUI + StrataKit)
│   │   ├── SatelliteInfo.jsx   # Details card for the selected satellite
│   │   ├── Legend.jsx
│   │   └── DebugLog.jsx
│   └── lib/
│       ├── tle.js              # Pure functions: parse TLE, SGP4 position, classify
│       ├── dataSources.js      # CelesTrak → mirror → snapshot → demo fallback chain
│       └── log.js              # In-app log that also feeds the debug panel
└── .github/workflows/deploy.yml  # Builds with Vite and deploys to GitHub Pages
```

---

## 🔧 Installation & Setup

You need [Node.js](https://nodejs.org) 18 or newer (20 LTS recommended).

### Run locally

```bash
git clone https://github.com/joecarrprofessional/OCTO-2026-Example.git
cd OCTO-2026-Example
npm install        # first time only
npm run dev        # dev server with hot reload → http://localhost:5173
```

Edit anything under `src/` and the browser updates instantly.

### Build and preview the production bundle

```bash
npm run build      # outputs static files to dist/
npm run preview    # serves dist/ locally → http://localhost:4173
```

`dist/` is what GitHub Pages serves. It's git-ignored; the Actions workflow
builds it for you.

### Deploy to GitHub Pages

1. **Fork** (or copy) this repo on GitHub.
2. In your repo go to **Settings → Pages** and under **Build and deployment**
   set **Source** to **GitHub Actions** (not "Deploy from a branch").
3. Push to `main`. The workflow in `.github/workflows/deploy.yml` runs
   `npm ci && npm run build` and publishes `dist/`. Watch it under the
   **Actions** tab; first deploy takes a minute or two.
4. Your site is live at `https://<username>.github.io/<repo-name>/`.

Because `vite.config.js` sets `base: './'`, you don't need to change anything
when you rename the repo.

---

## 💡 How It Works

### Data Flow

```
CelesTrak API (3000+ active satellites)
         ↓
    Parse TLE (Two-Line Elements)            src/lib/tle.js
         ↓
    SGP4 orbit propagation (position now)    src/lib/tle.js
         ↓
    React state (filters, search, selection) src/App.jsx
         ↓
    CesiumJS entities on a 3D globe          src/globe/SatelliteGlobe.jsx
```

### Key Pieces

| Where | What it does |
|-------|--------------|
| `lib/dataSources.js` → `loadTleText()` | Tries CelesTrak, then a mirror, then the bundled snapshot; caches in `localStorage` for 2 h |
| `lib/tle.js` → `parseTle()`, `classifySatellite()` | Parses TLEs, derives orbital elements, buckets into GPS / Comms / Weather / ISS / Other |
| `lib/tle.js` → `getSatellitePosition()`, `describeSatellite()` | SGP4 position in metres; live altitude and speed for the info card |
| `globe/SatelliteGlobe.jsx` | Creates the Cesium viewer once, rebuilds entities when the filtered list changes, updates positions every 2 s, handles clicks |
| `components/Sidebar.jsx` | All the controls, built from MUI components themed by StrataKit |

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
- **Color scheme:** Edit `CATEGORY_COLORS` in `src/lib/tle.js`
- **More categories:** Add to `classifySatellite()` in `src/lib/tle.js`
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
- Check the browser console (F12) for a WebGL or CDN error
- Make sure the Cesium `<script>` tag in `index.html` loaded (network tab)
- Try a different browser; some corporate VPNs block CDNs

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
- **StrataKit / MUI / React:** MIT
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
- 🔧 Free, open-source tools (CesiumJS, StrataKit)
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
