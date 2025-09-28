import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { JSDOM } from "jsdom";

import { convertClipboardPayload } from "../src/converter.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const globalsDom = new JSDOM("<!doctype html><html><body></body></html>");
const globalsWindow = globalsDom.window;

const extendedGlobal = globalThis as typeof globalThis & {
  Node?: typeof globalsWindow.Node;
  NodeFilter?: typeof globalsWindow.NodeFilter;
};

if (!extendedGlobal.Node) {
  extendedGlobal.Node = globalsWindow.Node;
}
if (!extendedGlobal.NodeFilter) {
  extendedGlobal.NodeFilter = globalsWindow.NodeFilter;
}

function createDomParser(): DOMParser {
  return new globalsWindow.DOMParser();
}

async function readFixture(filename: string): Promise<string> {
  const absolute = resolve(__dirname, filename);
  return readFile(absolute, "utf8");
}

test("Image handling tests", async (t) => {
  const html = await readFixture("image_test.html");
  
  await t.test("preserve all images (default)", async () => {
    const expected = (await readFixture("expected_markdown_with_images.md")).trim();
    const markdown = convertClipboardPayload(html, undefined, {
      domParser: createDomParser(),
      imageHandling: 'preserve'
    }).trim();

    assert.equal(markdown, expected, "Should preserve all images with default handling");
  });

  await t.test("preserve external images only", async () => {
    const expected = (await readFixture("expected_markdown_external_only.md")).trim();
    const markdown = convertClipboardPayload(html, undefined, {
      domParser: createDomParser(),
      imageHandling: 'preserve-external-only'
    }).trim();

    assert.equal(markdown, expected, "Should only preserve images with http/https URLs");
  });

  await t.test("remove all images", async () => {
    const expected = (await readFixture("expected_markdown_no_images.md")).trim();
    const markdown = convertClipboardPayload(html, undefined, {
      domParser: createDomParser(),
      imageHandling: 'remove'
    }).trim();

    assert.equal(markdown, expected, "Should remove all images");
  });

  await t.test("default behavior without imageHandling option", async () => {
    const expected = (await readFixture("expected_markdown_with_images.md")).trim();
    const markdown = convertClipboardPayload(html, undefined, {
      domParser: createDomParser()
    }).trim();

    assert.equal(markdown, expected, "Should preserve all images by default");
  });
});