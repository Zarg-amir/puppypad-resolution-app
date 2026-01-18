#!/usr/bin/env node
/**
 * Build script to sync frontend hub files into embedded code in src/index.js
 *
 * Usage: node build-hub.js
 *
 * This reads the source files from frontend/ and embeds them into
 * the Worker functions for Cloudflare Workers deployment.
 * 
 * APPROACH: 
 * - For CSS and HTML: Use template literals spanning multiple lines
 * - For JS: Use JSON.stringify to create a single-line double-quoted string
 * 
 * The functions in index.js have specific known structures:
 * - getResolutionHubHTML: uses template literal
 * - getHubStylesCSS: uses template literal  
 * - getHubAppJS: uses double-quoted string
 */

const fs = require('fs');
const path = require('path');

const HUB_HTML_PATH = path.join(__dirname, 'frontend/hub/index.html');
const HUB_APP_PATH = path.join(__dirname, 'frontend/hub/hub-app.js');
const HUB_CSS_PATH = path.join(__dirname, 'frontend/hub/hub-styles.css');
const FLOW_DOCS_REACT_PATH = path.join(__dirname, 'frontend/hub/flow-docs-react.js');
const FLOW_DOCS_HTML_PATH = path.join(__dirname, 'frontend/hub/flow-docs.html');
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

let flowDocsReactJS;
try {
  flowDocsReactJS = fs.readFileSync(FLOW_DOCS_REACT_PATH, 'utf8');
  console.log(`✓ Read ${FLOW_DOCS_REACT_PATH} (${flowDocsReactJS.length} bytes)`);
} catch (e) {
  // This file is optional - only exists for React Flow docs
  console.log(`⚠ ${FLOW_DOCS_REACT_PATH} not found (optional)`);
  flowDocsReactJS = null;
}

let flowDocsHTML;
try {
  flowDocsHTML = fs.readFileSync(FLOW_DOCS_HTML_PATH, 'utf8');
  console.log(`✓ Read ${FLOW_DOCS_HTML_PATH} (${flowDocsHTML.length} bytes)`);
} catch (e) {
  // This file is optional
  console.log(`⚠ ${FLOW_DOCS_HTML_PATH} not found (optional)`);
  flowDocsHTML = null;
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

// Split into lines for line-based replacement
let lines = indexJS.split('\n');

/**
 * Find the line number where a function starts (must be at beginning of line)
 */
function findFunctionLine(lines, functionName) {
  const pattern = `function ${functionName}() {`;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith(pattern)) {
      return i;
    }
  }
  return -1;
}

/**
 * Find the end line of a template literal function.
 * These functions end with a line containing just "}" after a line ending with ";"
 * The pattern is:
 *   ...some content\`;
 * }
 */
function findTemplateFunctionEndLine(lines, startLine) {
  for (let i = startLine + 1; i < lines.length; i++) {
    // Look for closing template literal pattern: ends with backtick-semicolon, next line is just }
    if (lines[i].trim() === '}' && i > 0 && lines[i-1].endsWith('`;')) {
      return i;
    }
  }
  // Fallback: look for first line that is just "}"
  for (let i = startLine + 1; i < lines.length; i++) {
    if (lines[i].trim() === '}') {
      return i;
    }
  }
  return -1;
}

/**
 * Find the end line of a JSON-string function (single-line return)
 * Pattern: 
 *   function name() {
 *     return "...long escaped string...";
 *   }
 */
function findJsonFunctionEndLine(lines, startLine) {
  // For JSON functions, the closing } is typically on the next line after the return
  // or on a line that is just "}"
  for (let i = startLine + 1; i < lines.length; i++) {
    if (lines[i].trim() === '}') {
      return i;
    }
  }
  return -1;
}

// Escape content for template literals
function escapeForTemplate(str) {
  return str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\${/g, '\\${');
}

// Process functions in reverse order (so line numbers don't shift)
// Process getHubAppJS first (highest line number)
const hubAppJSLine = findFunctionLine(lines, 'getHubAppJS');
if (hubAppJSLine === -1) {
  console.error('✗ Could not find getHubAppJS() function');
  process.exit(1);
}
let hubAppJSEndLine = findJsonFunctionEndLine(lines, hubAppJSLine);
if (hubAppJSEndLine === -1) {
  console.error('✗ Could not find end of getHubAppJS() function');
  process.exit(1);
}

// Replace getHubAppJS
const hubAppJSReplacement = `function getHubAppJS() {\n  return ${JSON.stringify(hubAppJS)};\n}`;
lines.splice(hubAppJSLine, hubAppJSEndLine - hubAppJSLine + 1, ...hubAppJSReplacement.split('\n'));
console.log(`✓ Updated getHubAppJS() (was lines ${hubAppJSLine + 1} to ${hubAppJSEndLine + 1})`);

