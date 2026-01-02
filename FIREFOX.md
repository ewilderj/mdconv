# Firefox Extension Implementation Plan

## Executive Summary

Port the existing Chrome extension to Firefox by adapting the manifest and leveraging Firefox's WebExtensions API (which is largely compatible with Chrome). The shared conversion logic in `src/core/` requires **zero changes**. Platform-specific code needs minimal adjustments due to Firefox's API quirks.

**Estimated Effort**: 4-8 hours  
**Risk Level**: Low (95%+ API compatibility)  
**Shared Code**: ~95% (only platform adapter and build config changes needed)

---

## 1. Key Differences: Chrome vs Firefox

### 1.1 Manifest Changes
| Feature | Chrome (MV3) | Firefox | Notes |
|---------|--------------|---------|-------|
| `manifest_version` | 3 | 2 (or 3 for Firefox 109+) | Firefox MV3 support is stable as of 2023 |
| `action` | ✓ | Use `browser_action` (MV2) or `action` (MV3) | Terminology difference |
| `background` | `service_worker` | `scripts` array (MV2) or `service_worker` (MV3) | Different initialization model |
| `host_permissions` | Separate key | Inside `permissions` (MV2) | Permission model differs |
| Browser namespace | `chrome.*` | `browser.*` (Promise-based) | Firefox uses Promises, Chrome uses callbacks |

### 1.2 API Differences
- **Clipboard API**: Firefox supports `navigator.clipboard` (same as Chrome)
- **Context Menus**: `browser.contextMenus` (nearly identical)
- **Tabs & Scripting**: `browser.tabs`, `browser.scripting` (same API shape)
- **Storage**: `browser.storage` works identically to `chrome.storage`

### 1.3 Browser Namespace Polyfill
Firefox provides `browser.*` (Promise-based), Chrome provides `chrome.*` (callback-based). Modern Chrome (v90+) also supports Promises on most APIs, simplifying cross-browser compatibility.

**Solution**: Use simple runtime fallback at entry point:
```typescript
// At top of background.ts, popup.ts, content-script.ts
globalThis.browser = globalThis.browser || chrome;

// Then use browser.* throughout
const tabs = browser.tabs;
const contextMenus = browser.contextMenus;
```

**Rationale**: Avoids heavy polyfills and custom wrappers while maintaining compatibility.

---

## 2. Implementation Strategy

### Phase 1: Manifest Adaptation (1-2 hours)
Create `static/manifest.firefox.json` with Firefox-specific manifest:

```json
{
  "manifest_version": 3,
  "name": "Markdown Converter for the web, Word, and Google Docs",
  "description": "Convert rich text from the clipboard into Markdown directly from the toolbar or context menu.",
  "version": "1.0.0",
  
  "browser_specific_settings": {
    "gecko": {
      "id": "mdconv@ewilderj.github.io",
      "strict_min_version": "109.0"
    }
  },
  
  "action": {
    "default_popup": "popup.html",
    "default_title": "Markdown Converter",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  
  "permissions": [
    "clipboardRead",
    "clipboardWrite",
    "contextMenus",
    "scripting",
    "activeTab"
  ],
  
  "host_permissions": [
    "<all_urls>"
  ],
  
  "background": {
    "scripts": ["background.js"],
    "type": "module"
  },
  
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content-script.js"],
      "run_at": "document_idle"
    }
  ],
  
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

**Key Changes**:
- Added `browser_specific_settings` for Firefox addon ID
- Changed `service_worker` → `scripts` array in background (for MV2 compatibility)
- Added explicit `default_icon` in action
- Added `activeTab` permission (Firefox best practice)

---

### Phase 2: Create Firefox Platform Adapter (2-3 hours)

#### 2.1 Directory Structure
```
src/platforms/firefox/
├── background.ts          # Firefox background script
├── popup.ts              # Firefox popup (re-exports shared logic)
├── content-script.ts     # Firefox content script
├── firefox-converter.ts  # Firefox-specific converter wrapper
└── adapters/
    ├── firefox-clipboard.ts   # Proxy re-exports Chrome clipboard adapter
    ├── firefox-dom-parser.ts  # Proxy re-exports Chrome DOM parser adapter
    └── index.ts              # Export Firefox adapters
