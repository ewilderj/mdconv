# Developer Guide

This document provides architecture overview and platform-specific build information for contributors.

## Architecture Overview

mdconv is a multi-platform Markdown converter with shared core logic and platform-specific adapters:

```
┌─────────────────────────────────────────┐
│         Core Conversion Logic           │
│    (src/core/converter.ts)              │
│                                         │
│  • HTML → Markdown via Turndown         │
│  • Word heading normalization           │
│  • Google Docs cleanup                  │
│  • Monospace detection → code blocks    │
│  • Image handling (preserve/skip)       │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴────────┐
       │   Adapters     │
       │   (Interfaces) │
       └───────┬────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
┌───▼────┐ ┌──▼─────┐ ┌──▼─────┐
│ Chrome │ │Firefox │ │Raycast │
│Platform│ │Platform│ │Platform│
└────────┘ └────────┘ └────────┘
```

### Core Components

- **`src/core/converter.ts`** - Main conversion engine using Turndown
- **`src/core/adapters/`** - Platform abstraction interfaces:
  - `clipboard.ts` - Clipboard read/write interface
  - `dom-parser.ts` - HTML parsing interface
- **`src/core/env.ts`** - Centralized environment configuration
- **`src/core/logging.ts`** - Debug logging utilities

### Platform Implementations

Each platform lives in `src/platforms/<platform>/` with:
- Entry points (popup.ts, background.ts, content-script.ts)
- Platform-specific converter wrapper
- Adapters implementing core interfaces

## Chrome/Edge/Brave Extension

**Location:** `src/platforms/chrome/`

### How It Works

1. **Popup UI** (`popup.ts`) - Main interface for manual paste & convert
2. **Context Menu** (`background.ts`) - Right-click "Copy as Markdown" on selections
3. **Content Script** (`content-script.ts`) - Extracts HTML from page selections
4. **Adapters** (`adapters/`) - Use browser clipboard APIs and jsdom for parsing

### Building

```bash
# Development (watch mode)
npm run dev

# Production build
npm run build

# Create distributable ZIP
npm run build:zip
```

**Output:** `dist/` directory contains unpacked extension, `mdconv-extension.zip` for store submission

**Static Assets:** `static/` contains manifest.json, popup HTML/CSS, and icons - copied to dist/ during build

### Loading in Browser

**Chrome:**
1. Navigate to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" → select `dist/`

**Edge:**
1. Navigate to `edge://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" → select `dist/`

## Firefox Extension

**Location:** `src/platforms/firefox/`

### How It Works

Firefox implementation uses the **proxy adapter pattern** - it re-exports Chrome adapters because both use standard Web APIs:

```typescript
// src/platforms/firefox/adapters/firefox-clipboard.ts
export * from "../../chrome/adapters/chrome-clipboard.js";
```

**Why this works:** Both Chrome and Firefox support:
- Standard `navigator.clipboard` API
- Standard DOM parsing via jsdom
- Manifest V3 (with minor differences handled at manifest level)

### Key Differences from Chrome

1. **Manifest:** Uses `static/manifest.firefox.json` with Firefox-specific fields:
   - `browser_specific_settings.gecko` for add-on ID
   - `data_collection_permissions: {required: ["none"]}`
   
2. **Browser API Access:** Uses `globalThis.browser` fallback:
   ```typescript
   const browser = globalThis.browser || chrome;
   ```

3. **Build Target:** ESBuild uses `--target=firefox109` (vs chrome115)

### Building

```bash
# Development
npm run dev:firefox

# Production build
npm run build:firefox

# Create distributable ZIP
npm run build:firefox:zip

# Create source package for Mozilla reviewers
npm run build:firefox:source
```

**Outputs:**
- `dist-firefox/` - Unpacked extension
- `mdconv-firefox.zip` - Store submission package
- `mdconv-firefox-source.zip` - Source code for Mozilla review

### Store Submission

See [FIREFOX_BUILD.md](FIREFOX_BUILD.md) for detailed build instructions provided to Mozilla reviewers.

## Raycast Extension

**Location:** `src/platforms/raycast/` (source) + `raycast/` (extension package)

### How It Works

Raycast extension has a **unique build architecture** because Raycast's store only accepts self-contained extensions:

```
Development (monorepo):
├── src/core/              ← Shared source
├── src/platforms/raycast/ ← Raycast source
└── raycast/
    ├── src/               ← Thin proxy modules
    └── lib/               ← Copied source (gitignored locally, committed for Raycast CI)

Publishing to Raycast Store:
└── raycast/               ← Only this directory submitted
    ├── src/               ← Proxies to lib/
    ├── lib/               ← Self-contained copy of shared code
    ├── package.json       ← Self-contained dependencies
    └── tsconfig.json      ← Self-contained config
