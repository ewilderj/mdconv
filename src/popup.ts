import TurndownService from "turndown";

type Tone = "info" | "success" | "error";

type UIRefs = {
  pasteButton: HTMLButtonElement;
  clearButton: HTMLButtonElement;
  output: HTMLTextAreaElement;
  status: HTMLElement;
};

type ClipboardImageData = {
  blob: Blob;
  type: string;
};

type ClipboardData = {
  html?: string;
  plain?: string;
  images?: ClipboardImageData[];
};

type ImageHandlingMode = "embed" | "link" | "placeholder";

type ImageHandlingConfig = {
  mode: ImageHandlingMode;
  maxDataURLSize: number; // Maximum size in bytes for data URLs to embed
};

const DEFAULT_IMAGE_CONFIG: ImageHandlingConfig = {
  mode: "embed", // Default to embedding images as data URLs
  maxDataURLSize: 1024 * 1024, // 1MB limit for data URL embedding
};

// Image placeholder constants
const IMAGE_PLACEHOLDERS = {
  NOT_AVAILABLE: "image-not-available",
  DATA_URL_TOO_LARGE: "data-url-too-large",
} as const;

// Image handling utilities
function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function extractImageSrcFromHtml(html: string): string[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const images = Array.from(doc.querySelectorAll("img"));
  return images.map(img => img.src).filter(src => src);
}

function isDataURL(url: string): boolean {
  return url.startsWith("data:");
}

function isExternalURL(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

function getImageAltText(img: HTMLImageElement): string {
  return img.alt || img.title || "Image";
}

function shouldEmbedDataURL(dataURL: string, config: ImageHandlingConfig): boolean {
  if (config.mode === "link" || config.mode === "placeholder") {
    return false;
  }
  
  // Estimate size of data URL (base64 is ~4/3 of original size)
  const estimatedSize = (dataURL.length * 3) / 4;
  return estimatedSize <= config.maxDataURLSize;
}

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  linkStyle: "inlined",
});

turndown.keep(["pre", "code"]);

// Custom rule to handle paragraphs inside list items (Word behavior)
turndown.addRule('listParagraph', {
  filter: function(node, options) {
    return !!(node.nodeName === 'P' && node.parentNode && node.parentNode.nodeName === 'LI');
  },
  replacement: function(content) {
    return content;
  }
});

// Custom list processing to fix spacing issues
turndown.addRule('listItem', {
  filter: 'li',
  replacement: function(content, node, options) {
    content = content
      .replace(/^\s+/, '') // Remove leading whitespace
      .replace(/\s+$/, '') // Remove trailing whitespace
      .replace(/\n/gm, '\n    '); // Indent wrapped lines properly
    
    const bullet = options.bulletListMarker || '*';
    return bullet + ' ' + content + '\n';
  }
});

// Override list rules to process all items at once
turndown.addRule('list', {
  filter: ['ul', 'ol'],
  replacement: function(content, node, options) {
    const element = node as HTMLElement;
    const listItems = Array.from(element.querySelectorAll('li'));
    const isOrdered = element.tagName.toLowerCase() === 'ol';
    
    const processedItems = listItems.map((li, index) => {
      let itemContent = turndown.turndown(li.innerHTML)
        .replace(/^\s+/, '') // Remove leading whitespace
        .replace(/\s+$/, '') // Remove trailing whitespace
        .replace(/\n/gm, '\n    '); // Indent wrapped lines
      
      if (isOrdered) {
        return `${index + 1}. ${itemContent}`;
      } else {
        const bullet = options.bulletListMarker || '*';
        return `${bullet} ${itemContent}`;
      }
    });
    
    return processedItems.join('\n') + '\n';
  }
});

