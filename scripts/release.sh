#!/bin/bash
set -e

# Release helper script for mdconv
# Usage: ./scripts/release.sh [version]
# Example: ./scripts/release.sh 1.0.1

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "Usage: ./scripts/release.sh <version>"
  echo "Example: ./scripts/release.sh 1.0.1"
  exit 1
fi

echo "🚀 Preparing release v$VERSION"
echo ""

# Update version in package.json
echo "📝 Updating version in package.json..."
npm version $VERSION --no-git-tag-version

# Sync version to manifests and Raycast package.json
echo "📝 Syncing version to manifests..."
npm run sync-version

# Run quality checks
echo "🔍 Running type check..."
npm run typecheck

echo "🧪 Running tests..."
npm test

# Build all distributions
echo "🏗️  Building Chrome extension..."
npm run build:zip

echo "🏗️  Building Firefox extension..."
npm run build:firefox:zip

echo "🏗️  Building Firefox source package..."
npm run build:firefox:source

echo ""
echo "✅ All builds complete!"
echo ""
echo "📦 Generated files:"
echo "   - mdconv-extension.zip (Chrome)"
echo "   - mdconv-firefox.zip (Firefox)"
echo "   - mdconv-firefox-source.zip (Firefox source)"
echo ""
echo "Next steps:"
echo "1. Review changes: git diff"
echo "2. Commit changes: git add . && git commit -m 'chore: release v$VERSION'"
echo "3. Create tag: git tag v$VERSION"
echo "4. Push with tags: git push && git push --tags"
echo ""
echo "GitHub Actions will automatically create the release with all artifacts."
