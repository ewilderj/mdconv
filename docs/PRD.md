# Product Requirements Document – Markdown Clipboard Converter

## 1. Summary
A multi-platform clipboard converter that transforms rich-text content into clean Markdown. Initially delivered as a Chrome/Edge browser extension, with Raycast integration in development for native macOS workflow integration. Users paste formatted content (e.g., from Google Docs, web pages, or email clients) and immediately receive Markdown that is ready to paste into documentation, wikis, or developer tools.

## 2. Goals & Non-Goals
- **Goals**
  - Provide a fast, reliable way to convert HTML clipboard content into Markdown across multiple platforms.
  - Offer intuitive interfaces: browser popup UI and native Raycast command integration.
  - Preserve semantic formatting (headings, lists, tables, code blocks) whenever possible.
  - Automatically copy the converted Markdown back to the clipboard for a frictionless workflow.
  - Maintain shared conversion logic to ensure consistent output across platforms.
- **Non-Goals**
  - Editing Markdown within the extension interfaces.
  - Hosting or syncing conversions in the cloud.
  - Supporting browsers other than Chromium-based for web extension.

## 3. Target Users & Use Cases
- **Markdown-first writers** creating docs for GitHub, Notion, or internal wikis.
- **Engineers** pasting specs or meeting notes from formatted sources into Markdown repos.
- **Support teams** capturing knowledge-base drafts from web editors.

Primary use cases:
1. Convert formatted meeting notes to Markdown for a GitHub issue.
2. Paste styled emails into Markdown without manual cleanup.
3. Migrate Google Docs snippets into Markdown documentation effortlessly.

## 4. User Stories

### Browser Extension
- _As a_ technical writer, _I want_ to paste formatted text into the popup _so that_ I instantly get Markdown that I can paste into my docs.
- _As a_ developer, _I want_ to right-click on selected code examples or documentation _so that_ I can quickly convert them to Markdown without switching contexts.
- _As a_ content creator, _I want_ the extension to copy the generated Markdown back to my clipboard automatically _so that_ I can share it in chat or commit messages.
- _As a_ busy professional, _I want_ visual feedback when using the context menu _so that_ I know the conversion succeeded without having to test-paste.

### Raycast Extension (In Development)
- _As a_ macOS power user, _I want_ to convert clipboard content via Raycast commands _so that_ I can integrate Markdown conversion into my existing workflow automation.
- _As a_ developer using multiple applications, _I want_ to convert rich text from any macOS app _so that_ I can quickly paste clean Markdown into terminal-based tools or editors.

### Cross-Platform
- _As a_ privacy-conscious user, _I want_ all processing to stay local _so that_ I know my clipboard never leaves my machine regardless of which platform I use.

## 5. Functional Requirements

### Core Conversion (Shared)
1. **HTML-to-Markdown conversion** using Turndown with custom rules for Word, Google Docs, and web content normalization.
2. **Word normalization** upgrades detected headings, monospace paragraphs, and bold spans so the resulting Markdown preserves intent.
3. **Auto-copy on success** writes the newly generated Markdown back to the clipboard immediately after conversion.
4. **Image handling options** allow users to preserve, filter, or remove images during conversion.
5. **Table conversion** transforms HTML tables into GFM (GitHub Flavored Markdown) table syntax via the `turndown-plugin-gfm` tables plugin.

#### Table Conversion Details
Table support is provided by the official `turndown-plugin-gfm` package which offers robust HTML-to-Markdown table conversion:

**Supported features:**
- Basic tables with `<thead>`/`<tbody>` structure → standard GFM pipe tables
- Column alignment preservation via `align` attributes (left, center, right)
- Empty cells handled gracefully
- Tables with `<th>` elements in first row (auto-detected as header)
- Multiple `<tbody>` sections merged into single table

**Conversion requirements:**
- Tables **must have a definitive heading row** to be converted to Markdown. A heading row is detected when:
  - The row is inside a `<thead>` element, OR
  - It's the first row of the table where all cells are `<th>` elements
- Tables without a valid heading row are **preserved as raw HTML** to prevent data loss

**Limitations:**
- Nested tables not supported (will be kept as HTML)
- `colspan`/`rowspan` spanning cells not supported (GFM limitation)
- Complex Word/Google Docs tables may require manual cleanup if they lack proper semantic markup
- Cell content containing pipe characters (`|`) may need escaping

