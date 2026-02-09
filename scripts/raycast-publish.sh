#!/usr/bin/env bash
# Publish the Raycast extension to the Raycast Store.
#
# This script handles the gymnastics needed because our monorepo layout
# differs from what the Raycast extensions repo expects:
#   1. Runs the prebuild to populate raycast/src/ from shared source
#   2. Temporarily un-ignores the generated src/ files
#   3. Strips the prebuild script (references parent-relative paths)
#   4. Runs `npx @raycast/api@latest publish`
#   5. Restores .gitignore and package.json to their original state
#
# Usage: npm run publish:raycast   (or: bash scripts/raycast-publish.sh)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RAYCAST_DIR="$ROOT/raycast"

echo "==> Building Raycast extension (prebuild + compile)..."
cd "$ROOT"
npm run build:raycast

echo "==> Preparing raycast/ for publish..."
cd "$RAYCAST_DIR"

# Save originals
cp .gitignore .gitignore.bak
cp package.json package.json.bak

# Remove src/ entries from .gitignore so publish includes them
sed -i '' '/^# Shared source files/,/^$/d' .gitignore
sed -i '' '/^src\//d' .gitignore

# Strip the prebuild script from package.json (parent paths won't exist in monorepo)
# Use node for reliable JSON manipulation
node -e '
  const fs = require("fs");
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
  delete pkg.scripts.prebuild;
  fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
'

echo "==> Publishing to Raycast Store..."
PUBLISH_OK=true
npx @raycast/api@latest publish || PUBLISH_OK=false

echo "==> Restoring original files..."
mv .gitignore.bak .gitignore
mv package.json.bak package.json

if [ "$PUBLISH_OK" = true ]; then
  echo "✓ Published successfully. Original files restored."
else
  echo "✗ Publish failed. Original files restored. Check errors above."
  exit 1
fi
