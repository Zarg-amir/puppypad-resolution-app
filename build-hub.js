#!/usr/bin/env node
/**
 * Build script to sync frontend hub files into embedded code in src/index.js
 *
 * Usage: node build-hub.js
 *
 * This reads the source files from frontend/ and embeds them into
 * the Worker functions for Cloudflare Workers deployment.
 * 
 * This ensures both Pages and Worker deployments use the same content.
 */

const fs = require('fs');
const path = require('path');

const HUB_HTML_PATH = path.join(__dirname, 'frontend/hub/index.html');
const HUB_APP_PATH = path.join(__dirname, 'frontend/hub/hub-app.js');
const HUB_CSS_PATH = path.join(__dirname, 'frontend/hub/hub-styles.css');
const INDEX_PATH = path.join(__dirname, 'src/index.js');

console.log('🔨 Building hub files into Worker...\n');

// Read source files
let hubHTML, hubAppJS, hubCSS;
try {
  hubHTML = fs.readFileSync(HUB_HTML_PATH, 'utf8');
  console.log(`✓ Read ${HUB_HTML_PATH} (${hubHTML.length} bytes)`);
} catch (e) {
  console.error(`✗ Failed to read ${HUB_HTML_PATH}:`, e.message);
  process.exit(1);
}

try {
  hubAppJS = fs.readFileSync(HUB_APP_PATH, 'utf8');
  console.log(`✓ Read ${HUB_APP_PATH} (${hubAppJS.length} bytes)`);
} catch (e) {
  console.error(`✗ Failed to read ${HUB_APP_PATH}:`, e.message);
  process.exit(1);
}

try {
  hubCSS = fs.readFileSync(HUB_CSS_PATH, 'utf8');
  console.log(`✓ Read ${HUB_CSS_PATH} (${hubCSS.length} bytes)`);
} catch (e) {
  console.error(`✗ Failed to read ${HUB_CSS_PATH}:`, e.message);
  process.exit(1);
}

// Read index.js
let indexJS;
try {
  indexJS = fs.readFileSync(INDEX_PATH, 'utf8');
  console.log(`✓ Read ${INDEX_PATH}\n`);
} catch (e) {
  console.error(`✗ Failed to read ${INDEX_PATH}:`, e.message);
  process.exit(1);
}

/**
 * Ultra-simple function replacement: find function start, find next function start, replace everything in between
 */
function replaceFunction(content, functionName, newFunctionBody) {
  const searchPattern = `function ${functionName}() {`;
  const startPos = content.indexOf(searchPattern);
  
  if (startPos === -1) {
    console.error(`✗ Could not find ${functionName}() function`);
    process.exit(1);
  }
  
  // Find the start of the next function (any function that comes after)
  const afterStart = content.substring(startPos);
  
  // List of functions we might encounter
  const functionNames = ['getResolutionHubHTML', 'getHubAppJS', 'getHubStylesCSS'];
  let nextFunctionStart = content.length;
  
  for (const name of functionNames) {
    if (name !== functionName) {
      const nextPos = content.indexOf(`function ${name}() {`, startPos + searchPattern.length);
      if (nextPos !== -1 && nextPos < nextFunctionStart) {
        nextFunctionStart = nextPos;
      }
    }
  }
  
  // If we found a next function, replace everything from start to that function
  // Otherwise, replace to end of file
  const before = content.substring(0, startPos);
  const after = content.substring(nextFunctionStart);
  
  return before + newFunctionBody + '\n' + after;
}

// Update getResolutionHubHTML()
const escapedHTML = JSON.stringify(hubHTML);
const newHTMLFunction = `function getResolutionHubHTML() { return ${escapedHTML}; }`;
indexJS = replaceFunction(indexJS, 'getResolutionHubHTML', newHTMLFunction);
console.log('✓ Updated getResolutionHubHTML()');

// Update getHubAppJS()
const escapedJS = JSON.stringify(hubAppJS);
const newJSFunction = `function getHubAppJS() { return ${escapedJS}; }`;
indexJS = replaceFunction(indexJS, 'getHubAppJS', newJSFunction);
console.log('✓ Updated getHubAppJS()');

// Update getHubStylesCSS()
const escapedCSS = JSON.stringify(hubCSS);
const newCSSFunction = `function getHubStylesCSS() { return ${escapedCSS}; }`;
indexJS = replaceFunction(indexJS, 'getHubStylesCSS', newCSSFunction);
console.log('✓ Updated getHubStylesCSS()');

// Write back
try {
  fs.writeFileSync(INDEX_PATH, indexJS);
  console.log(`\n✅ Build complete! Worker now matches frontend files.`);
  console.log('   You can now deploy to Cloudflare Workers.');
} catch (e) {
  console.error(`✗ Failed to write ${INDEX_PATH}:`, e.message);
  process.exit(1);
}