**Implementation approach (hybrid strategy):**
- Add `turndown-plugin-gfm` as a dependency and enable the `tables` plugin for battle-tested GFM table conversion
- Add pre-processing in the Word/Google Docs normalization passes (similar to `promoteWordHeadingsInPlace`) to fix common table markup issues before Turndown sees them:
  - Detect tables where first row has bold text or distinct styling → inject `<th>` elements
  - Handle Word-specific table markup patterns that lack semantic `<thead>`/`<th>` structure
- This hybrid approach leverages the proven plugin while adding source-specific fixes for better conversion rates

**Alternative approaches considered:**
- Custom Turndown rules only (more control but more maintenance burden)
- Keep tables as HTML intentionally (works in GitHub/Obsidian but less portable)
- Alternative libraries like rehype-remark (would require replacing Turndown entirely)

### Browser Extension
5. **Paste & Convert button** reads the clipboard and converts HTML to Markdown.
6. **Keyboard paste support** listens for `Cmd/Ctrl + V` within the popup and performs the same conversion.
7. **Context menu integration** adds "Copy as Markdown" option to right-click menus when text is selected.
8. **Clear output** button removes the current Markdown and resets the status message.
9. **Visual feedback** shows badge indicators on the extension icon for context menu conversion success/failure.
10. **Permissions flow** requests `clipboardRead`, `clipboardWrite`, `contextMenus`, and `scripting` permissions on demand.
11. **Global keyboard shortcut** converts the current text selection to Markdown with a single keypress, matching the semantics of standard copy (`Cmd/Ctrl+C`).

#### Keyboard Shortcut Details
A configurable keyboard shortcut enables quick selection-to-Markdown conversion from anywhere in the browser:

**Default shortcut:**
- Windows/Linux: `Ctrl+Shift+M`
- macOS: `Cmd+Shift+M`

The "M" mnemonic is chosen for "Markdown" - intuitive and memorable.

**Behavior:**
1. User selects text on any webpage
2. User presses the shortcut
3. Extension captures the selection HTML (same as context menu "Copy as Markdown")
4. Converts to Markdown using shared conversion logic
5. Writes Markdown to clipboard
6. Shows brief visual feedback confirming success

**Selection-only semantics:**
- If text is selected: Convert selection to Markdown and copy to clipboard
- If no text is selected: Do nothing (no badge, no clipboard change)
- This matches standard `Cmd/Ctrl+C` behavior - copy requires a selection
- Prevents accidental clipboard overwrites when shortcut is triggered inadvertently

**User feedback mechanism:**
- On success: Extension badge shows green checkmark (✓) for 2 seconds, then clears
- On failure: Extension badge shows red X (✗) for 2 seconds, then clears
- No selection: No feedback (silent no-op, matching Cmd+C behavior)
- Badge behavior matches existing context menu feedback pattern for consistency

**Customization:**
- Users can modify the shortcut via `chrome://extensions/shortcuts`
- The manifest specifies a `suggested_key` which Chrome may not honor if it conflicts with existing bindings
- If no shortcut is active (conflict or user cleared it), the feature is simply unavailable until configured

**Implementation approach:**
- Add `commands` section to `manifest.json` with `suggested_key` for the shortcut
- Register `chrome.commands.onCommand` listener in background service worker
- Reuse existing selection capture and conversion logic from context menu handler
- Reuse existing badge feedback mechanism from context menu handler

**Limitations:**
- Shortcut may conflict with browser or website shortcuts; user must resolve via Chrome settings
- No popup preview - conversion happens immediately (matches context menu behavior)
- Cannot work when Chrome is not focused (OS limitation)

**Alternative approaches considered:**
- Desktop notification instead of badge: More visible but intrusive for frequent use
- Toast injection into page: Requires content script coordination and may fail on restricted pages
- Sound feedback: Accessibility concerns and user preference variability

### Raycast Extension (In Development)
11. **Native clipboard access** reads rich HTML content from macOS clipboard via `pbpaste`.
12. **Raycast command interface** provides "Convert Clipboard to Markdown" command with preference controls.
13. **Status messaging** communicates success or actionable errors through Raycast toast notifications.

