# Markdown Clipboard Converter

A Chrome/Edge extension that transforms rich text from your clipboard into polished Markdown. Paste formatted content from Microsoft Word, Google Docs, or the web, preview the converted Markdown instantly, and copy it back to your clipboard in a single click.

Created with a lot of help from Copilot in VS Code, using GPT-5-Codex and Sonnet 4 models. 

⚠️ As of 2025-09-28 this extension has been submitted to the Chrome and Edge extension stores. I will update with links once available. In the meantime, to use this please follow "Getting Started" below. ⚠️

## Features

- **One-click conversion** – Read HTML from the clipboard and convert it to Markdown using [Turndown](https://github.com/mixmark-io/turndown).
- **Context menu integration** – Right-click on selected text anywhere on the web and choose "Copy as Markdown" to convert and copy formatted content instantly.
- **Smart fallback** – Gracefully handles plain text when no rich content is available.
- **Automatic copy-back** – Immediately writes the generated Markdown to your clipboard after each conversion.
- **Live paste listener** – Supports keyboard pastes (`Cmd/Ctrl + V`) directly inside the popup.
- **Word-aware headings** – Promotes Microsoft Word clipboard headings so Markdown keeps its structure.
- **Google Docs normalization** – Cleans up Docs-specific spans and non-breaking spaces so the output stays readable.
- **Monospace heuristics** – Detects Courier-style Word paragraphs and emits fenced code blocks.
- **Bold span detection** – Upgrades inline `font-weight: bold` spans into Markdown `**strong**` text.
- **Image support** – Includes conversion of inline images (beware large images will result in massive Markdown!)

## Screenshot

![Screenshot of Markdown Clipboard Converter](docs/screenshot.png)

## Usage

### Method 1: Extension Popup
1. Click the extension icon to open the popup.
2. Press **Paste & Convert** or press `Cmd/Ctrl + V` with formatted content on your clipboard.
3. The Markdown appears in the output area and is automatically copied back to your clipboard so you can paste it wherever it's needed.

### Method 2: Context Menu (New!)
1. Select any formatted text on a webpage, document, or local HTML file.
2. Right-click on the selection and choose **"Copy as Markdown"** from the context menu.
3. The converted Markdown is automatically copied to your clipboard – no popup needed!
4. A green checkmark (✓) badge appears on the extension icon to confirm successful conversion.

> **Clipboard permissions**: Chrome will prompt for clipboard permissions when first reading or writing. Accept the prompt so the extension can function correctly.

## Getting Started

### 1. Install Node.js (Mac)

Install Node, preferable through [Homebrew](https://brew.sh/).

### 1. Install Node.js (Windows users)

If you don't have Node.js installed on Windows:

1. Visit [nodejs.org](https://nodejs.org) and download the LTS version (recommended)
2. Run the installer and follow the installation wizard
3. Restart your terminal/VS Code after installation
4. Verify installation by running: `node --version` and `npm --version`

**PowerShell Execution Policy Fix:**
If you encounter "cannot be loaded because running scripts is disabled" error when using npm:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 2. Install dependencies

```bash
npm install
```

### 3. Build the extension

```bash
npm run build
```

The compiled assets are emitted to `dist/`.

### 4. Load the unpacked extension in Chrome

1. Open `chrome://extensions` in your browser.
2. Toggle **Developer mode** on (top-right switch).
3. Click **Load unpacked** and choose the `dist` folder.
4. The “Markdown Clipboard Converter” icon will appear in the toolbar.

### 5. Load the unpacked extension in Chrome or Edge

**For Chrome:**
1. Open `chrome://extensions` in your browser.
2. Toggle **Developer mode** on (top-right switch).
3. Click **Load unpacked** and choose the `dist` folder.
4. The "Markdown Clipboard Converter" icon will appear in the toolbar.

**For Microsoft Edge:**
1. Open `edge://extensions/` in your browser.
2. Toggle **Developer mode** on (left sidebar).
3. Click **Load unpacked** and choose the `dist` folder.
4. The "Markdown Clipboard Converter" icon will appear in the toolbar.

**To pin the extension for easy access:**
- Click the puzzle piece icon (🧩) in the toolbar, then click the pin icon next to "Markdown Clipboard Converter"
- **Edge**: Click the puzzle piece icon (🧩) in the toolbar, then click the pin icon next to "Markdown Clipboard Converter"

### 6. (Optional) Start a development watch task

```bash
npm run dev
```

This runs esbuild in watch mode and mirrors static assets into `dist/` whenever they change.

### 7. Run regression tests

```bash
npm test
```

Exercises the Word desktop, Word Online, and Google Docs HTML fixtures in `test/` to ensure the Markdown output stays consistent.

### Debugging clipboard captures

If clipboard conversion behaves differently in the popup than in your automated tests, enable the built-in logging flag to capture the raw payload:

1. Open the popup and choose **Inspect** to bring up DevTools.
2. In the DevTools console, run:

  ```js
  localStorage.setItem('mdconv.debugClipboard', 'true');
  ```

3. Paste or click **Paste & Convert** again. The console will log grouped entries containing the raw HTML, plain text, and resulting Markdown so you can copy them into new fixtures.

Disable logging when you're done:

```js
localStorage.removeItem('mdconv.debugClipboard');
```

## Project Structure

```
static/           # Manifest, popup HTML/CSS, placeholder icons
src/              # TypeScript source files
  ├── popup.ts          # Popup interface logic
  ├── background.ts     # Service worker & context menu handling
  ├── content-script.ts # Content script for HTML selection conversion
  └── converter.ts      # Core HTML-to-Markdown conversion logic
dist/             # Build output (generated)
test/             # Test fixtures and conversion verification
PRD.md            # Product requirements document
```


## License

MIT
