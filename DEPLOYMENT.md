# Deployment Guide

## Architecture Overview

This app has **two separate deployments**:

1. **Cloudflare Pages** - Serves the chat app only
   - URL: `https://your-pages-domain.pages.dev`
   - Serves: `index.html` (chat app) at root `/`
   - Simple static file serving - no redirects needed

2. **Cloudflare Worker** - Serves the hub app + all APIs
   - URL: `https://your-worker-domain.workers.dev`
   - Serves: `/hub` and all `/hub/*` routes (handles routing server-side)
   - Serves: All `/api/*` and `/hub/api/*` routes

## Why This Structure?

- **Chat app** is simple static HTML → Perfect for Pages
- **Hub app** needs server-side routing for SPA → Worker handles this perfectly
- **No redirects needed** - each deployment serves what it's good at

## URLs

- **Chat app**: `https://pages-domain.pages.dev/` (or Worker domain `/`)
- **Hub app**: `https://worker-domain.workers.dev/hub` (or any `/hub/*` route)

## Build Process

The `build-hub.js` script syncs frontend hub files into the Worker:

1. **Source of Truth**: `frontend/` directory
   - `frontend/index.html` - Chat app
   - `frontend/hub/index.html` - Hub app
   - `frontend/hub/hub-app.js` - Hub JavaScript
   - `frontend/hub/hub-styles.css` - Hub CSS

2. **Build Process**: Run `node build-hub.js`
   - Reads `frontend/hub/index.html` and embeds it into Worker's `getResolutionHubHTML()`
   - Reads `frontend/hub/hub-app.js` and embeds it into Worker's `getHubAppJS()`
   - Reads `frontend/hub/hub-styles.css` and embeds it into Worker's `getHubStylesCSS()`

3. **Deployment**:
   - **Pages**: Auto-deploys `frontend/` directory on git push (serves chat app)
   - **Worker**: Deploy manually with `wrangler deploy` (serves hub + APIs)

## Workflow

```bash
# 1. Update frontend files
# Edit: frontend/index.html, frontend/hub/index.html, etc.

# 2. Sync hub files to Worker
node build-hub.js

# 3. Commit and push
git add .
git commit -m "Update hub"
git push

# 4. Deploy Worker (if needed)
wrangler deploy
```

## Important Notes

- **Hub should be accessed via Worker URL**, not Pages URL
- Worker handles all `/hub/*` routing server-side (no redirects needed)
- Chat app works on both Pages and Worker (simple static file)
