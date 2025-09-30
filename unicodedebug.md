# Unicode Mangling Diagnostic Plan

**Status**: Investigation Complete - Debug Build Ready for Testing

## Problem Statement

When copying text with Unicode emoji (🎯) from a web browser:
- **Mangled output**: `?? Next: This month's work has concluded.�`
- **Expected output**: `🎯 Next: This month's work has concluded.`

## Diagnostic Execution Summary

✅ Phase 1: Raw Data Examination - **COMPLETED**
✅ Phase 2: Clipboard Reading Tests - **COMPLETED**  
✅ Phase 3: DOM Parsing Tests - **COMPLETED**
✅ Phase 4: Debug Instrumentation - **COMPLETED**
⏸️ Phase 5: Live Browser Testing - **AWAITING USER**

## Key Observations

1. ✅ Plain text from terminal → Works correctly in Raycast
2. ❌ HTML from browser (raycast_unicode_raw.html) → Mangled in Raycast
3. ✅ HTML from Word (word_unicode_raw.html) → Works correctly in Raycast
4. ✅ Tests with raycast_unicode_raw.html → Pass correctly (no mangling)

## Hypothesis

The issue is NOT:
- Plain text vs HTML (Word HTML works fine)
- The linkedom vs JSDOM difference (tests pass)
- The emoji character itself (works in other contexts)

The issue IS likely:
- **Character encoding mismatch** when reading HTML from `pbpaste`
- **Byte sequence interpretation** in the browser clipboard format
- **Meta charset handling** in the specific browser HTML format

## Diagnostic Plan

### Phase 1: Examine the Raw Data
1. ✅ Compare the raw byte sequences of both HTML files
2. ✅ Check charset declarations in both files
3. ✅ Examine how the emoji is encoded in each file

### Phase 2: Test Clipboard Reading
4. ⬜ Capture raw `pbpaste` output with hex dump
5. ⬜ Test different pbpaste format specifiers
6. ⬜ Compare encoding when reading HTML vs plain text

### Phase 3: Test DOM Parsing
7. ⬜ Parse both HTMLs with linkedom and inspect output
8. ⬜ Check textContent extraction from parsed nodes
9. ⬜ Test with different character encodings

### Phase 4: Trace Through Conversion Pipeline
10. ⬜ Add debug logging at each stage
11. ⬜ Compare Word HTML vs Browser HTML processing
12. ⬜ Identify exact point where mangling occurs

---

## Diagnostic Results

### Phase 1: Raw Data Examination

#### Step 1: File byte sequences

**Browser HTML (raycast_unicode_raw.html):**
```
Byte offset 0x2c0: f0 9f 8e af 20 4e 65 78 74
                   └─emoji─┘  sp N  e  x  t
```
- Emoji encoded as UTF-8 bytes: `f0 9f 8e af` (🎯)
- This is correct UTF-8 encoding for U+1F3AF (DIRECT HIT)

**Word HTML (word_unicode_raw.html):**
```
Line 747: <span>&#127919;</span> Next: This month's work has concluded.
```
- Emoji encoded as HTML entity: `&#127919;` (decimal)
- 127919 in decimal = 0x1F3AF in hex = U+1F3AF (DIRECT HIT) ✅
- Same character, different encoding method

**KEY FINDING #1:** Word uses HTML entities (`&#127919;`), browser uses raw UTF-8 bytes (`f0 9f 8e af`)

#### Step 2: Charset declarations

**Browser HTML:**
- `<meta charset='utf-8'>` at the very beginning
- Single quotes around utf-8

**Word HTML:**
- `<meta http-equiv=Content-Type content="text/html; charset=utf-8">`
- Standard HTTP-EQUIV style declaration

Both declare UTF-8, but Word uses HTML entities anyway (defense-in-depth).

#### Step 3: Theory so far

The browser HTML contains raw UTF-8 bytes that should work fine IF:
1. The file is read as UTF-8
2. pbpaste outputs UTF-8
3. linkedom parses UTF-8 correctly

