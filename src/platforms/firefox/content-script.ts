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
    try {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        sendResponse({ success: false, error: "No selection found" });
        return true;
      }

      const range = selection.getRangeAt(0);
      const container = document.createElement('div');
      container.appendChild(range.cloneContents());
      
      const html = container.innerHTML;
      const text = selection.toString();

      // Use Firefox converter to convert selection to Markdown
      const markdown = firefoxConverter.convertClipboardPayload(html || undefined, text || undefined);

      // Copy to clipboard
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
    
    // Return true to indicate we'll send response asynchronously
    return true;
  }
  
  // Return false for unhandled messages
  return false;
});
