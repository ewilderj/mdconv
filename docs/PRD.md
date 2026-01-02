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

### Browser Extension
5. **Paste & Convert button** reads the clipboard and converts HTML to Markdown.
6. **Keyboard paste support** listens for `Cmd/Ctrl + V` within the popup and performs the same conversion.
7. **Context menu integration** adds "Copy as Markdown" option to right-click menus when text is selected.
8. **Clear output** button removes the current Markdown and resets the status message.
9. **Visual feedback** shows badge indicators on the extension icon for context menu conversion success/failure.
10. **Permissions flow** requests `clipboardRead`, `clipboardWrite`, `contextMenus`, and `scripting` permissions on demand.

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
- **Markdown fidelity gaps**: Turndown may miss edge cases (e.g., complex tables). Allow users to review output and iterate quickly across all platforms.
- **Version sync complexity**: Shared codebase requires careful coordination between platform releases. Implement automated version synchronization.

### Browser Extension
- **Clipboard API variability**: Some environments block `navigator.clipboard.read`. Provide fallback to plain text and clear messaging.
- **Permission friction**: Users may deny clipboard access. Surface retry guidance and link to Chrome permission settings.

### Raycast Extension
- **macOS system dependencies**: Relies on `pbpaste` availability and Raycast API stability. Implement graceful degradation and clear error messaging.
- **Platform adoption uncertainty**: Raycast user base may have different expectations than browser extension users. Gather early feedback to validate product-market fit.

## 10. Open Questions
- Should we offer additional output formats (e.g., HTML → JSON) across both platforms?
- How should platform-specific preferences be synchronized or kept separate?
- Do we need advanced configuration (e.g., custom Turndown rules) in v1 or later versions?
- Should the Raycast extension include file-based conversion in addition to clipboard workflow?
- How can we maintain feature parity between platforms while respecting their unique interaction patterns?
