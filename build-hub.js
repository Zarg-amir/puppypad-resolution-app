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

// Escape content for template literals
function escapeForTemplate(str) {
  return str.replace(/`/g, '\\`').replace(/\${/g, '\\${');
}

// Update getResolutionHubHTML()
const htmlFunctionRegex = /function getResolutionHubHTML\(\) \{\s*return `[\s\S]*?`;\s*\}/;
if (!htmlFunctionRegex.test(indexJS)) {
  console.error('✗ Could not find getResolutionHubHTML() function');
  process.exit(1);
}
const escapedHTML = escapeForTemplate(hubHTML);
indexJS = indexJS.replace(
  htmlFunctionRegex,
  `function getResolutionHubHTML() {\n  return \`${escapedHTML}\`;\n}`
);
console.log('✓ Updated getResolutionHubHTML()');

// Update getHubAppJS()
// Use a more robust approach: find function start, then find the matching closing brace
// This handles cases where the content contains "; patterns
const jsFunctionStart = indexJS.indexOf('function getHubAppJS() {');
if (jsFunctionStart === -1) {
  console.error('✗ Could not find getHubAppJS() function');
  process.exit(1);
}

// Find the return statement
const returnStart = indexJS.indexOf('return "', jsFunctionStart);
if (returnStart === -1) {
  console.error('✗ Could not find return statement in getHubAppJS()');
  process.exit(1);
}

// Find the end of the string by parsing JSON-style escaped string
// Start after 'return "' (8 characters)
let stringStart = returnStart + 8;
let stringEnd = stringStart;
let escaped = false;

// Parse the JSON-encoded string character by character
while (stringEnd < indexJS.length) {
  const char = indexJS[stringEnd];
  if (escaped) {
    escaped = false;
    stringEnd++;
  } else if (char === '\\') {
    escaped = true;
    stringEnd++;
  } else if (char === '"') {
    // Found the end of the string
    break;
  } else {
    stringEnd++;
  }
}

if (stringEnd >= indexJS.length || indexJS[stringEnd] !== '"') {
  console.error('✗ Could not find end of string in getHubAppJS()');
  process.exit(1);
}

// Find the semicolon and closing brace after the string
const semicolonPos = indexJS.indexOf(';', stringEnd + 1);
const bracePos = indexJS.indexOf('}', semicolonPos + 1);

if (semicolonPos === -1 || bracePos === -1) {
  console.error('✗ Could not find function end in getHubAppJS()');
  process.exit(1);
}

// Replace the entire function
const escapedJS = JSON.stringify(hubAppJS);
const beforeFunction = indexJS.substring(0, jsFunctionStart);
const afterFunction = indexJS.substring(bracePos + 1);
indexJS = beforeFunction + 'function getHubAppJS() {\n  return ' + escapedJS + ';\n}' + afterFunction;

console.log('✓ Updated getHubAppJS()');

// Update getHubStylesCSS()
const cssFunctionRegex = /function getHubStylesCSS\(\) \{\s*return `[\s\S]*?`;\s*\}/;
if (!cssFunctionRegex.test(indexJS)) {
  console.error('✗ Could not find getHubStylesCSS() function');
  process.exit(1);
}
const escapedCSS = escapeForTemplate(hubCSS);
indexJS = indexJS.replace(
  cssFunctionRegex,
  `function getHubStylesCSS() {\n  return \`${escapedCSS}\`;\n}`
);
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
