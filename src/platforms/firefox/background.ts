/**
 * Firefox extension background script.
 * Handles context menu creation and selection-to-markdown conversion.
 * Uses browser.* API which works in both Firefox and modern Chrome.
 */
/// <reference types="chrome" />

// Cross-browser compatibility shim - Firefox provides browser, Chrome provides chrome
declare const browser: typeof chrome;
if (typeof browser === 'undefined') {
  // @ts-ignore - make browser available in Chrome
  globalThis.browser = chrome;
}

browser.runtime.onInstalled.addListener(() => {
  // Create context menu item
  browser.contextMenus.create({
    id: "copyAsMarkdown",
    title: "Copy as Markdown",
    contexts: ["selection"]
  });
});

browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "copyAsMarkdown" && info.selectionText && tab?.id) {
    try {
      let response;
      
      try {
        // Try to send message to content script first
        response = await browser.tabs.sendMessage(tab.id, {
          action: "convertSelection"
        });
      } catch (error) {
        // If content script isn't available, inject it and try again
        await browser.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content-script.js']
        });
        
        // Wait a moment for the script to load
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Try sending the message again
        response = await browser.tabs.sendMessage(tab.id, {
          action: "convertSelection"
        });
      }
      
      if (response && response.success) {
        // Show success badge
        await browser.action.setBadgeText({ text: "✓" });
        await browser.action.setBadgeBackgroundColor({ color: "#1b8a5a" });
      } else {
        throw new Error(response?.error || "Conversion failed");
      }
      
      // Clear badge after 2 seconds
      setTimeout(() => {
        browser.action.setBadgeText({ text: "" });
      }, 2000);
      
    } catch (error) {
      // Show error badge
      await browser.action.setBadgeText({ text: "✗" });
      await browser.action.setBadgeBackgroundColor({ color: "#d93025" });
      
      setTimeout(() => {
        browser.action.setBadgeText({ text: "" });
      }, 2000);
    }
  }
});
