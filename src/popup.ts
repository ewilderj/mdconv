import TurndownService from "turndown";

type Tone = "info" | "success" | "error";

type UIRefs = {
  pasteButton: HTMLButtonElement;
  clearButton: HTMLButtonElement;
  output: HTMLTextAreaElement;
  status: HTMLElement;
};

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  linkStyle: "inlined",
});

turndown.keep(["pre", "code"]);

const MONOSPACE_FONT_NAMES = new Set(
  [
    "courier",
    "courier new",
    "consolas",
    "lucida console",
    "menlo",
    "monaco",
    "source code pro",
    "fira code",
    "inconsolata",
    "ubuntu mono",
  ].map((name) => name.toLowerCase()),
);

const BLOCK_TEXT_ELEMENTS = new Set([
  "P",
  "DIV",
  "SECTION",
  "ARTICLE",
  "UL",
  "OL",
  "LI",
  "TABLE",
  "THEAD",
  "TBODY",
  "TFOOT",
  "TR",
  "TH",
  "TD",
  "BLOCKQUOTE",
  "PRE",
]);

function clampHeading(level: number | null | undefined): number | null {
  if (!level || Number.isNaN(level)) {
    return null;
  }
  return Math.min(Math.max(level, 1), 6);
}

function extractHeadingLevelFromString(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }
  const headingMatch = value.match(/heading\s*([1-6])/i) ?? value.match(/heading([1-6])/i);
  if (headingMatch) {
    return clampHeading(parseInt(headingMatch[1] ?? headingMatch[2], 10));
  }
  const outlineMatch = value.match(/outline\s*level\s*([1-6])/i);
  if (outlineMatch) {
    return clampHeading(parseInt(outlineMatch[1], 10));
  }
  return null;
}

function parseFontSize(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }
  const match = value.trim().match(/([0-9]+(?:\.[0-9]+)?)(px|pt|rem|em)?/i);
  if (!match) {
    return null;
  }
  const size = parseFloat(match[1]);
  const unit = (match[2] || "px").toLowerCase();
  if (Number.isNaN(size)) {
    return null;
  }
  switch (unit) {
    case "pt":
      return size * (96 / 72);
    case "rem":
      return size * 16;
    case "em":
      return size * 16;
    default:
      return size;
  }
}

function inferHeadingLevelFromStyle(element: HTMLElement): number | null {
  const style = element.style;
  const fontSize = parseFontSize(style?.fontSize);
  const fontWeight = style?.fontWeight?.toLowerCase();
  const isBold = fontWeight === "bold" || (!!fontWeight && parseInt(fontWeight, 10) >= 600);
  if (!fontSize || !isBold) {
    return null;
  }

  if (fontSize >= 34) {
    return 1;
  }
  if (fontSize >= 28) {
    return 2;
  }
  if (fontSize >= 24) {
    return 3;
  }
  if (fontSize >= 20) {
    return 4;
  }
  if (fontSize >= 18) {
    return 5;
  }
  if (fontSize >= 16) {
    return 6;
  }
  return null;
}

function detectWordHeadingLevel(element: HTMLElement): number | null {
  const role = element.getAttribute("role");
  if (role?.toLowerCase() === "heading") {
    const ariaLevel = element.getAttribute("aria-level") ?? element.dataset.ariaLevel;
    const levelFromAria = clampHeading(parseInt(ariaLevel ?? "", 10));
    if (levelFromAria) {
      return levelFromAria;
    }
  }

  const explicitDataAttr = element.getAttribute("data-ccp-parastyle") ?? element.getAttribute("data-ccp-parastyle-name");
  const levelFromDataAttr = extractHeadingLevelFromString(explicitDataAttr);
  if (levelFromDataAttr) {
    return levelFromDataAttr;
  }

  const datasetValues = Object.values(element.dataset ?? {});
  for (const value of datasetValues) {
    const level = extractHeadingLevelFromString(value);
    if (level) {
      return level;
    }
  }

  const classLevel = extractHeadingLevelFromString(element.className);
  if (classLevel) {
    return classLevel;
  }

  const styleAttr = element.getAttribute("style");
  const msoLevel = extractHeadingLevelFromString(styleAttr);
  if (msoLevel) {
    return msoLevel;
  }

  const inferred = inferHeadingLevelFromStyle(element);
  if (inferred) {
    const text = element.textContent?.trim() ?? "";
    if (text.split(/\s+/).length <= 12) {
      return inferred;
    }
  }

  return null;
}

