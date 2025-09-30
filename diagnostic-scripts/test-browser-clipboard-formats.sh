#!/bin/bash

echo "=== Clipboard Format Investigation ==="
echo ""
echo "INSTRUCTIONS:"
echo "1. Copy the text '🎯 Next: This month's work has concluded.' from a WEB BROWSER"
echo "2. Press ENTER when ready"
read -p ""

echo ""
echo "Available clipboard formats:"
osascript -e 'the clipboard as «class HTML»' > /tmp/clipboard-html.txt 2>&1
echo "1. HTML format available: $([ $? -eq 0 ] && echo 'YES' || echo 'NO')"

echo ""
echo "2. Testing pbpaste formats:"
echo ""

echo "=== Default pbpaste ==="
pbpaste | head -c 200
echo ""
echo ""

echo "=== pbpaste -Prefer public.html ==="
pbpaste -Prefer public.html 2>&1 | head -c 200
echo ""
echo ""

echo "=== pbpaste -Prefer public.utf8-plain-text ==="
pbpaste -Prefer public.utf8-plain-text 2>&1 | head -c 200
echo ""
echo ""

echo "=== pbpaste -Prefer public.rtf ==="
pbpaste -Prefer public.rtf 2>&1 | head -c 200
echo ""
echo ""

echo "=== All available types ==="
osascript << 'EOF'
set theTypes to {}
try
    set theTypes to clipboard info
    repeat with theType in theTypes
        log (item 1 of theType as string)
    end repeat
end try
EOF
