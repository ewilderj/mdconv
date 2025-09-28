import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { JSDOM } from "jsdom";

import { convertClipboardPayload } from "../src/converter.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FIXTURES = [
  {
    name: "Word desktop HTML",
    file: "raw_word_app.html",
  },
  {
    name: "Word web HTML",
    file: "raw_word_web.html",
  },
  {
    name: "Google Docs HTML",
    file: "raw_gdocs.html",
  },
  {
    name: "Word clipboard capture (2025-09-27)",
    file: "raw_word_app_ext.html",
  },
/*  {
    name: "Popup clipboard capture (2025-09-27)",
    file: "test3.html",
  }, */
  {
    name: "Example document HTML",
    file: "example_document.html",
  },
];

const globalsDom = new JSDOM("<!doctype html><html><body></body></html>");
const globalsWindow = globalsDom.window;

const globalWithDom = globalThis as typeof globalThis & {
  Node?: typeof globalsWindow.Node;
  NodeFilter?: typeof globalsWindow.NodeFilter;
};

if (!globalWithDom.Node) {
  globalWithDom.Node = globalsWindow.Node;
}
if (!globalWithDom.NodeFilter) {
  globalWithDom.NodeFilter = globalsWindow.NodeFilter;
}

function createDomParser(): DOMParser {
  return new globalsWindow.DOMParser();
}

async function readFixture(filename: string): Promise<string> {
  const absolute = resolve(__dirname, filename);
  return readFile(absolute, "utf8");
}

const expectedMarkdownPromise = readFixture("expected_markdown.md");
const expectedMarkdownWithImagesPromise = readFixture("expected_markdown_image.md");

test("Word HTML fixtures convert to expected Markdown", async (t) => {
  const expectedMarkdown = (await expectedMarkdownPromise).trim();

  await Promise.all(
    FIXTURES.map(async ({ name, file }) => {
      await t.test(name, async () => {
        const html = await readFixture(file);
        const markdown = convertClipboardPayload(html, undefined, {
          domParser: createDomParser(),
        }).trim();

        assert.ok(
          !/\u00a0/.test(markdown),
          `${file} should not contain non-breaking spaces`,
        );

        assert.equal(
          markdown,
          expectedMarkdown,
          `${file} should convert to expected markdown output`,
        );
      });
    }),
  );
});

test("Word HTML with inline images converts to expected Markdown", async () => {
  const [html, expectedMarkdown] = await Promise.all([
    readFixture("raw_word_image.html"),
    expectedMarkdownWithImagesPromise.then((markdown) => markdown.trim()),
  ]);

  const markdown = convertClipboardPayload(html, undefined, {
    domParser: createDomParser(),
  }).trim();

  assert.ok(
    !/\u00a0/.test(markdown),
    "raw_word_image.html should not contain non-breaking spaces",
  );

  assert.equal(
    markdown,
    expectedMarkdown,
    "raw_word_image.html should convert to expected markdown output",
  );
});
