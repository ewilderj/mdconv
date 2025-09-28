import TurndownService from "turndown";

export type ConversionOptions = {
  domParser?: DOMParser;
};

type ConversionContext = {
  parser: DOMParser;
};

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

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  linkStyle: "inlined",
});

turndown.keep(["pre", "code"]);

// Custom rule to handle paragraphs inside list items (Word behavior)
turndown.addRule("listParagraph", {
  filter: function (node) {
    return !!(node.nodeName === "P" && node.parentNode && node.parentNode.nodeName === "LI");
  },
  replacement: function (content) {
    return content;
  },
});

// Custom list processing to fix spacing issues
turndown.addRule("listItem", {
  filter: "li",
  replacement: function (content, node, options) {
    content = content
      .replace(/^\s+/, "")
      .replace(/\s+$/, "")
      .replace(/\n/gm, "\n    ");

    const bullet = options.bulletListMarker || "*";
    return bullet + " " + content + "\n";
  },
});

// Override list rules to process all items at once
turndown.addRule("list", {
  filter: ["ul", "ol"],
  replacement: function (content, node, options) {
    const element = node as HTMLElement;
    const listItems = Array.from(element.querySelectorAll("li"));
    const isOrdered = element.tagName.toLowerCase() === "ol";

    const processedItems = listItems.map((li, index) => {
      let itemContent = turndown
        .turndown(li.innerHTML)
        .replace(/^\s+/, "")
        .replace(/\s+$/, "")
        .replace(/\n/gm, "\n    ");

      if (isOrdered) {
        return `${index + 1}. ${itemContent}`;
      } else {
        const bullet = options.bulletListMarker || "*";
        return `${bullet} ${itemContent}`;
      }
    });

    return processedItems.join("\n") + "\n";
  },
});

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
  const ownerDocument = element.ownerDocument;
  const showElements = ownerDocument.defaultView?.NodeFilter?.SHOW_ELEMENT ?? 1;
  const walker = ownerDocument.createTreeWalker(element, showElements);

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
  const ownerDocument = element.ownerDocument;
  const nodeCtor = ownerDocument.defaultView?.Node;
  const TEXT_NODE = nodeCtor?.TEXT_NODE ?? 3;
  const ELEMENT_NODE = nodeCtor?.ELEMENT_NODE ?? 1;

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
    if (node.nodeType === TEXT_NODE) {
      let text = (node.textContent ?? "").replace(/\u00a0/g, " ");
      text = text.replace(/\r\n?/g, "\n");
      if (parts.length && parts[parts.length - 1].endsWith("\n")) {
        text = text.replace(/^\n+/, "");
      }
      text = text.replace(/\n+/g, " ");
      if (text) {
        parts.push(text);
      }
      return;
    }

    if (node.nodeType !== ELEMENT_NODE) {
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

function spanStyleIndicatesItalic(span: HTMLSpanElement): boolean {
  const fontStyle = span.style?.fontStyle?.toLowerCase();
  if (fontStyle === "italic" || fontStyle === "oblique") {
    return true;
  }
  const styleAttr = span.getAttribute("style") ?? "";
  return /font-style\s*:\s*(italic|oblique)/i.test(styleAttr);
}

function convertItalicSpansToEm(doc: Document) {
  const spans = Array.from(doc.body.querySelectorAll<HTMLSpanElement>("span"));
  for (const span of spans) {
    if (span.closest("pre, code")) {
      continue;
    }
    const parentTag = span.parentElement?.tagName;
    if (parentTag === "EM" || parentTag === "I") {
      continue;
    }
    if (!spanStyleIndicatesItalic(span)) {
      continue;
    }

    const em = doc.createElement("em");
    em.innerHTML = span.innerHTML;
    for (const attribute of span.getAttributeNames()) {
      if (attribute.toLowerCase() === "style") {
        continue;
      }
      const value = span.getAttribute(attribute);
      if (value !== null) {
        em.setAttribute(attribute, value);
      }
    }
    span.replaceWith(em);
  }
}

function consolidateWordLists(doc: Document) {
  const listContainers = Array.from(doc.body.querySelectorAll<HTMLElement>("div.ListContainerWrapper"));

  if (listContainers.length === 0) {
    return;
  }

  const groups: HTMLElement[][] = [];
  let currentGroup: HTMLElement[] = [];
  let lastListId: string | null = null;
  let lastListType: string | null = null;

  for (const container of listContainers) {
    const list = container.querySelector("ul, ol") as HTMLElement;
    if (!list) {
      continue;
    }

    const listType = list.tagName.toLowerCase();
    const listItem = list.querySelector("li") as HTMLElement;
    const listId = listItem?.getAttribute("data-listid") || "";

    const isSameGroup = listType === lastListType && listId === lastListId && lastListId !== null;

    if (isSameGroup) {
      currentGroup.push(container);
    } else {
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
      }
      currentGroup = [container];
      lastListType = listType;
      lastListId = listId;
    }
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  for (const group of groups) {
    if (group.length <= 1) {
      continue;
    }

    const firstContainer = group[0];
    const firstList = firstContainer.querySelector("ul, ol") as HTMLElement;
    if (!firstList) {
      continue;
    }

    const allItems: HTMLElement[] = [];
    for (const container of group) {
      const list = container.querySelector("ul, ol");
      if (list) {
        const items = Array.from(list.querySelectorAll("li"));
        allItems.push(...items);
      }
    }

    firstList.innerHTML = "";
    for (const item of allItems) {
      firstList.appendChild(item);
    }

    for (let i = 1; i < group.length; i++) {
      group[i].remove();
    }
  }
}

function isLegacyWordListParagraph(element: HTMLElement): boolean {
  if (element.tagName !== "P") {
    return false;
  }
  const styleAttr = element.getAttribute("style") ?? "";
  if (/mso-list/i.test(styleAttr)) {
    return true;
  }
  if (/MsoListParagraph/i.test(element.className)) {
    return true;
  }
  return false;
}

function extractLegacyListInfo(paragraph: HTMLElement, commentNodeType: number): { type: "ul" | "ol"; contentHtml: string } | null {
  const markerSpan = paragraph.querySelector<HTMLElement>('span[style*="mso-list:Ignore"]');
  if (!markerSpan) {
    return null;
  }

  const markerText = markerSpan.textContent ?? "";
  const isOrdered = /^\s*\d+[\.\)]/.test(markerText.trim());

  const clone = paragraph.cloneNode(true) as HTMLElement;

  const stack: Node[] = [clone];
  while (stack.length > 0) {
    const node = stack.pop()!;
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === commentNodeType) {
        child.parentNode?.removeChild(child);
        continue;
      }
      stack.push(child);
    }
  }

  const ignored = Array.from(clone.querySelectorAll<HTMLElement>('span[style*="mso-list:Ignore"]'));
  for (const span of ignored) {
    span.remove();
  }

  const officeNodes = Array.from(clone.querySelectorAll<HTMLElement>("o\\:p"));
  for (const officeNode of officeNodes) {
    officeNode.remove();
  }

  const contentHtml = clone.innerHTML.trim();
  if (!contentHtml) {
    return null;
  }

  return { type: isOrdered ? "ol" : "ul", contentHtml };
}

