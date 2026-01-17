/**
 * Tests for format detection and Markdown to HTML conversion.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import { detectInputFormat, getFormatLabel } from "../src/core/format-detection.js";
import { convertMarkdownToHtml, convertPlainTextToHtml, stripYamlFrontMatter } from "../src/core/md-to-html.js";
import { getTargetLabel, HTML_TARGETS } from "../src/core/html-targets.js";

describe("Format detection", () => {
  describe("Markdown detection", () => {
    it("should detect ATX headings", () => {
      assert.strictEqual(detectInputFormat("# Heading"), "markdown");
      assert.strictEqual(detectInputFormat("## Subheading"), "markdown");
      assert.strictEqual(detectInputFormat("###### Level 6"), "markdown");
    });

    it("should detect bold text", () => {
      assert.strictEqual(detectInputFormat("This is **bold** text"), "markdown");
      assert.strictEqual(detectInputFormat("This is __bold__ text"), "markdown");
    });

    it("should detect italic text", () => {
      assert.strictEqual(detectInputFormat("This is *italic* text"), "markdown");
      assert.strictEqual(detectInputFormat("This is _italic_ text"), "markdown");
    });

    it("should detect links", () => {
      assert.strictEqual(detectInputFormat("[link text](https://example.com)"), "markdown");
    });

    it("should detect fenced code blocks", () => {
      assert.strictEqual(detectInputFormat("```\ncode\n```"), "markdown");
      assert.strictEqual(detectInputFormat("~~~\ncode\n~~~"), "markdown");
    });

    it("should detect tables", () => {
      assert.strictEqual(detectInputFormat("| Col1 | Col2 |\n| --- | --- |"), "markdown");
    });

    it("should detect lists", () => {
      assert.strictEqual(detectInputFormat("- Item 1\n- Item 2"), "markdown");
      // * Item is ambiguous but defaults to markdown (more common format)
      assert.strictEqual(detectInputFormat("* Item 1\n* Item 2"), "markdown");
      assert.strictEqual(detectInputFormat("1. First\n2. Second"), "markdown");
    });

    it("should detect blockquotes", () => {
      assert.strictEqual(detectInputFormat("> This is a quote"), "markdown");
    });

    it("should detect inline code", () => {
      assert.strictEqual(detectInputFormat("Use `npm install`"), "markdown");
    });
  });

  describe("Org-mode detection", () => {
    it("should detect Org headings with 2+ asterisks", () => {
      assert.strictEqual(detectInputFormat("** Heading"), "org");
      assert.strictEqual(detectInputFormat("*** Subheading"), "org");
    });

    it("should detect single asterisk as Org heading with other Org signals", () => {
      // Single asterisk followed by space alone is ambiguous (could be MD list or Org heading)
      // Detection requires additional Org signals to confirm it's Org
      // Pure "* Item" defaults to markdown (more common format)
      assert.strictEqual(detectInputFormat("* Item"), "markdown");
      // But with additional Org signals like multi-level headings, it's detected as Org
      assert.strictEqual(detectInputFormat("* Top level\n** Nested"), "org");
    });

    it("should detect Org links with description", () => {
      assert.strictEqual(detectInputFormat("[[https://example.com][Example]]"), "org");
    });

    it("should detect Org links without description", () => {
      assert.strictEqual(detectInputFormat("[[https://example.com]]"), "org");
    });

    it("should detect Org blocks", () => {
      assert.strictEqual(detectInputFormat("#+BEGIN_SRC python\ncode\n#+END_SRC"), "org");
      assert.strictEqual(detectInputFormat("#+BEGIN_QUOTE\nquote\n#+END_QUOTE"), "org");
    });

    it("should detect Org TODO items", () => {
      assert.strictEqual(detectInputFormat("* TODO Task"), "org");
      assert.strictEqual(detectInputFormat("** DONE Completed task"), "org");
    });
  });

  describe("Plain text detection", () => {
    it("should detect plain text with no markup", () => {
      assert.strictEqual(detectInputFormat("Hello world"), "plain");
      assert.strictEqual(detectInputFormat("Just some regular text.\nWith multiple lines."), "plain");
    });

    it("should handle empty input", () => {
      assert.strictEqual(detectInputFormat(""), "plain");
      assert.strictEqual(detectInputFormat("   "), "plain");
    });

    it("should handle null/undefined", () => {
      assert.strictEqual(detectInputFormat(null as unknown as string), "plain");
      assert.strictEqual(detectInputFormat(undefined as unknown as string), "plain");
    });
  });

  describe("Format labels", () => {
    it("should return correct labels", () => {
      assert.strictEqual(getFormatLabel("markdown"), "Markdown");
      assert.strictEqual(getFormatLabel("org"), "Org-mode");
      assert.strictEqual(getFormatLabel("plain"), "Plain text");
    });
  });
});

describe("Markdown to HTML conversion", () => {
  describe("Basic conversion", () => {
    it("should convert headings", () => {
      const html = convertMarkdownToHtml("# Hello World");
      assert.ok(html.includes("<h1"));
      assert.ok(html.includes("Hello World"));
    });

    it("should convert bold text", () => {
      const html = convertMarkdownToHtml("**bold**");
      assert.ok(html.includes("<strong>bold</strong>"));
    });

    it("should convert italic text", () => {
      const html = convertMarkdownToHtml("*italic*");
      assert.ok(html.includes("<em>italic</em>"));
    });

    it("should convert links", () => {
      const html = convertMarkdownToHtml("[Example](https://example.com)");
      assert.ok(html.includes('href="https://example.com"'));
      assert.ok(html.includes("Example"));
    });

    it("should convert code blocks", () => {
      const html = convertMarkdownToHtml("```javascript\nconst x = 1;\n```");
      assert.ok(html.includes("<pre"));
      assert.ok(html.includes("<code"));
    });

    it("should convert inline code", () => {
      const html = convertMarkdownToHtml("Use `npm install`");
      assert.ok(html.includes("<code>npm install</code>"));
    });

    it("should convert lists", () => {
      const html = convertMarkdownToHtml("- Item 1\n- Item 2");
      assert.ok(html.includes("<ul"));
      assert.ok(html.includes("<li"));
    });

    it("should convert tables", () => {
      const html = convertMarkdownToHtml("| A | B |\n|---|---|\n| 1 | 2 |");
      assert.ok(html.includes("<table"));
      assert.ok(html.includes("<th"));
      assert.ok(html.includes("<td"));
    });
  });

  describe("Target-specific styling", () => {
    it("should add styles for Google Docs target", () => {
      const html = convertMarkdownToHtml("# Heading", { target: "google-docs" });
      assert.ok(html.includes("style="));
    });

    it("should add mso styles for Word target", () => {
      const html = convertMarkdownToHtml("# Heading", { target: "word" });
      assert.ok(html.includes("mso-style-name"));
      // Word target also includes xmlns declarations
      assert.ok(html.includes("xmlns:w"));
    });

    it("should produce clean HTML for generic target", () => {
      const html = convertMarkdownToHtml("# Heading", { target: "html" });
      assert.ok(html.includes("<h1>"));
      // Generic HTML should not have inline styles
      assert.ok(!html.includes("style="));
    });
  });

  describe("Handle empty/invalid input", () => {
    it("should return empty string for empty input", () => {
      assert.strictEqual(convertMarkdownToHtml(""), "");
      assert.strictEqual(convertMarkdownToHtml(null as unknown as string), "");
    });
  });

  describe("YAML front matter stripping", () => {
    it("should strip basic YAML front matter", () => {
      const md = `---
title: My Document
date: 2026-01-17
---
# Hello World`;
      const html = convertMarkdownToHtml(md);
      assert.ok(html.includes("Hello World"));
      assert.ok(!html.includes("title:"));
      assert.ok(!html.includes("My Document"));
    });

    it("should strip front matter with ... closing delimiter", () => {
      const md = `---
title: Test
...
Content here`;
      const html = convertMarkdownToHtml(md);
      assert.ok(html.includes("Content here"));
      assert.ok(!html.includes("title:"));
    });

    it("should not strip --- that does not start at beginning", () => {
      const md = `Some text first

---
This is a horizontal rule, not front matter
---`;
      const html = convertMarkdownToHtml(md);
      assert.ok(html.includes("Some text first"));
      // The --- should be converted to <hr> or remain as content
    });

    it("should handle empty front matter", () => {
      const md = `---
---
# Just content`;
      const html = convertMarkdownToHtml(md);
      assert.ok(html.includes("Just content"));
    });

    it("stripYamlFrontMatter should return original if no front matter", () => {
      const md = "# No front matter here";
      assert.strictEqual(stripYamlFrontMatter(md), md);
    });

    it("stripYamlFrontMatter should handle complex front matter", () => {
      const md = `---
title: Complex Example
tags:
  - foo
  - bar
nested:
  key: value
---
Actual content`;
      const result = stripYamlFrontMatter(md);
      assert.strictEqual(result, "Actual content");
    });
  });
});

describe("Plain text to HTML conversion", () => {
  it("should convert plain text to paragraphs", () => {
    const html = convertPlainTextToHtml("Hello world");
    assert.ok(html.includes("<p"));
    assert.ok(html.includes("Hello world"));
  });

  it("should join lines within paragraphs (single newlines become spaces)", () => {
    const html = convertPlainTextToHtml("Line 1\nLine 2");
    // Single newlines are joined, not converted to <br>
    assert.ok(html.includes("Line 1"));
    assert.ok(html.includes("Line 2"));
    // Both should be in the same paragraph
    assert.ok(html.includes("<p>") || html.includes("<p "));
  });

  it("should create separate paragraphs for double newlines", () => {
    const html = convertPlainTextToHtml("Para 1\n\nPara 2");
    const matches = html.match(/<p/g);
    assert.ok(matches && matches.length >= 2);
  });

  it("should strip raw HTML tags for safety", () => {
    // The Markdown processor strips raw HTML with allowDangerousHtml: false
    // Only the safe text content remains
    const html = convertPlainTextToHtml("Hello <script>alert('xss')</script> World");
    assert.ok(!html.includes("<script>"));
    assert.ok(html.includes("Hello"));
    assert.ok(html.includes("World"));
  });

  it("should escape special characters in regular text", () => {
    // Angle brackets and ampersands in regular text are escaped
    const html = convertPlainTextToHtml("A < B & C > D");
    // Less-than is escaped (&#x3C; or &lt;)
    assert.ok(html.includes("&#x3C;") || html.includes("&lt;"));
    // Ampersand is escaped (&#x26; or &amp;)
    assert.ok(html.includes("&#x26;") || html.includes("&amp;"));
  });
});

describe("HTML targets", () => {
  it("should export all targets", () => {
    assert.deepStrictEqual(HTML_TARGETS, ["html", "google-docs", "word"]);
  });

  it("should provide correct labels", () => {
    assert.strictEqual(getTargetLabel("html"), "HTML (Generic)");
    assert.strictEqual(getTargetLabel("google-docs"), "Google Docs");
    assert.strictEqual(getTargetLabel("word"), "Microsoft Word");
  });
});
