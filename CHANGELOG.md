# Changelog

All notable changes to mdconv will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.1] - 2026-01-17

### Fixed
- **Popup UI**: Eliminated scrollbar that appeared after conversion
- **Popup UI**: Fixed layout shift where footer elements jumped when status message appeared

## [1.2.0] - 2026-01-17

### Added
- **Bidirectional conversion**: Convert Markdown/Org to rich text for pasting into Word and Google Docs
- **Org-mode output**: Convert clipboard content to Org-mode format (in addition to Markdown)
- **Org-mode input**: Convert Org-mode documents to styled HTML for rich text paste
- **Target-specific styling**: Optimized HTML output for Word 365, Google Docs, or generic HTML
- **Raycast commands**: Three new commands for rich text output - "Convert to HTML", "Convert to Google Docs", "Convert to Word 365"
- **Mode flip UI**: Toggle between "Rich Text → Markdown" and "Markdown → Rich Text" in browser extensions

### Technical
- 181 tests covering new conversion paths
- Format detection module for Markdown/Org/plain text
- Centralized HTML target styling system

## [1.1.0] - 2026-01-03

### Added
- **Keyboard shortcut**: `Ctrl+Shift+M` (Windows/Linux) or `Cmd+Shift+M` (macOS) to copy selection as Markdown
- **Table support**: GFM-style Markdown tables from Word, Google Docs, and web pages
- **Help documentation**: "How to use" link in popup footer and extension icon context menu
- **User guide**: [HELP.md](HELP.md) with detailed usage instructions

### Improved
- **Tables**: Smart header detection from bold text in first row
- **Images in tables**: Inline images in table cells are now preserved correctly
- **Firefox parity**: Full feature parity with Chrome extension including keyboard shortcuts

### Technical
- 84 tests with new table conversion and fixture-based validation

## [1.0.1] - 2026-01-02

### Changed
- **Raycast**: Simplified UX with instant HUD notifications instead of preview UI
- **All platforms**: New icon design

### Improved
- **Raycast**: Faster workflow - no need to dismiss result window, markdown is immediately available in clipboard

## [1.0.0] - 2026-01-02

### Added
- Initial release of mdconv
- Chrome extension for clipboard Markdown conversion
- Firefox extension with full feature parity
- Raycast extension for macOS
- Support for Word, Google Docs, and Outlook HTML
- Context menu "Copy as Markdown" for text selections
- Popup UI for clipboard conversion
- Image handling options (preserve, external only, remove)
- Comprehensive test suite (71 tests)
- Build automation for all platforms

### Features
- **Chrome Extension**: Converts rich text from clipboard to Markdown
- **Firefox Extension**: Same functionality as Chrome, optimized for Firefox
- **Raycast Commands**: macOS-native clipboard conversion and diagnostics
- **Word Support**: Handles Word desktop and Word web HTML
- **Google Docs Support**: Converts Google Docs formatted content
- **Outlook Support**: Processes Outlook web email HTML
- **Selection Conversion**: Right-click context menu on selected text
- **Keyboard Shortcuts**: Paste directly into extension popup (Cmd/Ctrl+V)

### Technical
- TypeScript codebase with 80% code reuse across platforms
- ESBuild bundler with source maps
- Platform adapters for Chrome, Firefox, and Raycast
- Standard web APIs (no Chrome-specific dependencies in core)
- Centralized environment configuration
- Consistent error handling and logging patterns

[Unreleased]: https://github.com/ewilderj/mdconv/compare/v1.2.1...HEAD
[1.2.1]: https://github.com/ewilderj/mdconv/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/ewilderj/mdconv/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/ewilderj/mdconv/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/ewilderj/mdconv/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/ewilderj/mdconv/releases/tag/v1.0.0
