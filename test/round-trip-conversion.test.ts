/**
 * Tests for round-trip conversion: HTML → Markdown → target format.
 * Validates the smart clipboard detection path used by "to X" commands
 * when rich text is found on the clipboard.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import { JSDOM } from "jsdom";
import { convertClipboardPayload } from "../src/core/converter.js";
import { convertMarkdownToHtml } from "../src/core/md-to-html.js";
import { convertOrgToHtml } from "../src/core/org-to-html.js";
import { convertMarkdownToSlack } from "../src/core/md-to-slack.js";
import { convertMarkdownToOrg } from "../src/core/md-to-org.js";
import { detectInputFormat } from "../src/core/format-detection.js";
import type { DOMParserAdapter } from "../src/core/adapters/dom-parser.js";
import type { HtmlTarget } from "../src/core/html-targets.js";

// JSDOM-based parser for realistic HTML→Markdown conversion in tests
const jsdom = new JSDOM("<!doctype html><html><body></body></html>");
const jsdomParser: DOMParserAdapter = {
  parseFromString: (html: string) => {
    const dom = new JSDOM(html);
    return dom.window.document as unknown as Document;
  },
};

/**
 * Simulates the round-trip path: HTML clipboard → Markdown → target.
 * This mirrors what getClipboardContent() + the command handler does.
 */
function roundTrip(html: string, target: HtmlTarget): string {
  // Step 1: HTML → Markdown (what getClipboardContent does)
  const markdown = convertClipboardPayload(html, undefined, {
    domParserAdapter: jsdomParser,
  });

  // Step 2: Markdown → target HTML (what the command handler does)
  return convertMarkdownToHtml(markdown, { target });
}

