/// <reference types="chrome" />

chrome.runtime.onInstalled.addListener(() => {
  // Create context menu item
  chrome.contextMenus.create({
    id: "copyAsMarkdown",
    title: "Copy as Markdown",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
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
        // Show success badge
        await chrome.action.setBadgeText({ text: "✓" });
        await chrome.action.setBadgeBackgroundColor({ color: "#1b8a5a" });
      } else {
        throw new Error(response?.error || "Conversion failed");
      }
      
      // Clear badge after 2 seconds
      setTimeout(() => {
        chrome.action.setBadgeText({ text: "" });
      }, 2000);
      
    } catch (error) {
      // Show error badge
      await chrome.action.setBadgeText({ text: "✗" });
      await chrome.action.setBadgeBackgroundColor({ color: "#d93025" });
      
      setTimeout(() => {
        chrome.action.setBadgeText({ text: "" });
      }, 2000);
    }
  }
});
