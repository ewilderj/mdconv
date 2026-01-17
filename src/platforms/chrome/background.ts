/// <reference types="chrome" />

const RICH_TEXT_TARGET_STORAGE_KEY = "mdconv.richTextTarget";

/**
 * Shows a success or failure badge on the extension icon for 2 seconds.
 * @param success - Whether to show success (✓) or failure (✗) badge
 */
async function showChromeBadge(success: boolean): Promise<void> {
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

/**
 * Gets the stored rich text target preference.
 */
async function getRichTextTarget(): Promise<string> {
  try {
    const stored = await chrome.storage.local.get(RICH_TEXT_TARGET_STORAGE_KEY);
    return stored[RICH_TEXT_TARGET_STORAGE_KEY] || "google-docs";
  } catch (error) {
    return "google-docs";
  }
}

chrome.runtime.onInstalled.addListener(() => {
  // Create context menu items for text selection
  chrome.contextMenus.create({
    id: "copyAsMarkdown",
    title: "Copy as Markdown",
    contexts: ["selection"]
  });
  
  chrome.contextMenus.create({
    id: "copyAsOrg",
    title: "Copy as Org",
    contexts: ["selection"]
  });
  
  chrome.contextMenus.create({
    id: "copyAsRichText",
    title: "Copy as Rich Text",
    contexts: ["selection"]
  });
  
  // Create context menu item for extension icon (right-click on toolbar icon)
  chrome.contextMenus.create({
    id: "openHelp",
    title: "How to use",
    contexts: ["action"]
  });
});

// Handle keyboard shortcut commands
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "convert-clipboard" || command === "convert-clipboard-org" || command === "convert-clipboard-rich") {
    let format: string;
    let target: string | undefined;
    
    if (command === "convert-clipboard-org") {
      format = "org";
    } else if (command === "convert-clipboard-rich") {
      format = "rich";
      target = await getRichTextTarget();
    } else {
      format = "markdown";
    }
    
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
          action: "convertSelectionForShortcut",
          format,
          target
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
          action: "convertSelectionForShortcut",
          format,
          target
        });
      }
      
      // No selection = silent no-op (matches Cmd+C behavior)
      if (response?.noSelection) {
        return;
      }
      
      await showChromeBadge(response?.success ?? false);
    } catch (error) {
      await showChromeBadge(false);
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
  
  // Handle copy as Markdown/Org/Rich Text
  const isMarkdown = info.menuItemId === "copyAsMarkdown";
  const isOrg = info.menuItemId === "copyAsOrg";
  const isRichText = info.menuItemId === "copyAsRichText";
  
  if ((isMarkdown || isOrg || isRichText) && info.selectionText && tab?.id) {
    let format: string;
    let target: string | undefined;
    
    if (isOrg) {
      format = "org";
    } else if (isRichText) {
      format = "rich";
      target = await getRichTextTarget();
    } else {
      format = "markdown";
    }
    
    try {
      let response;
      
      try {
        // Try to send message to content script first
        response = await chrome.tabs.sendMessage(tab.id, {
          action: "convertSelection",
          format,
          target
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
          action: "convertSelection",
          format,
          target
        });
      }
      
      if (response && response.success) {
        await showChromeBadge(true);
      } else {
        throw new Error(response?.error || "Conversion failed");
      }
    } catch (error) {
      await showChromeBadge(false);
    }
  }
});
