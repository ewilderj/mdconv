#!/usr/bin/env node

/**
 * Prepares Raycast extension for publishing by copying shared source files
 * into the raycast/src directory so the extension is self-contained.
 *
 * MONOREPO NOTE: When copying raycast/ into the Raycast extensions monorepo
 * (github.com/raycast/extensions), the generated files in src/ must be committed
 * there since this script won't exist in that context. The publish script should
 * also strip the "prebuild" entry from package.json scripts.
 *
 * Layout produced:
 *   raycast/src/
 *     core/          ← src/core/
 *     types/         ← src/types/
 *     adapters/      ← src/platforms/raycast/adapters/ (imports rewritten)
 *     convert-*.tsx  ← src/platforms/raycast/convert-*.tsx (imports rewritten)
 *     raycast-converter.ts ← src/platforms/raycast/raycast-converter.ts (imports rewritten)
 */

import { cpSync, existsSync, mkdirSync, rmSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const raycastSrcDir = join(rootDir, 'raycast', 'src');

// Directories that are fully managed by this script (cleaned before copy)
const managedDirs = ['core', 'types', 'adapters'];

// Clean managed directories
for (const dir of managedDirs) {
  const target = join(raycastSrcDir, dir);
  if (existsSync(target)) {
    rmSync(target, { recursive: true, force: true });
  }
}

// Also clean any leftover lib/ from the old layout
const legacyLib = join(raycastSrcDir, 'lib');
if (existsSync(legacyLib)) {
  rmSync(legacyLib, { recursive: true, force: true });
}

// 1. Copy shared library code (unchanged)
cpSync(join(rootDir, 'src/core'), join(raycastSrcDir, 'core'), { recursive: true });
cpSync(join(rootDir, 'src/types'), join(raycastSrcDir, 'types'), { recursive: true });

// 2. Copy adapter files with import rewriting
//    ../../../core/ → ../core/
mkdirSync(join(raycastSrcDir, 'adapters'), { recursive: true });
const adapterDir = join(rootDir, 'src/platforms/raycast/adapters');
for (const file of readdirSync(adapterDir)) {
  let content = readFileSync(join(adapterDir, file), 'utf-8');
  content = content.replace(/from\s+["']\.\.\/\.\.\/\.\.\/core\//g, 'from "../core/');
  writeFileSync(join(raycastSrcDir, 'adapters', file), content);
}

// 3. Copy command files and raycast-converter with import rewriting
//    ../../core/ → ./core/
const platformDir = join(rootDir, 'src/platforms/raycast');
for (const file of readdirSync(platformDir)) {
  if (file === 'adapters') continue; // skip directory
  let content = readFileSync(join(platformDir, file), 'utf-8');
  content = content.replace(/from\s+["']\.\.\/\.\.\/core\//g, 'from "./core/');
  writeFileSync(join(raycastSrcDir, file), content);
}

console.log('✓ Copied shared source files to raycast/src/');
