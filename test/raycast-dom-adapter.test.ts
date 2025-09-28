import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

import { convertHtmlToMarkdown } from "../src/core/converter.js";
import { RaycastDOMParserAdapter } from "../src/platforms/raycast/adapters/raycast-dom-parser.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function readFixture(filename: string): Promise<string> {
  const absolute = resolve(__dirname, filename);
  return readFile(absolute, "utf8");
}

function createRaycastDomParser(): RaycastDOMParserAdapter {
  return new RaycastDOMParserAdapter();
}

test("Raycast DOM adapter", async (t) => {
  const domAdapter = createRaycastDomParser();

  await t.test("converts HTML to Markdown using Raycast adapters", async () => {
    const html = "<p><strong>Bold text</strong> and <em>italic text</em></p>";
    const markdown = convertHtmlToMarkdown(html, {
      domParserAdapter: domAdapter
    });
    
    assert.equal(markdown.trim(), "**Bold text** and _italic text_");
  });

  await t.test("handles Word HTML fixture with Raycast DOM adapter", async () => {
    const html = await readFixture("raw_word_app.html");
    const markdown = convertHtmlToMarkdown(html, {
      domParserAdapter: domAdapter
    });
    
    // Should convert without errors and produce non-empty result
    assert.ok(markdown.length > 0, "Should produce non-empty markdown");
    assert.ok(!markdown.includes("\u00a0"), "Should not contain non-breaking spaces");
  });

  await t.test("handles image processing options with Raycast DOM adapter", async () => {
    const html = '<p>Text with <img src="https://example.com/image.png" alt="test image"> image</p>';
    
    const withImages = convertHtmlToMarkdown(html, { 
      domParserAdapter: domAdapter,
      imageHandling: 'preserve' 
    });
    const withoutImages = convertHtmlToMarkdown(html, { 
      domParserAdapter: domAdapter,
      imageHandling: 'remove' 
    });
    
    assert.ok(withImages.includes("![test image]"), "Should preserve images when requested");
    assert.ok(!withoutImages.includes("!["), "Should remove images when requested");
  });
});