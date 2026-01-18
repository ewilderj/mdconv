# Product Requirements Document – Markdown Clipboard Converter

> **Document Status**: Last updated January 2026 for v1.2.x release
> 
> **Implementation Status**:
> - ✅ Chrome/Firefox browser extensions (v1.2.1 published)
> - ✅ Org-mode output format (Section 11)
> - ✅ Bidirectional rich text conversion (Section 12)
> - ⏳ Raycast extension (Store submission in review - PR #24129)
> - ⏳ Slack mrkdwn output (Section 13 - in design)

## 1. Summary
A multi-platform clipboard converter that enables bidirectional conversion between rich text and plain text formats. Initially delivered as a Chrome/Edge browser extension, with Raycast integration for native macOS workflow.

**Primary directions:**
- **Rich text → Markdown/Org**: Convert formatted content (from Google Docs, Word, web pages, email) into clean Markdown or Org-mode
- **Markdown/Org/Plain text → Rich text**: Convert plain text formats back to styled HTML for pasting into Google Docs, Word, or other rich text editors

The extension automatically detects clipboard content type and presents the appropriate conversion UI, making the tool intuitive regardless of workflow direction.

## 2. Goals & Non-Goals
- **Goals**
  - Provide fast, reliable bidirectional conversion between rich text and plain text formats (Markdown, Org-mode)
  - Automatically detect clipboard content type and present the appropriate conversion direction
  - Offer intuitive interfaces: browser popup UI and native Raycast command integration
  - Preserve semantic formatting (headings, lists, tables, code blocks) in both conversion directions
  - Support target-specific HTML output optimized for Google Docs, Microsoft Word, or generic HTML
  - Automatically copy converted content back to clipboard for a frictionless workflow
  - Maintain shared conversion logic to ensure consistent output across platforms
- **Non-Goals**
  - Editing content within the extension interfaces
  - Hosting or syncing conversions in the cloud
  - Full WYSIWYG editing or preview

## 3. Target Users & Use Cases
- **Markdown-first writers** creating docs for GitHub, Notion, or internal wikis.
- **Engineers** pasting specs or meeting notes from formatted sources into Markdown repos.
- **Support teams** capturing knowledge-base drafts from web editors.
- **Cross-format collaborators** who write in Markdown/Org but share with colleagues using Word or Google Docs.

Primary use cases:
1. Convert formatted meeting notes to Markdown for a GitHub issue.
2. Paste styled emails into Markdown without manual cleanup.
3. Migrate Google Docs snippets into Markdown documentation effortlessly.
4. Convert a Markdown README into rich text for pasting into a Word document or email.
5. Share Org-mode notes with non-technical stakeholders via Google Docs.

## 4. User Stories

### Browser Extension
- _As a_ technical writer, _I want_ to paste formatted text into the popup _so that_ I instantly get Markdown that I can paste into my docs.
- _As a_ developer, _I want_ to right-click on selected code examples or documentation _so that_ I can quickly convert them to Markdown without switching contexts.
- _As a_ content creator, _I want_ the extension to copy the generated Markdown back to my clipboard automatically _so that_ I can share it in chat or commit messages.
- _As a_ busy professional, _I want_ visual feedback when using the context menu _so that_ I know the conversion succeeded without having to test-paste.

### Raycast Extension
- _As a_ macOS power user, _I want_ to convert clipboard content via Raycast commands _so that_ I can integrate Markdown conversion into my existing workflow automation.
- _As a_ developer using multiple applications, _I want_ to convert rich text from any macOS app _so that_ I can quickly paste clean Markdown into terminal-based tools or editors.

### Reverse Conversion (Plain Text → Rich Text)
- _As a_ Markdown author, _I want_ the extension to automatically detect Markdown in my clipboard _so that_ I can convert it to rich text without manual steps.
- _As a_ user pasting into Google Docs, _I want_ optimized HTML output _so that_ my formatting looks correct when pasted.
- _As a_ user pasting into Word, _I want_ Word-optimized HTML _so that_ headings and styles are recognized properly.
- _As an_ Org-mode user, _I want_ to convert my org notes to rich text _so that_ I can share them with colleagues who don't use Emacs.

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

### Raycast Extension
11. **Native clipboard access** reads rich HTML content from macOS clipboard via `pbpaste`.
12. **Raycast command interface** provides five commands:
    - "Convert Clipboard to Markdown" - rich text → Markdown
    - "Convert Clipboard to Org" - rich text → Org-mode
    - "Convert Clipboard to HTML" - Markdown/Org → generic HTML rich text
    - "Convert Clipboard to Google Docs" - Markdown/Org → Google Docs optimized rich text
    - "Convert Clipboard to Word 365" - Markdown/Org → Microsoft Word optimized rich text
13. **Status messaging** communicates success or actionable errors through Raycast HUD notifications.

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
1. ~~**Alpha (internal)**: Validate clipboard read/write permissions and Markdown fidelity with core workflows.~~ ✅ Complete
2. ~~**Beta (friendly users)**: Gather feedback on formatting accuracy and UI clarity.~~ ✅ Complete
3. ~~**1.0 Launch**: Publish to Chrome Web Store with production branding and documentation.~~ ✅ Complete (v1.2.1 current)

### Raycast Extension
1. ~~**Development Phase**: Complete shared architecture refactor and basic clipboard conversion workflow.~~ ✅ Complete
2. ~~**Alpha Testing**: Internal validation of macOS clipboard integration and Raycast command interface.~~ ✅ Complete
3. ~~**Beta Release**: Refinement based on usage patterns and feedback from Raycast community.~~ ✅ Complete
4. **Store Submission**: Publish to Raycast Store following their review guidelines. ⏳ In review (PR #24129)

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
- ~~Should we offer additional output formats (e.g., HTML → JSON) across both platforms?~~ **Resolved**: Added Org-mode output format and bidirectional rich text conversion
- ~~How should platform-specific preferences be synchronized or kept separate?~~ **Resolved**: Kept separate; each platform maintains its own preferences appropriate to its UX
- Do we need advanced configuration (e.g., custom Turndown rules) in v1 or later versions?
- Should the Raycast extension include file-based conversion in addition to clipboard workflow?
- ~~How can we maintain feature parity between platforms while respecting their unique interaction patterns?~~ **Resolved**: Both platforms support the same 5 conversions (MD→, Org→, →HTML, →Docs, →Word) with platform-appropriate UI
- Should we provide a user option to force table header detection when source HTML lacks `<th>` elements?

---

## 11. ✅ Implemented: Org-mode Output Format

**Status: Fully implemented in v1.2.0**

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

---

## 12. ✅ Implemented: Rich Text Output (Reverse Conversion)

**Status: Fully implemented in v1.2.0**

### Summary
Add the ability to convert plain text formats (Markdown, Org-mode, or plain text) into rich HTML suitable for pasting into Google Docs, Microsoft Word, and other rich text editors. This completes the bidirectional conversion story: users can now go from rich text → Markdown AND from Markdown → rich text.

The popup UI automatically detects clipboard content type and presents the appropriate conversion direction, eliminating user confusion about which action to take.

### User Stories
- _As a_ Markdown author, _I want_ to paste my Markdown into Google Docs as formatted text _so that_ I can share documents with non-technical collaborators.
- _As an_ Org-mode user, _I want_ to convert my org notes to rich text _so that_ I can paste them into email or Word documents.
- _As a_ user, _I want_ the extension to automatically detect what's in my clipboard _so that_ I don't have to think about which conversion direction to use.
- _As a_ user, _I want_ to choose the target application (Word vs Google Docs) _so that_ the formatting looks correct when I paste.

### Functional Requirements

#### Automatic Input Format Detection
The extension automatically detects the input format without user intervention:

1. **Rich text (HTML)** → Existing flow: convert to Markdown or Org
2. **Plain text** → New flow: auto-detect format and offer rich text conversion
   - **Markdown detection**: Presence of Markdown syntax (headings `#`, bold `**`, links `[]()`, code blocks, etc.)
   - **Org-mode detection**: Presence of Org syntax (headings `*`, bold `*text*`, links `[[url][text]]`, `#+BEGIN_` blocks)
   - **Plain text fallback**: If no markup detected, treat as plain text (still convertible to rich text with paragraph structure)

Detection heuristics (in order):
1. Check for Org-specific patterns first (more distinctive): `#+BEGIN_`, `[[url][text]]`, `* Heading` at line start
2. Check for Markdown patterns: `# `, `## `, `**bold**`, `[text](url)`, triple backticks
3. Default to plain text if neither detected

#### Output Format Selection (Target Application)
Users select the target application for optimized styling:

| Target | Description | Styling Approach |
|--------|-------------|------------------|
| **HTML (Generic)** | Standard semantic HTML | Clean `<h1>`, `<p>`, `<strong>`, `<code>` tags |
| **Google Docs** | Optimized for Google Docs paste | Inline styles matching Docs defaults, `<span>` wrappers |
| **Microsoft Word** | Optimized for Word paste | MSO-specific CSS, `mso-*` style hints |
| **Slack** _(in progress)_ | Optimized for Slack paste | Slack mrkdwn text format (see Section 13) |
| **Microsoft Teams** _(future)_ | Optimized for Teams paste | Teams-compatible formatting |

**Rationale**: Different applications interpret pasted HTML differently. Google Docs ignores many CSS classes but respects inline styles. Word recognizes special `mso-*` CSS properties for better fidelity.

**State persistence**: The selected target application is persisted to `chrome.storage.local` (same pattern as the Markdown/Org format picker), so users don't need to reselect their preferred target each time.

#### Context-Aware Popup UI
The popup automatically adapts based on clipboard content:

**When clipboard contains rich text (HTML):**
```
┌─────────────────────────────────────┐
│  Markdown Converter                 │
├─────────────────────────────────────┤
│  📋 Rich text detected              │
│                                     │
│  Output: [Markdown ▾]               │
│                                     │
│  [Paste & Convert]  [Clear]         │
│  ...                                │
└─────────────────────────────────────┘
```

**When clipboard contains plain text/Markdown/Org:**
```
┌─────────────────────────────────────┐
│  Markdown Converter                 │
├─────────────────────────────────────┤
│  📝 Markdown detected               │
│                                     │
│  Convert to: [Google Docs ▾]        │
│                                     │
│  [Convert to Rich Text]  [Clear]    │
│  ...                                │
└─────────────────────────────────────┘
```

**Detection indicator** shows what was detected: "Rich text detected", "Markdown detected", "Org-mode detected", or "Plain text detected".

**Preview display**: The output preview textarea is shown by default (matching existing behavior). Users can hide/show the preview via extension settings. This setting applies to both conversion directions (rich text → Markdown and Markdown → rich text).

#### Browser Extension - Context Menu
Add new menu item for reverse conversion:
- "Copy as Rich Text" - converts selected Markdown/Org/plain text to HTML and copies to clipboard

The context menu item appears when text is selected. The extension auto-detects the input format.

#### Browser Extension - Keyboard Shortcut
- `Ctrl+Shift+R` / `Cmd+Shift+R` → Copy selection as Rich Text
- "R" mnemonic for "Rich text"
- Auto-detects input format (Markdown, Org, or plain text)
- Uses last-selected target application preference (Google Docs, Word, or HTML)

#### Clipboard Write (Rich Text)
Writing rich text to clipboard requires the `ClipboardItem` API:

```typescript
const htmlBlob = new Blob([html], { type: 'text/html' });
const textBlob = new Blob([plainText], { type: 'text/plain' });
await navigator.clipboard.write([
  new ClipboardItem({
    'text/html': htmlBlob,
    'text/plain': textBlob  // fallback for apps that don't accept HTML
  })
]);
```

Both `text/html` and `text/plain` are written so the user can paste into any application.

### Technical Approach

#### Conversion Pipeline (Unified Ecosystem)
Leverage the existing unified/remark infrastructure from Org-mode support:

```
Input Text → Detect Format → Parse to AST → Transform → Serialize to HTML
```

**Markdown input:**
```
Markdown → remark-parse → mdast → remark-rehype → hast → rehype-stringify → HTML
```

**Org-mode input:**
```
Org → org-parse (custom) → oast → org-to-mdast → mdast → remark-rehype → hast → rehype-stringify → HTML
```

**Plain text input:**
```
Plain text → paragraph splitting → minimal mdast → remark-rehype → hast → rehype-stringify → HTML
```

#### New Dependencies
- `remark-rehype` (~8KB) - Convert mdast to hast (HTML AST)
- `rehype-stringify` (~12KB) - Serialize hast to HTML string

These integrate with existing `unified`, `remark-parse`, and `remark-gfm` dependencies.

#### Target-Specific HTML Generation
Custom rehype plugins or post-processing for each target:

**Generic HTML:**
```html
<h1>Hello</h1>
<p>This is <strong>bold</strong> and <em>italic</em>.</p>
```

**Google Docs optimized:**
```html
<h1 style="font-size:24pt;font-weight:bold">Hello</h1>
<p style="font-size:11pt;line-height:1.15"><span style="font-weight:bold">bold</span> and <span style="font-style:italic">italic</span>.</p>
```

**Word optimized:**
```html
<h1 style="mso-style-name:'Heading 1';font-size:24pt">Hello</h1>
<p style="mso-style-name:'Normal'"><b>bold</b> and <i>italic</i>.</p>
```

#### Input Format Detection Implementation
```typescript
type DetectedFormat = 'markdown' | 'org' | 'plain';

function detectInputFormat(text: string): DetectedFormat {
  // Org-mode patterns (check first - more distinctive)
  // Note: Single `* ` could be Markdown bullet, so require 2+ asterisks for Org headings
  if (/^\*{2,} [^\n]+$/m.test(text) ||       // Org headings (level 2+, e.g., ** Heading)
      /\[\[[^\]]+\]\[.+\]\]/.test(text) ||   // Org links [[url][text]]
      /#\+BEGIN_/i.test(text)) {             // Org blocks
    return 'org';
  }
  
  // Markdown patterns
  if (/^#{1,6} /m.test(text) ||              // ATX headings
      /\*\*[^*]+\*\*/.test(text) ||          // Bold
      /\[[^\]]+\]\([^)]+\)/.test(text) ||    // Links
      /^```/m.test(text) ||                   // Fenced code
      /^\|.+\|$/m.test(text)) {              // Tables
    return 'markdown';
  }
  
  return 'plain';
}
```

#### File Structure
```
src/core/
├── converter.ts              # HTML → Markdown (existing)
├── md-to-org.ts              # Markdown → Org (existing)
├── org-stringify.ts          # mdast → Org (existing)
├── md-to-html.ts             # NEW: Markdown → HTML
├── org-to-mdast.ts           # NEW: Org → mdast (for reverse conversion)
├── format-detection.ts       # NEW: Auto-detect input format
├── html-targets.ts           # NEW: Target-specific HTML styling
```

### UI Mockups

#### Popup - Plain Text Mode
```
┌─────────────────────────────────────┐
│  Markdown Converter                 │
├─────────────────────────────────────┤
│  📝 Markdown detected               │
│                                     │
│  Convert to: [Google Docs ▾]        │
│              ├─ HTML (Generic)      │
│              ├─ Google Docs         │
│              └─ Microsoft Word      │
│                                     │
│  [Convert to Rich Text]  [Clear]    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ <h1>Hello World</h1>        │    │
│  │ <p>This is <strong>...      │    │
│  └─────────────────────────────┘    │
│                                     │
│  ✓ Rich text copied to clipboard    │
└─────────────────────────────────────┘
```

#### Context Menu
```
┌─────────────────────────┐
│ Copy                    │
│ Cut                     │
│ Paste                   │
│ ───────────────────     │
│ Copy as Markdown        │
│ Copy as Org             │
│ Copy as Rich Text       │  ← new
│ ───────────────────     │
│ ...                     │
└─────────────────────────┘
```

### Bundle Size Impact
- Additional dependencies: ~20KB gzipped (remark-rehype + rehype-stringify)
- Combined with Org support: total increase ~60-80KB from baseline
- Acceptable for the feature value provided

### Raycast Extension
1. **New command**: "Convert Clipboard to Rich Text"
2. **Preference**: Target application (HTML / Google Docs / Word)
3. Auto-detects input format (Markdown, Org, plain text)
4. Writes rich HTML to clipboard via `pbcopy` with appropriate MIME type

### Risks & Mitigations
- **Clipboard API browser support**: `ClipboardItem` is well-supported in Chrome 76+. Firefox support may be limited - document in HELP.md.
- **Paste fidelity varies**: Different applications interpret HTML differently. Target-specific optimizations help, but perfect fidelity isn't guaranteed. Document expectations.
- **Format detection ambiguity**: Some text could be interpreted as either Markdown or plain text. Use conservative heuristics and allow user override if needed in future.
- **Org-mode parsing complexity**: Full Org-mode parsing is complex. Start with common constructs (headings, bold, italic, links, code blocks) and expand based on user feedback.

### Open Questions
- ~~Should we show a preview of the generated HTML in the popup?~~ **Yes** - show preview for consistency with existing functionality. Add a setting in extension options to hide/show preview (applies to both rich text → Markdown and Markdown → rich text modes).
- ~~Should users be able to manually select the input format if auto-detection is wrong?~~ **No** - focus on making detection heuristics robust. Manual override adds UI complexity without proportional benefit.
- ~~Should we support additional targets (Notion, Slack, etc.) in the future?~~ **Yes** - Slack and Microsoft Teams are planned future targets. The target-specific styling architecture should accommodate additional targets easily.
- ~~For Raycast, how do we write rich HTML to macOS clipboard?~~ **Already solved** - the existing Raycast extension writes HTML to clipboard; same approach applies.

## 13. ⏳ Planned: Slack Output Format (mrkdwn)

### Overview
Slack uses a custom markup language called **mrkdwn** that differs significantly from standard Markdown. Unlike other rich text targets (Google Docs, Word) which accept HTML paste, Slack requires text formatted in mrkdwn syntax for reliable formatting.

**Key insight**: Slack is a **text-to-text** conversion target, not a text-to-HTML target. This follows the same pattern as Org-mode output.

### Slack mrkdwn Syntax Reference

| Feature | Standard Markdown | Slack mrkdwn | Notes |
|---------|-------------------|--------------|-------|
| **Bold** | `**text**` | `*text*` | Single asterisk (conflict!) |
| **Italic** | `*text*` or `_text_` | `_text_` | Underscore only |
| **Strikethrough** | `~~text~~` | `~text~` | Single tilde |
| **Inline code** | `` `code` `` | `` `code` `` | Same ✓ |
| **Code block** | ` ``` ` | ` ``` ` | Same ✓ |
| **Links** | `[text](url)` | `text (url)` | See note below |
| **Blockquote** | `> text` | `>text` | No space after `>` |
| **Lists** | `- item` | `- item` | Mimicked with text, not semantic |
| **Headers** | `# Heading` | ❌ None | Must downgrade to bold |
| **Tables** | GFM pipe tables | ❌ None | Must render as code block |
| **Images** | `![alt](url)` | ❌ None | Not supported inline |