function convertLegacyWordParagraphLists(doc: Document) {
  const defaultView = doc.defaultView;
  const commentNodeType = defaultView?.Node?.COMMENT_NODE ?? 8;
  const children = Array.from(doc.body.children);
  let currentList: { element: HTMLUListElement | HTMLOListElement; type: "ul" | "ol" } | null = null;

  for (const child of children) {
    const paragraph = child as HTMLElement;
    if (!isLegacyWordListParagraph(paragraph)) {
      currentList = null;
      continue;
    }

    const info = extractLegacyListInfo(paragraph, commentNodeType);
    if (!info) {
      currentList = null;
      continue;
    }

    const li = doc.createElement("li");
    li.innerHTML = info.contentHtml;

    if (!currentList || currentList.type !== info.type) {
      const listElement = doc.createElement(info.type);
      currentList = { element: listElement, type: info.type };
      paragraph.replaceWith(listElement);
      listElement.appendChild(li);
    } else {
      currentList.element.appendChild(li);
      paragraph.remove();
    }
  }
}

function replaceOfficeParagraphNodes(doc: Document) {
  const officeNodes = Array.from(doc.body.querySelectorAll<HTMLElement>("o\\:p"));
  for (const node of officeNodes) {
    const content = node.textContent && node.textContent.length > 0 ? node.textContent : "\u00a0";
    const textNode = doc.createTextNode(content);
    node.replaceWith(textNode);
  }
}

