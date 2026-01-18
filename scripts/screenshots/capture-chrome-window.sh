#!/bin/bash
# Capture Chrome window automatically without manual clicking
# Uses a combination of AppleScript and screencapture with timer

OUTPUT_FILE="$1"

if [ -z "$OUTPUT_FILE" ]; then
    echo "Usage: $0 <output-file>"
    exit 1
fi

# Activate Chrome and position it
osascript <<EOF
tell application "Google Chrome"
    activate
    tell window 1
        set bounds to {100, 100, 1380, 900}
    end tell
end tell
EOF

sleep 0.5

# Use timed capture with a selection that we'll click cancel on,
# but actually capture with interactive mode
screencapture -W "$OUTPUT_FILE"

echo "Screenshot saved to: $OUTPUT_FILE"
