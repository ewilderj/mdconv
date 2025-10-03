# Configuration Reference

**Last updated:** October 3, 2025

This document describes all environment variables and configuration options available in the mdconv codebase.

## Environment Variables

### Debug Variables

#### `MDCONV_DEBUG`
- **Type:** String (`"1"` | unset)
- **Default:** Unset
- **Description:** Enables debug logging across all components when set to `"1"`
- **Usage:** 
  ```bash
  MDCONV_DEBUG=1 npm test
  MDCONV_DEBUG=1 raycast run mdconv.convert-clipboard
  ```
- **Impact:** All `mdlog('debug', ...)` calls will output to console
- **Files:** `src/core/logging.ts`

#### `MDCONV_DEBUG_INLINE`
- **Type:** String (`"1"` | unset)
- **Default:** Unset
- **Description:** Enables verbose HTML→Markdown conversion debugging, especially for monospace font detection
- **Usage:**
  ```bash
  MDCONV_DEBUG_INLINE=1 node scripts/demo-logging.mjs
  ```
- **Impact:** Logs normalized HTML and resulting Markdown when monospace content is detected
- **Files:** `src/core/converter.ts`

#### `MDCONV_DEBUG_CLIPBOARD`
- **Type:** String (`"1"`, `"true"`, `"TRUE"` | unset)
- **Default:** Unset
- **Description:** Enables detailed clipboard debugging in Raycast adapter, including locale normalization
- **Usage:**
  ```bash
  MDCONV_DEBUG_CLIPBOARD=1 raycast run mdconv.convert-clipboard
  ```
- **Impact:** Logs clipboard locale settings and pbpaste command execution details
- **Files:** `src/platforms/raycast/adapters/raycast-clipboard.ts`

### Runtime Variables

#### `NODE_ENV`
- **Type:** String (`"test"` | other)
- **Default:** Unset in production
- **Description:** Runtime environment detection
- **Impact:** When set to `"test"`, debug logs are automatically filtered out regardless of `MDCONV_DEBUG`
- **Files:** `src/core/logging.ts`, test files

### System Variables (Read-Only)

These system locale variables are read by the Raycast clipboard adapter for debugging and normalization:

#### `LANG`
- **Description:** System locale setting
- **Usage:** Read for locale normalization in pbpaste calls
- **Files:** `src/platforms/raycast/diagnose-clipboard.tsx`

#### `LC_ALL`
- **Description:** Override for all locale settings
- **Usage:** Read and normalized to ensure UTF-8 encoding
- **Files:** `src/platforms/raycast/adapters/raycast-clipboard.ts`, `src/platforms/raycast/diagnose-clipboard.tsx`

#### `LC_CTYPE`
- **Description:** Character classification locale
- **Usage:** Read for diagnostic purposes only
- **Files:** `src/platforms/raycast/diagnose-clipboard.tsx`

## Platform-Specific Configuration

### Chrome Extension
- **Configuration File:** `static/manifest.json`
- **Key Settings:** Permissions, content scripts, background scripts
- **Runtime:** Chrome extension manifest v3

### Raycast Extension
- **Configuration File:** `raycast/package.json`
- **Key Settings:** Commands, preferences, metadata
- **Preferences:** `imageHandling` dropdown with options:
  - `"preserve"` (default)
  - `"preserve-external-only"`
  - `"remove"`

## Code Configuration

### TypeScript Configuration
- **Root Config:** `tsconfig.json`
- **Raycast Config:** `raycast/tsconfig.json`
- **Key Settings:** ES2022 target, strict mode, module resolution

### Build Configuration
- **Chrome:** ESBuild with Chrome 115 target
- **Raycast:** Raycast CLI with TypeScript compilation
- **Testing:** tsx --test runner

## Debugging Setup

### Quick Debug Commands
```bash
# Enable all debug logging
MDCONV_DEBUG=1 npm run build:raycast

# Test clipboard debugging
MDCONV_DEBUG_CLIPBOARD=1 raycast run mdconv.convert-clipboard

# Run tests with debug output
MDCONV_DEBUG=1 npm test
```

### Demo Script
```bash
# Run logging demo with inline debugging
MDCONV_DEBUG_INLINE=1 node scripts/demo-logging.mjs
```

## Configuration Cleanup Opportunities

### Potential Improvements Identified
1. **Consolidate debug environment checking** - Currently scattered across multiple files
2. **Standardize debug variable naming** - Mix of `MDCONV_DEBUG_*` patterns
3. **Centralize locale handling** - Locale variables accessed in multiple places
4. **Consider configuration object** - Could replace scattered environment variable access

### Current Pain Points
- Debug environment detection repeated in multiple files
- Locale normalization logic spread across Raycast adapter files
- GlobalThis process type assertions duplicated
- No single source of truth for available environment variables

---

*This configuration reference is maintained alongside TODO.md improvements to support LLM codebase understanding.*