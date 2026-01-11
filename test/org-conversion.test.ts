/**
 * Tests for Markdown to Org-mode conversion.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import { convertMarkdownToOrg } from "../src/core/md-to-org.js";

describe("Markdown to Org-mode conversion", () => {
  describe("Headings", () => {
    it("should convert h1 to single asterisk", () => {
      const md = "# Heading 1";
      const org = convertMarkdownToOrg(md);
      assert.strictEqual(org.trim(), "* Heading 1");
    });

    it("should convert h2 to double asterisk", () => {
      const md = "## Heading 2";
      const org = convertMarkdownToOrg(md);
      assert.strictEqual(org.trim(), "** Heading 2");
    });

    it("should convert h3 to triple asterisk", () => {
      const md = "### Heading 3";
      const org = convertMarkdownToOrg(md);
      assert.strictEqual(org.trim(), "*** Heading 3");
    });
  });

  describe("Inline formatting", () => {
    it("should convert bold to asterisks", () => {
      const md = "This is **bold** text";
      const org = convertMarkdownToOrg(md);
      assert.ok(org.includes("*bold*"), `Expected *bold* in: ${org}`);
    });

    it("should convert italic to slashes", () => {
      const md = "This is *italic* text";
      const org = convertMarkdownToOrg(md);
      assert.ok(org.includes("/italic/"), `Expected /italic/ in: ${org}`);
    });

    it("should convert inline code to tildes", () => {
      const md = "Use `code` here";
      const org = convertMarkdownToOrg(md);
      assert.ok(org.includes("~code~"), `Expected ~code~ in: ${org}`);
    });

    it("should convert strikethrough to plus signs", () => {
      const md = "This is ~~deleted~~ text";
      const org = convertMarkdownToOrg(md);
      assert.ok(org.includes("+deleted+"), `Expected +deleted+ in: ${org}`);
    });
  });

  describe("Links", () => {
    it("should convert links to Org format", () => {
      const md = "[Example](https://example.com)";
      const org = convertMarkdownToOrg(md);
      assert.ok(org.includes("[[https://example.com][Example]]"), `Expected Org link in: ${org}`);
    });

    it("should convert bare URLs", () => {
      const md = "Visit https://example.com for more";
      const org = convertMarkdownToOrg(md);
      // autolinks might just pass through
      assert.ok(org.includes("https://example.com"), `Expected URL in: ${org}`);
    });
  });

  describe("Images", () => {
    it("should convert images with alt text to caption + image", () => {
      const md = "![Alt text](https://example.com/image.jpg)";
      const org = convertMarkdownToOrg(md);
      assert.ok(org.includes("#+CAPTION: Alt text"), `Expected caption in: ${org}`);
      assert.ok(org.includes("[[https://example.com/image.jpg]]"), `Expected image link in: ${org}`);
      // Should NOT have the link-with-description syntax
      assert.ok(!org.includes("[[https://example.com/image.jpg][Alt text]]"), 
        `Should not use link syntax for images: ${org}`);
    });

    it("should convert images without alt text", () => {
      const md = "![](https://example.com/image.jpg)";
      const org = convertMarkdownToOrg(md);
      assert.ok(org.includes("[[https://example.com/image.jpg]]"), `Expected image link in: ${org}`);
      assert.ok(!org.includes("#+CAPTION:"), `Should not have caption when no alt: ${org}`);
    });
  });

  describe("Lists", () => {
    it("should convert unordered lists", () => {
      const md = "- Item 1\n- Item 2\n- Item 3";
      const org = convertMarkdownToOrg(md);
      assert.ok(org.includes("- Item 1"), `Expected list items in: ${org}`);
    });

    it("should convert ordered lists", () => {
      const md = "1. First\n2. Second\n3. Third";
      const org = convertMarkdownToOrg(md);
      assert.ok(org.includes("1. First") || org.includes("1) First"), `Expected numbered list in: ${org}`);
    });
  });

  describe("Code blocks", () => {
    it("should convert fenced code blocks", () => {
      const md = "```javascript\nconst x = 1;\n```";
      const org = convertMarkdownToOrg(md);
      assert.ok(org.includes("#+BEGIN_SRC javascript"), `Expected BEGIN_SRC in: ${org}`);
      assert.ok(org.includes("const x = 1;"), `Expected code content in: ${org}`);
      assert.ok(org.includes("#+END_SRC"), `Expected END_SRC in: ${org}`);
    });

    it("should convert code blocks without language", () => {
      const md = "```\nsome code\n```";
      const org = convertMarkdownToOrg(md);
      assert.ok(org.includes("#+BEGIN_SRC"), `Expected BEGIN_SRC in: ${org}`);
      assert.ok(org.includes("#+END_SRC"), `Expected END_SRC in: ${org}`);
    });
  });

  describe("Blockquotes", () => {
    it("should convert blockquotes", () => {
      const md = "> This is a quote";
      const org = convertMarkdownToOrg(md);
      assert.ok(org.includes("#+BEGIN_QUOTE") || org.includes(": This is a quote"), 
        `Expected quote format in: ${org}`);
    });
  });

  describe("Tables (GFM)", () => {
    it("should convert simple tables", () => {
      const md = "| A | B |\n|---|---|\n| 1 | 2 |";
      const org = convertMarkdownToOrg(md);
      assert.ok(org.includes("|"), `Expected table pipes in: ${org}`);
    });
  });

  describe("Horizontal rules", () => {
    it("should convert horizontal rules", () => {
      const md = "Above\n\n---\n\nBelow";
      const org = convertMarkdownToOrg(md);
      assert.ok(org.includes("-----"), `Expected horizontal rule in: ${org}`);
    });
  });

  describe("Complex documents", () => {
    it("should convert a document with mixed content", () => {
      const md = `# Title

This is a paragraph with **bold** and *italic* text.

## Section 1

- Item 1
- Item 2

\`\`\`python
print("hello")
\`\`\`

[Link](https://example.com)
`;
      const org = convertMarkdownToOrg(md);
      
      // Check key conversions
      assert.ok(org.includes("* Title"), "Should have h1");
      assert.ok(org.includes("** Section 1"), "Should have h2");
      assert.ok(org.includes("*bold*"), "Should have bold");
      assert.ok(org.includes("/italic/"), "Should have italic");
      assert.ok(org.includes("- Item 1"), "Should have list");
      assert.ok(org.includes("#+BEGIN_SRC python"), "Should have code block");
      assert.ok(org.includes("[[https://example.com][Link]]"), "Should have link");
    });
  });
});
