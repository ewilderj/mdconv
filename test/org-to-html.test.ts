/**
 * Tests for Org-mode to HTML conversion.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import { convertOrgToHtml } from "../src/core/org-to-html.js";
import { detectInputFormat } from "../src/core/format-detection.js";

describe("Org-mode format detection", () => {
  it("should detect single asterisk heading with additional Org signals", () => {
    // Single '* Heading' alone is ambiguous - defaults to markdown
    assert.strictEqual(detectInputFormat("* Heading"), "markdown");
    // But with Org-specific signals like multi-level headings, it's Org
    assert.strictEqual(detectInputFormat("* Top\n** Nested"), "org");
  });

  it("should detect multi-level headings", () => {
    assert.strictEqual(detectInputFormat("** Second level"), "org");
    assert.strictEqual(detectInputFormat("*** Third level"), "org");
  });

  it("should detect #+BEGIN_SRC blocks", () => {
    const org = `#+BEGIN_SRC python
print("hello")
#+END_SRC`;
    assert.strictEqual(detectInputFormat(org), "org");
  });

  it("should detect #+BEGIN_QUOTE blocks", () => {
    const org = `#+BEGIN_QUOTE
A wise saying
#+END_QUOTE`;
    assert.strictEqual(detectInputFormat(org), "org");
  });

  it("should detect Org links with description", () => {
    assert.strictEqual(detectInputFormat("[[https://example.com][Example]]"), "org");
  });

  it("should detect Org links without description", () => {
    assert.strictEqual(detectInputFormat("[[https://example.com]]"), "org");
  });

  it("should detect TODO items", () => {
    assert.strictEqual(detectInputFormat("* TODO Some task"), "org");
    assert.strictEqual(detectInputFormat("** TODO Another task"), "org");
  });

  it("should detect DONE items", () => {
    assert.strictEqual(detectInputFormat("* DONE Completed task"), "org");
  });

  it("should detect Org tables with + separators", () => {
    const org = `| foo | bar |
|-----+-----|
| 1   | 2   |`;
    assert.strictEqual(detectInputFormat(org), "org");
  });

  it("should detect complex Org document", () => {
    const org = `* Telling Keysmith to copy to the clipboard
Funny thing is that ⌘C doesn't get activated.

#+BEGIN_SRC txt
tell application "System Events"
end tell
#+END_SRC

| www foo  | bar |
|----------+-----|
| antelope | mgr |`;
    assert.strictEqual(detectInputFormat(org), "org");
  });
});

describe("Org-mode to HTML conversion", () => {
  describe("Headings", () => {
    it("should convert level 1 heading", () => {
      const html = convertOrgToHtml("* Hello World");
      assert.ok(html.includes("<h1"));
      assert.ok(html.includes("Hello World"));
    });

    it("should convert level 2 heading", () => {
      const html = convertOrgToHtml("** Second Level");
      assert.ok(html.includes("<h2"));
      assert.ok(html.includes("Second Level"));
    });

    it("should convert level 3 heading", () => {
      const html = convertOrgToHtml("*** Third Level");
      assert.ok(html.includes("<h3"));
    });
  });

  describe("Inline formatting", () => {
    it("should convert bold text", () => {
      const html = convertOrgToHtml("This is *bold* text");
      assert.ok(html.includes("<strong>bold</strong>"));
    });

    it("should convert italic text", () => {
      const html = convertOrgToHtml("This is /italic/ text");
      assert.ok(html.includes("<em>italic</em>"));
    });

    it("should convert inline code with tilde", () => {
      const html = convertOrgToHtml("Use ~npm install~");
      assert.ok(html.includes("<code"));
      assert.ok(html.includes("npm install"));
    });

    it("should convert inline code with equals", () => {
      const html = convertOrgToHtml("Use =npm install=");
      assert.ok(html.includes("<code"));
      assert.ok(html.includes("npm install"));
    });

    it("should convert strikethrough", () => {
      const html = convertOrgToHtml("This is +deleted+ text");
      assert.ok(html.includes("<del>deleted</del>"));
    });

    it("should convert underline", () => {
      const html = convertOrgToHtml("This is _underlined_ text");
      assert.ok(html.includes("<u>underlined</u>"));
    });
  });

  describe("Links", () => {
    it("should convert link with description", () => {
      const html = convertOrgToHtml("[[https://example.com][Example]]");
      assert.ok(html.includes('<a href="https://example.com"'));
      assert.ok(html.includes(">Example</a>"));
    });

    it("should convert link without description", () => {
      const html = convertOrgToHtml("[[https://example.com]]");
      assert.ok(html.includes('<a href="https://example.com"'));
      assert.ok(html.includes(">https://example.com</a>"));
    });
  });

  describe("Code blocks", () => {
    it("should convert code blocks", () => {
      const org = `#+BEGIN_SRC python
print("hello")
#+END_SRC`;
      const html = convertOrgToHtml(org);
      assert.ok(html.includes("<pre"));
      assert.ok(html.includes("<code"));
      assert.ok(html.includes("print"));
    });

    it("should escape HTML in code blocks", () => {
      const org = `#+BEGIN_SRC html
<div>content</div>
#+END_SRC`;
      const html = convertOrgToHtml(org);
      assert.ok(html.includes("&lt;div&gt;"));
    });
  });

  describe("Lists", () => {
    it("should convert unordered lists with -", () => {
      const org = `- Item 1
- Item 2`;
      const html = convertOrgToHtml(org);
      assert.ok(html.includes("<ul"));
      assert.ok(html.includes("<li"));
      assert.ok(html.includes("Item 1"));
    });

    it("should convert unordered lists with +", () => {
      const org = `+ Item 1
+ Item 2`;
      const html = convertOrgToHtml(org);
      assert.ok(html.includes("<ul"));
    });

    it("should convert ordered lists", () => {
      const org = `1. First
2. Second`;
      const html = convertOrgToHtml(org);
      assert.ok(html.includes("<ol"), "Should use <ol> for ordered lists");
      assert.ok(html.includes("</ol>"), "Should close <ol> tag");
      assert.ok(html.includes("First"));
    });
  });

  describe("Tables", () => {
    it("should convert simple table", () => {
      const org = `| foo | bar |
|-----+-----|
| 1   | 2   |`;
      const html = convertOrgToHtml(org);
      assert.ok(html.includes("<table"));
      assert.ok(html.includes("<tr"));
      assert.ok(html.includes("<td"));
      assert.ok(html.includes("foo"));
    });

    it("should skip separator rows", () => {
      const org = `| a | b |
|---+---|
| 1 | 2 |`;
      const html = convertOrgToHtml(org);
      // Should not contain the separator row as content
      assert.ok(!html.includes("---+---"));
    });
  });

  describe("Target-specific styling", () => {
    it("should add Word styles", () => {
      const html = convertOrgToHtml("* Heading", { target: "word" });
      assert.ok(html.includes("mso-"));
    });

    it("should add Google Docs styles", () => {
      const html = convertOrgToHtml("* Heading", { target: "google-docs" });
      assert.ok(html.includes("font-size"));
    });

    it("should produce clean HTML for generic target", () => {
      const html = convertOrgToHtml("* Heading", { target: "html" });
      assert.ok(html.includes("<h1>"));
    });
  });

  describe("Complex documents", () => {
    it("should convert the user's example document", () => {
      const org = `* Telling Keysmith to copy to the clipboard
Funny thing is that ⌘C doesn't get activated. Here's the Apple Script that does the copy

#+BEGIN_SRC txt
tell application "System Events"
	set frontApp to name of first application process whose frontmost is true
end tell
#+END_SRC

| www foo  | bar | han    |
|----------+-----+--------|
| antelope | mgr | boobah |`;

      const html = convertOrgToHtml(org);
      assert.ok(html.includes("<h1"), "Should have h1 for level 1 heading");
      assert.ok(html.includes("Telling Keysmith"), "Should include heading text");
      assert.ok(html.includes("<pre"), "Should have pre for code block");
      assert.ok(html.includes("tell application"), "Should include code content");
      assert.ok(html.includes("<table"), "Should have table");
      assert.ok(html.includes("antelope"), "Should include table content");
    });
  });

  describe("Edge cases", () => {
    it("should handle empty input", () => {
      assert.strictEqual(convertOrgToHtml(""), "");
      assert.strictEqual(convertOrgToHtml(null as unknown as string), "");
    });

    it("should escape HTML in regular text", () => {
      const html = convertOrgToHtml("Use <script> tags carefully");
      assert.ok(html.includes("&lt;script&gt;"));
    });
  });
});
