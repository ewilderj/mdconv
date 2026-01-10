import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { test, describe } from "node:test";
import { JSDOM } from "jsdom";

import { convertClipboardPayload } from "../src/core/converter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Table conversion tests for GFM pipe table support.
 * Tests the turndown-plugin-gfm integration and header normalization.
 */

// Set up JSDOM globals for DOM parsing
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

const TABLE_FIXTURES = [
  {
    name: "Semantic table with thead/th",
    html: "table_semantic.html",
    expected: "expected_markdown_table_semantic.md",
  },
  {
    name: "Bold header row (Word/Google Docs style)",
    html: "table_bold_header.html",
    expected: "expected_markdown_table_bold_header.md",
  },
  {
    name: "Table with alignment",
    html: "table_alignment.html",
    expected: "expected_markdown_table_alignment.md",
  },
  {
    name: "Table with empty cells",
    html: "table_empty_cells.html",
    expected: "expected_markdown_table_empty_cells.md",
  },
  {
    name: "Font-weight styled headers",
    html: "table_styled_header.html",
    expected: "expected_markdown_table_styled_header.md",
  },
  {
    name: "Strong element headers",
    html: "table_strong_header.html",
    expected: "expected_markdown_table_strong_header.md",
  },
  {
    name: "Google Docs table with bold headers",
    html: "table_gdoc_simple.html",
    expected: "expected_markdown_table_gdoc_simple.md",
  },
  {
    name: "Word web table with bold headers",
    html: "table_word_web_simple.html",
    expected: "expected_markdown_table_word_web_simple.md",
  },
  {
    name: "Word app table with bold headers",
    html: "table_word_app_simple.html",
    expected: "expected_markdown_table_word_app_simple.md",
  },
];

describe("Table conversion to GFM Markdown", () => {
  for (const { name, html, expected } of TABLE_FIXTURES) {
    test(name, async () => {
      const [htmlContent, expectedMarkdown] = await Promise.all([
        readFixture(html),
        readFixture(expected).then((md) => md.trim()),
      ]);

      const markdown = convertClipboardPayload(htmlContent, undefined, {
        domParserAdapter: createDomParser(),
      }).trim();

      assert.equal(
        markdown,
        expectedMarkdown,
        `${html} should convert to expected GFM table format`,
      );
    });
  }

  test("Table without headers is preserved as HTML", async () => {
    const [htmlContent, expectedMarkdown] = await Promise.all([
      readFixture("table_no_header.html"),
      readFixture("expected_markdown_table_no_header.md").then((md) => md.trim()),
    ]);

    const markdown = convertClipboardPayload(htmlContent, undefined, {
      domParserAdapter: createDomParser(),
    }).trim();

    // Tables without valid headers should be preserved as HTML
    assert.ok(
      markdown.includes("<table>") || markdown.includes("<tbody>"),
      "Table without headers should be preserved as HTML",
    );

    assert.equal(
      markdown,
      expectedMarkdown,
      "table_no_header.html should preserve table as HTML",
    );
  });
});

describe("Table header normalization", () => {
  test("Should not double-process tables with existing th elements", async () => {
    const html = `
      <table>
        <thead>
          <tr><th><b>Already Bold TH</b></th><th>Plain TH</th></tr>
        </thead>
        <tbody>
          <tr><td>Data 1</td><td>Data 2</td></tr>
        </tbody>
      </table>
    `;

    const markdown = convertClipboardPayload(html, undefined, {
      domParserAdapter: createDomParser(),
    }).trim();

    // Should produce a valid table without duplicated bold markers
    assert.ok(
      markdown.includes("|"),
      "Should produce pipe table format",
    );
    assert.ok(
      !markdown.includes("****"),
      "Should not have doubled bold markers",
    );
  });

  test("Should handle mixed bold/non-bold first row gracefully", async () => {
    // Only some cells are bold - should NOT be converted to header
    const html = `
      <table>
        <tr>
          <td><b>Bold Cell</b></td>
          <td>Plain Cell</td>
          <td><b>Bold Cell</b></td>
        </tr>
        <tr>
          <td>Data 1</td>
          <td>Data 2</td>
          <td>Data 3</td>
        </tr>
      </table>
    `;

    const markdown = convertClipboardPayload(html, undefined, {
      domParserAdapter: createDomParser(),
    }).trim();

    // Since not all cells are bold, it should be kept as HTML
    assert.ok(
      markdown.includes("<table>") || markdown.includes("<tbody>"),
      "Partially bold row should not be promoted to header",
    );
  });

  test("Should handle span with bold style in header detection", async () => {
    const html = `
      <table>
        <tr>
          <td><span style="font-weight: bold;">Header 1</span></td>
          <td><span style="font-weight: 700;">Header 2</span></td>
        </tr>
        <tr>
          <td>Data 1</td>
          <td>Data 2</td>
        </tr>
      </table>
    `;

    const markdown = convertClipboardPayload(html, undefined, {
      domParserAdapter: createDomParser(),
    }).trim();

    assert.ok(
      markdown.includes("| Header 1 | Header 2 |"),
      "Should detect bold spans and convert to GFM table",
    );
    assert.ok(
      markdown.includes("| --- | --- |"),
      "Should have separator row",
    );
  });
});
