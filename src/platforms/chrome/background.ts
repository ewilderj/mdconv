/// <reference types="chrome" />

/**
 * Shows a success or failure badge on the extension icon for 2 seconds.
 * @param success - Whether to show success (✓) or failure (✗) badge
 */
async function showBadge(success: boolean): Promise<void> {
  if (success) {
    await chrome.action.setBadgeText({ text: "✓" });
    await chrome.action.setBadgeBackgroundColor({ color: "#1b8a5a" });
  } else {
    await chrome.action.setBadgeText({ text: "✗" });
    await chrome.action.setBadgeBackgroundColor({ color: "#d93025" });
  }
  
  setTimeout(() => {
    chrome.action.setBadgeText({ text: "" });
  }, 2000);
}

chrome.runtime.onInstalled.addListener(() => {
  // Create context menu item for text selection
  chrome.contextMenus.create({
    id: "copyAsMarkdown",
    title: "Copy as Markdown",
    contexts: ["selection"]
  });
  
  // Create context menu item for extension icon (right-click on toolbar icon)
  chrome.contextMenus.create({
    id: "openHelp",
    title: "How to use",
    contexts: ["action"]
  });
});

// Handle keyboard shortcut command
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "convert-clipboard") {
    // Get the active tab to run the content script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      // No active tab - silent no-op
      return;
    }

    try {
      let response;
      
      try {
        // Try to send message to content script first
        response = await chrome.tabs.sendMessage(tab.id, {
          action: "convertSelectionForShortcut"
        });
      } catch (error) {
        // If content script isn't available, inject it and try again
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content-script.js']
        });
        
        // Wait a moment for the script to load
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Try sending the message again
        response = await chrome.tabs.sendMessage(tab.id, {
          action: "convertSelectionForShortcut"
        });
      }
      
      // No selection = silent no-op (matches Cmd+C behavior)
      if (response?.noSelection) {
        return;
      }
      
      await showBadge(response?.success ?? false);
    } catch (error) {
      await showBadge(false);
    }
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  // Handle help menu item
  if (info.menuItemId === "openHelp") {
    await chrome.tabs.create({
      url: "https://github.com/ewilderj/mdconv/blob/main/HELP.md"
    });
    return;
  }
  
  if (info.menuItemId === "copyAsMarkdown" && info.selectionText && tab?.id) {
    try {
      let response;
      
      try {
        // Try to send message to content script first
        response = await chrome.tabs.sendMessage(tab.id, {
          action: "convertSelection"
        });
      } catch (error) {
        // If content script isn't available, inject it and try again
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content-script.js']
        });
        
        // Wait a moment for the script to load
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Try sending the message again
        response = await chrome.tabs.sendMessage(tab.id, {
          action: "convertSelection"
        });
      }
      
      if (response && response.success) {
        await showBadge(true);
      } else {
        throw new Error(response?.error || "Conversion failed");
      }
    } catch (error) {
      await showBadge(false);
    }
  }
});
