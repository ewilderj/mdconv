# Markdown Clipboard Converter

A Chrome extension that transforms rich text from your clipboard into polished Markdown. Paste formatted content, preview the converted Markdown instantly, and copy it back to your clipboard in a single click.

## Features

- **One-click conversion** – Read HTML from the clipboard and convert it to Markdown using [Turndown](https://github.com/mixmark-io/turndown).
- **Smart fallback** – Gracefully handles plain text when no rich content is available.
- **Automatic copy-back** – Immediately writes the generated Markdown to your clipboard after each conversion.
- **Live paste listener** – Supports keyboard pastes (`Cmd/Ctrl + V`) directly inside the popup.
- **Word-aware headings** – Promotes Microsoft Word clipboard headings so Markdown keeps its structure.
- **Monospace heuristics** – Detects Courier-style Word paragraphs and emits fenced code blocks.
- **Bold span detection** – Upgrades inline `font-weight: bold` spans into Markdown `**strong**` text.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Build the extension

```bash
npm run build
```

The compiled assets are emitted to `dist/`.

### 3. Load the unpacked extension in Chrome

1. Open `chrome://extensions` in your browser.
2. Toggle **Developer mode** on (top-right switch).
3. Click **Load unpacked** and choose the `dist` folder.
4. The “Markdown Clipboard Converter” icon will appear in the toolbar.

### 4. (Optional) Start a development watch task

```bash
npm run dev
```

This runs esbuild in watch mode and mirrors static assets into `dist/` whenever they change.

### 5. (Optional) Type-check only

```bash
npm run typecheck
```

Runs TypeScript diagnostics without emitting bundled assets.

## Usage

1. Click the extension icon to open the popup.
2. Press **Paste & Convert** or press `Cmd/Ctrl + V` with formatted content on your clipboard.
3. The Markdown appears in the output area and is automatically copied back to your clipboard so you can paste it wherever it's needed.

> **Clipboard permissions**: Chrome will prompt for clipboard permissions when first reading or writing. Accept the prompt so the extension can function correctly.

## Project Structure

```
static/           # Manifest, popup HTML/CSS, placeholder icons
src/              # TypeScript source (popup logic, background service worker)
dist/             # Build output (generated)
PRD.md            # Product requirements document
```

## Customization Notes

- The placeholder icons in `static/icons` are 1×1 transparent PNGs. Replace them with production-ready artwork before publishing.
- Update `static/manifest.json` with an appropriate version number and metadata when you release.

## License

MIT
