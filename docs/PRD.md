# Product Requirements Document – Markdown Clipboard Converter

## 1. Summary
A multi-platform bidirectional clipboard converter that transforms content between rich-text and Markdown formats. Initially delivered as a Chrome/Edge browser extension, with Raycast integration in development for native macOS workflow integration. 

**Primary Direction (HTML → Markdown):** Users paste formatted content (e.g., from Google Docs, web pages, or email clients) and immediately receive Markdown that is ready to paste into documentation, wikis, or developer tools.

**Reverse Direction (Markdown → Rich Text):** Users paste or type Markdown and receive formatted HTML that can be pasted into Word, Google Docs, email clients, or any rich-text editor, preserving semantic formatting.

## 2. Goals & Non-Goals
- **Goals**
  - Provide a fast, reliable way to convert between HTML and Markdown formats across multiple platforms.
  - Support bidirectional conversion: HTML → Markdown AND Markdown → Rich Text/HTML.
  - Offer intuitive interfaces: browser popup UI and native Raycast command integration.
  - Preserve semantic formatting (headings, lists, tables, code blocks) whenever possible in both directions.
  - Automatically copy the converted output back to the clipboard for a frictionless workflow.
  - Maintain shared conversion logic to ensure consistent output across platforms.
- **Non-Goals**
  - Editing Markdown or rich text within the extension interfaces.
  - Hosting or syncing conversions in the cloud.
  - Supporting browsers other than Chromium-based for web extension.
  - Advanced Markdown editing features (preview, WYSIWYG editing, etc.).

## 3. Target Users & Use Cases
- **Markdown-first writers** creating docs for GitHub, Notion, or internal wikis.
- **Engineers** pasting specs or meeting notes from formatted sources into Markdown repos.
- **Support teams** capturing knowledge-base drafts from web editors.
- **Documentation writers** who draft in Markdown but need to share in Word/Google Docs.
- **Content creators** who write in Markdown but collaborate with teams using rich-text tools.

Primary use cases:
1. **HTML → Markdown**: Convert formatted meeting notes to Markdown for a GitHub issue.
2. **HTML → Markdown**: Paste styled emails into Markdown without manual cleanup.
3. **HTML → Markdown**: Migrate Google Docs snippets into Markdown documentation effortlessly.
4. **Markdown → Rich Text**: Share technical documentation written in Markdown with non-technical stakeholders in Word.
5. **Markdown → Rich Text**: Paste Markdown README content into Google Docs for collaboration.
6. **Markdown → Rich Text**: Convert Markdown notes into formatted emails with proper styling.

## 4. User Stories

### Browser Extension - HTML to Markdown (Existing)
- _As a_ technical writer, _I want_ to paste formatted text into the popup _so that_ I instantly get Markdown that I can paste into my docs.
- _As a_ developer, _I want_ to right-click on selected code examples or documentation _so that_ I can quickly convert them to Markdown without switching contexts.
- _As a_ content creator, _I want_ the extension to copy the generated Markdown back to my clipboard automatically _so that_ I can share it in chat or commit messages.
- _As a_ busy professional, _I want_ visual feedback when using the context menu _so that_ I know the conversion succeeded without having to test-paste.

### Browser Extension - Markdown to Rich Text (New)
- _As a_ documentation writer, _I want_ to paste Markdown into the popup and convert it to rich text _so that_ I can paste it into Word or Google Docs with proper formatting.
- _As a_ developer, _I want_ to toggle between conversion modes _so that_ I can convert in either direction as needed.
- _As a_ content creator, _I want_ the HTML output to be compatible with Word and Google Docs _so that_ I don't lose formatting when pasting.
- _As a_ technical writer, _I want_ code blocks in Markdown to render with monospace fonts _so that_ they remain readable in Word/Docs.
- _As a_ user, _I want_ a clear visual indication of the current conversion mode _so that_ I don't accidentally convert in the wrong direction.

### Raycast Extension (In Development)
- _As a_ macOS power user, _I want_ to convert clipboard content via Raycast commands _so that_ I can integrate Markdown conversion into my existing workflow automation.
- _As a_ developer using multiple applications, _I want_ to convert rich text from any macOS app _so that_ I can quickly paste clean Markdown into terminal-based tools or editors.
- _As a_ documentation writer, _I want_ to convert Markdown to rich text via Raycast _so that_ I can quickly share formatted content with non-technical colleagues.

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

