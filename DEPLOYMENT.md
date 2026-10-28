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

# Copy your project files here
# (your index.html, styles.css, app.js, etc.)

# Add all files
git add .

# Commit
git commit -m "Initial commit: satellite tracker"

# Push to GitHub
git push origin main
```

### Step 3: Enable GitHub Pages
1. Go to your repository on GitHub
2. Click **Settings** (top right)
3. Scroll down to **Pages** (left sidebar)
4. Under "Build and deployment":
   - Set **Source** to `Deploy from a branch`
   - Set **Branch** to `main` (or `master`)
   - Click **Save**
5. Wait 1-2 minutes
6. Your site is now live at: `https://YOUR-USERNAME.github.io/my-satellite-tracker`

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
- Make sure your `index.html` is in the root of the repository
- Or if it's in a folder, update Pages source to that folder

### "JavaScript isn't working"
- Open browser console (F12)
- Check for errors (red text)
- Make sure `index.html`, `styles.css`, and `app.js` are all present

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
        ├── styles.css
        └── app.js
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
# Make changes locally
# Edit index.html, app.js, etc.

# Test with local server
python -m http.server 8000
# Open http://localhost:8000

# When happy, push to GitHub
git add .
git commit -m "Add satellite trails feature"
git push origin main

# Changes are live in ~30 seconds!
```

---

## Resources

- **GitHub Pages Docs:** https://docs.github.com/en/pages
- **CesiumJS Demos:** https://sandcastle.cesium.com/
- **Markdown Guide:** https://www.markdownguide.org/

Happy building! 🚀
