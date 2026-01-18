#!/bin/bash

# Automated popup screenshot capture script
# Uses AppleScript to activate Chrome and screencapture to take screenshots

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="$SCRIPT_DIR/../../docs/screenshots"
mkdir -p "$OUTPUT_DIR"

echo "🎬 Starting popup screenshot capture..."
echo "📋 Clipboard should contain rich text from Google Doc"
echo ""

# Function to take a screenshot after a delay
take_screenshot() {
    local filename=$1
    local message=$2
    
    echo "📸 Ready to capture: $filename"
    echo "   $message"
    read -p "   Press ENTER when ready..."
    
    # Activate Chrome and capture window bounds with padding for background border
    osascript -e 'tell application "Google Chrome" to activate' > /dev/null 2>&1
    sleep 0.5
    BOUNDS=$(osascript -e 'tell application "Google Chrome" to get bounds of front window')
    X=$(echo $BOUNDS | cut -d',' -f1 | tr -d ' ')
    Y=$(echo $BOUNDS | cut -d',' -f2 | tr -d ' ')
    X2=$(echo $BOUNDS | cut -d',' -f3 | tr -d ' ')
    Y2=$(echo $BOUNDS | cut -d',' -f4 | tr -d ' ')
    PAD=40
    X=$((X - PAD))
    Y=$((Y - PAD))
    W=$((X2 - X + PAD))
    H=$((Y2 - Y + PAD))
    
    screencapture -R "$X,$Y,$W,$H" "$OUTPUT_DIR/$filename"
    sips -z 800 1280 "$OUTPUT_DIR/$filename" > /dev/null 2>&1
    echo "   ✓ Saved and resized $filename"
}

# Activate Chrome
osascript -e 'tell application "Google Chrome" to activate'
sleep 1

echo ""
echo "🎯 Step 1: Hero Markdown Screenshot"
echo "   1. Click the mdconv extension icon"
echo "   2. Wait for popup to show Markdown conversion"
take_screenshot "hero-markdown.png" "Extension popup showing Markdown output"

echo ""
echo "🎯 Step 2: Hero Org-mode Screenshot"  
echo "   1. In the popup, click the 'Org' format toggle"
echo "   2. Wait for org-mode conversion to appear"
take_screenshot "hero-org.png" "Extension popup showing Org-mode output"

echo ""
echo "🎯 Step 3: Reverse Conversion Screenshot"
echo "   1. Close the popup and copy some Markdown text to clipboard"
echo "   2. Click the extension icon again"
echo "   3. Click the bidirectional arrow icon to switch to 'Markdown → Rich Text' mode"
take_screenshot "reverse-conversion.png" "Extension popup in reverse conversion mode"

echo ""
echo "🎯 Step 4: Context Menu Screenshot"
echo "   1. Close the popup"
echo "   2. Select some text in the Google Doc"
echo "   3. Right-click to show context menu with 'Copy as Markdown/Org' options"
take_screenshot "context-menu.png" "Context menu showing conversion options"

echo ""
echo "✅ Screenshot capture complete!"
echo "📁 Screenshots saved to: $OUTPUT_DIR"
echo ""
echo "📊 Review screenshots:"
ls -lh "$OUTPUT_DIR"/*.png
