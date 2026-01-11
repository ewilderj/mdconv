/**
 * Firefox extension popup script.
 * Handles clipboard conversion UI interactions.
 * Uses browser.* API which works in both Firefox and modern Chrome.
 */

// Cross-browser compatibility shim - Firefox provides browser, Chrome provides chrome
// Note: popup.ts doesn't use browser API directly, but imports from firefox-converter
// which needs the shim for consistency
/// <reference types="chrome" />

declare const browser: typeof chrome;

import { firefoxConverter } from "./firefox-converter.js";
import { convertMarkdownToOrg } from "../../core/md-to-org.js";

type Tone = "info" | "success" | "error";
type OutputFormat = "markdown" | "org";

type UIRefs = {
  pasteButton: HTMLButtonElement;
  clearButton: HTMLButtonElement;
  formatSelect: HTMLSelectElement;
  output: HTMLTextAreaElement;
  status: HTMLElement;
};

const DEBUG_CLIPBOARD_FLAG = "mdconv.debugClipboard";
const FORMAT_STORAGE_KEY = "mdconv.outputFormat";

function isClipboardDebugEnabled(): boolean {
  try {
    return localStorage.getItem(DEBUG_CLIPBOARD_FLAG) === "true";
  } catch (error) {
    return false;
  }
}

type ClipboardDebugPayload = {
  source: string;
  html?: string | null;
  plain?: string | null;
  markdown?: string | null;
};

function logClipboardDebug(payload: ClipboardDebugPayload) {
  if (!isClipboardDebugEnabled()) {
    return;
  }

  const { source, html, plain, markdown } = payload;
  const group = `[mdconv] ${source}`;

  if (typeof console.groupCollapsed === "function") {
    console.groupCollapsed(group);
  } else {
    console.log(group);
  }

  if (html !== undefined) {
    console.log(`HTML (${html ? `${html.length} chars` : "none"})`);
    if (html) {
      console.log(html);
    }
  }

  if (plain !== undefined) {
    console.log(`Plain (${plain ? `${plain.length} chars` : "none"})`);
    if (plain) {
      console.log(plain);
    }
  }

  if (markdown !== undefined) {
    console.log(`Markdown (${markdown ? `${markdown.length} chars` : "none"})`);
    if (markdown) {
      console.log(markdown);
    }
  }

  if (typeof console.groupEnd === "function") {
    console.groupEnd();
  }
}

function formatPreview(value: string | undefined | null, limit = 10000): string {
  if (!value) {
    return "(none)";
  }
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (trimmed.length <= limit) {
    return trimmed;
  }
  return `${trimmed.slice(0, limit)}… [truncated ${trimmed.length - limit} chars]`;
}



function queryUI(): UIRefs | null {
  const pasteButton = document.getElementById("pasteButton") as HTMLButtonElement | null;
  const clearButton = document.getElementById("clearButton") as HTMLButtonElement | null;
  const formatSelect = document.getElementById("formatSelect") as HTMLSelectElement | null;
  const output = document.getElementById("output") as HTMLTextAreaElement | null;
  const status = document.getElementById("status");

  if (!pasteButton || !clearButton || !formatSelect || !output || !status) {
    return null;
  }

  return { pasteButton, clearButton, formatSelect, output, status };
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
      // Fallback to readText
    }
  }

  const plain = await navigator.clipboard.readText();
  return { plain };
}
async function presentMarkdown(refs: UIRefs, markdown: string, context: string) {
  const format = refs.formatSelect.value as OutputFormat;
  const output = format === "org" ? convertMarkdownToOrg(markdown) : markdown;
  const formatLabel = format === "org" ? "Org" : "Markdown";
  
  refs.output.value = output;
  setStatus(refs, `${context}. Copying ${formatLabel} to clipboard…`, "info");

  try {
    await writeClipboard(output);
    setStatus(refs, `${context}. ${formatLabel} copied to clipboard.`, "success");
  } catch (error) {
    setStatus(refs, "Failed to copy to clipboard", "error");
  }
}

async function handleConversion(refs: UIRefs) {
  setStatus(refs, "Reading clipboard…", "info");
  try {
    const { html, plain } = await readClipboardAsHtml();
    logClipboardDebug({ source: "clipboard.read", html, plain });
    const markdown = firefoxConverter.convertClipboardPayload(html, plain);
    logClipboardDebug({ source: "clipboard.read -> markdown", markdown });

    if (!markdown) {
      setStatus(refs, "No convertible content found on the clipboard.", "error");
      refs.output.value = "";
      return;
    }

    const context = html ? "Converted rich text from clipboard" : "Converted plain text from clipboard";
    await presentMarkdown(refs, markdown, context);
  } catch (error) {
    setStatus(refs, "Conversion failed. Please try again.", "error");
  }
}

async function handlePasteEvent(refs: UIRefs, event: ClipboardEvent) {
  event.preventDefault();
  const html = event.clipboardData?.getData("text/html");
  const plain = event.clipboardData?.getData("text/plain");
  logClipboardDebug({ source: "paste", html, plain });
  const markdown = firefoxConverter.convertClipboardPayload(html, plain);
  logClipboardDebug({ source: "paste -> markdown", markdown });

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

  // Restore saved format preference
  try {
    const stored = await browser.storage.local.get(FORMAT_STORAGE_KEY);
    if (stored[FORMAT_STORAGE_KEY] === "org" || stored[FORMAT_STORAGE_KEY] === "markdown") {
      refs.formatSelect.value = stored[FORMAT_STORAGE_KEY];
    }
  } catch (error) {
    // Ignore storage errors
  }

  // Save format preference on change
  refs.formatSelect.addEventListener("change", () => {
    void browser.storage.local.set({ [FORMAT_STORAGE_KEY]: refs.formatSelect.value });
  });

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