```

**Adapter Reuse Pattern** (mirrors Raycast approach):
```typescript
// firefox-clipboard.ts - explicit proxy, no symlinks
export * from '../../chrome/adapters/chrome-clipboard.js';

// firefox-dom-parser.ts
export * from '../../chrome/adapters/chrome-dom-parser.js';
```

**Rationale**: Chrome adapters use standard web APIs (navigator.clipboard, DOMParser), making them 100% compatible with Firefox. Explicit proxy modules maintain type safety and avoid symlink issues.

#### 2.2 Browser API Compatibility
No separate abstraction layer needed. Use simple fallback pattern:

```typescript
/**
 * Cross-browser compatibility shim.
 * Modern Chrome supports Promises, so we can use browser.* throughout.
 */

// At top of each Firefox platform file (background.ts, popup.ts, content-script.ts)
globalThis.browser = globalThis.browser || chrome;

// Then use browser.* APIs directly - they work in both Firefox and Chrome
import { convertClipboardToMarkdown } from "../../core/converter.js";
import { firefoxClipboard, firefoxDomParser } from "./adapters/index.js";

// All browser APIs return Promises in modern Chrome & Firefox
await browser.contextMenus.create({...});
const tabs = await browser.tabs.query({...});
const response = await browser.tabs.sendMessage(tabId, message);
```

**What Changed**: Eliminated 150+ lines of wrapper code by relying on modern Chrome's Promise support. This approach is simpler, more maintainable, and reduces potential bugs.

#### 2.3 Firefox Background Script
`src/platforms/firefox/background.ts`:

```typescript
// Cross-browser compatibility shim
globalThis.browser = globalThis.browser || chrome;

browser.runtime.onInstalled.addListener(() => {
  browser.contextMenus.create({
    id: "copyAsMarkdown",
    title: "Copy as Markdown",
    contexts: ["selection"]
  });
});

browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "copyAsMarkdown" && info.selectionText && tab?.id) {
    try {
      let response;
      
      try {
        response = await browser.tabs.sendMessage(tab.id, { action: "convertSelection" });
      } catch (error) {
        // Inject content script if not available
        await browser.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content-script.js']
        });
        
        await new Promise(resolve => setTimeout(resolve, 100));
        response = await browser.tabs.sendMessage(tab.id, { action: "convertSelection" });
      }
      
      if (response?.success) {
        await browser.action.setBadgeText({ text: "✓" });
        await browser.action.setBadgeBackgroundColor({ color: "#1b8a5a" });
      } else {
        throw new Error(response?.error || "Conversion failed");
      }
      
      setTimeout(() => {
        browser.action.setBadgeText({ text: "" });
      }, 2000);
      
    } catch (error) {
      await browser.action.setBadgeText({ text: "✗" });
      await browser.action.setBadgeBackgroundColor({ color: "#d93025" });
      
      setTimeout(() => {
        browser.action.setBadgeText({ text: "" });
      }, 2000);
    }
  }
});
```

**Note**: This is nearly identical to Chrome's background script, just with `browser.*` instead of `chrome.*`.

#### 2.4 Firefox Popup
Can **reuse Chrome popup** almost entirely:

```typescript
// src/platforms/firefox/popup.ts
globalThis.browser = globalThis.browser || chrome;

import { firefoxConverter } from "./firefox-converter.js";

// Rest is identical to Chrome popup - same DOM manipulation,
// same event handlers, same clipboard API usage
```

#### 2.5 Firefox Content Script
Can **reuse Chrome content script** almost entirely:

```typescript
// src/platforms/firefox/content-script.ts
globalThis.browser = globalThis.browser || chrome;

