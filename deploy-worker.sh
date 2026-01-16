#!/bin/bash
# Deploy script for Cloudflare Worker
# This ensures the Worker uses worker.json config (not wrangler.toml which is for Pages)

npx wrangler deploy --config worker.json
