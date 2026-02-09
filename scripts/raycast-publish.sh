#!/usr/bin/env bash
# Publish the Raycast extension to the Raycast Store.
#
# This script handles the gymnastics needed because our monorepo layout
# differs from what the Raycast extensions repo expects:
#   1. Runs the prebuild to populate raycast/src/ from shared source
#   2. Un-ignores the generated src/ files and strips the prebuild script
#   3. Commits the publish-ready state (Raycast CLI requires clean git)
#   4. Runs `npx @raycast/api@latest publish`
#   5. Reverts the publish commit to restore the original state
#
# Usage: npm run publish:raycast   (or: bash scripts/raycast-publish.sh)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RAYCAST_DIR="$ROOT/raycast"

# Ensure we start with a clean working tree
cd "$ROOT"
if ! git diff --quiet HEAD; then
  echo "✗ Working tree is dirty. Please commit or stash your changes first."
  exit 1
fi

echo "==> Building Raycast extension (prebuild + compile)..."
npm run build:raycast

echo "==> Preparing raycast/ for publish..."
cd "$RAYCAST_DIR"

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

# Format generated src/ files with Raycast's Prettier config
echo "==> Formatting source files with Prettier..."
npx ray lint --fix 2>/dev/null || true

# Commit the publish-ready state (Raycast CLI requires a clean git tree)
echo "==> Committing publish-ready state..."
cd "$ROOT"
git add -A
git commit -m "chore: temporary publish-ready state (will be reverted)" --no-verify

echo "==> Publishing to Raycast Store..."
cd "$RAYCAST_DIR"
PUBLISH_OK=true
npx @raycast/api@latest publish || PUBLISH_OK=false

# Revert the temporary publish commit to restore original state
echo "==> Reverting publish commit..."
cd "$ROOT"
git reset --hard HEAD~1

if [ "$PUBLISH_OK" = true ]; then
  echo "✓ Published successfully. Publish commit reverted."
else
  echo "✗ Publish failed. Publish commit reverted. Check errors above."
  exit 1
fi
