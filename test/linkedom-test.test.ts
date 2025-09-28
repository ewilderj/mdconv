import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import { RaycastDOMParserAdapter } from "../src/platforms/raycast/adapters/raycast-dom-parser.js";
import { convertClipboardPayload } from "../src/core/converter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test("linkedom DOM parser works with captured Word HTML", async () => {
  const wordHtmlPath = resolve(__dirname, "raycast-word-capture.html");
  const wordHtml = await readFile(wordHtmlPath, "utf8");

  const domParser = new RaycastDOMParserAdapter();
  const result = convertClipboardPayload(wordHtml, undefined, {
    domParserAdapter: domParser,
    imageHandling: "remove",
  });

  assert.ok(result.includes("**Bold text**"), "Should contain bold text");
  assert.ok(result.includes("_Italic text_"), "Should contain italic text");
  assert.ok(result.includes("# Heading 1"), "Should contain heading 1");
  assert.ok(result.includes("## Heading 2"), "Should contain heading 2");
  assert.ok(result.includes("* First"), "Should contain bulleted list");
  assert.ok(result.includes("1. Fee"), "Should contain numbered list");
  assert.ok(result.includes("`monospace should`"), "Should contain inline code");
  assert.ok(result.includes("[link](https://github.com/)"), "Should contain links");
  assert.ok(result.includes("```"), "Should contain code blocks");

  assert.ok(!result.includes("@font-face"), "Should not contain CSS font definitions");
  assert.ok(!result.includes("mso-"), "Should not contain Word CSS properties");
});