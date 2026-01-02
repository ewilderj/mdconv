#!/usr/bin/env node

/**
 * Prepares Raycast extension for publishing by copying shared source files
 * into the raycast directory so the extension is self-contained.
 */

import { cpSync, existsSync, mkdirSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const raycastDir = join(rootDir, 'raycast');
const raycastLibDir = join(raycastDir, 'lib');

// Clean up any existing lib directory
if (existsSync(raycastLibDir)) {
  rmSync(raycastLibDir, { recursive: true, force: true });
}

// Create lib directory
mkdirSync(raycastLibDir, { recursive: true });

// Copy shared source files
cpSync(join(rootDir, 'src/core'), join(raycastLibDir, 'core'), { recursive: true });
cpSync(join(rootDir, 'src/platforms/raycast'), join(raycastLibDir, 'platforms/raycast'), { recursive: true });
cpSync(join(rootDir, 'src/globals.d.ts'), join(raycastLibDir, 'globals.d.ts'));

console.log('✓ Copied shared source files to raycast/lib/');
