# Firefox Extension Build Instructions

This document provides step-by-step instructions for Mozilla reviewers to build the Firefox extension from source.

## System Requirements

- **Operating System**: macOS, Linux, or Windows
- **Node.js**: v25.x or later
- **npm**: v10.x or later (comes with Node.js)

## Installation Instructions

### 1. Install Node.js

Download and install Node.js from: https://nodejs.org/

Verify installation:
```bash
node --version  # Should show v25.x or later
npm --version   # Should show v10.x or later
```

### 2. Extract Source Code

Extract the source code archive to a directory, then navigate to it:
```bash
cd mdconv
```

### 3. Install Dependencies

Install all required npm packages:
```bash
npm install
```

This installs:
- `esbuild` - JavaScript bundler and TypeScript compiler
- `turndown` - HTML to Markdown converter library
- `typescript` - TypeScript language support
- Other development dependencies listed in package.json

## Build Process

### Single Command Build

To build the Firefox extension in one step:

```bash
npm run build:firefox
```

This command:
1. Cleans the `dist-firefox/` directory
2. Compiles TypeScript files using ESBuild
3. Copies static assets (HTML, CSS, icons)
4. Copies the Firefox manifest

### Build Output

The built extension is located in:
```
dist-firefox/
├── background.js
├── background.js.map
├── content-script.js
├── content-script.js.map
├── popup.js
├── popup.js.map
├── manifest.json
├── popup.html
├── popup.css
└── icons/
    ├── icon16.png
    ├── icon48.png
    ├── icon128.png
    └── icon.svg
```

### Create Distribution Package

To create the distributable ZIP file:
```bash
npm run build:firefox:zip
```

This creates `mdconv-firefox.zip` containing the built extension.

## Build Script Details

The build process is defined in `package.json` under the `scripts` section:

```json
{
  "clean:firefox": "rimraf dist-firefox",
  "build:firefox:js": "esbuild src/platforms/firefox/popup.ts src/platforms/firefox/background.ts src/platforms/firefox/content-script.ts --bundle --outdir=dist-firefox --format=esm --target=firefox109 --sourcemap",
  "copy:firefox:assets": "cpx \"static/{icons/**,popup.html,popup.css}\" dist-firefox",
  "copy:firefox:manifest": "node -e \"require('fs').copyFileSync('static/manifest.firefox.json', 'dist-firefox/manifest.json')\"",
  "build:firefox": "npm run clean:firefox && npm-run-all build:firefox:js copy:firefox:assets copy:firefox:manifest"
}
```

### ESBuild Configuration

ESBuild is invoked with these flags:
- `--bundle` - Combines all imports into single files
- `--format=esm` - Outputs ES modules
- `--target=firefox109` - Targets Firefox 109+ JavaScript features
- `--sourcemap` - Generates `.map` files for debugging
- **No minification** - Code remains readable

## Source Code Structure

```
src/
├── core/                          # Shared conversion logic
│   ├── converter.ts               # Main HTML→Markdown converter
│   ├── logging.ts                 # Logging utilities
│   ├── env.ts                     # Environment configuration
│   └── adapters/
│       ├── clipboard.ts           # Clipboard interface
│       └── dom-parser.ts          # DOM parser interface
├── platforms/
    └── firefox/                   # Firefox-specific code
        ├── background.ts          # Background script (context menu)
        ├── popup.ts               # Popup UI script
        ├── content-script.ts      # Content script (selection conversion)
        ├── firefox-converter.ts   # Firefox converter wrapper
        └── adapters/
            ├── firefox-clipboard.ts    # Re-exports Chrome adapter
            ├── firefox-dom-parser.ts   # Re-exports Chrome adapter
            └── index.ts                # Adapter exports

static/
├── manifest.firefox.json          # Firefox manifest (copied to dist-firefox/manifest.json)
├── popup.html                     # Popup UI HTML
├── popup.css                      # Popup UI styles
└── icons/                         # Extension icons

test/                              # Test files (not included in build)
```

## Verification

### 1. Verify Build Succeeded

After running `npm run build:firefox`, check that `dist-firefox/` contains all files listed above.

### 2. Type Check

Run TypeScript type checking:
```bash
npm run typecheck
```

Should complete with no errors.

### 3. Run Tests

Execute the test suite:
```bash
npm test
```

All 71 tests should pass.

### 4. Compare Output

The built JavaScript in `dist-firefox/*.js` should match the functionality of the TypeScript source in `src/platforms/firefox/`. Source maps (`.js.map` files) allow tracing compiled code back to original TypeScript.

## Third-Party Libraries

The extension bundles these open-source libraries:

1. **Turndown** (v7.1.2)
   - License: MIT
   - Purpose: HTML to Markdown conversion
   - Source: https://github.com/mixmark-io/turndown
   - Bundled into `popup.js` and `content-script.js`

All library code is bundled by ESBuild and visible in the output JavaScript files.

## Notes for Reviewers

- **No minification**: JavaScript output is readable and formatted
- **Source maps included**: All `.js.map` files trace back to TypeScript source
- **Standard build tools**: Uses mainstream npm packages (esbuild, typescript)
- **Reproducible builds**: Same source + same Node.js version = identical output
- **No obfuscation**: Straightforward TypeScript → JavaScript compilation

## Troubleshooting

### Build Fails with "command not found"

Ensure Node.js and npm are installed and in your PATH.

### TypeScript Errors

Run `npm install` to ensure all dependencies are installed, then retry `npm run build:firefox`.

### Missing Files in dist-firefox/

Delete `dist-firefox/` and `node_modules/`, then:
```bash
npm install
npm run build:firefox
```

## Contact

For questions about the build process:
- GitHub: https://github.com/ewilderj/mdconv
- Issues: https://github.com/ewilderj/mdconv/issues