// Custom image rule to handle different types of image sources
turndown.addRule('image', {
  filter: 'img',
  replacement: function(content: string, node: any, options: any) {
    const img = node as HTMLImageElement;
    const src = img.src;
    const alt = getImageAltText(img);
    const config = DEFAULT_IMAGE_CONFIG; // Use default config for now

    // Handle different types of image sources
    if (isExternalURL(src)) {
      // External URLs - use standard Markdown syntax
      return `![${alt}](${src})`;
    } else if (isDataURL(src)) {
      // Data URLs - check configuration and size limits
      if (shouldEmbedDataURL(src, config)) {
        return `![${alt}](${src})`;
      } else {
        // Data URL too large or config says not to embed
        return `![${alt}](${IMAGE_PLACEHOLDERS.DATA_URL_TOO_LARGE})`;
      }
    } else if (src) {
      // Relative or other URLs - preserve as-is
      return `![${alt}](${src})`;
    } else {
      // No src attribute - create placeholder
      return `![${alt}](${IMAGE_PLACEHOLDERS.NOT_AVAILABLE})`;
    }
  }
});

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

function consolidateWordLists(doc: Document) {
  const listContainers = Array.from(doc.body.querySelectorAll<HTMLElement>("div.ListContainerWrapper"));
  
  if (listContainers.length === 0) {
    return;
  }

  // Group consecutive list containers by list type and list ID
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
    
    // Check if this continues the current group
    const isSameGroup = listType === lastListType && listId === lastListId && lastListId !== null;
    
    if (isSameGroup) {
      currentGroup.push(container);
    } else {
      // Start new group
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
      }
      currentGroup = [container];
      lastListType = listType;
      lastListId = listId;
    }
  }
  
  // Add final group
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  // Consolidate each group
  for (const group of groups) {
    if (group.length <= 1) {
      continue; // Nothing to consolidate
    }

    const firstContainer = group[0];
    const firstList = firstContainer.querySelector("ul, ol") as HTMLElement;
    if (!firstList) {
      continue;
    }

    // Collect all list items from the group
    const allItems: HTMLElement[] = [];
    for (const container of group) {
      const list = container.querySelector("ul, ol");
      if (list) {
        const items = Array.from(list.querySelectorAll("li"));
        allItems.push(...items);
      }
    }

    // Clear the first list and add all items to it
    firstList.innerHTML = "";
    for (const item of allItems) {
      firstList.appendChild(item);
    }

    // Remove the other containers in the group
    for (let i = 1; i < group.length; i++) {
      group[i].remove();
    }
  }
}

function normalizeWordHtml(html: string): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    if (!doc?.body) {
      return html;
    }

    consolidateWordLists(doc);
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

async function readClipboardAsHtml(): Promise<ClipboardData> {
  if (navigator.clipboard && "read" in navigator.clipboard) {
    try {
      const items = await navigator.clipboard.read();
      let html: string | undefined;
      let plain: string | undefined;
      const images: ClipboardImageData[] = [];

      for (const item of items) {
        // Get text content
        if (item.types.includes("text/html") && !html) {
          const blob = await item.getType("text/html");
          html = await blob.text();
        }
        if (item.types.includes("text/plain") && !plain) {
          const blob = await item.getType("text/plain");
          plain = await blob.text();
        }

        // Get image content
        for (const type of item.types) {
          if (type.startsWith("image/")) {
            try {
              const blob = await item.getType(type);
              images.push({ blob, type });
            } catch (error) {
              console.warn(`Failed to read image of type ${type}`, error);
            }
          }
        }
      }

      return { html, plain, images: images.length > 0 ? images : undefined };
    } catch (error) {
      console.warn("navigator.clipboard.read unavailable, falling back", error);
    }
  }

  const plain = await navigator.clipboard.readText();
  return { plain };
}

