import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

import { convertClipboardPayload } from "../src/core/converter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function createDomParser(): any {
  const globalsDom = new JSDOM("<!doctype html><html><body></body></html>");
  const globalsWindow = globalsDom.window;
  return {
    parseFromString: (html: string, type: string) => {
      const dom = new JSDOM(html, { 
        contentType: type === "text/html" ? "text/html" : "application/xml"
      });
      return dom.window.document;
    }
  };
}

async function readFixture(filename: string): Promise<string> {
  const absolute = resolve(__dirname, filename);
  return readFile(absolute, "utf8");
}

test("Raycast Word clipboard capture", async () => {
  const html = await readFixture("raycast-word-capture.html");
  console.log("HTML length:", html.length);
  console.log("HTML preview:", html.substring(0, 500));
  
  const markdown = convertClipboardPayload(html, undefined, {
    domParserAdapter: createDomParser(),
  }).trim();
  
  console.log("Converted markdown:", markdown.substring(0, 500));
  console.log("Full markdown length:", markdown.length);
  
  // Basic validation
  assert.ok(markdown.length > 0, "Should produce non-empty markdown");
  assert.ok(!markdown.includes("@font-face"), "Should not contain CSS");
  assert.ok(!markdown.includes("mso-"), "Should not contain Word CSS properties");
});