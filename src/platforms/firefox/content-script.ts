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

// Listen for messages from the background script
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "convertSelection") {
    handleConvertSelection(sendResponse);
    return true; // Will send response asynchronously
  }
  
  if (request.action === "convertSelectionForShortcut") {
    handleConvertSelectionForShortcut(sendResponse);
    return true; // Will send response asynchronously
  }
  
  // Return false for unhandled messages
  return false;
});

/**
 * Handles converting the current text selection to Markdown.
 * Used by the context menu "Copy as Markdown" feature.
 */
function handleConvertSelection(sendResponse: (response: unknown) => void): void {
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

    const markdown = firefoxConverter.convertClipboardPayload(html || undefined, text || undefined);

    navigator.clipboard.writeText(markdown)
      .then(() => {
        sendResponse({ success: true, markdown });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message, markdown });
      });

  } catch (error) {
    sendResponse({ success: false, error: (error as Error).message });
  }
}

/**
 * Handles converting selection to Markdown for keyboard shortcut.
 * Returns noSelection: true if nothing is selected (silent no-op).
 */
function handleConvertSelectionForShortcut(sendResponse: (response: unknown) => void): void {
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

    const markdown = firefoxConverter.convertClipboardPayload(html || undefined, text || undefined);

    navigator.clipboard.writeText(markdown)
      .then(() => {
        sendResponse({ success: true, markdown });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message, markdown });
      });

  } catch (error) {
    const errorMessage = (error as Error).message;
    console.error("[mdconv] Selection conversion failed:", errorMessage);
    sendResponse({ success: false, error: errorMessage });
  }
}
