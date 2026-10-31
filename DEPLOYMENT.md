# Deployment Guide for OCTO 2026 Participants

## Quick Start: Get Your Project on GitHub Pages in 5 Minutes

### Step 1: Create a GitHub Repository
1. Go to https://github.com/new
2. Name it something catchy (e.g., `my-satellite-tracker`)
3. Add a description
4. Choose **Public** (so judges can access it)
5. **Create repository**

### Step 2: Add Your Files
```bash
# Clone your new repo
git clone https://github.com/YOUR-USERNAME/my-satellite-tracker.git
cd my-satellite-tracker

# Copy your project files here, then:
git add .
git commit -m "Initial commit: satellite tracker"
git push origin main
```

> **Tip:** the quickest route is to **fork this example repo** instead. It
> already contains the deploy workflow, so you only need Step 3.

### Step 3: Enable GitHub Pages

There are two ways, depending on whether your project needs a build step.

**A. Your project has a build step (React/Vite, like this example)**

1. Make sure `.github/workflows/deploy.yml` from this repo is in your repo.
2. Go to **Settings → Pages**.
3. Under "Build and deployment" set **Source** to **GitHub Actions**.
4. Push to `main` (or re-run the workflow from the **Actions** tab).
5. Wait for the green tick (1–2 min). Your site is live at
   `https://YOUR-USERNAME.github.io/my-satellite-tracker/`.

Every later push to `main` rebuilds and redeploys automatically.

**B. Your project is plain HTML/CSS/JS (no `npm run build`)**

1. Go to **Settings → Pages**.
2. Under "Build and deployment" set **Source** to **Deploy from a branch**,
   branch `main`, folder `/ (root)`. Click **Save**.
3. Wait 1–2 minutes. Same URL as above.

### Step 4: Submit to OCTO 2026
Fill out the Microsoft Form with:
- **Project Name:** My Satellite Tracker
- **GitHub Repository URL:** https://github.com/YOUR-USERNAME/my-satellite-tracker
- **Live Demo URL:** https://YOUR-USERNAME.github.io/my-satellite-tracker
- **Bentley Technology Used:** CesiumJS
- **Data Sources:** CelesTrak (public domain)
- **Brief Description:** Live 3D visualization of orbiting satellites

Done! 🎉

---

## Troubleshooting

### "My site isn't showing up"
- Wait 2-3 minutes after enabling Pages (GitHub needs time to deploy)
- Check **Settings → Pages** to see deployment status
- Look for errors in the **Deployments** tab

### "I see a 404"
- Build-step projects: check the **Actions** tab for a failed run, and confirm
  Pages **Source** is set to **GitHub Actions**
- Plain-static projects: make sure `index.html` is in the root of the repository
  (or point the Pages folder setting at the right subfolder)
- Assets 404 but the page loads: paths must be relative (`./assets/...`) or
  Vite's `base` must be `'./'`, because your site lives under `/repo-name/`

### "JavaScript isn't working"
- Open browser console (F12) and look for errors (red text)
- Run `npm run build && npm run preview` locally; if it works there but not on
  Pages, it's almost always a path/`base` problem (see "I see a 404")

### "Cesium isn't loading"
- Check your internet connection
- Try opening in a different browser
- Make sure JavaScript is enabled

---

## GitHub Pages Tips

### Using a Subfolder
If you want projects in a `/projects` subfolder:
```bash
my-username.github.io/
├── README.md
└── projects/
    └── satellite-tracker/
        ├── index.html
        └── assets/   (built output, or your own css/js)
```

Then set Pages source to `/ (root)` and your site is at:
`https://my-username.github.io/projects/satellite-tracker/`

### Custom Domain (Optional)
If you own a domain:
1. Go to **Settings → Pages**
2. Under "Custom domain", enter your domain
3. Follow GitHub's DNS setup instructions

### HTTPS (Automatic)
GitHub Pages automatically provides HTTPS for `.github.io` domains. ✅

---

## Pro Tips

### Make Your Demo Shine
1. **Add a screenshot/GIF** to your README
   - Use https://www.screentogif.com/ to record GIF
   - Upload to README with `![Demo](demo.gif)`

2. **Write a great description**
   - What problem does it solve?
   - What's the wow factor?
   - How did you build it?

3. **Test before submitting**
   - Open your live demo URL
   - Test filters, search, clicking satellites
   - Make sure everything works

4. **Share with friends**
   - Get feedback
   - Find bugs
   - Celebrate together!

### Iterate During the Hackathon
```bash
# Make changes locally with hot reload
npm run dev
# Open http://localhost:5173

# (plain-static projects: python -m http.server 8000 instead)

# When happy, push to GitHub
git add .
git commit -m "Add satellite trails feature"
git push origin main

# The Actions workflow rebuilds; changes are live in ~1-2 minutes
```

---

## Resources

- **GitHub Pages Docs:** https://docs.github.com/en/pages
- **Vite static deploy guide:** https://vite.dev/guide/static-deploy#github-pages
- **StrataKit:** https://stratakit.bentley.com
- **CesiumJS Demos:** https://sandcastle.cesium.com/
- **Markdown Guide:** https://www.markdownguide.org/

Happy building! 🚀
