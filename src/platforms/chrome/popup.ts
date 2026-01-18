import { chromeConverter } from "./chrome-converter.js";
import { convertMarkdownToOrg } from "../../core/md-to-org.js";
import { convertMarkdownToSlack } from "../../core/md-to-slack.js";
import { convertMarkdownToHtml, convertPlainTextToHtml } from "../../core/md-to-html.js";
import { convertOrgToHtml } from "../../core/org-to-html.js";
import { detectInputFormat, getFormatLabel, type DetectedFormat } from "../../core/format-detection.js";
import { type HtmlTarget, isTextTarget } from "../../core/html-targets.js";

console.log('[mdconv] popup.ts loaded');

type Tone = "info" | "success" | "error";
type OutputFormat = "markdown" | "org";
type ConversionMode = "to-markdown" | "to-rich-text";

type UIRefs = {
  pasteButton: HTMLButtonElement;
  convertToRichButton: HTMLButtonElement;
  clearButton: HTMLButtonElement;
  flipModeButton: HTMLButtonElement;
  formatSelect: HTMLSelectElement;
  targetSelect: HTMLSelectElement;
  toMarkdownControls: HTMLElement;
  toRichTextControls: HTMLElement;
  modeLabel: HTMLElement;
  helperText: HTMLElement;
  output: HTMLTextAreaElement;
  status: HTMLElement;
};

const DEBUG_CLIPBOARD_FLAG = "mdconv.debugClipboard";
const FORMAT_STORAGE_KEY = "mdconv.outputFormat";
const TARGET_STORAGE_KEY = "mdconv.richTextTarget";
const MODE_STORAGE_KEY = "mdconv.conversionMode";

let currentMode: ConversionMode = "to-markdown";

// Store last input for reconversion when format changes
let lastRichTextInput: { html?: string; plain?: string } | null = null;
let lastPlainTextInput: string | null = null;

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
  const convertToRichButton = document.getElementById("convertToRichButton") as HTMLButtonElement | null;
  const clearButton = document.getElementById("clearButton") as HTMLButtonElement | null;
  const flipModeButton = document.getElementById("flipModeButton") as HTMLButtonElement | null;
  const formatSelect = document.getElementById("formatSelect") as HTMLSelectElement | null;
  const targetSelect = document.getElementById("targetSelect") as HTMLSelectElement | null;
  const toMarkdownControls = document.getElementById("toMarkdownControls") as HTMLElement | null;
  const toRichTextControls = document.getElementById("toRichTextControls") as HTMLElement | null;
  const modeLabel = document.getElementById("modeLabel") as HTMLElement | null;
  const helperText = document.getElementById("helperText") as HTMLElement | null;
  const output = document.getElementById("output") as HTMLTextAreaElement | null;
  const status = document.getElementById("status");

  // Debug: log which elements are missing
  const missing: string[] = [];
  if (!pasteButton) missing.push('pasteButton');
  if (!convertToRichButton) missing.push('convertToRichButton');
  if (!clearButton) missing.push('clearButton');
  if (!flipModeButton) missing.push('flipModeButton');
  if (!formatSelect) missing.push('formatSelect');
  if (!targetSelect) missing.push('targetSelect');
  if (!toMarkdownControls) missing.push('toMarkdownControls');
  if (!toRichTextControls) missing.push('toRichTextControls');
  if (!modeLabel) missing.push('modeLabel');
  if (!helperText) missing.push('helperText');
  if (!output) missing.push('output');
  if (!status) missing.push('status');
  
  if (missing.length > 0) {
    console.error('[mdconv] Missing UI elements:', missing);
    return null;
  }

  return { 
    pasteButton: pasteButton!,
    convertToRichButton: convertToRichButton!,
    clearButton: clearButton!,
    flipModeButton: flipModeButton!,
    formatSelect: formatSelect!,
    targetSelect: targetSelect!,
    toMarkdownControls: toMarkdownControls!,
    toRichTextControls: toRichTextControls!,
    modeLabel: modeLabel!,
    helperText: helperText!,
    output: output!,
    status: status!
  };
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

