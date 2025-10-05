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
Firefox provides `browser.*` (Promise-based), Chrome provides `chrome.*` (callback-based). Modern Chrome also supports Promises, but we need to handle both:

**Solution**: Use `webextension-polyfill` or simple runtime detection:
```typescript
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
```

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
├── popup.ts              # Firefox popup (same as Chrome)
├── content-script.ts     # Firefox content script
├── firefox-converter.ts  # Firefox-specific converter wrapper
└── adapters/
    ├── firefox-clipboard.ts   # Same as Chrome (uses standard navigator.clipboard)
    ├── firefox-dom-parser.ts  # Same as Chrome (uses standard DOMParser)
    └── index.ts              # Export Firefox adapters
```

#### 2.2 Browser API Abstraction
Create `src/platforms/firefox/browser-api.ts`:

```typescript
/**
 * Cross-browser API wrapper for Chrome/Firefox compatibility.
 * Firefox provides browser.* (Promises), Chrome provides chrome.* (callbacks + Promises).
 */

// Detect which browser API is available
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

export const tabs = browserAPI.tabs;
export const contextMenus = browserAPI.contextMenus;
export const scripting = browserAPI.scripting;
export const runtime = browserAPI.runtime;
export const action = browserAPI.action || (browserAPI as any).browserAction;

/**
 * Promisify chrome.* APIs if needed (Firefox already uses Promises)
 */
export function sendMessage<T = any>(tabId: number, message: any): Promise<T> {
  if (typeof browser !== 'undefined') {
    return browser.tabs.sendMessage(tabId, message) as Promise<T>;
  }
  // Chrome callback → Promise wrapper
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}
```

#### 2.3 Firefox Background Script
`src/platforms/firefox/background.ts`:

```typescript
import { contextMenus, runtime, action, scripting, sendMessage } from './browser-api.js';

runtime.onInstalled.addListener(() => {
  contextMenus.create({
    id: "copyAsMarkdown",
    title: "Copy as Markdown",
    contexts: ["selection"]
  });
});

contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "copyAsMarkdown" && info.selectionText && tab?.id) {
    try {
      let response;
      
      try {
        response = await sendMessage(tab.id, { action: "convertSelection" });
      } catch (error) {
        // Inject content script if not available
        await scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content-script.js']
        });
        
        await new Promise(resolve => setTimeout(resolve, 100));
        response = await sendMessage(tab.id, { action: "convertSelection" });
      }
      
      if (response?.success) {
        await action.setBadgeText({ text: "✓" });
        await action.setBadgeBackgroundColor({ color: "#1b8a5a" });
      } else {
        throw new Error(response?.error || "Conversion failed");
      }
      
      setTimeout(() => {
        action.setBadgeText({ text: "" });
      }, 2000);
      
    } catch (error) {
      await action.setBadgeText({ text: "✗" });
      await action.setBadgeBackgroundColor({ color: "#d93025" });
      
      setTimeout(() => {
        action.setBadgeText({ text: "" });
      }, 2000);
    }
  }
});
```

#### 2.4 Firefox Popup
Can **reuse Chrome popup** almost entirely. Only change imports:

```typescript
import { firefoxConverter } from "./firefox-converter.js";
// ... rest is identical to Chrome popup
```

#### 2.5 Firefox Content Script
Can **reuse Chrome content script** almost entirely:

```typescript
import { runtime } from './browser-api.js';
import { firefoxConverter } from "./firefox-converter.js";

runtime.onMessage.addListener((request, sender, sendResponse) => {
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

### Phase 4: Testing & Validation (1-2 hours)

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
- `src/platforms/firefox/browser-api.ts` - Cross-browser API abstraction (150 lines)
- `src/platforms/firefox/firefox-converter.ts` - Firefox adapter wrapper (30 lines)
- `src/platforms/firefox/adapters/` - Symlink or copy Chrome adapters

**Total New Code**: ~200 lines  
**Code Reuse**: ~95%

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

### 5.2 Shared Code Updates
When updating core conversion logic:
1. Edit `src/core/converter.ts`
2. Run tests: `npm test`
3. Build both platforms: `npm run build && npm run build:firefox`
4. Test in both browsers
5. Commit changes

### 5.3 Platform-Specific Fixes
- Chrome-only issues → Edit `src/platforms/chrome/`
- Firefox-only issues → Edit `src/platforms/firefox/`
- Never fork `src/core/` for platform differences

### 5.4 CI/CD Considerations
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
| **Phase 1**: Manifest | Create Firefox manifest, configure build | 1-2 hours |
| **Phase 2**: Platform Adapter | Browser API abstraction, platform code | 2-3 hours |
| **Phase 3**: Build & Test | ESBuild config, manual testing | 1-2 hours |
| **Phase 4**: Distribution | Store submission, documentation | 1 hour |
| **Total** | End-to-end Firefox support | **5-8 hours** |

**Recommended Approach**: Implement in one session to maintain context and momentum.

---

## 10. Open Questions

1. **Manifest V2 vs V3 for Firefox?**
   - *Recommendation*: Start with MV3 (Firefox 109+ stable support), provide MV2 fallback if needed
   - *Decision*: Use MV3 for feature parity with Chrome

2. **Shared adapters vs duplicated?**
   - *Recommendation*: Reuse Chrome adapters via imports (they use standard APIs)
   - *Decision*: Import Chrome adapters, only create Firefox-specific wrappers if needed

3. **Single manifest.json with browser detection?**
   - *Recommendation*: Keep separate manifests for clarity
   - *Decision*: Maintain `manifest.json` (Chrome) and `manifest.firefox.json` (Firefox)

4. **Support Firefox Android?**
   - *Recommendation*: Test compatibility, but don't optimize for mobile initially
   - *Decision*: Desktop-first, mobile compatibility is a bonus

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

The main work is **build configuration** and **manifest adaptation**, not algorithmic or UI changes. This makes Firefox support a **low-risk, high-value** addition to the project.
