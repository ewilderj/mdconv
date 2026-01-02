# Changelog

All notable changes to mdconv will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
- TypeScript codebase with 95%+ code reuse across platforms
- ESBuild bundler with source maps
- Platform adapters for Chrome, Firefox, and Raycast
- Standard web APIs (no Chrome-specific dependencies in core)
- Centralized environment configuration
- Consistent error handling and logging patterns

[Unreleased]: https://github.com/ewilderj/mdconv/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/ewilderj/mdconv/releases/tag/v1.0.0
