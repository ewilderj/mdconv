#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Markdown to Org
# @raycast.mode silent

# Optional parameters:
# @raycast.icon 🦄
# @raycast.packageName Developer Utilities
# @raycast.description Converts clipboard from Markdown to Org using Pandoc.

# Add Homebrew to path to find pandoc (adjust if you are on Intel mac)
export PATH="$PATH:/opt/homebrew/bin:/usr/local/bin"

if ! command -v pandoc &> /dev/null; then
    echo "Error: Pandoc not found"
    exit 1
fi

# 1. Get clipboard
# 2. Pipe through pandoc
# 3. Pipe back to clipboard
pbpaste | pandoc -f markdown-auto_identifiers -t org --wrap=preserve | pbcopy

echo "Clipboard converted to Org"
