import TurndownService from "turndown";

type Tone = "info" | "success" | "error";

type UIRefs = {
  pasteButton: HTMLButtonElement;
  copyButton: HTMLButtonElement;
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

function promoteWordHeadings(html: string): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    if (!doc?.body) {
      return html;
    }

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

    return doc.body.innerHTML;
  } catch (error) {
    console.warn("Failed to normalize Word headings", error);
    return html;
  }
}

function queryUI(): UIRefs | null {
  const pasteButton = document.getElementById("pasteButton") as HTMLButtonElement | null;
  const copyButton = document.getElementById("copyButton") as HTMLButtonElement | null;
  const clearButton = document.getElementById("clearButton") as HTMLButtonElement | null;
  const output = document.getElementById("output") as HTMLTextAreaElement | null;
  const status = document.getElementById("status");

  if (!pasteButton || !copyButton || !clearButton || !output || !status) {
    console.error("Popup UI failed to initialize: missing element(s)");
    return null;
  }

  return { pasteButton, copyButton, clearButton, output, status };
}

function setStatus(refs: UIRefs, message: string, tone: Tone = "info") {
  refs.status.textContent = message;
  refs.status.dataset.tone = message ? tone : "";
}

async function saveLastValue(markdown: string) {
  try {
    await chrome?.storage?.local?.set?.({ lastMarkdown: markdown, updatedAt: Date.now() });
  } catch (error) {
    console.warn("Unable to persist last Markdown value", error);
  }
}

async function restoreLastValue(refs: UIRefs) {
  try {
    const result = await chrome?.storage?.local?.get?.(["lastMarkdown"]);
    const markdown = result?.lastMarkdown as string | undefined;
    if (markdown) {
      refs.output.value = markdown;
      refs.copyButton.disabled = false;
      setStatus(refs, "Restored previous conversion", "info");
    }
  } catch (error) {
    console.warn("Unable to restore previous Markdown value", error);
  }
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
          return { html, plain: await item.getType("text/plain").then((b) => b.text()).catch(() => "") };
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
    const normalized = promoteWordHeadings(html);
    return turndown.turndown(normalized);
  }
  return plain?.trim() ?? "";
}

async function handleConversion(refs: UIRefs) {
  setStatus(refs, "Reading clipboard…", "info");
  try {
    const { html, plain } = await readClipboardAsHtml();
    const markdown = convertClipboardPayload(html, plain);

    if (!markdown) {
      setStatus(refs, "No convertible content found on the clipboard.", "error");
      refs.output.value = "";
      refs.copyButton.disabled = true;
      return;
    }

    refs.output.value = markdown;
    refs.copyButton.disabled = false;
    setStatus(refs, html ? "Converted rich text from clipboard." : "Converted plain text from clipboard.", "success");
    await saveLastValue(markdown);
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
    refs.copyButton.disabled = true;
    return;
  }

  refs.output.value = markdown;
  refs.copyButton.disabled = false;
  setStatus(refs, html ? "Converted pasted rich text." : "Converted pasted text.", "success");
  await saveLastValue(markdown);
}

async function init() {
  const refs = queryUI();
  if (!refs) {
    return;
  }

  await restoreLastValue(refs);

  refs.pasteButton.addEventListener("click", () => {
    void handleConversion(refs);
  });

  document.addEventListener("paste", (event) => {
    void handlePasteEvent(refs, event);
  });

  refs.copyButton.addEventListener("click", async () => {
    try {
      await writeClipboard(refs.output.value);
      setStatus(refs, "Markdown copied to clipboard.", "success");
    } catch (error) {
      console.error("Failed to copy markdown", error);
      setStatus(refs, "Unable to copy Markdown. Check clipboard permissions.", "error");
    }
  });

  refs.clearButton.addEventListener("click", () => {
    refs.output.value = "";
    refs.copyButton.disabled = true;
    setStatus(refs, "", "info");
    void saveLastValue("");
  });
}

void init();