// Handle getFlowDocsReactJS (if file exists)
if (flowDocsReactJS) {
  let flowDocsLine = findFunctionLine(lines, 'getFlowDocsReactJS');
  
  if (flowDocsLine === -1) {
    // Function doesn't exist, add it after getHubAppJS
    const newHubAppJSLine = findFunctionLine(lines, 'getHubAppJS');
    const newHubAppJSEndLine = findJsonFunctionEndLine(lines, newHubAppJSLine);
    const flowDocsReplacement = `\n// Flow Docs React JS Asset\n\nfunction getFlowDocsReactJS() {\n  return ${JSON.stringify(flowDocsReactJS)};\n}`;
    lines.splice(newHubAppJSEndLine + 1, 0, ...flowDocsReplacement.split('\n'));
    console.log(`✓ Added getFlowDocsReactJS() after getHubAppJS()`);
  } else {
    // Function exists, update it
    let flowDocsEndLine = findJsonFunctionEndLine(lines, flowDocsLine);
    const flowDocsReplacement = `function getFlowDocsReactJS() {\n  return ${JSON.stringify(flowDocsReactJS)};\n}`;
    lines.splice(flowDocsLine, flowDocsEndLine - flowDocsLine + 1, ...flowDocsReplacement.split('\n'));
    console.log(`✓ Updated getFlowDocsReactJS() (was lines ${flowDocsLine + 1} to ${flowDocsEndLine + 1})`);
  }
}

// Handle getFlowDocsHTML (if file exists)
if (flowDocsHTML) {
  let flowDocsHTMLLine = findFunctionLine(lines, 'getFlowDocsHTML');
  
  if (flowDocsHTMLLine === -1) {
    // Function doesn't exist, add it after getHubAppJS (or after getFlowDocsReactJS if it exists)
    const afterLine = findFunctionLine(lines, 'getFlowDocsReactJS') !== -1 
      ? findJsonFunctionEndLine(lines, findFunctionLine(lines, 'getFlowDocsReactJS'))
      : findJsonFunctionEndLine(lines, findFunctionLine(lines, 'getHubAppJS'));
    const flowDocsHTMLReplacement = `\n// Flow Docs HTML Asset\n\nfunction getFlowDocsHTML() {\n  return \`${escapeForTemplate(flowDocsHTML)}\`;\n}`;
    lines.splice(afterLine + 1, 0, ...flowDocsHTMLReplacement.split('\n'));
    console.log(`✓ Added getFlowDocsHTML()`);
  } else {
    // Function exists, update it
    let flowDocsHTMLEndLine = findTemplateFunctionEndLine(lines, flowDocsHTMLLine);
    const flowDocsHTMLReplacement = `function getFlowDocsHTML() {\n  return \`${escapeForTemplate(flowDocsHTML)}\`;\n}`;
    lines.splice(flowDocsHTMLLine, flowDocsHTMLEndLine - flowDocsHTMLLine + 1, ...flowDocsHTMLReplacement.split('\n'));
    console.log(`✓ Updated getFlowDocsHTML() (was lines ${flowDocsHTMLLine + 1} to ${flowDocsHTMLEndLine + 1})`);
  }
}

// Re-find CSS function (line numbers may have shifted)
const hubCSSLine = findFunctionLine(lines, 'getHubStylesCSS');
if (hubCSSLine === -1) {
  console.error('✗ Could not find getHubStylesCSS() function');
  process.exit(1);
}
let hubCSSEndLine = findTemplateFunctionEndLine(lines, hubCSSLine);
if (hubCSSEndLine === -1) {
  console.error('✗ Could not find end of getHubStylesCSS() function');
  process.exit(1);
}

// Replace getHubStylesCSS
const hubCSSReplacement = `function getHubStylesCSS() {\n  return \`${escapeForTemplate(hubCSS)}\`;\n}`;
lines.splice(hubCSSLine, hubCSSEndLine - hubCSSLine + 1, ...hubCSSReplacement.split('\n'));
console.log(`✓ Updated getHubStylesCSS() (was lines ${hubCSSLine + 1} to ${hubCSSEndLine + 1})`);

// Re-find HTML function (line numbers may have shifted)
const hubHTMLLine = findFunctionLine(lines, 'getResolutionHubHTML');
if (hubHTMLLine === -1) {
  console.error('✗ Could not find getResolutionHubHTML() function');
  process.exit(1);
}
let hubHTMLEndLine = findTemplateFunctionEndLine(lines, hubHTMLLine);
if (hubHTMLEndLine === -1) {
  console.error('✗ Could not find end of getResolutionHubHTML() function');
  process.exit(1);
}

// Replace getResolutionHubHTML
const hubHTMLReplacement = `function getResolutionHubHTML() {\n  return \`${escapeForTemplate(hubHTML)}\`;\n}`;
lines.splice(hubHTMLLine, hubHTMLEndLine - hubHTMLLine + 1, ...hubHTMLReplacement.split('\n'));
console.log(`✓ Updated getResolutionHubHTML() (was lines ${hubHTMLLine + 1} to ${hubHTMLEndLine + 1})`);

// Write back
try {
  fs.writeFileSync(INDEX_PATH, lines.join('\n'));
  console.log(`\n✅ Build complete! Worker now matches frontend files.`);
  console.log('   You can now deploy to Cloudflare Workers.');
} catch (e) {
  console.error(`✗ Failed to write ${INDEX_PATH}:`, e.message);
  process.exit(1);
}