async function processClipboardImages(html: string, images?: ClipboardImageData[], config: ImageHandlingConfig = DEFAULT_IMAGE_CONFIG): Promise<string> {
  if (!images || images.length === 0) {
    return html;
  }

  let processedHtml = html;
  
  // For each clipboard image, try to find matching img tags without src or with placeholder src
  // and replace them with data URLs
  // Note: Parsing user HTML here is safe because:
  // 1. Content comes from user's own clipboard (not external input)
  // 2. Parsed in isolated document, not current page DOM  
  // 3. Only used to extract image metadata, never executed
  // 4. Result is converted to safe Markdown text
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const imgTags = Array.from(doc.querySelectorAll("img"));
  
  // Find img tags that might need image data from clipboard
  const emptyImgTags = imgTags.filter(img => !img.src || img.src === "about:blank" || img.src.includes("placeholder"));
  
  // If we have clipboard images and empty img tags, try to match them
  if (emptyImgTags.length > 0 && images.length > 0) {
    for (let i = 0; i < Math.min(emptyImgTags.length, images.length); i++) {
      try {
        const dataURL = await blobToDataURL(images[i].blob);
        emptyImgTags[i].src = dataURL;
      } catch (error) {
        console.warn("Failed to convert image blob to data URL", error);
      }
    }
    processedHtml = doc.body?.innerHTML || html;
  }
  
  // If we have standalone clipboard images (not matched to HTML img tags), append them
  if (images.length > emptyImgTags.length) {
    const remainingImages = images.slice(emptyImgTags.length);
    
    for (const imageData of remainingImages) {
      try {
        const dataURL = await blobToDataURL(imageData.blob);
        const img = doc.createElement('img');
        img.src = dataURL;
        img.alt = 'Clipboard Image';
        doc.body?.appendChild(img);
      } catch (error) {
        console.warn("Failed to convert clipboard image to data URL", error);
      }
    }
    
    processedHtml = doc.body?.innerHTML || processedHtml;
  }

  return processedHtml;
}

async function convertClipboardPayload(data: ClipboardData, config: ImageHandlingConfig = DEFAULT_IMAGE_CONFIG): Promise<string> {
  const { html, plain, images } = data;
  
  if (html && html.trim()) {
    // Process images first if they exist
    const processedHtml = await processClipboardImages(html, images, config);
    const normalized = normalizeWordHtml(processedHtml);
    return turndown.turndown(normalized);
  }
  
  // If no HTML but we have images, create simple HTML with images
  if (images && images.length > 0) {
    const parser = new DOMParser();
    const doc = parser.parseFromString('<html><body></body></html>', 'text/html');
    
    for (const imageData of images) {
      try {
        const img = doc.createElement('img');
        img.alt = 'Clipboard Image';
        
        const dataURL = await blobToDataURL(imageData.blob);
        if (shouldEmbedDataURL(dataURL, config)) {
          img.src = dataURL;
        } else {
          img.src = IMAGE_PLACEHOLDERS.DATA_URL_TOO_LARGE;
        }
        
        doc.body?.appendChild(img);
      } catch (error) {
        console.warn("Failed to convert clipboard image to data URL", error);
      }
    }
    
    const imageHtml = doc.body?.innerHTML;
    if (imageHtml) {
      return turndown.turndown(imageHtml);
    }
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
    const clipboardData = await readClipboardAsHtml();
    const markdown = await convertClipboardPayload(clipboardData, DEFAULT_IMAGE_CONFIG);

    if (!markdown) {
      setStatus(refs, "No convertible content found on the clipboard.", "error");
      refs.output.value = "";
      return;
    }

    let context = "Converted plain text from clipboard";
    if (clipboardData.html) {
      context = "Converted rich text from clipboard";
    }
    if (clipboardData.images && clipboardData.images.length > 0) {
      const imageCount = clipboardData.images.length;
      context += ` (including ${imageCount} image${imageCount > 1 ? 's' : ''})`;
    }
    
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
  
  // Try to get images from the paste event
  const images: ClipboardImageData[] = [];
  if (event.clipboardData) {
    for (let i = 0; i < event.clipboardData.items.length; i++) {
      const item = event.clipboardData.items[i];
      if (item.type.startsWith("image/")) {
        const blob = item.getAsFile();
        if (blob) {
          images.push({ blob, type: item.type });
        }
      }
    }
  }

  const clipboardData: ClipboardData = { 
    html, 
    plain, 
    images: images.length > 0 ? images : undefined 
  };
  
  const markdown = await convertClipboardPayload(clipboardData, DEFAULT_IMAGE_CONFIG);

  if (!markdown) {
    setStatus(refs, "Clipboard data was empty.", "error");
    refs.output.value = "";
    return;
  }

  let context = "Converted pasted text";
  if (html) {
    context = "Converted pasted rich text";
  }
  if (images.length > 0) {
    context += ` (including ${images.length} image${images.length > 1 ? 's' : ''})`;
  }
  
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