```

### Build Process

1. **Local Development:** 
   - Proxy modules in `raycast/src/` import from `../../src/platforms/raycast/`
   - Prebuild script copies shared code to `raycast/lib/` before building
   - Works seamlessly in monorepo context

2. **Raycast Store Submission:**
   - `raycast/lib/` is committed to git
   - Raycast's CI only sees the `raycast/` directory
   - Imports reference `../lib/` which is already present
   - No access to parent directories needed

### Key Files

**Proxy modules** (`raycast/src/*.tsx`):
```typescript
// raycast/src/convert-clipboard.tsx
export { default } from "../lib/platforms/raycast/convert-clipboard.js";
```

**Build scripts:**
- `scripts/prepare-raycast-build.mjs` - Copies `src/core/` and `src/platforms/raycast/` to `raycast/lib/`
- `scripts/sync-version.mjs` - Syncs version from root package.json

**Self-contained configs:**
- `raycast/package.json` - Includes all dependencies (turndown, linkedom, etc.)
- `raycast/tsconfig.json` - No parent directory references

### Building

```bash
# From root (includes prebuild sync)
npm run build:raycast

# Development mode (auto-reload in Raycast)
npm run dev:raycast

# From raycast/ directory
cd raycast
npm run build  # prebuild runs automatically
npm run dev
```

### Testing Locally

```bash
cd raycast
npm run dev
```

Opens extension in Raycast with hot-reload. Search "Convert Clipboard to Markdown" in Raycast to test.

### Publishing to Raycast Store

```bash
cd raycast
npm run publish
```

This:
1. Runs prebuild to update `lib/`
2. Opens PR to [raycast/extensions](https://github.com/raycast/extensions)
3. Raycast's CI validates and builds using only the `raycast/` directory

**Important:** Always commit `raycast/lib/` before publishing so Raycast's CI has the latest code.

## Development Workflow

### 1. Install Node.js

**macOS:**
```bash
brew install node
```

**Windows:**
1. Download from [nodejs.org](https://nodejs.org) (LTS version)
2. Run installer
3. Fix PowerShell execution policy if needed:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

Verify: `node --version` (should show v25.x or later)

### 2. Install Dependencies

```bash
npm install
npm run raycast:install  # If working on Raycast extension
```

### 3. Build Commands

```bash
# Type checking
npm run typecheck

# Chrome extension
npm run build        # Production
npm run build:zip    # + create ZIP
npm run dev          # Watch mode

# Firefox extension
npm run build:firefox
npm run build:firefox:zip
npm run build:firefox:source
npm run dev:firefox

# Raycast extension
npm run build:raycast
npm run dev:raycast
```

### 4. Testing

```bash
npm test  # Run all tests
```

Tests use fixtures in `test/` covering:
- Word desktop app HTML
- Word Online HTML
- Google Docs HTML
- Outlook Web HTML
- Image handling scenarios

### 5. Debugging

**Chrome Extension:**
```javascript
// In popup DevTools console
localStorage.setItem('mdconv.debugClipboard', 'true');
// Paste again to see raw HTML logged
localStorage.removeItem('mdconv.debugClipboard');  // Disable
```

**Raycast Extension:**
```bash
# Check logs in Raycast development console
npm run dev:raycast
# Raycast shows errors/console.log output
```

**Environment Variables:**
- `MDCONV_DEBUG=1` - Enable all debug logging
- `MDCONV_DEBUG_CLIPBOARD=1` - Log clipboard contents
- `MDCONV_DEBUG_INLINE=1` - Log HTML→Markdown conversion details

See `src/core/env.ts` for complete environment variable definitions.

## Code Quality Standards

### Error Handling
- Use `error` consistently in catch blocks (never `err`, `messageError`)
- Pattern: `} catch (error) { /* handle */ }`

### Documentation
- Add JSDoc comments to all exported functions in `src/core/`
- Include purpose, parameters, return value, and key behaviors

### Configuration
- Use centralized `src/core/env.ts` for all environment access
- Avoid direct `process.env` access

### Simplicity
- Prefer simple functions over classes when possible
- Regularly check for dead code: `npx ts-unused-exports tsconfig.json`

### Quality Gate Checklist

Before committing substantial changes:
1. ✅ All catch blocks use `error` consistently?
2. ✅ Exported functions have JSDoc documentation?
3. ✅ Environment access through `src/core/env.ts`?
4. ✅ Checked for unused exports?
5. ✅ Tests pass and builds work for all platforms?

Run: `npm run typecheck && npm run build && npm run build:raycast && npm test`

## Platform-Specific Notes

### Chrome/Firefox
- Share 95% of code via proxy adapters
- Only differ in manifest and build targets
- Both use standard Web APIs

### Raycast
- macOS only (Raycast limitation)
- Uses Node.js APIs for clipboard access
- Requires committed `lib/` directory for store builds
- Development uses parent source, publishing uses self-contained copy

## Contributing

1. Create a feature branch
2. Make changes, following code quality standards above
3. Run quality gate checks
4. Update tests if needed
5. Commit with clear messages
6. For Raycast changes, rebuild and commit `raycast/lib/`

## References

- Main README: [README.md](README.md)
- Firefox Build Instructions: [FIREFOX_BUILD.md](FIREFOX_BUILD.md)
- Product Requirements: [PRD.md](docs/PRD.md)