const INLINE_TAGS_FOR_NBSP = new Set(["A", "B", "I", "EM", "STRONG", "CODE", "SPAN", "SMALL", "BIG", "SUB", "SUP"]);

function convertInlineBoundarySpacesToNbsp(doc: Document) {
  const showText = doc.defaultView?.NodeFilter?.SHOW_TEXT ?? 4;
  const walker = doc.createTreeWalker(doc.body, showText);
  const nbsp = "\u00a0";
  const nodes: Text[] = [];

  while (walker.nextNode()) {
    nodes.push(walker.currentNode as Text);
  }

  for (const textNode of nodes) {
    let value = textNode.nodeValue ?? "";
    if (!value.includes(" ") && !value.includes("\n")) {
      continue;
    }

    const previousSibling = textNode.previousSibling;
    const nextSibling = textNode.nextSibling;

    if (value.startsWith(" ") && previousSibling && previousSibling.nodeType === 1) {
      const previousElement = previousSibling as HTMLElement;
      if (INLINE_TAGS_FOR_NBSP.has(previousElement.tagName)) {
        value = nbsp + value.slice(1);
      }
    }

    if (value.endsWith(" ") && nextSibling && nextSibling.nodeType === 1) {
      const nextElement = nextSibling as HTMLElement;
      if (INLINE_TAGS_FOR_NBSP.has(nextElement.tagName)) {
        value = value.slice(0, -1) + nbsp;
      }
    }

    textNode.nodeValue = value;
  }
}

function resolveContext(options: ConversionOptions): ConversionContext {
  if (options.domParser) {
    return { parser: options.domParser };
  }
  if (typeof DOMParser === "undefined") {
    throw new Error("DOMParser is not available. Provide domParser in ConversionOptions.");
  }
  return { parser: new DOMParser() };
}

function normalizeWordHtml(html: string, context: ConversionContext): string {
  try {
    const doc = context.parser.parseFromString(html, "text/html");
    if (!doc?.body) {
      return html;
    }

    consolidateWordLists(doc);
    convertLegacyWordParagraphLists(doc);
    replaceOfficeParagraphNodes(doc);
    convertInlineBoundarySpacesToNbsp(doc);
    promoteWordHeadingsInPlace(doc);
    transformMonospaceBlocks(doc);
    convertBoldSpansToStrong(doc);
    convertItalicSpansToEm(doc);

    return doc.body.innerHTML;
  } catch (error) {
    console.warn("Failed to normalize Word markup", error);
    return html;
  }
}

export function convertHtmlToMarkdown(html: string, options: ConversionOptions = {}): string {
  const context = resolveContext(options);
  const normalized = normalizeWordHtml(html, context);
  return turndown.turndown(normalized);
}

export function convertClipboardPayload(html?: string, plain?: string, options: ConversionOptions = {}): string {
  if (html && html.trim()) {
    return convertHtmlToMarkdown(html, options);
  }
  return plain?.trim() ?? "";
}