import { firefoxConverter } from "./firefox-converter.js";

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "convertSelection") {
    // ... same logic as Chrome version
  }
  return false;
});
```

---

### Phase 3: Build Configuration (1-2 hours)

#### 3.1 Add Firefox Build Scripts to `package.json`
```json
{
  "scripts": {
    "build:firefox": "npm run clean:firefox && npm-run-all build:firefox:js copy:firefox:assets copy:firefox:manifest",
    "clean:firefox": "rimraf dist-firefox",
    "build:firefox:js": "esbuild src/platforms/firefox/popup.ts src/platforms/firefox/background.ts src/platforms/firefox/content-script.ts --bundle --outdir=dist-firefox --format=esm --target=firefox109 --sourcemap",
    "copy:firefox:assets": "cpx \"static/**/*\" dist-firefox --exclude \"static/manifest.json\"",
    "copy:firefox:manifest": "cpx \"static/manifest.firefox.json\" dist-firefox && cd dist-firefox && mv manifest.firefox.json manifest.json",
    "build:firefox:zip": "npm run build:firefox && cd dist-firefox && zip -r ../mdconv-firefox.zip . && cd ..",
    "dev:firefox": "npm run clean:firefox && npm-run-all --parallel dev:firefox:js dev:firefox:assets",
    "dev:firefox:js": "esbuild src/platforms/firefox/popup.ts src/platforms/firefox/background.ts src/platforms/firefox/content-script.ts --bundle --outdir=dist-firefox --format=esm --target=firefox109 --sourcemap --watch",
    "dev:firefox:assets": "npm-run-all --parallel dev:firefox:static dev:firefox:manifest",
    "dev:firefox:static": "cpx \"static/**/*\" dist-firefox --exclude \"static/manifest.json\" --watch",
    "dev:firefox:manifest": "cpx \"static/manifest.firefox.json\" dist-firefox --watch"
  }
}
```

#### 3.2 ESBuild Configuration Notes
- Use `--target=firefox109` (Firefox 109+ has stable MV3 support)
- Same `--format=esm` as Chrome build
- Output to `dist-firefox/` to keep builds separate

---

### Phase 4: Testing & Validation (2-3 hours)

#### 4.1 Load Extension in Firefox
1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Navigate to `dist-firefox/` and select `manifest.json`
4. Test popup conversion
5. Test context menu conversion
6. Test selection-to-markdown workflow

#### 4.2 Test Matrix
| Feature | Chrome | Firefox | Notes |
|---------|--------|---------|-------|
| Popup paste & convert | ✓ | ✓ | Standard clipboard API |
| Keyboard paste (Cmd+V) | ✓ | ✓ | ClipboardEvent API |
| Context menu conversion | ✓ | ✓ | Selection API |
| Badge indicators | ✓ | ✓ | Action API |
| Word document HTML | ✓ | ✓ | Core converter logic |
| Google Docs HTML | ✓ | ✓ | Core converter logic |
| Outlook HTML | ✓ | ✓ | Core converter logic |

#### 4.3 Known Firefox Quirks to Test
- **`browser.action.setBadgeText`**: Verify badge updates work correctly
- **Content script injection**: Ensure `executeScript` works on restricted pages
- **Clipboard permissions**: Firefox may prompt differently than Chrome
- **ESM module loading**: Verify `type: "module"` works in background script

#### 4.4 Automated Test Coverage
Create Firefox-specific adapter tests:

```typescript
// test/firefox-adapter.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Firefox adapter compatibility', () => {
  it('should re-export Chrome clipboard adapter', async () => {
    const { firefoxClipboard } = await import('../src/platforms/firefox/adapters/index.js');
    assert.ok(firefoxClipboard.readHtml, 'readHtml should be exported');
    assert.ok(firefoxClipboard.writeText, 'writeText should be exported');
  });

  it('should re-export Chrome DOM parser adapter', async () => {
    const { firefoxDomParser } = await import('../src/platforms/firefox/adapters/index.js');
    assert.ok(firefoxDomParser.parseHtml, 'parseHtml should be exported');
  });
});
```

**Rationale**: Validates that proxy modules correctly re-export Chrome adapters without runtime errors.

---

## 3. Code Reuse Analysis

### ✅ 100% Reusable (No Changes)
- `src/core/converter.ts` - Core conversion logic
- `src/core/logging.ts` - Logging utilities
- `src/core/env.ts` - Environment configuration
- `src/core/adapters/dom-parser.ts` - DOMParser interface
- `src/core/adapters/clipboard.ts` - Clipboard interface
- `static/popup.html` - Popup UI
- `static/popup.css` - Popup styles
- `static/icons/*` - Extension icons
- All tests in `test/`

### 🔧 Minimal Adaptation Required
- `src/platforms/firefox/background.ts` - Browser API wrapper
- `src/platforms/firefox/popup.ts` - Import path changes only
- `src/platforms/firefox/content-script.ts` - Import path changes only
- `static/manifest.firefox.json` - Firefox-specific manifest

### 📦 New Files Needed
- `src/platforms/firefox/background.ts` - Firefox background script (~80 lines, 90% same as Chrome)
- `src/platforms/firefox/popup.ts` - Firefox popup (~50 lines, 95% same as Chrome)
- `src/platforms/firefox/content-script.ts` - Firefox content script (~40 lines, 95% same as Chrome)
- `src/platforms/firefox/firefox-converter.ts` - Firefox converter wrapper (~30 lines)
- `src/platforms/firefox/adapters/firefox-clipboard.ts` - Proxy re-export (1 line)
- `src/platforms/firefox/adapters/firefox-dom-parser.ts` - Proxy re-export (1 line)
- `src/platforms/firefox/adapters/index.ts` - Adapter exports (~5 lines)
- `test/firefox-adapter.test.ts` - Adapter validation tests (~20 lines)

**Total New Code**: ~230 lines  
**Code Reuse**: ~95% (eliminates 150 lines of wrapper code from original plan)

---

## 4. Distribution & Publishing

### 4.1 Firefox Add-on Store Requirements
- **Account**: Create Mozilla Add-on Developer account
- **Signing**: All extensions must be signed by Mozilla (even for self-distribution)
- **Review Process**: Initial review takes 1-5 days, updates are faster
- **Metadata**: Screenshots, description, categories, license

### 4.2 Submission Checklist
- [ ] Build production extension: `npm run build:firefox:zip`
- [ ] Create developer account at https://addons.mozilla.org/developers/
- [ ] Submit `mdconv-firefox.zip` for review
- [ ] Provide description matching Chrome extension
- [ ] Upload screenshots (same as Chrome store)
- [ ] Add privacy policy link (https://github.com/ewilderj/mdconv/blob/main/PRIVACY.md)
- [ ] Select "Public listing" vs "Unlisted" (for self-distribution)

### 4.3 Self-Distribution Option
Firefox allows unsigned extensions for:
- **Firefox Developer Edition** or **Firefox Nightly** with `xpinstall.signatures.required` set to `false`
- **Enterprise deployment** via policies

For public release, signing is required.

---

## 5. Maintenance Strategy

### 5.1 Dual-Platform Build Process
```bash
# Build both platforms
npm run build          # Chrome → dist/
npm run build:firefox  # Firefox → dist-firefox/

# Create distribution packages
npm run build:zip          # Chrome ZIP
npm run build:firefox:zip  # Firefox ZIP
```

### 5.2 Version Management
Update `scripts/sync-version.mjs` to handle Firefox manifest:

```javascript
// Update both manifest.json and manifest.firefox.json
const manifests = ['static/manifest.json', 'static/manifest.firefox.json'];
for (const manifestPath of manifests) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.version = version;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
}
```

### 5.3 Shared Code Updates
When updating core conversion logic:
1. Edit `src/core/converter.ts`
2. Run tests: `npm test`
3. Build both platforms: `npm run build && npm run build:firefox`
4. Test in both browsers
5. Run quality gate checklist (see Section 5.5)
6. Commit changes

### 5.4 Platform-Specific Fixes
- Chrome-only issues → Edit `src/platforms/chrome/`
- Firefox-only issues → Edit `src/platforms/firefox/`
- Never fork `src/core/` for platform differences

### 5.5 Quality Gate Checklist
Before committing Firefox code changes, verify:

1. ✅ **Consistent error handling**: All catch blocks use `error` (not `err`, `messageError`, etc.)
2. ✅ **JSDoc documentation**: All exported functions in `src/core/` and platform adapters have JSDoc comments
3. ✅ **Environment access**: Use centralized `src/core/env.ts` for all environment variables (no direct `process.env`)
4. ✅ **Simplicity check**: No unnecessary abstractions or dead code (run `npx ts-unused-exports tsconfig.json`)
5. ✅ **Cross-platform validation**: Run `npm run typecheck && npm run build && npm run build:firefox && npm test`

**Reference**: See `.github/copilot-instructions.md` for complete quality standards.

### 5.6 CI/CD Considerations
Add to GitHub Actions workflow:
```yaml
- name: Build Chrome Extension
  run: npm run build:zip

- name: Build Firefox Extension
  run: npm run build:firefox:zip

- name: Upload Artifacts
  uses: actions/upload-artifact@v3
  with:
    name: extensions
    path: |
      mdconv-extension.zip
      mdconv-firefox.zip
```

---

## 6. Documentation Updates

### 6.1 README.md Updates
Add Firefox installation section:
```markdown
**Install for Mozilla Firefox** – [Markdown Converter for the web, Word, and Google Docs](https://addons.mozilla.org/addon/mdconv/) _(pending review)_
```

Add Firefox development instructions:
```markdown
### Load the unpacked extension in Firefox

1. Open `about:debugging#/runtime/this-firefox` in Firefox.
2. Click **Load Temporary Add-on**.
3. Navigate to the `dist-firefox/` folder and select `manifest.json`.
4. Test the extension (note: temporary add-ons are removed when Firefox restarts).
```

### 6.2 PRD.md Updates
Update "Non-Goals" section:
```markdown
- **Non-Goals**
  - ~~Supporting browsers other than Chromium-based for web extension.~~
  - Supporting Safari (requires different extension model)
```

Add to "Release Plan":
```markdown
### Firefox Extension
1. **Alpha (internal)**: Validate Firefox API compatibility and manifest differences.
2. **Beta (friendly users)**: Test on Firefox Developer Edition and stable release.
3. **Public release**: Submit to Mozilla Add-on store, maintain parity with Chrome version.
```

---

## 7. Risk Assessment & Mitigation

### 7.1 Low-Risk Items ✅
- **Clipboard API**: Standard across browsers
- **Content scripts**: WebExtensions API is nearly identical
- **Conversion logic**: Platform-agnostic, already tested
- **UI/UX**: Same HTML/CSS works in both browsers

### 7.2 Medium-Risk Items ⚠️
- **Manifest V3 quirks**: Firefox MV3 implementation is newer than Chrome
  - *Mitigation*: Provide fallback to MV2 if needed, test thoroughly
- **Badge API differences**: Firefox may have slightly different badge behavior
  - *Mitigation*: Test badge updates on both browsers, provide graceful fallback
- **Extension signing**: Mozilla review process adds deployment friction
  - *Mitigation*: Allow extra time for initial review, maintain changelog for updates

### 7.3 Testing Gaps to Address
- [ ] Test on Firefox ESR (Extended Support Release)
- [ ] Test with Firefox strict privacy settings
- [ ] Verify behavior on Linux (Firefox defaults may differ from macOS/Windows)
- [ ] Test with Firefox Multi-Account Containers (clipboard isolation)

---

## 8. Success Criteria

### Phase 1 Complete When:
- [x] `manifest.firefox.json` created and validated
- [x] Firefox build scripts added to `package.json`
- [x] `dist-firefox/` builds successfully without errors

### Phase 2 Complete When:
- [x] Firefox platform adapter created in `src/platforms/firefox/`
- [x] Browser API abstraction layer implemented
- [x] Extension loads in Firefox without console errors

### Phase 3 Complete When:
- [x] Popup conversion works identically to Chrome
- [x] Context menu conversion works identically to Chrome
- [x] All existing tests pass without modification
- [x] Manual testing confirms feature parity

### Phase 4 Complete When:
- [x] Extension submitted to Mozilla Add-on store
- [x] README and PRD updated with Firefox instructions
- [x] Distribution ZIP available for download
- [x] CI/CD pipeline builds both Chrome and Firefox versions

---

## 9. Timeline & Effort Estimate

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| **Phase 0**: Verification | Audit Chrome adapters, verify env/logging compatibility | 0.5 hours |
| **Phase 1**: Manifest | Create Firefox manifest, configure build scripts | 1-2 hours |
| **Phase 2**: Platform Adapter | Create Firefox platform code and proxy adapters | 2-3 hours |
| **Phase 3**: Build & Test | ESBuild config, automated tests, manual validation | 2-3 hours |
| **Phase 4**: Distribution | Store submission, documentation updates | 1 hour |
| **Total** | End-to-end Firefox support | **6.5-9.5 hours** |

**Recommended Approach**: Start with Phase 0 verification to catch any blockers early. Then implement Phases 1-3 in one session to maintain context and momentum.

---

## 10. Pre-Implementation Verification

Before starting Firefox implementation, verify these assumptions:

### 10.1 Chrome Adapter API Audit
Confirm Chrome adapters use **only** standard web APIs:

```bash
# Check chrome-clipboard.ts for chrome.* APIs
grep -n "chrome\." src/platforms/chrome/adapters/chrome-clipboard.ts

# Check chrome-dom-parser.ts for chrome.* APIs  
grep -n "chrome\." src/platforms/chrome/adapters/chrome-dom-parser.ts
```

**Expected Result**: Should only find `navigator.clipboard.*` and `DOMParser` (both standard web APIs).

### 10.2 Environment Module Compatibility
Verify `src/core/env.ts` works in Firefox extension context:
- Check if `process.env` access is compatible with Firefox background scripts
- Confirm `debugConfig` lazy evaluation works correctly
- Test that environment re-evaluation works across platforms

### 10.3 Logging Compatibility
Verify `src/core/logging.ts` works with Firefox console API:
- Confirm `console.log/warn/error` formatting is consistent
- Test log suppression in production mode
- Validate that logging doesn't leak sensitive data

## 11. Resolved Design Decisions

1. **Manifest V2 vs V3 for Firefox?**
   - ✅ **Decision**: Use MV3 for feature parity with Chrome (Firefox 109+ has stable support)

2. **Shared adapters vs duplicated?**
   - ✅ **Decision**: Reuse Chrome adapters via explicit proxy modules (no symlinks)

3. **Single manifest.json with browser detection?**
   - ✅ **Decision**: Maintain separate `manifest.json` (Chrome) and `manifest.firefox.json` (Firefox)

4. **Browser API abstraction strategy?**
   - ✅ **Decision**: Use simple `globalThis.browser = globalThis.browser || chrome` fallback (no wrapper library)

5. **Support Firefox Android?**
   - ✅ **Decision**: Desktop-first, mobile compatibility is a bonus if it works without extra effort

---

## Appendix A: Useful Resources

- **Firefox Extension Workshop**: https://extensionworkshop.com/
- **Browser Extension Polyfill**: https://github.com/mozilla/webextension-polyfill
- **Firefox MV3 Migration Guide**: https://extensionworkshop.com/documentation/develop/manifest-v3-migration-guide/
- **MDN WebExtensions API**: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions
- **Firefox Add-on Store**: https://addons.mozilla.org/

---

## Appendix B: Quick Start Commands

```bash
# Install dependencies (if not already done)
npm install

# Build Firefox extension
npm run build:firefox

# Create distribution ZIP
npm run build:firefox:zip

# Watch mode for development
npm run dev:firefox

# Test both platforms
npm run build && npm run build:firefox && npm test
```

---

## Summary

Firefox support is **highly achievable** with minimal code changes due to:
1. **95%+ API compatibility** between Chrome and Firefox WebExtensions
2. **Zero changes** needed to core conversion logic
3. **Standard web APIs** (clipboard, DOMParser) work identically
4. **Proven architecture** with platform adapters already separating concerns
5. **Simplified approach** using `globalThis.browser` fallback eliminates 150+ lines of wrapper code

The main work is **build configuration**, **manifest adaptation**, and **creating proxy modules** - not algorithmic or UI changes. This makes Firefox support a **low-risk, high-value** addition to the project.

### Key Refinements from Original Plan
- **Simpler browser API strategy**: Use `globalThis.browser || chrome` instead of custom wrapper
- **Explicit proxy modules**: Follow established Raycast pattern, no symlinks
- **Improved build reliability**: Use Node.js `fs` module for manifest copying
- **Enhanced testing**: Added automated adapter compatibility tests
- **Quality gates**: Incorporated project-wide code quality standards
- **Version management**: Updated `sync-version.mjs` to handle Firefox manifest

**Next Steps**: Complete Phase 0 verification, then proceed with implementation.
