#!/usr/bin/env node
import { execSync } from 'child_process';
import { readFileSync } from 'fs';

console.log('=== Testing Clipboard Encoding ===\n');

// First, let's see what's in our test file
console.log('1. Test file raw bytes (emoji section):');
const fileBytes = readFileSync('test/raycast_unicode_raw.html');
const emojiStart = fileBytes.indexOf(Buffer.from([0xf0, 0x9f, 0x8e, 0xaf]));
console.log('Emoji found at byte offset:', emojiStart);
console.log('Bytes around emoji:', fileBytes.slice(emojiStart, emojiStart + 30).toString('hex'));
console.log('As UTF-8 string:', fileBytes.slice(emojiStart, emojiStart + 30).toString('utf8'));
console.log();

// Now copy the file to clipboard and read it back
console.log('2. Copying test file to clipboard...');
try {
  execSync('pbcopy < test/raycast_unicode_raw.html');
  console.log('✓ Copied to clipboard\n');
  
  // Read back with default pbpaste
  console.log('3. Reading with default pbpaste:');
  const defaultOutput = execSync('pbpaste', { encoding: 'utf8' });
  const defaultEmojiStart = defaultOutput.indexOf('Next:') - 10;
  console.log('Text around emoji:', defaultOutput.slice(defaultEmojiStart, defaultEmojiStart + 40));
  console.log('Contains emoji?', defaultOutput.includes('🎯'));
  console.log();
  
  // Read with HTML format
  console.log('4. Reading with pbpaste -Prefer public.html:');
  const htmlOutput = execSync('pbpaste -Prefer public.html', { encoding: 'utf8' });
  const htmlEmojiStart = htmlOutput.indexOf('Next:') - 10;
  console.log('Text around emoji:', htmlOutput.slice(htmlEmojiStart, htmlEmojiStart + 40));
  console.log('Contains emoji?', htmlOutput.includes('🎯'));
  console.log();
  
  // Read as buffer and check encoding
  console.log('5. Reading as binary buffer:');
  const bufferOutput = execSync('pbpaste -Prefer public.html');
  const bufEmojiStart = bufferOutput.indexOf(Buffer.from([0xf0, 0x9f, 0x8e, 0xaf]));
  if (bufEmojiStart >= 0) {
    console.log('✓ Emoji UTF-8 bytes found at offset:', bufEmojiStart);
    console.log('Bytes:', bufferOutput.slice(bufEmojiStart, bufEmojiStart + 20).toString('hex'));
    console.log('As UTF-8:', bufferOutput.toString('utf8').slice(bufEmojiStart, bufEmojiStart + 40));
  } else {
    console.log('✗ Emoji UTF-8 bytes NOT found');
    console.log('Looking for any f0 bytes...');
    const f0Indices = [];
    for (let i = 0; i < bufferOutput.length; i++) {
      if (bufferOutput[i] === 0xf0) f0Indices.push(i);
    }
    console.log('Found f0 bytes at:', f0Indices);
  }
  console.log();
  
  // Try to read with explicit encoding
  console.log('6. Trying different encodings:');
  const latin1 = bufferOutput.toString('latin1').includes('🎯');
  const utf8 = bufferOutput.toString('utf8').includes('🎯');
  const ascii = bufferOutput.toString('ascii').includes('🎯');
  console.log('latin1:', latin1);
  console.log('utf8:', utf8);
  console.log('ascii:', ascii);
  
} catch (error) {
  console.error('Error:', error.message);
}