function normalizeFontTokens(fontFamily: string | null | undefined): string[] {
  if (!fontFamily) {
    return [];
  }
  return fontFamily
    .split(",")
    .map((token) => token.replace(/["']/g, "").trim().toLowerCase())
    .filter(Boolean);
}

function isMonospaceFontFamily(fontFamily: string | null | undefined): boolean {
  const tokens = normalizeFontTokens(fontFamily);
  return tokens.some((token) => MONOSPACE_FONT_NAMES.has(token));
}

function readInlineFontFamily(element: HTMLElement): string | null {
  const inline = element.style?.fontFamily;
  if (inline && inline.trim()) {
    return inline;
  }

  const faceAttr = element.getAttribute("face");
  if (faceAttr && faceAttr.trim()) {
    return faceAttr;
  }

  const styleAttr = element.getAttribute("style");
  if (styleAttr) {
    const match = styleAttr.match(/font-family\s*:\s*([^;]+)/i);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

function promoteWordHeadingsInPlace(doc: Document) {
  const paragraphs = Array.from(doc.body.querySelectorAll("p"));
  for (const paragraph of paragraphs) {
    const level = detectWordHeadingLevel(paragraph);
    if (!level) {
      continue;
    }
    const headingTag = `h${level}` as keyof HTMLElementTagNameMap;
    const heading = doc.createElement(headingTag);
    heading.innerHTML = paragraph.innerHTML;
    if (paragraph.id) {
      heading.id = paragraph.id;
    }
    paragraph.replaceWith(heading);
  }
}

function shouldTransformToCodeBlock(element: HTMLElement): boolean {
  if (!element.textContent || !element.textContent.trim()) {
    return false;
  }

  if (element.closest("pre, code")) {
    return false;
  }

  let encounteredMonospace = isMonospaceFontFamily(readInlineFontFamily(element));
  const walker = element.ownerDocument.createTreeWalker(element, NodeFilter.SHOW_ELEMENT);

  while (walker.nextNode()) {
    const current = walker.currentNode as HTMLElement;

    if (current === element) {
      continue;
    }

    if (current.tagName === "PRE" || current.tagName === "CODE") {
      return false;
    }

    const fontFamily = readInlineFontFamily(current);
    if (!fontFamily) {
      continue;
    }

    if (isMonospaceFontFamily(fontFamily)) {
      encounteredMonospace = true;
      continue;
    }

    return false;
  }

  return encounteredMonospace;
}

function transformMonospaceBlocks(doc: Document) {
  const blocks = Array.from(doc.body.querySelectorAll<HTMLElement>("p, div"));
  for (const block of blocks) {
    if (!shouldTransformToCodeBlock(block)) {
      continue;
    }

    const pre = doc.createElement("pre");
    const code = doc.createElement("code");
    const text = extractMonospaceBlockText(block);
    code.textContent = text;
    pre.appendChild(code);

    if (block.id) {
      pre.id = block.id;
    }

    block.replaceWith(pre);
  }
}

function extractMonospaceBlockText(element: HTMLElement): string {
  const parts: string[] = [];

  function appendNewline() {
    if (!parts.length) {
      parts.push("\n");
      return;
    }
    if (!parts[parts.length - 1].endsWith("\n")) {
      parts.push("\n");
    }
  }

  function serialize(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent ?? "").replace(/\u00a0/g, " ");
      if (text) {
        parts.push(text);
      }
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const el = node as HTMLElement;
    const tag = el.tagName;

    if (tag === "BR") {
      parts.push("\n");
      return;
    }

    for (const child of Array.from(el.childNodes)) {
      serialize(child);
    }

    if (BLOCK_TEXT_ELEMENTS.has(tag)) {
      appendNewline();
    }
  }

  for (const child of Array.from(element.childNodes)) {
    serialize(child);
  }

  let text = parts.join("");
  text = text.replace(/\r\n?/g, "\n").replace(/\u2028|\u2029/g, "\n");
  text = text.replace(/[ \t]+\n/g, "\n");
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.replace(/^[\n\s]+/, "").replace(/[\n\s]+$/, "");
  return text;
}

function isBoldFontWeight(fontWeight: string | null | undefined): boolean {
  if (!fontWeight) {
    return false;
  }
  const normalized = fontWeight.trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  if (normalized === "bold" || normalized === "bolder") {
    return true;
  }
  const numeric = parseInt(normalized, 10);
  return !Number.isNaN(numeric) && numeric >= 600;
}

function spanStyleIndicatesBold(span: HTMLSpanElement): boolean {
  if (isBoldFontWeight(span.style?.fontWeight)) {
    return true;
  }
  const styleAttr = span.getAttribute("style") ?? "";
  return /font-weight\s*:\s*(bold|[6-9]\d\d)/i.test(styleAttr);
}

function convertBoldSpansToStrong(doc: Document) {
  const spans = Array.from(doc.body.querySelectorAll<HTMLSpanElement>("span"));
  for (const span of spans) {
    if (span.closest("pre, code")) {
      continue;
    }
    const parentTag = span.parentElement?.tagName;
    if (parentTag === "STRONG" || parentTag === "B") {
      continue;
    }
    if (!spanStyleIndicatesBold(span)) {
      continue;
    }

    const strong = doc.createElement("strong");
    strong.innerHTML = span.innerHTML;
    for (const attribute of span.getAttributeNames()) {
      if (attribute.toLowerCase() === "style") {
        continue;
      }
      const value = span.getAttribute(attribute);
      if (value !== null) {
        strong.setAttribute(attribute, value);
      }
    }
    span.replaceWith(strong);
  }
}

function normalizeWordHtml(html: string): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    if (!doc?.body) {
      return html;
    }

    promoteWordHeadingsInPlace(doc);
    transformMonospaceBlocks(doc);
    convertBoldSpansToStrong(doc);

    return doc.body.innerHTML;
  } catch (error) {
    console.warn("Failed to normalize Word markup", error);
    return html;
  }
}

function queryUI(): UIRefs | null {
  const pasteButton = document.getElementById("pasteButton") as HTMLButtonElement | null;
  const clearButton = document.getElementById("clearButton") as HTMLButtonElement | null;
  const output = document.getElementById("output") as HTMLTextAreaElement | null;
  const status = document.getElementById("status");

  if (!pasteButton || !clearButton || !output || !status) {
    console.error("Popup UI failed to initialize: missing element(s)");
    return null;
  }

  return { pasteButton, clearButton, output, status };
}

function setStatus(refs: UIRefs, message: string, tone: Tone = "info") {
  refs.status.textContent = message;
  refs.status.dataset.tone = message ? tone : "";
}

async function writeClipboard(text: string) {
  await navigator.clipboard.writeText(text);
}

async function readClipboardAsHtml(): Promise<{ html?: string; plain?: string }> {
  if (navigator.clipboard && "read" in navigator.clipboard) {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        if (item.types.includes("text/html")) {
          const blob = await item.getType("text/html");
          const html = await blob.text();
          const plain = await item.getType("text/plain").then((b) => b.text()).catch(() => "");
          return { html, plain };
        }
      }
    } catch (error) {
      console.warn("navigator.clipboard.read unavailable, falling back", error);
    }
  }

  const plain = await navigator.clipboard.readText();
  return { plain };
}

