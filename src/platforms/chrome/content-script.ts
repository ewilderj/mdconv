/// <reference types="chrome" />
import { chromeConverter } from "./chrome-converter.js";
import { convertMarkdownToOrg } from "../../core/md-to-org.js";

type OutputFormat = "markdown" | "org";

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "convertSelection") {
    handleConvertSelection(sendResponse, request.format || "markdown");
    return true; // Will send response asynchronously
  }
  
  if (request.action === "convertSelectionForShortcut") {
    handleConvertSelectionForShortcut(sendResponse, request.format || "markdown");
    return true; // Will send response asynchronously
  }
  
  // Return false for unhandled messages
  return false;
});

/**
 * Handles converting the current text selection to Markdown or Org.
 * Used by the context menu "Copy as Markdown/Org" feature.
 */
function handleConvertSelection(sendResponse: (response: unknown) => void, format: OutputFormat): void {
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

    const markdown = chromeConverter.convertClipboardPayload(html || undefined, text || undefined);
    const output = format === "org" ? convertMarkdownToOrg(markdown) : markdown;

    navigator.clipboard.writeText(output)
      .then(() => {
        sendResponse({ success: true, output });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message, output });
      });

  } catch (error) {
    sendResponse({ success: false, error: (error as Error).message });
  }
}

/**
 * Handles converting selection to Markdown or Org for keyboard shortcut.
 * Returns noSelection: true if nothing is selected (silent no-op).
 */
function handleConvertSelectionForShortcut(sendResponse: (response: unknown) => void, format: OutputFormat): void {
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

    const markdown = chromeConverter.convertClipboardPayload(html || undefined, text || undefined);
    const output = format === "org" ? convertMarkdownToOrg(markdown) : markdown;

    navigator.clipboard.writeText(output)
      .then(() => {
        sendResponse({ success: true, output });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message, output });
      });

  } catch (error) {
    const errorMessage = (error as Error).message;
    console.error("[mdconv] Selection conversion failed:", errorMessage);
    sendResponse({ success: false, error: errorMessage });
  }
}