/// <reference types="chrome" />
import { convertClipboardPayload } from "./converter";

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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

      // Use your existing converter with a proper DOMParser
      const markdown = convertClipboardPayload(html || undefined, text || undefined, {
        domParser: new DOMParser()
      });

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