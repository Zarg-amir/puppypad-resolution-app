#!/usr/bin/env node
/**
 * Build script to sync frontend/hub/hub-app.js into the embedded code in src/index.js
 *
 * Usage: node build-hub.js
 *
 * This reads the clean source file (frontend/hub/hub-app.js) and embeds it
 * into the getHubAppJS() function in src/index.js for Cloudflare Workers deployment.
 */

const fs = require('fs');
const path = require('path');

const HUB_APP_PATH = path.join(__dirname, 'frontend/hub/hub-app.js');
const INDEX_PATH = path.join(__dirname, 'src/index.js');

console.log('Building hub-app.js into index.js...');

// Read the source hub-app.js
let hubAppJS;
try {
  hubAppJS = fs.readFileSync(HUB_APP_PATH, 'utf8');
  console.log(`✓ Read ${HUB_APP_PATH} (${hubAppJS.length} bytes)`);
} catch (e) {
  console.error(`✗ Failed to read ${HUB_APP_PATH}:`, e.message);
  process.exit(1);
}

// Read index.js
let indexJS;
try {
  indexJS = fs.readFileSync(INDEX_PATH, 'utf8');
  console.log(`✓ Read ${INDEX_PATH} (${indexJS.length} bytes)`);
} catch (e) {
  console.error(`✗ Failed to read ${INDEX_PATH}:`, e.message);
  process.exit(1);
}

// Find and replace the getHubAppJS function
const functionRegex = /function getHubAppJS\(\) \{\s*return "[\s\S]*?";\s*\}/;

if (!functionRegex.test(indexJS)) {
  console.error('✗ Could not find getHubAppJS() function in index.js');
  process.exit(1);
}

// Escape the JS content for embedding as a string
const escapedJS = JSON.stringify(hubAppJS);

// Replace the function
const newIndexJS = indexJS.replace(
  functionRegex,
  `function getHubAppJS() {\n  return ${escapedJS};\n}`
);

// Write back
try {
  fs.writeFileSync(INDEX_PATH, newIndexJS);
  console.log(`✓ Updated ${INDEX_PATH}`);
  console.log('\n✅ Build complete! You can now deploy to Cloudflare.');
} catch (e) {
  console.error(`✗ Failed to write ${INDEX_PATH}:`, e.message);
  process.exit(1);
}
