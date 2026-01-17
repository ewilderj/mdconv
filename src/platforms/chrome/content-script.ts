/// <reference types="chrome" />
import { chromeConverter } from "./chrome-converter.js";
import { convertMarkdownToOrg } from "../../core/md-to-org.js";
import { convertMarkdownToHtml, convertPlainTextToHtml } from "../../core/md-to-html.js";
import { detectInputFormat } from "../../core/format-detection.js";
import { type HtmlTarget } from "../../core/html-targets.js";

type OutputFormat = "markdown" | "org" | "rich";

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "convertSelection") {
    handleConvertSelection(sendResponse, request.format || "markdown", request.target);
    return true; // Will send response asynchronously
  }
  
  if (request.action === "convertSelectionForShortcut") {
    handleConvertSelectionForShortcut(sendResponse, request.format || "markdown", request.target);
    return true; // Will send response asynchronously
  }
  
  // Return false for unhandled messages
  return false;
});

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
 * Handles converting the current text selection to Markdown, Org, or Rich Text.
 * Used by the context menu "Copy as Markdown/Org/Rich Text" feature.
 */
function handleConvertSelection(sendResponse: (response: unknown) => void, format: OutputFormat, target?: HtmlTarget): void {
  try {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      sendResponse({ success: false, error: "No selection found" });
      return;
    }

    const range = selection.getRangeAt(0);
    const container = document.createElement('div');
    container.appendChild(range.cloneContents());
    
    const html = container.innerHTML;
    const text = selection.toString();

    if (format === "rich") {
      // Convert plain text to rich HTML
      const detectedFormat = detectInputFormat(text);
      const richTarget = target || "google-docs";
      
      let richHtml: string;
      if (detectedFormat === "markdown") {
        richHtml = convertMarkdownToHtml(text, { target: richTarget });
      } else {
        richHtml = convertPlainTextToHtml(text, { target: richTarget });
      }
      
      writeRichClipboard(richHtml, text)
        .then(() => {
          sendResponse({ success: true, output: richHtml });
        })
        .catch((error) => {
          sendResponse({ success: false, error: (error as Error).message });
        });
    } else {
      // Convert to Markdown or Org
      const markdown = chromeConverter.convertClipboardPayload(html || undefined, text || undefined);
      const output = format === "org" ? convertMarkdownToOrg(markdown) : markdown;

      navigator.clipboard.writeText(output)
        .then(() => {
          sendResponse({ success: true, output });
        })
        .catch((error) => {
          sendResponse({ success: false, error: (error as Error).message, output });
        });
    }

  } catch (error) {
    sendResponse({ success: false, error: (error as Error).message });
  }
}

/**
 * Handles converting selection to Markdown, Org, or Rich Text for keyboard shortcut.
 * Returns noSelection: true if nothing is selected (silent no-op).
 */
function handleConvertSelectionForShortcut(sendResponse: (response: unknown) => void, format: OutputFormat, target?: HtmlTarget): void {
  try {
    const selection = window.getSelection();
    
    // No selection = silent no-op (matches Cmd+C behavior)
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      sendResponse({ success: true, noSelection: true });
      return;
    }

    const range = selection.getRangeAt(0);
    const container = document.createElement('div');
    container.appendChild(range.cloneContents());
    
    const html = container.innerHTML;
    const text = selection.toString();

    if (format === "rich") {
      // Convert plain text to rich HTML
      const detectedFormat = detectInputFormat(text);
      const richTarget = target || "google-docs";
      
      let richHtml: string;
      if (detectedFormat === "markdown") {
        richHtml = convertMarkdownToHtml(text, { target: richTarget });
      } else {
        richHtml = convertPlainTextToHtml(text, { target: richTarget });
      }
      
      writeRichClipboard(richHtml, text)
        .then(() => {
          sendResponse({ success: true, output: richHtml });
        })
        .catch((error) => {
          sendResponse({ success: false, error: (error as Error).message });
        });
    } else {
      // Convert to Markdown or Org
      const markdown = chromeConverter.convertClipboardPayload(html || undefined, text || undefined);
      const output = format === "org" ? convertMarkdownToOrg(markdown) : markdown;

      navigator.clipboard.writeText(output)
        .then(() => {
          sendResponse({ success: true, output });
        })
        .catch((error) => {
          sendResponse({ success: false, error: (error as Error).message, output });
        });
    }

  } catch (error) {
    const errorMessage = (error as Error).message;
    console.error("[mdconv] Selection conversion failed:", errorMessage);
    sendResponse({ success: false, error: errorMessage });
  }
}