But we're seeing `??` and `�` which are classic "replacement characters" when:
- UTF-8 is interpreted as Latin-1/ISO-8859-1
- OR bytes are corrupted during reading
- OR the encoding is lost somewhere in the pipeline

### Phase 2: Test Clipboard Reading

#### Step 4: pbpaste encoding test

✅ **Result: pbpaste works correctly**
- Raw UTF-8 bytes preserved: `f09f8eaf` (🎯)
- Both default and `public.html` format work
- Emoji correctly read as UTF-8 string

### Phase 3: Test DOM Parsing

#### Step 7: linkedom parsing test

🔴 **CRITICAL BUG FOUND!**

When linkedom parses the browser HTML with raw UTF-8 emoji bytes:
```javascript
span.textContent.charCodeAt(0) = 0xd83c  // UTF-16 surrogate pair (high)
span.textContent.charCodeAt(1) = 0xdfaf  // UTF-16 surrogate pair (low)
```

**The Problem:**
- Emoji U+1F3AF (🎯) in UTF-8 is 4 bytes: `f0 9f 8e af`
- linkedom incorrectly interprets this as two separate UTF-16 surrogates
- When converted to string, displays as `��` (two replacement characters)
- JavaScript sees `includes('🎯')` as FALSE because the emoji is broken

**Why Word HTML works:**
- Word uses HTML entity: `&#127919;`
- linkedom correctly decodes HTML entities
- Result: proper U+1F3AF character

**Why tests pass:**
- Unknown - possibly JSDOM handles UTF-8 better than linkedom
- Or test environment has different string encoding

## Root Cause Identified

~~linkedom's `parseHTML()` has a UTF-8 decoding issue with emoji and other 4-byte UTF-8 sequences. It incorrectly creates UTF-16 surrogate pairs in the JavaScript string instead of proper Unicode code points.~~

### CORRECTION: Surrogate Pairs Are NORMAL

Further testing reveals that:
1. Emojis in JavaScript **always** use UTF-16 surrogate pairs (2 chars)
2. linkedom correctly creates these pairs: 0xD83C + 0xDFAF = U+1F3AF (🎯)
3. JavaScript `.includes('🎯')` works correctly with these pairs
4. `execSync` with `encoding: 'utf8'` preserves emojis correctly
5. Tests pass because everything is actually working!

### The REAL Problem

The user reports seeing `??` and `�` in Raycast output, but our tests show the emoji works fine. This suggests:

**Option A: Display/Font Issue**
- Raycast UI can't render the emoji
- Shows replacement characters instead
- But the Markdown IS correct underneath

**Option B: Different Raycast Environment**
- Production Raycast has different Node.js version
- Different character encoding settings
- Different terminal/console behavior

**Option C: Copy-Paste Context Matters**
- When copying from browser, additional clipboard metadata
- Raycast might be reading a different clipboard format
- `pbpaste -Prefer public.html` might not be the format browsers use

### Next Investigation: Real Clipboard Format from Browser

## Testing Plan - Manual Steps Required

### Step 1: Build Raycast extension with debug logging

```bash
npm run build:raycast
```

### Step 2: Set debug environment variable

In Raycast preferences or terminal where you launch Raycast:
```bash
export MDCONV_DEBUG_CLIPBOARD=1
```

### Step 3: Test the actual problem

1. Open a web browser
2. Go to a page with the text: `🎯 Next: This month's work has concluded.`
3. Copy that text
4. Run the Raycast extension "Convert Clipboard to Markdown"
5. Check the Console output in Raycast Developer Tools

### Step 4: Analyze debug output

The debug logs will show:
- `[raycast-clipboard]` - What HTML was read from pbpaste
- `[raycast-converter]` - Whether emoji is in HTML, plain text, and final markdown
- Character codes and emoji detection

### Alternative: Test with clipboard format script

Run the manual test script:
```bash
./test-browser-clipboard-formats.sh
```

Then copy the emoji text from a browser and check what formats are available.

## Preliminary Findings Summary

