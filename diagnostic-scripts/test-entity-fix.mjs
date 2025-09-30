#!/usr/bin/env node
import { readFileSync } from 'fs';
import { parseHTML } from 'linkedom';

console.log('=== Testing Solution: Convert UTF-8 to HTML Entities ===\n');

/**
 * Convert all 4-byte UTF-8 sequences (emojis, etc.) to HTML numeric entities.
 * This works around linkedom's UTF-8 parsing bug.
 */
function convertUtf8ToHtmlEntities(html) {
  // Match all 4-byte UTF-8 sequences (emojis, rare CJK, etc.)
  // UTF-8 4-byte pattern: 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
  return html.replace(/[\u{10000}-\u{10FFFF}]/gu, (char) => {
    const codePoint = char.codePointAt(0);
    return `&#${codePoint};`;
  });
}

// Test with browser HTML
const browserHtml = readFileSync('test/raycast_unicode_raw.html', 'utf8');
console.log('1. Original HTML (around emoji):');
const emojiPos = browserHtml.indexOf('🎯');
console.log(browserHtml.substring(emojiPos - 10, emojiPos + 40));
console.log();

// Convert emojis to entities
const fixedHtml = convertUtf8ToHtmlEntities(browserHtml);
console.log('2. Fixed HTML (around emoji):');
const fixedPos = fixedHtml.indexOf('&#');
console.log(fixedHtml.substring(fixedPos - 10, fixedPos + 50));
console.log();

// Parse with linkedom
console.log('3. Parsing fixed HTML with linkedom:');
const { document } = parseHTML(fixedHtml);
const span = document.querySelector('span');
console.log('Span textContent:', span.textContent);
console.log('Contains emoji?', span.textContent.includes('🎯'));
console.log('First char code:', span.textContent.charCodeAt(0).toString(16));
console.log();

// Test the full conversion pipeline
console.log('4. Testing with converter:');
import { convertHtmlToMarkdown } from './src/core/converter.ts';
import { RaycastDOMParserAdapter } from './src/platforms/raycast/adapters/raycast-dom-parser.ts';

// Original (broken)
const brokenMarkdown = convertHtmlToMarkdown(browserHtml, {
  domParserAdapter: new RaycastDOMParserAdapter()
});
console.log('Without fix:', brokenMarkdown.trim());
console.log('Contains emoji?', brokenMarkdown.includes('🎯'));
console.log();

// Fixed
const fixedMarkdown = convertHtmlToMarkdown(fixedHtml, {
  domParserAdapter: new RaycastDOMParserAdapter()
});
console.log('With fix:', fixedMarkdown.trim());
console.log('Contains emoji?', fixedMarkdown.includes('🎯'));
console.log();

// Verify it matches expected
const expected = readFileSync('test/expected_markdown_raycast_unicode.md', 'utf8').trim();
console.log('Matches expected?', fixedMarkdown.trim() === expected);
