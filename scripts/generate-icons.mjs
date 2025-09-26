import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { promises as fs } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const sourceSvg = join(projectRoot, "static", "icons", "icon.svg");
const targets = [
  { size: 16, filename: "icon16.png" },
  { size: 48, filename: "icon48.png" },
  { size: 128, filename: "icon128.png" }
];

async function ensureSourceExists() {
  try {
    await fs.access(sourceSvg);
  } catch (error) {
    throw new Error(`Source SVG not found at ${sourceSvg}`);
  }
}

async function generateIcon({ size, filename }) {
  const destination = join(projectRoot, "static", "icons", filename);
  await sharp(sourceSvg)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(destination);
  return destination;
}

async function main() {
  await ensureSourceExists();
  await Promise.all(targets.map(generateIcon));
  console.info("Generated icon PNGs:");
  for (const target of targets) {
    console.info(` - ${target.filename} (${target.size}x${target.size})`);
  }
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exitCode = 1;
});