## 6. Non-Functional Requirements
- **Performance**: Conversion should complete within 200 ms for typical clipboard payloads (<200 KB HTML).
- **Reliability**: Gracefully fall back to plain text when HTML is unavailable.
- **Security & Privacy**: Never transmit clipboard contents off-device; operate entirely within the extension context.
- **Accessibility**: Buttons should be keyboard accessible with focus styles and ARIA status updates.
- **Internationalization readiness**: UI text centralized for easy localization in future iterations.

## 7. Success Metrics
- Time-to-convert: <1 second for 95% of conversions.
- Copy success rate: >98% after granting permissions.
- Repeat usage rate: ≥60% of active users trigger the auto-copy workflow at least twice per week.
- Error rate: <5% of conversions result in an error message.

## 8. Release Plan

### Browser Extension
1. **Alpha (internal)**: Validate clipboard read/write permissions and Markdown fidelity with core workflows.
2. **Beta (friendly users)**: Gather feedback on formatting accuracy and UI clarity.
3. **1.0 Launch**: Publish to Chrome Web Store with production branding and documentation.

### Raycast Extension
1. **Development Phase**: Complete shared architecture refactor and basic clipboard conversion workflow.
2. **Alpha Testing**: Internal validation of macOS clipboard integration and Raycast command interface.
3. **Beta Release**: Refinement based on usage patterns and feedback from Raycast community.
4. **Store Submission**: Publish to Raycast Store following their review guidelines.

## 9. Risks & Mitigations

### Cross-Platform
- **Markdown fidelity gaps**: Turndown may miss edge cases. Tables without semantic headers or using `colspan`/`rowspan` cannot be converted to GFM and are preserved as HTML. Allow users to review output and iterate quickly across all platforms.
- **Version sync complexity**: Shared codebase requires careful coordination between platform releases. Implement automated version synchronization.

### Browser Extension
- **Clipboard API variability**: Some environments block `navigator.clipboard.read`. Provide fallback to plain text and clear messaging.
- **Permission friction**: Users may deny clipboard access. Surface retry guidance and link to Chrome permission settings.
- **Keyboard shortcut conflicts**: Default shortcut may conflict with browser, OS, or website shortcuts. Users can reconfigure via `chrome://extensions/shortcuts`. Document this in help/FAQ.

### Raycast Extension
- **macOS system dependencies**: Relies on `pbpaste` availability and Raycast API stability. Implement graceful degradation and clear error messaging.
- **Platform adoption uncertainty**: Raycast user base may have different expectations than browser extension users. Gather early feedback to validate product-market fit.

## 10. Open Questions
- Should we offer additional output formats (e.g., HTML → JSON) across both platforms?
- How should platform-specific preferences be synchronized or kept separate?
- Do we need advanced configuration (e.g., custom Turndown rules) in v1 or later versions?
- Should the Raycast extension include file-based conversion in addition to clipboard workflow?
- How can we maintain feature parity between platforms while respecting their unique interaction patterns?
- Should we provide a user option to force table header detection when source HTML lacks `<th>` elements?

---

## 11. Future Feature: Org-mode Output Format

### Summary
Add Org-mode as an alternative output format alongside Markdown. Org-mode is the native format for Emacs org-mode users and offers similar structured text capabilities. This feature provides explicit Org-specific commands and UI controls rather than a global preference, keeping Markdown workflows unchanged.

### User Stories
- _As an_ Emacs user, _I want_ to convert clipboard content directly to Org-mode _so that_ I can paste into my org files without manual reformatting.
- _As a_ user who works with both formats, _I want_ to choose the output format at conversion time _so that_ I can use whichever is appropriate for my current task.

### Functional Requirements

#### Output Format Selection
The output format is selected **per-action** rather than as a global preference:
- Each conversion action explicitly targets either Markdown or Org
- Existing Markdown workflows remain unchanged
- Org-mode is an additive feature, not a replacement

#### Browser Extension - Popup UI
1. **Format selector dropdown** in the popup UI allows choosing output format before conversion
   - Options: "Markdown" (default), "Org"
   - Dropdown appears near the "Paste & Convert" button
   - Selected format is remembered for the session (or optionally persisted in storage)
