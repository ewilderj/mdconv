# Markdown Clipboard Converter

A multi-platform clipboard converter that transforms rich text into polished Markdown. Available as a Chrome/Edge browser extension, with Raycast integration in development.

**Primary Platform: Browser Extension** – Paste formatted content from Microsoft Word, Google Docs, or the web, preview the converted Markdown instantly, and copy it back to your clipboard in a single click.

**🚧 Work in Progress: Raycast Extension** – Native macOS integration through Raycast for quick clipboard conversion without browser context.

Created with a lot of help from Copilot in VS Code, using GPT-5-Codex and Sonnet 4 models. 

**Install for Google Chrome** – [Markdown Converter for the web, Word, and Google Docs](https://chromewebstore.google.com/detail/markdown-converter-for-th/bnfjgeonjiooklgimcmobnkeibiiaamp)

**Install for Microsoft Edge** – [Markdown Converter for the web, Word, and Google Docs](https://microsoftedge.microsoft.com/addons/detail/markdown-converter-for-th/jhgdmdnfelimaoponohkkimlfbgnadam) 

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

### Raycast Extension (pending review by Raycast)

A native Raycast command for clipboard conversion, on macOS only:

1. Copy formatted content from any application (Word, Google Docs, web pages, etc.)
2. Open Raycast and run "Convert Clipboard to Markdown"
3. Converted Markdown is automatically copied back to your clipboard

![Raycast usage of Markdown Clipboard Converter](docs/screencast.gif)


## Getting Started With Development

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

**For Chrome/Edge extension:**
```bash
npm run build
```
The compiled assets are emitted to `dist/`.

**For Raycast extension (optional):**
```bash
npm run build:raycast
```
Builds the Raycast extension in `raycast/dist/`.

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

**For Chrome/Edge extension:**
```bash
npm run dev
```
This runs esbuild in watch mode and mirrors static assets into `dist/` whenever they change.

**For Raycast extension:**
```bash
npm run dev:raycast
```
Starts Raycast development mode for testing the extension locally.

### 7. Run regression tests

```bash
npm test
```

Exercises the Word desktop, Word Online, and Google Docs HTML fixtures in `test/` to ensure the Markdown output stays consistent across both Chrome and Raycast platforms.

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
static/                    # Chrome extension manifest, popup HTML/CSS, icons
src/
  ├── core/                # Shared conversion logic
  │   ├── converter.ts     # Core HTML-to-Markdown conversion
  │   └── adapters/        # Platform abstraction interfaces
  ├── platforms/
  │   ├── chrome/          # Chrome/Edge extension implementation
  │   │   ├── popup.ts     # Browser popup interface
  │   │   ├── background.ts# Service worker & context menu
  │   │   └── content-script.ts # HTML selection conversion
  │   └── raycast/         # Raycast extension (work in progress)
  │       ├── convert-clipboard.tsx # Raycast command UI
  │       └── adapters/    # Raycast-specific clipboard handling
raycast/                   # Raycast extension package
dist/                      # Chrome extension build output
test/                      # Test fixtures and conversion verification
scripts/                   # Build and version sync utilities
PRD.md                     # Product requirements document
```

## Credits

* @nahals for original inspiration, Windows usage, and more
* This extension builds on the amazing [Turndown](https://github.com/mixmark-io/turndown) library

## License

MIT
