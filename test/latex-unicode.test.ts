import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";

import { convertClipboardPayload } from "../src/core/converter.js";
import { convertLatexToUnicode, convertLatexInText, looksLikeLatex } from "../src/core/latex-unicode.js";
import { convertMarkdownToHtml } from "../src/core/md-to-html.js";

const globalsDom = new JSDOM("<!doctype html><html><body></body></html>");
const globalsWindow = globalsDom.window;

const extendedGlobal = globalThis as typeof globalThis & {
  Node?: typeof globalsWindow.Node;
  NodeFilter?: typeof globalsWindow.NodeFilter;
};

if (!extendedGlobal.Node) {
  extendedGlobal.Node = globalsWindow.Node;
}
if (!extendedGlobal.NodeFilter) {
  extendedGlobal.NodeFilter = globalsWindow.NodeFilter;
}

function createDomParser(): DOMParser {
  return new globalsWindow.DOMParser();
}

test("looksLikeLatex", async (t) => {
  await t.test("detects dollar-delimited math", () => {
    assert.equal(looksLikeLatex("$\\rightarrow$"), true);
  });

  await t.test("detects bare backslash commands", () => {
    assert.equal(looksLikeLatex("\\rightarrow"), true);
  });

  await t.test("does not flag plain text", () => {
    assert.equal(looksLikeLatex("Example image"), false);
    assert.equal(looksLikeLatex(""), false);
  });
});

test("convertLatexToUnicode", async (t) => {
  await t.test("converts a dollar-wrapped arrow to Unicode", () => {
    const { text, complete } = convertLatexToUnicode("$\\rightarrow$");
    assert.equal(text, "→");
    assert.equal(complete, true);
  });

  await t.test("converts a bare LaTeX command to Unicode", () => {
    const { text, complete } = convertLatexToUnicode("\\leq");
    assert.equal(text, "≤");
    assert.equal(complete, true);
  });

  await t.test("converts greek letters", () => {
    const { text, complete } = convertLatexToUnicode("$\\alpha + \\beta$");
    assert.equal(text, "α + β");
    assert.equal(complete, true);
  });

  await t.test("leaves unrecognized commands and reports incomplete", () => {
    const { text, complete } = convertLatexToUnicode("$\\frac{a}{b}$");
    assert.equal(complete, false);
    assert.match(text, /\\frac/);
  });
});

test("Rich text image equations", async (t) => {
  await t.test("converts a Google Docs equation image (arrow) to plain Unicode", () => {
    const html = `<p>The result <img src="https://docs.google.com/equation.png" alt="$\\rightarrow$" aria-label="$\\rightarrow$"> the answer.</p>`;
    const markdown = convertClipboardPayload(html, undefined, {
      domParserAdapter: createDomParser(),
    }).trim();

    assert.equal(markdown, "The result → the answer.");
    assert.doesNotMatch(markdown, /rightarrow/);
    assert.doesNotMatch(markdown, /\$/);
  });

  await t.test("falls back to Markdown image syntax for complex equations", () => {
    const html = `<p><img src="https://docs.google.com/equation.png" alt="$\\frac{a}{b}$"></p>`;
    const markdown = convertClipboardPayload(html, undefined, {
      domParserAdapter: createDomParser(),
    }).trim();

    assert.equal(markdown, "![$\\frac{a}{b}$](https://docs.google.com/equation.png)");
  });

  await t.test("respects imageHandling 'remove' for equation images", () => {
    const html = `<p>Result <img src="https://docs.google.com/equation.png" alt="$\\rightarrow$"> here.</p>`;
    const markdown = convertClipboardPayload(html, undefined, {
      domParserAdapter: createDomParser(),
      imageHandling: "remove",
    }).trim();

    assert.equal(markdown, "Result  here.");
  });
});

test("convertLatexInText", async (t) => {
  await t.test("converts a dollar-delimited symbol within surrounding text", () => {
    assert.equal(
      convertLatexInText("The result $\\rightarrow$ the answer."),
      "The result → the answer."
    );
  });

  await t.test("converts a bare backslash command within surrounding text", () => {
    assert.equal(convertLatexInText("Plain arrow: \\rightarrow here."), "Plain arrow: → here.");
  });

  await t.test("leaves incomplete LaTeX (e.g. fractions) untouched", () => {
    assert.equal(
      convertLatexInText("Fraction $\\frac{a}{b}$ stays as-is."),
      "Fraction $\\frac{a}{b}$ stays as-is."
    );
  });

  await t.test("does not treat currency amounts as LaTeX", () => {
    assert.equal(convertLatexInText("Price is $5 and $10 total."), "Price is $5 and $10 total.");
  });

  await t.test("leaves plain text without LaTeX untouched", () => {
    assert.equal(convertLatexInText("Just plain text."), "Just plain text.");
  });
});

test("Markdown → Rich Text LaTeX conversion", async (t) => {
  await t.test("converts dollar-delimited LaTeX to Unicode in generated HTML", () => {
    const html = convertMarkdownToHtml("The result $\\rightarrow$ the answer.", {
      target: "google-docs",
    });

    assert.match(html, /The result → the answer\./);
    assert.doesNotMatch(html, /rightarrow/);
  });

  await t.test("converts a bare LaTeX command to Unicode in generated HTML", () => {
    const html = convertMarkdownToHtml("Plain arrow: \\rightarrow here.", {
      target: "google-docs",
    });

    assert.match(html, /Plain arrow: → here\./);
  });

  await t.test("leaves LaTeX inside inline code untouched", () => {
    const html = convertMarkdownToHtml("Code: `$\\rightarrow$` should stay literal.", {
      target: "google-docs",
    });

    assert.match(html, /<code[^>]*>\$\\rightarrow\$<\/code>/);
  });

  await t.test("leaves currency amounts untouched", () => {
    const html = convertMarkdownToHtml("Price is $5 and $10 total.", { target: "google-docs" });

    assert.match(html, /Price is \$5 and \$10 total\./);
  });
});