2. **Conversion behavior** uses the selected format for both paste-and-convert and keyboard paste (Cmd/Ctrl+V) within the popup

#### Browser Extension - Context Menu
1. **Separate menu items** for each format:
   - "Copy as Markdown" (existing)
   - "Copy as Org" (new)
2. Both appear when text is selected on a page
3. Each triggers its respective conversion and copies result to clipboard

#### Browser Extension - Keyboard Shortcuts
1. **Separate shortcuts** for each format:
   - `Ctrl+Shift+M` / `Cmd+Shift+M` → Copy selection as Markdown (existing)
   - `Ctrl+Shift+O` / `Cmd+Shift+O` → Copy selection as Org (new)
2. The "O" mnemonic is chosen for "Org" - intuitive and memorable
3. Both shortcuts follow the same selection-only semantics (no selection = silent no-op)
4. Both use the same badge feedback mechanism (✓ success, ✗ failure)

#### Raycast Extension
1. **Separate command** for Org conversion:
   - "Convert Clipboard to Markdown" (existing)
   - "Convert Clipboard to Org" (new)
2. Each command uses the same image handling preference
3. Both show HUD notification on success

### Technical Approach

#### Conversion Pipeline
The Org output uses a two-stage conversion:
```
HTML → Markdown (Turndown) → AST (remark-parse) → Org (custom serializer)
```

This approach:
- Reuses all existing HTML normalization (Word, Google Docs, etc.)
- Leverages battle-tested Markdown parsing via remark
- Adds ~40-60KB to bundle size (unified + remark-parse + remark-gfm)

#### Org Serializer
A custom `toOrg()` function walks the mdast AST and produces Org syntax:

| Markdown | Org-mode |
|----------|----------|
| `# Heading` | `* Heading` |
| `**bold**` | `*bold*` |
| `*italic*` | `/italic/` |
| `` `code` `` | `~code~` |
| `[text](url)` | `[[url][text]]` |
| `~~strike~~` | `+strike+` |
| Code blocks | `#+BEGIN_SRC`...`#+END_SRC` |
| Tables | Org pipe tables with `\|-` separator |
| Blockquotes | `#+BEGIN_QUOTE`...`#+END_QUOTE` |

#### New Dependencies
- `unified` - AST processing framework
- `remark-parse` - Markdown parser
- `remark-gfm` - GFM extensions (tables, strikethrough)

These are already installed as dev dependencies for the `scripts/md2org.mjs` proof-of-concept.

#### File Structure
```
src/core/
├── converter.ts           # HTML → Markdown (unchanged)
├── org-stringify.ts       # NEW: AST → Org serializer
├── md-to-org.ts           # NEW: Markdown → Org wrapper
```

### UI Mockups

#### Popup Format Selector
```
┌─────────────────────────────────────┐
│  Markdown Converter                 │
├─────────────────────────────────────┤
│                                     │
│  Format: [Markdown ▾]               │
│                                     │
│  [Paste & Convert]  [Clear]         │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ # Converted output here     │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  How to use                         │
└─────────────────────────────────────┘
```

#### Context Menu
```
┌─────────────────────────┐
│ Copy                    │
│ Cut                     │
│ Paste                   │
│ ───────────────────     │
│ Copy as Markdown        │  ← existing
│ Copy as Org             │  ← new
│ ───────────────────     │
│ ...                     │
└─────────────────────────┘
```

### Bundle Size Impact
- Current popup.js: ~62KB
- Estimated increase: ~40-60KB (+65-95%)
- Mitigation: Could lazy-load Org conversion on first use, but adds complexity

### Risks & Mitigations
- **Bundle size increase**: Accept the tradeoff for feature value; most users have fast connections
- **Org edge cases**: Some Org features (TODO states, drawers, properties) have no Markdown equivalent - document limitations
- **Maintenance burden**: Two output formats means testing both; mitigate with shared test fixtures

### Open Questions
- ~~Should the popup remember the last-used format across sessions?~~ **Yes** - persist to `chrome.storage.local`
- Should we add a keyboard shortcut hint next to the format dropdown?
- ~~Is the bundle size increase acceptable, or should we lazy-load the Org converter?~~ **Yes** - acceptable; animated GIFs are 10x larger

