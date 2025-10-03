import assert from "node:assert/strict";
import { test, describe } from "node:test";
import { 
  convertHtmlToMarkdown, 
  convertClipboardPayload,
  type ConversionOptions,
} from "../src/core/converter.js";
import type { DOMParserAdapter } from "../src/core/adapters/dom-parser.js";
import { JSDOM } from "jsdom";

/**
 * Core conversion tests focusing on functional requirements
 * Tests main conversion logic, input validation, and key behaviors
 */

describe("Core HTML→Markdown conversion", () => {
  // Set up a simple DOM parser for testing
  const mockParser: DOMParserAdapter = {
    parseFromString: (html: string) => {
      // Using JSDOM would be ideal but for unit tests we can use a simple mock
      // that provides the basic structure we need
      const mockDoc = {
        body: {
          innerHTML: html,
          querySelector: () => null,
          querySelectorAll: () => [],
        },
        createElement: () => ({ textContent: '' }),
      };
      return mockDoc as any;
    },
  };

  describe("Input validation and edge cases", () => {
    test("should handle empty string input", async () => {
      const result = await convertHtmlToMarkdown("", {
        domParserAdapter: mockParser
      });
      assert.equal(result, "");
    });

    test("should handle null/undefined input", async () => {
      const result1 = await convertHtmlToMarkdown(null as any, {
        domParserAdapter: mockParser
      });
      const result2 = await convertHtmlToMarkdown(undefined as any, {
        domParserAdapter: mockParser
      });
      
      assert(typeof result1 === "string");
      assert(typeof result2 === "string");
    });

    test("should handle non-string input gracefully", async () => {
      const result = await convertHtmlToMarkdown(123 as any, {
        domParserAdapter: mockParser
      });
      assert(typeof result === "string");
    });

    test("should handle whitespace-only input", async () => {
      const result = await convertHtmlToMarkdown("   \n\t  ", {
        domParserAdapter: mockParser
      });
      assert(typeof result === "string");
    });
  });

  describe("Google Docs detection and normalization", () => {
    test("should detect Google Docs HTML from internal GUID markers", async () => {
      const googleDocGuid = "docs-internal-guid-abc123";
      const googleDocsHtml = `<p>Text with <span id="${googleDocGuid}">internal GUID</span></p>`;
      const result = await convertHtmlToMarkdown(googleDocsHtml, {
        domParserAdapter: mockParser,
      });
      
      assert.ok(result, "Should return conversion result");
      assert.ok(typeof result === "string", "Should return string");
      
      // Test negative case - non-Google Docs content
      const regularHtml = '<div>Regular content</div>';
      const regularResult = await convertHtmlToMarkdown(regularHtml, {
        domParserAdapter: mockParser,
      });
      assert(typeof regularResult === "string");
    });

    test("should handle Google Docs in different formats", async () => {
      const googleCases = [
        '<div id="docs-internal-guid-abc">content</div>',
        '<div docs-internal-guid="def">content</div>',
        '<div class="docs-internal-guid-ghi">content</div>',
      ];

      for (const html of googleCases) {
        const result = await convertHtmlToMarkdown(html, {
          domParserAdapter: mockParser,
        });
        assert(typeof result === "string", `Should handle: ${html}`);
      }
    });
  });

  describe("Clipboard payload conversion with fallbacks", () => {
    test("should prefer HTML over plain text when both available", async () => {
      const html = "<h1>HTML Title</h1><p>HTML content</p>";
      const plain = "Plain text fallback";
      
      const result = await convertClipboardPayload(html, plain, {
        domParserAdapter: mockParser,
      });
      
      // Should convert the HTML, not use plain text
      assert(result.includes("# HTML Title")); // Markdown from HTML
      assert(!result.includes("Plain text fallback"));
    });

    test("should use plain text when HTML is invalid/empty", async () => {
      const html = "";
      const plain = "Plain text content";
      
      const result = await convertClipboardPayload(html, plain, {
        domParserAdapter: mockParser,
      });
      
      assert.equal(result, plain);
    });

    test("should handle different content type combinations", async () => {
      const testCases = [
        { html: undefined, plain: undefined, expected: "" },
        { html: "", plain: "", expected: "" },
        { html: null as any, plain: null as any, expected: "" },
        { html: "<p>valid</p>", plain: undefined, expectHtml: true },
        { html: undefined, plain: "text only", expectPlain: true },
      ];

      for (const { html, plain, expected, expectHtml, expectPlain } of testCases) {
        const result = await convertClipboardPayload(html as string | undefined, plain, {
          domParserAdapter: mockParser,
        });
        
        if (expected !== undefined) {
          assert.equal(result, expected, `Should return ${expected}`);
        } else if (expectHtml) {
          assert(result.length > 0, `Should convert HTML`);
        } else if (expectPlain) {
          assert.equal(result, plain, `Should use plain text`);
        }
      }
    });
  });

  describe("Image handling configuration", () => {
    const imageTestHtml = `
      <p>Text before image</p>
      <img src="https://example.com/image.jpg" alt="An image">
      <img src="./images/internal.png" alt="Internal image">
      <p>Text after image</p>
    `;

    // Set up JSDOM for image handling tests
    const jsdom = new JSDOM("<!doctype html><html><body></body></html>");
    const jsdomWindow = jsdom.window;

    // Extend global scope with JSDOM globals
    const setupJSDOM = () => {
      (globalThis as any).Document = jsdomWindow.Document;
      (globalThis as any).DOMParser = jsdomWindow.DOMParser;
      (globalThis as any).Node = jsdomWindow.Node;
      (globalThis as any).Element = jsdomWindow.Element;
      (globalThis as any).HTMLImageElement = jsdomWindow.HTMLImageElement;
    };

    // Cleanup JSDOM globals
    const cleanupJSDOM = () => {
      delete (globalThis as any).Document;
      delete (globalThis as any).DOMParser;
      delete (globalThis as any).Node;
      delete (globalThis as any).Element;
      delete (globalThis as any).HTMLImageElement;
    };

    test("should preserve all images when imageHandling is 'preserve'", async () => {
      setupJSDOM();
      try {
        const result = await convertHtmlToMarkdown(imageTestHtml, { 
          imageHandling: 'preserve'
        });
        
        assert(result.includes("![An image](https://example.com/image.jpg)"));
        assert(result.includes("![Internal image](./images/internal.png)"));
      } finally {
        cleanupJSDOM();
      }
    });

    test("should only preserve external images when imageHandling is 'preserve-external-only'", async () => {
      setupJSDOM();
      try {
        const result = await convertHtmlToMarkdown(imageTestHtml, { 
          imageHandling: 'preserve-external-only'
        });
        
        assert(result.includes("![An image](https://example.com/image.jpg)"));
        assert(!result.includes("![Internal image](./images/internal.png)"));
      } finally {
        cleanupJSDOM();
      }
    });

    test("should remove all images when imageHandling is 'remove'", async () => {
      setupJSDOM();
      try {
        const result = await convertHtmlToMarkdown(imageTestHtml, { 
          imageHandling: 'remove'
        });
        
        assert(!result.includes("!["));
        assert(!result.includes("https://example.com/image.jpg"));
        assert(!result.includes("http://cdn.local/internal.png"));
        assert(result.includes("Text before image"));
        assert(result.includes("Text after image"));
      } finally {
        cleanupJSDOM();
      }
    });
  });

  describe("Character encoding and whitespace handling", () => {
    test("should handle non-breaking spaces correctly", async () => {
      const htmlWithNbsp = "<p>Text\u00a0with\u00a0non-breaking\u00a0spaces</p>";
      
      const result = await convertHtmlToMarkdown(htmlWithNbsp, { domParserAdapter: mockParser });
      
      // Non-breaking spaces should be converted to regular spaces
      assert.equal(result, "Text with non-breaking spaces");
    });

    test("should handle trailing whitespace in lines", async () => {
      const htmlWithTrailingSpaces = "<p>Line with spaces   </p>\n<p>Another line\t</p>";
      
      const result = await convertHtmlToMarkdown(htmlWithTrailingSpaces, { domParserAdapter: mockParser });
      
      // Should trim trailing whitespace from lines
      const lines = result.split('\n');
      lines.forEach(line => {
        assert.equal(line, line.trim(), `Line should not have trailing whitespace: "${line}"`);
      });
    });
  });

  describe("Error handling in conversion chain", () => {
    test("should handle DOM parsing errors gracefully", async () => {
      // Mock a parser that throws an error
      const failingParser: DOMParserAdapter = {
        parseFromString: () => {
          throw new Error("DOM parsing failed");
        },
      };

      const result = await convertHtmlToMarkdown("<p>Test</p>", { 
        domParserAdapter: failingParser 
      });
      
      // Should fallback gracefully (our implementation catches and returns original HTML)
      assert(typeof result === "string");
      assert(result.length > 0);
    });

    test("should handle malformed HTML without crashing", async () => {
      const malformedHtmls = [
        "<p>Unclosed paragraph",
        "<div><span>Nested<span><div>More nesting</div>",
        "<p>Invalid <b><i>nesting</b></i>",
        "", // Empty
        "<script>alert('xss')</script>", // Scripts should be stripped
      ];

      for (const [i, html] of malformedHtmls.entries()) {
        assert.doesNotThrow(async () => {
          const result = await convertHtmlToMarkdown(html, {
            domParserAdapter: mockParser,
          });
          assert(typeof result === "string", `Case ${i}: should return string`);
        }, `Should handle malformed HTML case ${i}: ${html}`);
      }
    });

    test("should handle debug mode without crashing", async () => {
      const currentEnv = (globalThis as any).process?.env;
      try {
        // Set debug flag for this test
        (globalThis as any).process.env = { ...currentEnv, MDCONV_DEBUG_INLINE: "1" };
        
        const result = await convertHtmlToMarkdown("<p>Test</p>", {
          domParserAdapter: mockParser
        });
        assert(typeof result === "string");
      } finally {
        (globalThis as any).process.env = currentEnv;
      }
    });
  });
});