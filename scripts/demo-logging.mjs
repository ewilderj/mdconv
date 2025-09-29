#!/usr/bin/env node

/**
 * Manual logging demonstration for mdconv
 * Shows how logging works in different environments
 */

import { mdlog } from '../src/core/logging.js';
import { convertHtmlToMarkdown } from '../src/core/converter.js';

console.log('🧪 mdconv Logging Demonstration\n');

console.log('1. Basic logging patterns:');
mdlog('info', 'converter', 'Starting conversion process');
mdlog('warn', 'clipboard', 'Clipboard access might be restricted');
mdlog('error', 'dom-parser', 'Failed to parse malformed HTML', { 
  htmlLength: 1234,
  errorCode: 'PARSE_ERROR'
});

console.log('\n2. Debug logging (will only show if MDCONV_DEBUG=1):');
mdlog('debug', 'converter', 'Processing inline styles');
mdlog('debug', 'clipboard', 'Reading HTML from clipboard', {
  format: 'text/html',
  contentPreview: '<p>Sample content...</p>'
});

console.log('\n3. Real conversion with potential logging:');
const sampleHtml = `
<div style="font-family: 'Courier New'">
  <p>function example() {</p>
  <p>  console.log('Hello, world!');</p>
  <p>}</p>
</div>
`;

// Enable inline debug for this demo
process.env.MDCONV_DEBUG_INLINE = '1';

const markdown = convertHtmlToMarkdown(sampleHtml);
console.log('Converted markdown:', markdown);

console.log('\n4. Component-specific logging patterns:');
console.log('   [mdconv:converter] - Core conversion operations');
console.log('   [mdconv:clipboard] - Clipboard read/write operations');  
console.log('   [mdconv:dom-parser] - HTML parsing operations');
console.log('   [mdconv:chrome-popup] - Chrome extension UI operations');
console.log('   [mdconv:raycast-ui] - Raycast extension operations');

console.log('\n✅ Demo complete! To see debug logs, run:');
console.log('   MDCONV_DEBUG=1 node scripts/demo-logging.mjs');