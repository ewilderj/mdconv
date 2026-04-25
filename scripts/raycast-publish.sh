#!/usr/bin/env bash
# Publish the Raycast extension to the Raycast Store.
#
# This script handles the gymnastics needed because our monorepo layout
# differs from what the Raycast extensions repo expects:
#   1. Pulls upstream contributions and restores development state
#   2. Runs the prebuild to populate raycast/src/ from shared source
#   3. Un-ignores the generated src/ files and strips the prebuild script
#   4. Commits the publish-ready state (Raycast CLI requires clean git)
#   5. Runs `npx @raycast/api@latest publish`
#   6. Reverts the publish commit to restore the original state
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

# --- Pull upstream contributions from the Raycast store ---
# The Raycast team may have made changes (lint configs, metadata, etc.) since
# our last publish. The CLI will refuse to publish if we haven't pulled them.
# After merging, we restore our development-only files that the publish step
# strips (src/ gitignore entries, prebuild script) since the store version
# won't have them.
echo "==> Pulling upstream contributions..."
cd "$RAYCAST_DIR"
CONTRIB_OUTPUT=$(npx @raycast/api@latest pull-contributions 2>&1) || true
echo "$CONTRIB_OUTPUT"

if echo "$CONTRIB_OUTPUT" | grep -q "some contributions conflict"; then
  echo ""
  echo "✗ Contributions have merge conflicts. Resolve them manually:"
  echo "  1. Edit conflicted files and git add them"
  echo "  2. Run: git merge --continue"
  echo "  3. Re-run: npm run publish:raycast"
  exit 1
elif echo "$CONTRIB_OUTPUT" | grep -q "pulling new contributions"; then
  echo "==> Contributions merged. Restoring development state..."

  # Restore src/ entries in .gitignore if missing
  if ! grep -q "^src/core/" .gitignore; then
    cat >> .gitignore << 'GITIGNORE_ENTRIES'

# Shared source files copied by scripts/prepare-raycast-build.mjs
src/core/
src/types/
src/adapters/
src/convert-clipboard.tsx
src/convert-clipboard-org.tsx
src/convert-to-html.tsx
src/convert-to-google-docs.tsx
src/convert-to-word.tsx
src/convert-to-slack.tsx
src/raycast-converter.ts
GITIGNORE_ENTRIES
  fi

  # Restore prebuild script in package.json if missing
  if ! node -e 'const p=JSON.parse(require("fs").readFileSync("package.json","utf8")); process.exit(p.scripts.prebuild ? 0 : 1)' 2>/dev/null; then
    node -e '
      const fs = require("fs");
      const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
      const scripts = {};
      scripts.prebuild = "node ../scripts/sync-version.mjs && node ../scripts/prepare-raycast-build.mjs";
      for (const [k, v] of Object.entries(pkg.scripts)) scripts[k] = v;
      pkg.scripts = scripts;
      fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
    '
  fi

  # Update deps if upstream changed package.json
  npm install --silent 2>/dev/null || true

  cd "$ROOT"
  git add -A
  git commit -m "chore: pull Raycast contributions and restore dev state" --no-verify
  echo "✓ Development state restored and committed."
else
  echo "✓ No new contributions."
fi

cd "$ROOT"
echo "==> Building Raycast extension (prebuild + compile)..."
npm run build:raycast

echo "==> Preparing raycast/ for publish..."
cd "$RAYCAST_DIR"

# Remove src/ entries from .gitignore so publish includes them
sed -i '' '/^# Shared source files/,/^$/d' .gitignore
sed -i '' '/^src\//d' .gitignore

# Remove the raycast/raycast/ subfolder (CLI artifact, not needed in store)
rm -rf "$RAYCAST_DIR/raycast"

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
# Use a meaningful message since the Raycast CLI includes it in the PR.
echo "==> Committing publish-ready state..."
cd "$ROOT"
git add -A
git commit -m "Update markdown-converter extension" --no-verify

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
