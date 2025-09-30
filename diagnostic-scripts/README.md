# Unicode Diagnostic Scripts

This folder contains diagnostic scripts created during investigation of the Unicode emoji mangling issue in the Raycast extension.

## Scripts

### test-clipboard-encoding.mjs
Tests how `pbpaste` handles UTF-8 encoding when reading from clipboard.
- Copies test file to clipboard
- Reads back with different methods
- Verifies emoji preservation

```bash
node diagnostic-scripts/test-clipboard-encoding.mjs
```

### test-linkedom-encoding.mjs
Tests how linkedom parses UTF-8 HTML with emojis.
- Compares browser HTML vs Word HTML
- Checks surrogate pair handling
- Verifies textContent extraction

```bash
node diagnostic-scripts/test-linkedom-encoding.mjs
```

### test-execsync-encoding.mjs
Tests if execSync's encoding parameter affects emoji handling.
- Compares `encoding: 'utf8'` vs buffer approach
- Checks byte preservation

```bash
node diagnostic-scripts/test-execsync-encoding.mjs
```

### test-surrogate-deep-dive.mjs
Deep analysis of JavaScript UTF-16 surrogate pair handling.
- Shows how emojis are stored in JavaScript
- Demonstrates `.includes()` behavior with surrogates
- Explains why tests pass despite surrogate pairs

```bash
node diagnostic-scripts/test-surrogate-deep-dive.mjs
```

### test-entity-fix.mjs
Tests a potential fix: converting UTF-8 emojis to HTML entities.
- Converts 4-byte UTF-8 sequences to `&#decimal;` format
- Tests if linkedom handles entities better
- Verifies full conversion pipeline

```bash
npx tsx diagnostic-scripts/test-entity-fix.mjs
```

### test-browser-clipboard-formats.sh
Interactive script to investigate available clipboard formats.
**Requires manual interaction:**
1. Run script
2. Copy emoji text from a web browser
3. Script shows all available clipboard formats

```bash
./diagnostic-scripts/test-browser-clipboard-formats.sh
```

## Key Findings

See `unicodedebug.md` in the project root for complete investigation results.

**TL;DR**: All isolated tests work correctly. The issue only occurs in the live Raycast environment when copying from browsers, suggesting a clipboard format or encoding mismatch that we haven't yet captured in test fixtures.