### Required Character Escaping
Slack uses `&`, `<`, and `>` as control characters. They must be escaped:

| Character | Escaped Form |
|-----------|--------------|
| `&` | `&amp;` |
| `<` | `&lt;` |
| `>` | `&gt;` |

**Note**: Do not HTML-encode the entire text—only these specific characters need escaping.

### Conversion Tradeoffs (Accepted Limitations)

#### 1. Headers → Bold Text
Slack has no header syntax. Convert to bold:
```
# Main Heading     →  *Main Heading*
## Subheading      →  *Subheading*
```

#### 2. Tables → Code Block
GFM tables cannot be rendered semantically. Wrap in code block for readability:
```
| Name  | Age |          →    ```
|-------|-----|          →    | Name  | Age |
| Alice | 30  |          →    |-------|-----|
                         →    | Alice | 30  |
                         →    ```
```

#### 3. Links Cannot Have Custom Text (User Paste Limitation)
The `<url|text>` syntax only works via Slack's API (bots, webhooks). For user-pasted text, URLs auto-link but custom link text is not supported. Output format:
```
[Click here](https://example.com)  →  Click here (https://example.com)
[Example](https://example.com)     →  https://example.com  (if text matches domain)
```

**Note**: Raw URLs like `https://example.com` auto-link when pasted.