describe("Round-trip conversion (HTML → Markdown → target)", () => {
  describe("Structural preservation", () => {
    it("should preserve headings through round-trip", () => {
      const html = "<h1>Title</h1><h2>Subtitle</h2><p>Body text</p>";
      const result = roundTrip(html, "google-docs");
      assert(result.includes("Title"), "Should preserve heading text");
      assert(result.includes("Subtitle"), "Should preserve subheading text");
      assert(result.includes("Body text"), "Should preserve body text");
    });

    it("should preserve bold and italic through round-trip", () => {
      const html = "<p>This is <strong>bold</strong> and <em>italic</em> text</p>";
      const result = roundTrip(html, "html");
      assert(result.includes("<strong>bold</strong>"), "Should preserve bold");
      assert(result.includes("<em>italic</em>"), "Should preserve italic");
    });

    it("should preserve links through round-trip", () => {
      const html = '<p>Visit <a href="https://example.com">Example</a></p>';
      const result = roundTrip(html, "html");
      assert(result.includes("https://example.com"), "Should preserve link URL");
      assert(result.includes("Example"), "Should preserve link text");
    });

    it("should preserve lists through round-trip", () => {
      const html = "<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>";
      const result = roundTrip(html, "html");
      assert(result.includes("Item 1"), "Should preserve list items");
      assert(result.includes("Item 2"), "Should preserve list items");
      assert(result.includes("<li>"), "Should produce list HTML");
    });

    it("should preserve code blocks through round-trip", () => {
      const html = '<pre><code>const x = 1;</code></pre>';
      const result = roundTrip(html, "html");
      assert(result.includes("const x = 1;"), "Should preserve code content");
    });
  });

  describe("Target-specific output", () => {
    const testHtml = "<h1>Title</h1><p>A <strong>bold</strong> paragraph.</p>";

    it("should produce Google Docs styled output", () => {
      const result = roundTrip(testHtml, "google-docs");
      assert(result.includes("font-size"), "Google Docs should have inline styles");
      assert(result.includes('meta charset="utf-8"'), "Google Docs should have charset meta");
    });

    it("should produce Word styled output", () => {
      const result = roundTrip(testHtml, "word");
      assert(result.includes("mso-style-name"), "Word should have MSO styles");
      assert(result.includes("urn:schemas-microsoft-com:office"), "Word should have xmlns");
    });

    it("should produce clean generic HTML", () => {
      const result = roundTrip(testHtml, "html");
      assert(result.includes("<h1>"), "Generic HTML should have clean tags");
      assert(!result.includes("mso-style-name"), "Generic HTML should not have MSO styles");
    });
  });

  describe("Round-trip to Slack", () => {
    it("should convert rich text to Slack mrkdwn via Markdown", () => {
      const html = "<h1>Title</h1><p>A <strong>bold</strong> paragraph.</p>";
      const markdown = convertClipboardPayload(html, undefined, {
        domParserAdapter: jsdomParser,
      });
      const slack = convertMarkdownToSlack(markdown);
      assert(slack.includes("*Title*"), "Slack should have bold heading");
      assert(slack.includes("*bold*"), "Slack should have bold text");
    });

    it("should convert rich text lists to Slack format", () => {
      const html = "<ul><li>First</li><li>Second</li></ul>";
      const markdown = convertClipboardPayload(html, undefined, {
        domParserAdapter: jsdomParser,
      });
      const slack = convertMarkdownToSlack(markdown);
      assert(slack.includes("First"), "Should preserve list items");
      assert(slack.includes("Second"), "Should preserve list items");
    });
  });

  describe("Round-trip to Org-mode", () => {
    it("should convert rich text to Org via Markdown", () => {
      const html = "<h1>Title</h1><p>A <strong>bold</strong> paragraph.</p>";
      const markdown = convertClipboardPayload(html, undefined, {
        domParserAdapter: jsdomParser,
      });
      const org = convertMarkdownToOrg(markdown);
      assert(org.includes("* Title"), "Org should have heading with stars");
      assert(org.includes("*bold*"), "Org should have bold markup");
    });
  });

  describe("Format detection after round-trip", () => {
    it("should detect round-tripped content as Markdown", () => {
      const html = "<h1>Title</h1><p>Some <strong>content</strong></p>";
      const markdown = convertClipboardPayload(html, undefined, {
        domParserAdapter: jsdomParser,
      });
      assert.strictEqual(detectInputFormat(markdown), "markdown",
        "Round-tripped content should be detected as Markdown");
    });
  });

  describe("Complex document round-trip", () => {
    it("should handle a realistic document with mixed elements", () => {
      const html = `
        <h1>Project Overview</h1>
        <p>This project has <strong>two phases</strong>:</p>
        <ol>
          <li>Phase 1: <em>Research</em></li>
          <li>Phase 2: <strong>Implementation</strong></li>
        </ol>
        <h2>Details</h2>
        <p>See <a href="https://example.com/docs">the documentation</a> for more info.</p>
        <blockquote><p>Important note about the project.</p></blockquote>
      `;
      const result = roundTrip(html, "google-docs");
      assert(result.includes("Project Overview"), "Should preserve title");
      assert(result.includes("Phase 1"), "Should preserve list items");
      assert(result.includes("Phase 2"), "Should preserve list items");
      assert(result.includes("Details"), "Should preserve subheading");
      assert(result.includes("https://example.com/docs"), "Should preserve links");
    });

    it("should handle Word-style HTML with spans and inline styles", () => {
      const html = `
        <p style="mso-style-name:'Heading 1'"><span style="font-weight:bold">Word Title</span></p>
        <p><span style="font-family:'Calibri'">Normal paragraph in Word.</span></p>
      `;
      const result = roundTrip(html, "word");
      assert(result.includes("Word Title"), "Should extract Word heading text");
      assert(result.includes("Normal paragraph"), "Should extract Word body text");
    });

    it("should handle Google Docs HTML", () => {
      const html = `
        <p><span style="font-size:20pt">Google Title</span></p>
        <p><span style="font-weight:700">Bold text</span> and normal text.</p>
      `;
      const result = roundTrip(html, "google-docs");
      assert(result.includes("Google Title"), "Should extract GDocs heading text");
      assert(result.includes("normal text"), "Should extract GDocs body text");
    });
  });

  describe("Edge cases", () => {
    it("should handle empty HTML gracefully", () => {
      const markdown = convertClipboardPayload("", undefined, {
        domParserAdapter: jsdomParser,
      });
      assert.strictEqual(markdown, "", "Empty HTML should produce empty Markdown");
    });

    it("should handle whitespace-only HTML", () => {
      const markdown = convertClipboardPayload("   ", undefined, {
        domParserAdapter: jsdomParser,
      });
      assert.strictEqual(markdown.trim(), "", "Whitespace HTML should produce empty result");
    });

    it("should handle HTML with only text (no tags)", () => {
      const markdown = convertClipboardPayload("Just plain text copied from somewhere", undefined, {
        domParserAdapter: jsdomParser,
      });
      assert(markdown.includes("Just plain text"), "Should preserve text content");
    });
  });
});
