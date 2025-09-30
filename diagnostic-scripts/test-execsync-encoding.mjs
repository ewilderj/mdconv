#!/usr/bin/env node
import { execSync } from 'child_process';
import { readFileSync } from 'fs';

console.log('=== Testing execSync encoding behavior ===\n');

// Copy file to clipboard first
execSync('pbcopy < test/raycast_unicode_raw.html');

console.log('1. Reading with encoding: "utf8":');
const utf8Result = execSync('pbpaste -Prefer public.html', { encoding: 'utf8' });
console.log('Type:', typeof utf8Result);
console.log('Length:', utf8Result.length);
const utf8EmojiPos = utf8Result.indexOf('Next') - 5;
console.log('Around emoji:', JSON.stringify(utf8Result.substring(utf8EmojiPos, utf8EmojiPos + 20)));
console.log('Contains 🎯:', utf8Result.includes('🎯'));
console.log('Char codes at emoji:');
for (let i = utf8EmojiPos; i < utf8EmojiPos + 3; i++) {
  console.log(`  [${i}] 0x${utf8Result.charCodeAt(i).toString(16)}`);
}
console.log();

console.log('2. Reading as buffer, then toString("utf8"):');
const bufferResult = execSync('pbpaste -Prefer public.html');
const bufferString = bufferResult.toString('utf8');
console.log('Type:', typeof bufferString);
console.log('Length:', bufferString.length);
const bufEmojiPos = bufferString.indexOf('Next') - 5;
console.log('Around emoji:', JSON.stringify(bufferString.substring(bufEmojiPos, bufEmojiPos + 20)));
console.log('Contains 🎯:', bufferString.includes('🎯'));
console.log('Char codes at emoji:');
for (let i = bufEmojiPos; i < bufEmojiPos + 3; i++) {
  console.log(`  [${i}] 0x${bufferString.charCodeAt(i).toString(16)}`);
}
console.log();

console.log('3. Comparing results:');
console.log('utf8Result === bufferString:', utf8Result === bufferString);
console.log('Length match:', utf8Result.length === bufferString.length);

// Check byte-by-byte
let firstDiff = -1;
for (let i = 0; i < Math.min(utf8Result.length, bufferString.length); i++) {
  if (utf8Result.charCodeAt(i) !== bufferString.charCodeAt(i)) {
    firstDiff = i;
    break;
  }
}
if (firstDiff >= 0) {
  console.log(`First difference at position ${firstDiff}:`);
  console.log(`  utf8Result[${firstDiff}]: 0x${utf8Result.charCodeAt(firstDiff).toString(16)}`);
  console.log(`  bufferString[${firstDiff}]: 0x${bufferString.charCodeAt(firstDiff).toString(16)}`);
} else {
  console.log('No differences found');
}
