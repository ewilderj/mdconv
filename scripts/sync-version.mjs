import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

async function readJson(filePath) {
  const source = await readFile(filePath, 'utf8');
  return JSON.parse(source);
}

async function writeJson(filePath, data) {
  const payload = JSON.stringify(data, null, 2);
  await writeFile(filePath, `${payload}\n`, 'utf8');
}

async function ensureVersion(targetPath, field) {
  const data = await readJson(targetPath);
  if (data[field] === rootVersion) {
    return false;
  }
  data[field] = rootVersion;
  await writeJson(targetPath, data);
  return true;
}

async function ensureRaycastPackageVersion(targetPath) {
  const data = await readJson(targetPath);
  if (data.version === rootVersion) {
    return false;
  }
  data.version = rootVersion;
  await writeJson(targetPath, data);
  return true;
}

const rootPackagePath = path.join(rootDir, 'package.json');
const rootPackage = await readJson(rootPackagePath);
const rootVersion = rootPackage.version;

if (!rootVersion || typeof rootVersion !== 'string') {
  throw new Error('Root package.json is missing a valid "version" field.');
}

const chromeManifestPath = path.join(rootDir, 'static', 'manifest.json');
const raycastPackagePath = path.join(rootDir, 'raycast', 'package.json');

const updates = await Promise.all([
  ensureVersion(chromeManifestPath, 'version'),
  ensureRaycastPackageVersion(raycastPackagePath)
]);

const filesUpdated = [chromeManifestPath, raycastPackagePath].filter((_, index) => updates[index]);

if (filesUpdated.length > 0) {
  console.info(`Synced version ${rootVersion} to:\n- ${filesUpdated.map((file) => path.relative(rootDir, file)).join('\n- ')}`);
}
