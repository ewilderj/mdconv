#!/usr/bin/env node
import { readFileSync } from 'fs';
import { parseHTML } from 'linkedom';

console.log('=== Deep Dive: Surrogate Pair Handling ===\n');

const browserHtml = readFileSync('test/raycast_unicode_raw.html', 'utf8');
const { document } = parseHTML(browserHtml);
const span = document.querySelector('span');
const text = span.textContent;

console.log('1. Character analysis:');
console.log('Text:', text);
console.log('Length (JS):', text.length);
console.log('Length (codePoints):', Array.from(text).length);
console.log();

console.log('2. First "character" breakdown:');
console.log('text[0]:', text[0]);
console.log('text[1]:', text[1]);
console.log('text.charCodeAt(0):', '0x' + text.charCodeAt(0).toString(16), `(${text.charCodeAt(0)})`);
console.log('text.charCodeAt(1):', '0x' + text.charCodeAt(1).toString(16), `(${text.charCodeAt(1)})`);
console.log('text.codePointAt(0):', '0x' + text.codePointAt(0).toString(16), `(${text.codePointAt(0)})`);
console.log();

console.log('3. String contains checks:');
console.log('text.includes("🎯"):', text.includes('🎯'));
console.log('text.startsWith("🎯"):', text.startsWith('🎯'));
console.log('text === "🎯 Next...":', text.substring(0, 5) === '🎯 Next');
console.log();

console.log('4. Emoji character itself:');
const emoji = '🎯';
console.log('emoji:', emoji);
console.log('emoji.length:', emoji.length);
console.log('emoji.charCodeAt(0):', '0x' + emoji.charCodeAt(0).toString(16));
console.log('emoji.charCodeAt(1):', '0x' + emoji.charCodeAt(1).toString(16));
console.log('emoji.codePointAt(0):', '0x' + emoji.codePointAt(0).toString(16));
console.log();

console.log('5. Comparison:');
console.log('text[0] === emoji[0]:', text[0] === emoji[0]);
console.log('text[1] === emoji[1]:', text[1] === emoji[1]);
console.log('text.substring(0, 2) === emoji:', text.substring(0, 2) === emoji);
console.log();

console.log('6. How Turndown might see it:');
// Simulate what happens when we iterate
for (let i = 0; i < Math.min(10, text.length); i++) {
  const char = text[i];
  const code = text.charCodeAt(i);
  const codePoint = text.codePointAt(i);
  console.log(`[${i}] char="${char}" charCode=0x${code.toString(16)} codePoint=0x${codePoint.toString(16)}`);
}
