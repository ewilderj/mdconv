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

/**
 * Shows a success or failure badge on the extension icon for 2 seconds.
 * @param success - Whether to show success (✓) or failure (✗) badge
 */
async function showFirefoxBadge(success: boolean): Promise<void> {
  if (success) {
    await browser.action.setBadgeText({ text: "✓" });
    await browser.action.setBadgeBackgroundColor({ color: "#1b8a5a" });
  } else {
    await browser.action.setBadgeText({ text: "✗" });
    await browser.action.setBadgeBackgroundColor({ color: "#d93025" });
  }
  
  setTimeout(() => {
    browser.action.setBadgeText({ text: "" });
  }, 2000);
}

browser.runtime.onInstalled.addListener(() => {
  // Create context menu item for text selection
  browser.contextMenus.create({
    id: "copyAsMarkdown",
    title: "Copy as Markdown",
    contexts: ["selection"]
  });
  
  // Create context menu item for extension icon (right-click on toolbar icon)
  browser.contextMenus.create({
    id: "openHelp",
    title: "How to use",
    contexts: ["action"]
  });
});

// Handle keyboard shortcut command
browser.commands.onCommand.addListener(async (command) => {
  if (command === "convert-clipboard") {
    // Get the active tab to run the content script
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      // No active tab - silent no-op
      return;
    }

    try {
      let response;
      
      try {
        // Try to send message to content script first
        response = await browser.tabs.sendMessage(tab.id, {
          action: "convertSelectionForShortcut"
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
          action: "convertSelectionForShortcut"
        });
      }
      
      // No selection = silent no-op (matches Cmd+C behavior)
      if (response?.noSelection) {
        return;
      }
      
      await showFirefoxBadge(response?.success ?? false);
    } catch (error) {
      await showFirefoxBadge(false);
    }
  }
});

browser.contextMenus.onClicked.addListener(async (info, tab) => {
  // Handle help menu item
  if (info.menuItemId === "openHelp") {
    await browser.tabs.create({
      url: "https://github.com/ewilderj/mdconv/blob/main/HELP.md"
    });
    return;
  }
  
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
        await showFirefoxBadge(true);
      } else {
        throw new Error(response?.error || "Conversion failed");
      }
    } catch (error) {
      await showFirefoxBadge(false);
    }
  }
});