#### 4. Nested/Combined Formatting
Slack has limited support for nested formatting. Keep it simple:
```
**_bold italic_**  →  *_bold italic_*  (may not render correctly)
```

#### 5. Images Dropped
Inline images cannot be rendered. Convert to link:
```
![Screenshot](url)  →  <url|Screenshot (image)>
```

### Architecture

Follow the same pattern as `md-to-org.ts`:

```
Markdown → remark-parse → mdast → toSlack() → mrkdwn text
```

#### New Files
```
src/core/
├── md-to-slack.ts        # NEW: Markdown → Slack mrkdwn
├── slack-stringify.ts    # NEW: mdast → mrkdwn serializer
```

#### Target Registration
Add `'slack'` to `HtmlTarget` type (even though it outputs text, not HTML) for UI consistency with the target selector dropdown.

### Why Not HTML?

Slack's HTML paste behavior is:
- **Inconsistent**: Desktop app vs. web app handle HTML differently
- **Undocumented**: No official API docs on paste HTML support
- **Unreliable**: Formatting often stripped or mangled

mrkdwn text output is the **only reliable** way to get formatted text into Slack.

### Open Questions
- Should numbered lists use `1.` syntax or convert to bullets? (Slack renders both similarly)
- Should we preserve raw URLs as-is or wrap them in `<url>` syntax?
- How should we handle horizontal rules (`---`)? Slack has no equivalent.

### Testing Strategy

1. **Unit tests**: Test each Markdown construct → mrkdwn conversion
2. **Manual paste testing**: Copy mrkdwn output and paste into Slack to verify rendering
3. **Test fixtures**: Create paired input/expected-output files like other converters