/**
 * Writes both HTML and plain text to clipboard for rich text paste.
 */
async function writeRichClipboard(html: string, plainText: string): Promise<void> {
  const htmlBlob = new Blob([html], { type: 'text/html' });
  const textBlob = new Blob([plainText], { type: 'text/plain' });
  await navigator.clipboard.write([
    new ClipboardItem({
      'text/html': htmlBlob,
      'text/plain': textBlob
    })
  ]);
}

/**
 * Checks if HTML content has meaningful rich formatting.
 * Many apps wrap plain text in minimal HTML - we should treat that as plain text.
 */
function hasRichFormatting(html: string): boolean {
  // Check for actual formatting elements
  const richPatterns: [RegExp, string][] = [
    [/<h[1-6]\b/i, "heading"],
    [/<(strong|b)\b/i, "bold-tag"],
    [/<(em|i)\b/i, "italic-tag"],
    [/<(u|s|strike)\b/i, "underline/strike"],
    [/<(ul|ol|li)\b/i, "list"],
    [/<table\b/i, "table"],
    [/<(pre|code)\b/i, "code"],
    [/<blockquote\b/i, "blockquote"],
    [/<a\s+href/i, "link"],
    [/<img\s+src/i, "image"],
    [/style\s*=\s*["'][^"']*font-weight\s*:\s*(bold|[6-9]\d\d)/i, "bold-style"],
    [/style\s*=\s*["'][^"']*font-style\s*:\s*italic/i, "italic-style"],
    [/docs-internal-guid-/i, "google-docs"],
    [/mso-/i, "ms-office-style"],
    [/class\s*=\s*["'][^"']*Mso/i, "ms-office-class"],
  ];
  
  const matches: string[] = [];
  for (const [pattern, name] of richPatterns) {
    if (pattern.test(html)) {
      matches.push(name);
    }
  }
  
  const hasRich = matches.length > 0;
  
  // Debug logging
  console.log('[mdconv] hasRichFormatting check:', {
    htmlLength: html.length,
    htmlPreview: html.slice(0, 500),
    matchedPatterns: matches,
    result: hasRich
  });
  
  return hasRich;
}

/**
 * Determines if clipboard contains rich text (HTML) or plain text.
 */
async function detectClipboardMode(): Promise<{ mode: ConversionMode; html?: string; plain?: string; detectedFormat?: DetectedFormat }> {
  const { html, plain } = await readClipboardAsHtml();
  
  console.log('[mdconv] detectClipboardMode:', {
    hasHtml: !!html,
    htmlLength: html?.length ?? 0,
    hasPlain: !!plain,
    plainLength: plain?.length ?? 0,
    plainPreview: plain?.slice(0, 200)
  });
  
  // If we have HTML AND it actually contains rich formatting, use rich text mode
  if (html && html.trim() && hasRichFormatting(html)) {
    console.log('[mdconv] Mode: to-markdown (rich HTML detected)');
    return { mode: "to-markdown", html, plain };
  }
  
  // Plain text (or HTML without meaningful formatting) → detect format and offer rich text conversion
  if (plain && plain.trim()) {
    const detectedFormat = detectInputFormat(plain);
    console.log('[mdconv] Mode: to-rich-text, detected format:', detectedFormat);
    return { mode: "to-rich-text", plain, detectedFormat };
  }
  
  // Empty clipboard - default to Markdown mode
  console.log('[mdconv] Mode: to-markdown (empty clipboard)');
  return { mode: "to-markdown" };
}

/**
 * Updates the UI to show the appropriate controls based on conversion mode.
 */
function setConversionMode(refs: UIRefs, mode: ConversionMode, detectedFormat?: DetectedFormat): void {
  if (mode === "to-markdown") {
    refs.toMarkdownControls.classList.remove("hidden");
    refs.toRichTextControls.classList.add("hidden");
    refs.modeLabel.textContent = "Rich Text → Markdown";
    refs.helperText.textContent = "Paste formatted content (Word, Google Docs, etc.) to convert.";
  } else {
    refs.toMarkdownControls.classList.add("hidden");
    refs.toRichTextControls.classList.remove("hidden");
    refs.modeLabel.textContent = "Markdown → Rich Text";
    refs.helperText.textContent = "Paste Markdown to convert for Google Docs or Word.";
  }
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
    
    // Store input for reconversion when format changes
    lastRichTextInput = { html, plain };
    
    const markdown = chromeConverter.convertClipboardPayload(html, plain);
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
  
  if (currentMode === "to-markdown") {
    // Store input for reconversion when format changes
    lastRichTextInput = { html: html || undefined, plain: plain || undefined };
    
    // Rich text → Markdown mode: convert pasted content
    if (html && html.trim() && hasRichFormatting(html)) {
      const markdown = chromeConverter.convertClipboardPayload(html, plain);
      logClipboardDebug({ source: "paste -> markdown", markdown });

      if (!markdown) {
        setStatus(refs, "Clipboard data was empty.", "error");
        refs.output.value = "";
        return;
      }

      const context = "Converted pasted rich text";
      await presentMarkdown(refs, markdown, context);
    } else if (plain && plain.trim()) {
      // Plain text in markdown mode - just convert it as plain
      const markdown = chromeConverter.convertClipboardPayload(undefined, plain);
      if (markdown) {
        await presentMarkdown(refs, markdown, "Converted pasted text");
      } else {
        refs.output.value = plain;
        setStatus(refs, "Pasted plain text (no conversion needed).", "info");
      }
    } else {
      setStatus(refs, "Clipboard data was empty.", "error");
      refs.output.value = "";
    }
  } else {
    // Markdown → Rich text mode: store and prepare for conversion
    if (plain && plain.trim()) {
      lastPlainTextInput = plain;
      refs.output.value = plain;
      const detectedFormat = detectInputFormat(plain);
      setStatus(refs, `Pasted ${getFormatLabel(detectedFormat)}. Click "Convert" to convert to rich text.`, "info");
    } else {
      setStatus(refs, "Clipboard data was empty.", "error");
      refs.output.value = "";
    }
  }
}

/**
 * Handles conversion from plain text (Markdown/Org/plain) to rich HTML or Slack mrkdwn.
 */
async function handleConvertToRichText(refs: UIRefs) {
  setStatus(refs, "Converting…", "info");
  
  try {
    // Use stored input, or textarea content, or read from clipboard
    let plain = lastPlainTextInput || refs.output.value.trim();
    
    if (!plain) {
      setStatus(refs, "Reading clipboard…", "info");
      plain = await navigator.clipboard.readText();
    }
    
    if (!plain || !plain.trim()) {
      setStatus(refs, "No text content found. Paste some Markdown first.", "error");
      return;
    }
    
    // Store for reconversion when target changes
    lastPlainTextInput = plain;
    
    const detectedFormat = detectInputFormat(plain);
    const target = refs.targetSelect.value as HtmlTarget;
    
    setStatus(refs, `Converting ${getFormatLabel(detectedFormat)} to ${isTextTarget(target) ? 'text' : 'rich text'}…`, "info");
    
    // Handle Slack (text output) differently from HTML targets
    if (target === 'slack') {
      // For Slack, convert to mrkdwn (plain text)
      let slackText: string;
      if (detectedFormat === 'org') {
        // For Org, first convert to Markdown intermediary, then to Slack
        // This is a limitation - direct Org->Slack would be better
        slackText = convertMarkdownToSlack(plain);
      } else {
        // Markdown or plain text
        slackText = convertMarkdownToSlack(plain);
      }
      
      refs.output.value = slackText;
      
      // Write plain text to clipboard (Slack doesn't use HTML paste)
      await writeClipboard(slackText);
      
      setStatus(refs, "Slack mrkdwn copied to clipboard. Paste directly into Slack.", "success");
      return;
    }
    
    // HTML targets (Google Docs, Word, generic HTML)
    let html: string;
    if (detectedFormat === 'plain') {
      html = convertPlainTextToHtml(plain, { target });
    } else if (detectedFormat === 'org') {
      html = convertOrgToHtml(plain, { target });
    } else {
      // Markdown
      html = convertMarkdownToHtml(plain, { target });
    }
    
    refs.output.value = html;
    
    // Write rich HTML to clipboard
    await writeRichClipboard(html, plain);
    
    const targetLabel = target === 'google-docs' ? 'Google Docs' : 
                        target === 'word' ? 'Word' : 'HTML';
    setStatus(refs, `Rich text copied to clipboard (optimized for ${targetLabel}).`, "success");
    
  } catch (error) {
    setStatus(refs, "Conversion failed. Please try again.", "error");
  }
}

async function init() {
  console.log('[mdconv] init() starting');
  const refs = queryUI();
  if (!refs) {
    console.error('[mdconv] init() failed: queryUI returned null - check that all UI elements exist in popup.html');
    return;
  }
  console.log('[mdconv] UI refs acquired');

  refs.output.value = "";
  setStatus(refs, "", "info");

  // Restore saved format preferences
  try {
    const stored = await chrome.storage.local.get([FORMAT_STORAGE_KEY, TARGET_STORAGE_KEY, MODE_STORAGE_KEY]);
    if (stored[FORMAT_STORAGE_KEY] === "org" || stored[FORMAT_STORAGE_KEY] === "markdown") {
      refs.formatSelect.value = stored[FORMAT_STORAGE_KEY];
    }
    if (stored[TARGET_STORAGE_KEY] === "google-docs" || stored[TARGET_STORAGE_KEY] === "word" || stored[TARGET_STORAGE_KEY] === "html" || stored[TARGET_STORAGE_KEY] === "slack") {
      refs.targetSelect.value = stored[TARGET_STORAGE_KEY];
    }
    if (stored[MODE_STORAGE_KEY] === "to-markdown" || stored[MODE_STORAGE_KEY] === "to-rich-text") {
      currentMode = stored[MODE_STORAGE_KEY];
    }
  } catch (error) {
    // Ignore storage errors
  }

  // Set initial mode (persisted from last session or default to-markdown)
  console.log('[mdconv] Setting initial mode:', currentMode);
  setConversionMode(refs, currentMode);

  // Flip mode button
  refs.flipModeButton.addEventListener("click", () => {
    currentMode = currentMode === "to-markdown" ? "to-rich-text" : "to-markdown";
    setConversionMode(refs, currentMode);
    void chrome.storage.local.set({ [MODE_STORAGE_KEY]: currentMode });
    // Clear stored inputs and output when switching modes
    lastRichTextInput = null;
    lastPlainTextInput = null;
    refs.output.value = "";
    setStatus(refs, "", "info");
  });

  // Save format preference and reconvert if we have stored input
  refs.formatSelect.addEventListener("change", () => {
    void chrome.storage.local.set({ [FORMAT_STORAGE_KEY]: refs.formatSelect.value });
    // Reconvert if we have stored rich text input
    if (lastRichTextInput && (lastRichTextInput.html || lastRichTextInput.plain)) {
      const markdown = chromeConverter.convertClipboardPayload(lastRichTextInput.html, lastRichTextInput.plain);
      if (markdown) {
        void presentMarkdown(refs, markdown, "Reconverted to new format");
      }
    }
  });

  // Save target preference and reconvert if we have stored input
  refs.targetSelect.addEventListener("change", () => {
    void chrome.storage.local.set({ [TARGET_STORAGE_KEY]: refs.targetSelect.value });
    // Reconvert if we have stored plain text input
    if (lastPlainTextInput) {
      void handleConvertToRichText(refs);
    }
  });

  // Rich text → Markdown conversion
  refs.pasteButton.addEventListener("click", () => {
    void handleConversion(refs);
  });

  // Plain text → Rich text conversion
  refs.convertToRichButton.addEventListener("click", () => {
    void handleConvertToRichText(refs);
  });

  document.addEventListener("paste", (event) => {
    void handlePasteEvent(refs, event);
  });

  refs.clearButton.addEventListener("click", () => {
    refs.output.value = "";
    lastRichTextInput = null;
    lastPlainTextInput = null;
    setStatus(refs, "", "info");
  });
}

void init();
