#!/usr/bin/env node
import { readFileSync } from 'fs';
import { parseHTML } from 'linkedom';

console.log('=== Testing linkedom UTF-8 Parsing ===\n');

// Read the browser HTML
const browserHtml = readFileSync('test/raycast_unicode_raw.html', 'utf8');
console.log('1. Browser HTML (first 100 chars):');
console.log(browserHtml.substring(0, 100));
console.log('\nContains emoji?', browserHtml.includes('🎯'));
console.log();

// Parse with linkedom
console.log('2. Parsing with linkedom (parseHTML):');
const { document } = parseHTML(browserHtml);
console.log('Body textContent:', document.body.textContent);
console.log('Contains emoji?', document.body.textContent.includes('🎯'));
console.log();

// Check the span element
console.log('3. Examining span element:');
const span = document.querySelector('span');
if (span) {
  console.log('Span textContent:', span.textContent);
  console.log('Span textContent length:', span.textContent.length);
  console.log('First char code:', span.textContent.charCodeAt(0).toString(16));
  console.log('Contains emoji?', span.textContent.includes('🎯'));
  
  // Check char codes
  const text = span.textContent;
  console.log('\nFirst 20 characters as hex codes:');
  for (let i = 0; i < Math.min(20, text.length); i++) {
    const code = text.charCodeAt(i);
    console.log(`  [${i}] U+${code.toString(16).padStart(4, '0')} "${text[i]}"`);
  }
}
console.log();

// Now test with buffer input
console.log('4. Testing with buffer input (latin1):');
const bufferInput = readFileSync('test/raycast_unicode_raw.html');
const latin1String = bufferInput.toString('latin1');
console.log('Latin1 string includes emoji?', latin1String.includes('🎯'));
const { document: latin1Doc } = parseHTML(latin1String);
console.log('Parsed textContent:', latin1Doc.body.textContent);
console.log('Contains emoji?', latin1Doc.body.textContent.includes('🎯'));
console.log();

// Test the Word HTML too
console.log('5. Testing Word HTML (HTML entities):');
const wordHtml = readFileSync('test/word_unicode_raw.html', 'utf8');
const { document: wordDoc } = parseHTML(wordHtml);
const wordText = wordDoc.body.textContent.trim();
console.log('Word textContent (first 50 chars):', wordText.substring(0, 50));
console.log('Contains emoji?', wordText.includes('🎯'));
