/**
 * Tests for Markdown to Slack mrkdwn conversion.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import { convertMarkdownToSlack } from "../src/core/md-to-slack.js";

describe("Markdown to Slack mrkdwn conversion", () => {
  describe("Headings", () => {
    it("should convert h1 to bold (no header syntax in Slack)", () => {
      const md = "# Heading 1";
      const slack = convertMarkdownToSlack(md);
      assert.strictEqual(slack.trim(), "*Heading 1*");
    });

    it("should convert h2 to bold", () => {
      const md = "## Heading 2";
      const slack = convertMarkdownToSlack(md);
      assert.strictEqual(slack.trim(), "*Heading 2*");
    });

    it("should convert h3 to bold", () => {
      const md = "### Heading 3";
      const slack = convertMarkdownToSlack(md);
      assert.strictEqual(slack.trim(), "*Heading 3*");
    });
  });

  describe("Inline formatting", () => {
    it("should convert bold to single asterisks", () => {
      const md = "This is **bold** text";
      const slack = convertMarkdownToSlack(md);
      assert.ok(slack.includes("*bold*"), `Expected *bold* in: ${slack}`);
    });

    it("should convert italic to underscores", () => {
      const md = "This is *italic* text";
      const slack = convertMarkdownToSlack(md);
      assert.ok(slack.includes("_italic_"), `Expected _italic_ in: ${slack}`);
    });

    it("should convert inline code to backticks", () => {
      const md = "Use `code` here";
      const slack = convertMarkdownToSlack(md);
      assert.ok(slack.includes("`code`"), `Expected \`code\` in: ${slack}`);
    });

    it("should convert strikethrough to single tildes", () => {
      const md = "This is ~~deleted~~ text";
      const slack = convertMarkdownToSlack(md);
      assert.ok(slack.includes("~deleted~"), `Expected ~deleted~ in: ${slack}`);
    });
  });

  describe("Links", () => {
    it("should convert links to text (url) format", () => {
      const md = "[Example](https://example.com)";
      const slack = convertMarkdownToSlack(md);
      assert.ok(slack.includes("Example (https://example.com)"), `Expected text (url) in: ${slack}`);
    });

    it("should preserve bare URLs", () => {
      const md = "Visit https://example.com for more";
      const slack = convertMarkdownToSlack(md);
      assert.ok(slack.includes("https://example.com"), `Expected URL in: ${slack}`);
    });
  });

  describe("Images", () => {
    it("should convert images with alt text to text (url) format", () => {
      const md = "![Alt text](https://example.com/image.jpg)";
      const slack = convertMarkdownToSlack(md);
      assert.ok(slack.includes("Alt text (https://example.com/image.jpg)"), 
        `Expected alt text (url) in: ${slack}`);
    });

    it("should convert images without alt text to just URL", () => {
      const md = "![](https://example.com/image.jpg)";
      const slack = convertMarkdownToSlack(md);
      assert.ok(slack.includes("https://example.com/image.jpg"), `Expected URL in: ${slack}`);
    });
  });

  describe("Lists", () => {
    it("should convert unordered lists with bullet character", () => {
      const md = "- Item 1\n- Item 2\n- Item 3";
      const slack = convertMarkdownToSlack(md);
      assert.ok(slack.includes("• Item 1"), `Expected bullet items in: ${slack}`);
    });

    it("should convert ordered lists", () => {
      const md = "1. First\n2. Second\n3. Third";
      const slack = convertMarkdownToSlack(md);
      assert.ok(slack.includes("1. First"), `Expected numbered list in: ${slack}`);
      assert.ok(slack.includes("2. Second"), `Expected numbered list in: ${slack}`);
    });
  });

  describe("Code blocks", () => {
    it("should convert fenced code blocks (language ignored)", () => {
      const md = "```javascript\nconst x = 1;\n```";
      const slack = convertMarkdownToSlack(md);
      assert.ok(slack.includes("```"), `Expected triple backticks in: ${slack}`);
      assert.ok(slack.includes("const x = 1;"), `Expected code content in: ${slack}`);
      // Language should NOT appear (Slack doesn't support it)
      assert.ok(!slack.includes("javascript"), `Should not include language in: ${slack}`);
    });

    it("should convert code blocks without language", () => {
      const md = "```\nsome code\n```";
      const slack = convertMarkdownToSlack(md);
      assert.ok(slack.includes("```"), `Expected triple backticks in: ${slack}`);
      assert.ok(slack.includes("some code"), `Expected content in: ${slack}`);
    });
  });

  describe("Blockquotes", () => {
    it("should convert blockquotes with > prefix", () => {
      const md = "> This is a quote";
      const slack = convertMarkdownToSlack(md);
      assert.ok(slack.includes(">This is a quote"), `Expected >text format in: ${slack}`);
    });
  });

  describe("Tables (GFM)", () => {
    it("should convert tables to code block", () => {
      const md = "| A | B |\n|---|---|\n| 1 | 2 |";
      const slack = convertMarkdownToSlack(md);
      assert.ok(slack.includes("```"), `Expected code block wrapper in: ${slack}`);
      assert.ok(slack.includes("| A"), `Expected table content in: ${slack}`);
    });
  });

  describe("Horizontal rules", () => {
    it("should convert horizontal rules to dashes", () => {
      const md = "Above\n\n---\n\nBelow";
      const slack = convertMarkdownToSlack(md);
      assert.ok(slack.includes("---"), `Expected dashes in: ${slack}`);
    });
  });

  describe("Character escaping", () => {
    it("should escape ampersand", () => {
      const md = "Tom & Jerry";
      const slack = convertMarkdownToSlack(md);
      assert.ok(slack.includes("&amp;"), `Expected escaped ampersand in: ${slack}`);
    });

    it("should escape less than", () => {
      const md = "3 < 5";
      const slack = convertMarkdownToSlack(md);
      assert.ok(slack.includes("&lt;"), `Expected escaped < in: ${slack}`);
    });

    it("should escape greater than", () => {
      const md = "5 > 3";
      const slack = convertMarkdownToSlack(md);
      assert.ok(slack.includes("&gt;"), `Expected escaped > in: ${slack}`);
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
      const slack = convertMarkdownToSlack(md);
      
      // Check key conversions
      assert.ok(slack.includes("*Title*"), "Should have heading as bold");
      assert.ok(slack.includes("*Section 1*"), "Should have h2 as bold");
      assert.ok(slack.includes("*bold*"), "Should have bold");
      assert.ok(slack.includes("_italic_"), "Should have italic");
      assert.ok(slack.includes("• Item 1"), "Should have bullet list");
      assert.ok(slack.includes("```"), "Should have code block");
      assert.ok(slack.includes("Link (https://example.com)"), "Should have link");
    });
  });

  describe("Edge cases", () => {
    it("should handle empty input", () => {
      assert.strictEqual(convertMarkdownToSlack(""), "");
      assert.strictEqual(convertMarkdownToSlack(null as unknown as string), "");
    });

    it("should handle plain text without formatting", () => {
      const md = "Just plain text";
      const slack = convertMarkdownToSlack(md);
      assert.ok(slack.includes("Just plain text"), `Expected plain text in: ${slack}`);
    });
  });
});
