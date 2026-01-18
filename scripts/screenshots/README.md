# Store Screenshot Capture Guide

Instructions for capturing Chrome Web Store screenshots at 1280×800.

## Prerequisites

- macOS with `screencapture` and `sips` (built-in)
- Google Chrome with mdconv extension installed
- Ghostty terminal (for composite screenshots showing markdown source)
- Test documents (URLs in `screenshot-config.json`):
  - Google Doc with headings, lists, tables, formatting
  - Word Online document (optional, for Word-specific screenshots)

## Core Capture Command

This captures Chrome's window with a 40px background border padding, then resizes to 1280×800:

```bash
osascript -e 'tell application "Google Chrome" to activate' && sleep 0.5 && \
BOUNDS=$(osascript -e 'tell application "Google Chrome" to get bounds of front window') && \
X=$(echo $BOUNDS | cut -d',' -f1 | tr -d ' ') && Y=$(echo $BOUNDS | cut -d',' -f2 | tr -d ' ') && \
X2=$(echo $BOUNDS | cut -d',' -f3 | tr -d ' ') && Y2=$(echo $BOUNDS | cut -d',' -f4 | tr -d ' ') && \
PAD=40 && X=$((X - PAD)) && Y=$((Y - PAD)) && W=$((X2 - X + PAD)) && H=$((Y2 - Y + PAD)) && \
screencapture -R "$X,$Y,$W,$H" OUTPUT_FILE.png && \
sips -z 800 1280 OUTPUT_FILE.png && \
open OUTPUT_FILE.png
```

## Screenshot Types

### 1. Standard Chrome Window Captures

For screenshots showing just Chrome (with or without popup):
- `google-docs-source.png` - Google Doc visible
- `hero-markdown.png` - Popup showing Markdown output
- `hero-org.png` - Popup showing Org-mode output  
- `hero-markdown-word.png` - Word doc with Markdown popup

**Setup:**
1. Navigate to the test document
2. Select and copy content (Cmd+A, Cmd+C)
3. Open extension popup, set desired mode/format
4. Run the core capture command

### 2. Composite Screenshots (Chrome + Ghostty)

For screenshots showing markdown source alongside Chrome (reverse conversion demos):
- `reverse-conversion.png` - Markdown source → Rich Text conversion
- `reverse-conversion-result.png` - Result pasted into Google Docs

**Setup:**
1. Open a new Ghostty window: `osascript -e 'tell application "Ghostty" to activate' -e 'tell application "System Events" to keystroke "n" using command down'`
2. Display the sample markdown: `cat docs/screenshots/sample-markdown.md`
3. Position Ghostty window over the left portion of Chrome
4. Set up Chrome with the extension popup showing the conversion

**Capture command (brings Ghostty to front):**
```bash
BOUNDS=$(osascript -e 'tell application "Google Chrome" to get bounds of front window') && \
X=$(echo $BOUNDS | cut -d',' -f1 | tr -d ' ') && Y=$(echo $BOUNDS | cut -d',' -f2 | tr -d ' ') && \
X2=$(echo $BOUNDS | cut -d',' -f3 | tr -d ' ') && Y2=$(echo $BOUNDS | cut -d',' -f4 | tr -d ' ') && \
PAD=40 && X=$((X - PAD)) && Y=$((Y - PAD)) && W=$((X2 - X + PAD)) && H=$((Y2 - Y + PAD)) && \
osascript -e 'tell application "Ghostty" to activate' && sleep 0.3 && \
screencapture -R "$X,$Y,$W,$H" OUTPUT_FILE.png && \
sips -z 800 1280 OUTPUT_FILE.png && \
open OUTPUT_FILE.png
```

**Important:** Get Chrome bounds *before* activating Ghostty, otherwise Ghostty ends up behind Chrome.

### 3. Context Menu Screenshot

Requires timed capture since you need to right-click and hold:
- `context-menu.png` - Right-click menu showing "Copy as Markdown/Org"

**Setup:**
1. Navigate to Google Doc
2. Select some text
3. Run timed capture command
4. Right-click to show context menu before timer expires

**Timed capture command (10 second delay):**
```bash
osascript -e 'tell application "Google Chrome" to activate' && sleep 0.5 && \
BOUNDS=$(osascript -e 'tell application "Google Chrome" to get bounds of front window') && \
X=$(echo $BOUNDS | cut -d',' -f1 | tr -d ' ') && Y=$(echo $BOUNDS | cut -d',' -f2 | tr -d ' ') && \
X2=$(echo $BOUNDS | cut -d',' -f3 | tr -d ' ') && Y2=$(echo $BOUNDS | cut -d',' -f4 | tr -d ' ') && \
PAD=40 && X=$((X - PAD)) && Y=$((Y - PAD)) && W=$((X2 - X + PAD)) && H=$((Y2 - Y + PAD)) && \
echo "Right-click NOW! Capturing in 10 seconds..." && \
screencapture -T 10 -R "$X,$Y,$W,$H" OUTPUT_FILE.png && \
sips -z 800 1280 OUTPUT_FILE.png && \
open OUTPUT_FILE.png
```

## Complete Screenshot Set

| File | Type | Description |
|------|------|-------------|
| `google-docs-source.png` | standard | Google Doc with extension |
| `hero-markdown.png` | standard | Markdown conversion (Google Doc) |
| `hero-markdown-word.png` | standard | Markdown conversion (Word) |
| `hero-org.png` | standard | Org-mode conversion |
| `reverse-conversion.png` | composite | Ghostty + Chrome: Markdown → Rich Text |
| `reverse-conversion-result.png` | composite | Ghostty + Chrome: Result in Docs |
| `context-menu.png` | timed | Right-click context menu |

## Tips

- **Window sizing:** Before capturing, size Chrome to approximately 1200×760 so the 40px padding and resize work well
- **Dark background:** The 40px padding captures your desktop background - use a solid dark color for best results
- **Popup position:** Keep the extension popup towards the right side of the window so document content is visible
- **Ghostty positioning:** For composites, position Ghostty to show the markdown clearly without obscuring the popup

## Output Directory

All screenshots go to `docs/screenshots/` at 1280×800 PNG format.

## Regenerating Screenshots

Ask the AI assistant: "Please retake the store screenshots following scripts/screenshots/README.md"

The AI will:
1. Guide you through setting up each screenshot
2. Run the appropriate capture command
3. Verify each output before moving to the next

## Files

- `screenshot-config.json` - Test URLs and screenshot metadata
- `sample-markdown.md` (in `docs/screenshots/`) - Sample markdown for reverse conversion demos
- `README.md` - This file