1. ✅ UTF-8 encoding works correctly in all test scenarios
2. ✅ linkedom creates valid surrogate pairs (normal for JavaScript)  
3. ✅ execSync with encoding:'utf8' preserves emojis correctly
4. ✅ Conversion pipeline works in isolated tests
5. ❌ Real Raycast environment shows mangled output (`??` and `�`)

**Hypothesis**: The issue occurs only with specific clipboard formats from browsers that we haven't captured in our test fixtures. Need live debugging with actual browser clipboard data.

## Code Changes Made

1. Added debug logging to `raycast-clipboard.ts`:
   - Logs emoji detection in HTML
   - Shows code points of found emojis
   - **Always-on console.log** (no environment variable needed)

2. Added debug logging to `raycast-converter.ts`:
   - Logs HTML and markdown emoji presence
   - Shows intermediate conversion steps
   - **Always-on console.log** (no environment variable needed)

3. Added debug logging to `convert-clipboard.tsx`:
   - Logs UI conversion lifecycle
   - Shows result length and emoji detection
   - **Always-on console.log** (no environment variable needed)

**Note**: Changed from conditional logging to always-on because Raycast's sandboxed environment doesn't support environment variables the same way as Node.js.

## Conclusions & Next Steps

### What We Learned

1. **The pipeline works correctly in isolation**
   - All tests pass including the new Unicode test
   - pbpaste correctly reads UTF-8
   - linkedom correctly parses UTF-8 (with normal surrogate pairs)
   - Conversion produces correct output

2. **Surrogate pairs are not the problem**
   - JavaScript always represents emojis as UTF-16 surrogate pairs
   - This is normal and expected behavior
   - `.includes('🎯')` works correctly with surrogate pairs

3. **The issue is environment-specific**
   - Only occurs in real Raycast when copying from browser
   - Does not occur in tests
   - Does not occur when copying from Word
   - Does not occur when copying from terminal

### Likely Root Causes (in order of probability)

1. **Browser clipboard format mismatch**
   - Browsers may use a different clipboard format than `public.html`
   - May need to try `public.utf16-plain-text` or other formats
   - The HTML we capture in tests may not match what browsers actually put on clipboard

2. **Encoding mismatch in specific browsers**
   - Chrome/Safari/Firefox may encode clipboard differently
   - Some browsers may use UTF-16LE instead of UTF-8 for HTML
   - Character encoding declaration may be missing or different

3. **Raycast runtime environment**
   - Node.js version differences
   - Different default encoding settings
   - Shell environment variables affecting execSync

### Immediate Next Steps for User

1. **Run the Raycast extension in dev mode:**
   ```bash
   cd raycast && npm run dev
   ```
   
   This will open Raycast in development mode with hot reloading.

2. **Open Raycast Developer Tools:**
   - In Raycast, press `Cmd + Shift + D` to open Developer Tools
   - Or go to Raycast menu → View Developer Tools
   - Keep the Console tab visible

3. **Test with actual browser clipboard:**
   - Copy `🎯 Next: This month's work has concluded.` from a browser
   - Run "Convert Clipboard to Markdown" command
   - Watch the Console output - you should see:
     - `[mdconv:ui]` - UI lifecycle logs
     - `[mdconv:clipboard]` - Clipboard reading logs
     - `[mdconv:converter]` - Conversion pipeline logs

4. **Share the debug output:**
   - Take a screenshot or copy the console logs
   - Look specifically for:
     - What HTML length was read
     - Whether emoji is detected in HTML
     - Whether emoji is in the final markdown
     - Any error messages

3. **Run clipboard format investigation:**
   ```bash
   ./diagnostic-scripts/test-browser-clipboard-formats.sh
   ```
   Then copy from browser and observe which formats are available

4. **Try different browsers:**
   - Test with Chrome, Safari, Firefox
   - See if the issue is browser-specific

**Note**: Debug logging is now always-on, so you don't need to set environment variables.

### Potential Fixes (once root cause confirmed)