function convertClipboardPayload(html?: string, plain?: string) {
  if (html && html.trim()) {
    const normalized = normalizeWordHtml(html);
    return turndown.turndown(normalized);
  }
  return plain?.trim() ?? "";
}

async function presentMarkdown(refs: UIRefs, markdown: string, context: string) {
  refs.output.value = markdown;
  setStatus(refs, `${context}. Copying Markdown to clipboard…`, "info");

  try {
    await writeClipboard(markdown);
    setStatus(refs, `${context}. Markdown copied to clipboard.`, "success");
  } catch (error) {
    console.error("Failed to copy markdown", error);
    setStatus(refs, `${context}. Converted text but unable to copy automatically. Copy manually.`, "error");
  }
}

async function handleConversion(refs: UIRefs) {
  setStatus(refs, "Reading clipboard…", "info");
  try {
    const { html, plain } = await readClipboardAsHtml();
    const markdown = convertClipboardPayload(html, plain);

    if (!markdown) {
      setStatus(refs, "No convertible content found on the clipboard.", "error");
      refs.output.value = "";
      return;
    }

    const context = html ? "Converted rich text from clipboard" : "Converted plain text from clipboard";
    await presentMarkdown(refs, markdown, context);
  } catch (error) {
    console.error("Failed to convert clipboard contents", error);
    setStatus(refs, "Couldn't read the clipboard. Grant clipboard permissions and try again.", "error");
  }
}

async function handlePasteEvent(refs: UIRefs, event: ClipboardEvent) {
  event.preventDefault();
  const html = event.clipboardData?.getData("text/html");
  const plain = event.clipboardData?.getData("text/plain");
  const markdown = convertClipboardPayload(html, plain);

  if (!markdown) {
    setStatus(refs, "Clipboard data was empty.", "error");
    refs.output.value = "";
    return;
  }

  const context = html ? "Converted pasted rich text" : "Converted pasted text";
  await presentMarkdown(refs, markdown, context);
}

async function init() {
  const refs = queryUI();
  if (!refs) {
    return;
  }

  refs.output.value = "";
  setStatus(refs, "", "info");

  refs.pasteButton.addEventListener("click", () => {
    void handleConversion(refs);
  });

  document.addEventListener("paste", (event) => {
    void handlePasteEvent(refs, event);
  });

  refs.clearButton.addEventListener("click", () => {
    refs.output.value = "";
    setStatus(refs, "", "info");
  });
}

void init();
