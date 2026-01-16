# Deployment Guide

## Architecture Overview

This app has **two separate deployments**:

1. **Cloudflare Pages** - Serves static frontend files (`frontend/` directory)
   - URL: `https://your-pages-domain.pages.dev`
   - Serves: `index.html`, `hub.html`, CSS, JS files directly

2. **Cloudflare Worker** - Serves API routes and embedded hub HTML
   - URL: `https://your-worker-domain.workers.dev`
   - Serves: `/api/*` routes, `/hub` (embedded HTML), `/hub/api/*` routes

## The Problem

- **Pages** serves `frontend/hub.html` directly (static file)
- **Worker** serves hub HTML from embedded function `getResolutionHubHTML()` in `src/index.js`
- This creates duplication - you have to update both places manually

## The Solution

We use a **build script** (`build-hub.js`) that automatically syncs frontend files to the Worker's embedded functions.

### How It Works

1. **Source of Truth**: `frontend/` directory
   - `frontend/hub.html` - Hub HTML
   - `frontend/hub/hub-app.js` - Hub JavaScript
   - `frontend/hub/hub-styles.css` - Hub CSS

2. **Build Process**: Run `node build-hub.js`
   - Reads files from `frontend/`
   - Embeds them into `src/index.js` functions:
     - `getResolutionHubHTML()` ← `frontend/hub.html`
     - `getHubAppJS()` ← `frontend/hub/hub-app.js`
     - `getHubStylesCSS()` ← `frontend/hub/hub-styles.css`

3. **Deployment**:
   - **Pages**: Deploys `frontend/` directory (automatic on git push)
   - **Worker**: Deploys `src/index.js` with embedded content (run `wrangler deploy`)

## Workflow

### When You Update Hub Files

1. **Edit files in `frontend/`** (this is your source of truth)
2. **Run build script**: `node build-hub.js`
3. **Commit and push**: Both deployments will be updated
   - Pages: Auto-deploys from `frontend/` 
   - Worker: Deploy manually with `wrangler deploy` (or set up CI/CD)

### Quick Deploy Commands

```bash
# 1. Update frontend files (hub.html, hub-app.js, hub-styles.css)

# 2. Sync to Worker
node build-hub.js

# 3. Commit changes
git add .
git commit -m "Update hub styling"
git push

# 4. Deploy Worker (if needed)
wrangler deploy
```

## Why Two Deployments?

- **Pages**: Fast CDN for static assets, free tier
- **Worker**: API routes, database access, server-side logic
- **Hub**: Needs both - static HTML (Pages) + API routes (Worker)

## Future Improvement: Unified Deployment

You could configure Cloudflare to:
- Use Pages for static files
- Use Worker Functions (Pages Functions) for API routes
- This would unify everything under one domain

But for now, the build script keeps both in sync automatically.