- Add fallback clipboard format reading (try multiple formats)
- Pre-process HTML to convert emojis to HTML entities
- Add encoding detection and conversion
- Handle different UTF-16 vs UTF-8 scenarios

## Solution Options

### Option 1: Pre-process HTML to convert emojis to HTML entities
Before passing to linkedom, convert UTF-8 emojis to `&#decimal;` entities.

### Option 2: Post-process textContent to fix surrogate pairs  
After extraction, fix malformed surrogate pairs in the output string.

### Option 3: Switch to a different DOM parser
Use JSDOM or another parser that handles UTF-8 correctly (but may impact Raycast bundle size).

### Option 4: Fix at clipboard read level
Detect and convert emojis to entities when reading from pbpaste.

---

## Quick Reference

### Test Files
- `test/raycast_unicode_raw.html` - Browser HTML with raw UTF-8 emoji (causes issue)
- `test/word_unicode_raw.html` - Word HTML with HTML entity emoji (works fine)
- `test/expected_markdown_raycast_unicode.md` - Expected output
- `test/verify-markdown.test.ts` - Test suite (includes new Unicode test)

### Modified Code Files
- `src/platforms/raycast/adapters/raycast-clipboard.ts` - Added emoji detection logging
- `src/platforms/raycast/raycast-converter.ts` - Added conversion pipeline logging

### Diagnostic Scripts
All located in `diagnostic-scripts/` folder - see `diagnostic-scripts/README.md` for details.

### Debug Commands

```bash
# Run tests
npm test

# Build Raycast with debug logging (always-on)
npm run build:raycast

# Run Raycast in dev mode (debug logs automatically enabled)
cd raycast && npm run dev

# Open Raycast Developer Tools once Raycast is running:
# Press Cmd + Shift + D or use Raycast menu → View Developer Tools

# Check clipboard formats (requires manual browser copy)
./diagnostic-scripts/test-browser-clipboard-formats.sh

# Test encoding behavior
node diagnostic-scripts/test-clipboard-encoding.mjs
node diagnostic-scripts/test-linkedom-encoding.mjs
node diagnostic-scripts/test-surrogate-deep-dive.mjs
npx tsx diagnostic-scripts/test-entity-fix.mjs
```

### What's Next

1. User runs Raycast extension with debug logging
2. User copies problematic text from browser
3. User shares debug console output
4. We analyze which clipboard format is being used
5. We implement appropriate fix based on findings



## 🎯 BREAKTHROUGH - Root Cause Found!

**Date**: September 29, 2025
**Status**: Root cause identified from live debugging

### Console Output Analysis

```
[mdconv:clipboard] HTML contains 🎯? false          ❌ Emoji lost in HTML
[mdconv:converter] Plain text: 🎯 Next: ...        ✅ Emoji present in plain text  
[mdconv:converter] Markdown result: ?? Next: ...   ❌ Mangled output
```

### The Problem

**The emoji is being corrupted when reading HTML via `pbpaste -Prefer public.html`**, even though:
- The HTML is 778 chars (correct length)
- Plain text clipboard reading works perfectly
- The file test fixture has the emoji

### Why This Happens

When browsers copy to clipboard, they put HTML in the `public.html` format, but the UTF-8 emoji bytes are getting mangled during the `execSync()` read, even with `encoding: 'utf8'` specified.

This explains why:
- ✅ Word HTML works (uses HTML entities: `&#127919;`)
- ❌ Browser HTML fails (uses raw UTF-8 bytes: `f0 9f 8e af`)
- ✅ Plain text works (Raycast API reads it correctly)
- ✅ Tests work (read from file, not clipboard)

### The Fix

**Solution 1: Use plain text when HTML is corrupted**
We already have both HTML and plain text. Detect when HTML has mangled Unicode and fall back to plain text.

**Solution 2: Read HTML as binary, then decode properly**
Stop using `encoding: 'utf8'` in execSync and handle the conversion ourselves.

**Solution 3: Convert corrupted bytes back to proper UTF-8**
Detect the mangled surrogate pairs and fix them.