### Reverse Conversion: Markdown → Rich Text/HTML (New Feature)

#### Core Conversion
1. **Markdown-to-HTML conversion** using a CommonMark-compliant parser with GitHub Flavored Markdown (GFM) support.
2. **Rich text clipboard format** writes both HTML and plain text to clipboard for maximum compatibility with Word, Google Docs, and other rich-text editors.
3. **Semantic HTML generation** produces clean, semantic HTML (headings, lists, tables, code blocks) that preserves Markdown intent.
4. **Styling for compatibility** applies basic inline styles to ensure formatting survives paste into Word/Docs.
5. **Auto-copy on success** writes the HTML to clipboard immediately after conversion (same workflow as existing direction).

#### Library Selection & Rationale

**Recommended: marked**
- **Pros:**
  - Extremely lightweight (~13KB minified) - perfect for browser extensions
  - Fast and battle-tested with wide adoption
  - Built-in GFM support (tables, strikethrough, task lists)
  - Simple API: `marked.parse(markdown)` returns HTML
  - No dependencies
  - Well-maintained with active development
- **Cons:**
  - Limited plugin ecosystem compared to markdown-it
  - Requires manual security configuration for untrusted input (not a concern for user's own clipboard)
- **Verdict:** Best fit for this use case due to simplicity, bundle size, and performance.

**Alternative: markdown-it**
- **Pros:**
  - More extensive plugin ecosystem
  - Strict CommonMark compliance
  - Better error handling and parsing edge cases
- **Cons:**
  - Larger bundle size (~20KB minified)
  - More complex API
  - Overkill for basic conversion needs
- **Verdict:** Consider for future if advanced features needed (footnotes, custom syntax extensions).

**Alternative: showdown**
- **Pros:**
  - Bidirectional (Markdown ↔ HTML)
  - Simple to use
- **Cons:**
  - Less actively maintained
  - Not strictly CommonMark compliant
  - Larger bundle than marked
- **Verdict:** Not recommended; marked is better for our needs.

**Not Recommended: remark/unified**
- **Pros:**
  - Extremely powerful plugin ecosystem
  - Excellent for complex transformations
- **Cons:**
  - Steep learning curve
  - Heavy bundle size (requires rehype for HTML output)
  - Overcomplicated for basic Markdown → HTML
- **Verdict:** Overkill for this feature.

#### HTML Generation Details

**Styling Strategy:**
- Generate semantic HTML structure (proper heading levels, lists, tables)
- Apply minimal inline styles for Word/Docs compatibility:
  - Headings: Bold + appropriate font size
  - Code blocks: Monospace font (Consolas/Courier) + light gray background
  - Inline code: Monospace + light background
  - Tables: Borders + padding for readability
  - Blockquotes: Left border + indentation
- Avoid external CSS; use inline styles only for maximum portability

**Clipboard Format:**
- Write to `text/html` MIME type for rich text paste
- Also write to `text/plain` MIME type with the original Markdown
- This allows paste into both rich-text and plain-text contexts

**Supported Markdown Features:**
- Headings (# through ######)
- Bold, italic, strikethrough
- Inline code and fenced code blocks
- Unordered and ordered lists (including nested)
- Tables (GitHub Flavored Markdown)
- Links and images
- Blockquotes
- Horizontal rules
- Task lists ([ ] and [x])

**Known Limitations:**
- Complex nested structures may not render perfectly in all target applications
- Custom Markdown extensions (beyond GFM) not supported
- Image embedding requires network access when pasting (images as `<img>` tags with URLs)
- Word/Docs may apply their own styling overrides on paste

#### Browser Extension UI Changes

**Mode Toggle:**
- Add a toggle/switch at the top of the popup: "HTML → Markdown" | "Markdown → Rich Text"
- Default to HTML → Markdown (existing behavior)
- Mode persists across popup sessions (saved in chrome.storage.local)
- Clear visual indicator of current mode (highlighted button, icon change)

**UI Layout Changes:**
- **Option 1 (Recommended):** Segmented control toggle above input
  ```
  [HTML → Markdown] [Markdown → Rich Text]
       ↓ Current mode highlighted ↓
  ```
- **Option 2:** Dropdown selector
- **Option 3:** Two separate buttons side-by-side

**Button Text Changes:**
- HTML → Markdown mode: "Paste & Convert" (existing)
- Markdown → Rich Text mode: "Convert to Rich Text" or "Paste & Convert"

**Output Area Changes:**
- HTML → Markdown mode: Shows Markdown output (existing)
- Markdown → Rich Text mode: Shows HTML output with preview option
  - **Option 1:** Show raw HTML in textarea
  - **Option 2:** Show rendered preview with "Copy HTML" button
  - **Recommended:** Show rendered preview with auto-copy (same workflow)

**Status Messages:**
- Update status text based on mode:
  - HTML → Markdown: "Converted rich text to Markdown. Copied to clipboard."
  - Markdown → Rich Text: "Converted Markdown to rich text. Copied to clipboard."

#### Raycast Extension Changes

**New Command:**
- Add "Convert Markdown to Rich Text" command alongside existing "Convert Clipboard to Markdown"
- Reads plain text (Markdown) from clipboard
- Converts to HTML
- Writes HTML to clipboard (`pbcopy` with `-Prefer html` flag)

**Alternative:** Single command with mode toggle via preferences

#### Implementation Approach

**Phase 1: Core Library Integration**
1. Add `marked` as dependency
2. Create `src/core/reverse-converter.ts` with `convertMarkdownToHtml(markdown: string, options?: ReverseConversionOptions): string`
3. Configure marked for GFM support
4. Add HTML styling logic for Word/Docs compatibility
5. Add tests in `test/reverse-conversion.test.ts`

**Phase 2: Platform Adapters**
1. Create `src/platforms/chrome/reverse-converter.ts` wrapper
2. Create `src/platforms/firefox/reverse-converter.ts` wrapper (same as Chrome)
3. Add HTML clipboard write support (use `navigator.clipboard.write()` with `text/html` blob)
4. Create `src/platforms/raycast/reverse-converter.ts` for async variant

**Phase 3: UI Implementation**
1. Add mode toggle to `static/popup.html`
2. Update `src/platforms/chrome/popup.ts` event handlers
3. Add state management for current mode
4. Update button labels and status messages dynamically
5. Add preview rendering if needed

**Phase 4: Testing & Refinement**
1. Test Markdown → HTML conversion with various inputs
2. Test paste into Word (Windows and macOS)
3. Test paste into Google Docs
4. Test paste into Outlook and other email clients
5. Refine styling for best compatibility

**Alternative Approaches Considered:**

1. **WYSIWYG Editor Approach:**
   - Add a rich text editor to the popup
   - Allow users to see live preview as they type Markdown
   - **Rejected:** Too complex, conflicts with "non-goal" of editing

2. **Two Separate Extensions:**
   - One extension for HTML → Markdown
   - Separate extension for Markdown → Rich Text
   - **Rejected:** Poor UX, duplicate code, harder to maintain

3. **Automatic Direction Detection:**
   - Auto-detect whether input is HTML or Markdown
   - Convert in appropriate direction automatically
   - **Rejected:** Ambiguous cases, unpredictable behavior

4. **Context Menu for Both Directions:**
   - Add "Copy as Rich Text" context menu item
   - Requires selecting Markdown text on page
   - **Rejected:** Markdown rarely appears as selectable text on web pages

## 6. Non-Functional Requirements
- **Performance**: Conversion should complete within 200 ms for typical clipboard payloads (<200 KB HTML or Markdown).
- **Reliability**: Gracefully fall back to plain text when HTML/Markdown is unavailable.
- **Security & Privacy**: Never transmit clipboard contents off-device; operate entirely within the extension context.
- **Accessibility**: Buttons should be keyboard accessible with focus styles and ARIA status updates.
- **Internationalization readiness**: UI text centralized for easy localization in future iterations.
- **Bundle size**: Keep extension size minimal (<500KB total) to ensure fast loading and updates.

### Additional Requirements for Reverse Conversion
- **Word/Docs compatibility**: Generated HTML must paste correctly into Microsoft Word (Windows/Mac) and Google Docs with preserved formatting.
- **Email client compatibility**: HTML should render correctly in major email clients (Outlook, Gmail, Apple Mail).
- **Graceful degradation**: If target application doesn't support certain HTML features, content should remain readable.
- **Markdown compatibility**: Support GitHub Flavored Markdown (GFM) as the baseline Markdown dialect.

## 7. Success Metrics
- Time-to-convert: <1 second for 95% of conversions (both directions).
- Copy success rate: >98% after granting permissions.
- Repeat usage rate: ≥60% of active users trigger the auto-copy workflow at least twice per week.
- Error rate: <5% of conversions result in an error message.
- **Reverse conversion metrics (new):**
  - Successful paste rate into Word/Docs: >95% (formatting preserved).
  - User adoption of reverse feature: ≥25% of active users try reverse conversion within first month.
  - Mode toggle usage: Users should be able to switch modes without confusion (<2% error rate switching wrong direction).

## 8. Release Plan

### Browser Extension
1. **Alpha (internal)**: Validate clipboard read/write permissions and Markdown fidelity with core workflows.
2. **Beta (friendly users)**: Gather feedback on formatting accuracy and UI clarity.
3. **1.0 Launch**: Publish to Chrome Web Store with production branding and documentation.

### Browser Extension - Reverse Conversion Feature
1. **v1.1 - Reverse Conversion Alpha**: 
   - Add Markdown → Rich Text conversion with mode toggle
   - Internal testing with Word and Google Docs
   - Validate HTML clipboard writing
2. **v1.2 - Beta Release**: 
   - Gather feedback from early adopters
   - Refine styling for Word/Docs compatibility
   - Test with various Markdown inputs
3. **v2.0 - General Availability**: 
   - Polish UI based on feedback
   - Update documentation and store listing
   - Announce bidirectional conversion support

### Raycast Extension
1. **Development Phase**: Complete shared architecture refactor and basic clipboard conversion workflow.
2. **Alpha Testing**: Internal validation of macOS clipboard integration and Raycast command interface.
3. **Beta Release**: Refinement based on usage patterns and feedback from Raycast community.
4. **Store Submission**: Publish to Raycast Store following their review guidelines.
5. **Reverse Conversion**: Add after browser extension release proves feature viability.

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

### Reverse Conversion (New Feature Risks)
- **HTML compatibility variance**: Different versions of Word and Google Docs may render HTML differently. **Mitigation:** Use conservative, well-supported HTML/CSS subset; extensive testing across versions.
- **Styling conflicts**: Target applications may override inline styles. **Mitigation:** Use semantic HTML first, inline styles as enhancement; test with major applications.
- **Bundle size increase**: Adding markdown-it increases extension size. **Mitigation:** Use lightweight `marked` library (~13KB); monitor total bundle size.
- **User confusion with mode toggle**: Users may convert in wrong direction. **Mitigation:** Clear visual indicators, prominent mode toggle, helpful error messages.
- **Clipboard HTML format limitations**: Some applications don't support HTML clipboard. **Mitigation:** Always write both HTML and plain text; provide fallback messages.
- **Markdown dialect incompatibility**: Users may use non-GFM Markdown. **Mitigation:** Document GFM as baseline; consider adding parser options in future.

## 10. Open Questions
- Should we offer additional output formats (e.g., HTML → JSON) across both platforms?
- How should platform-specific preferences be synchronized or kept separate?
- Do we need advanced configuration (e.g., custom Turndown rules) in v1 or later versions?
- Should the Raycast extension include file-based conversion in addition to clipboard workflow?
- How can we maintain feature parity between platforms while respecting their unique interaction patterns?
- Should we provide a user option to force table header detection when source HTML lacks `<th>` elements?

### Open Questions - Reverse Conversion
- **Styling preferences**: Should users be able to customize the HTML output styling (fonts, colors, spacing)?
- **Preview before copy**: Should the popup show a rendered preview of the HTML output, or just auto-copy like the current direction?
- **Advanced Markdown features**: Should we support Markdown extensions beyond GFM (e.g., footnotes, definition lists, custom containers)?
- **Mode persistence**: Should the mode toggle state be saved per-user, or always default to HTML → Markdown?
- **Performance optimization**: Should we pre-load the Markdown parser or lazy-load it only when needed?
- **Mobile support**: Should we consider a mobile browser extension version with reverse conversion?
- **RTF format support**: Should we also write RTF (Rich Text Format) to clipboard for better Word compatibility on Windows?
- **Custom CSS**: Should power users be able to provide custom CSS for the generated HTML?
