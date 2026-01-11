/**
 * Firefox extension content script.
 * Handles selection-to-markdown conversion in web pages.
 * Uses browser.* API which works in both Firefox and modern Chrome.
 */
/// <reference types="chrome" />

// Cross-browser compatibility shim - Firefox provides browser, Chrome provides chrome
declare const browser: typeof chrome;
if (typeof browser === 'undefined') {
  // @ts-ignore - make browser available in Chrome
  globalThis.browser = chrome;
}

import { firefoxConverter } from "./firefox-converter.js";
import { convertMarkdownToOrg } from "../../core/md-to-org.js";

type OutputFormat = "markdown" | "org";

// Listen for messages from the background script
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
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
 * @param sendResponse - Callback to send result back to background script
 * @param format - Output format: "markdown" or "org"
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

    let result = firefoxConverter.convertClipboardPayload(html || undefined, text || undefined);
    
    if (format === "org") {
      result = convertMarkdownToOrg(result);
    }

    navigator.clipboard.writeText(result)
      .then(() => {
        sendResponse({ success: true, markdown: result });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message, markdown: result });
      });

  } catch (error) {
    sendResponse({ success: false, error: (error as Error).message });
  }
}

/**
 * Handles converting selection to Markdown or Org for keyboard shortcut.
 * Returns noSelection: true if nothing is selected (silent no-op).
 * @param sendResponse - Callback to send result back to background script
 * @param format - Output format: "markdown" or "org"
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

    let result = firefoxConverter.convertClipboardPayload(html || undefined, text || undefined);
    
    if (format === "org") {
      result = convertMarkdownToOrg(result);
    }

    navigator.clipboard.writeText(result)
      .then(() => {
        sendResponse({ success: true, markdown: result });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message, markdown: result });
      });

  } catch (error) {
    const errorMessage = (error as Error).message;
    console.error("[mdconv] Selection conversion failed:", errorMessage);
    sendResponse({ success: false, error: errorMessage });
  }
}
