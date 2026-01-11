// src/platforms/firefox/background.ts
if (typeof browser === "undefined") {
  globalThis.browser = chrome;
}
async function showFirefoxBadge(success) {
  if (success) {
    await browser.action.setBadgeText({ text: "\u2713" });
    await browser.action.setBadgeBackgroundColor({ color: "#1b8a5a" });
  } else {
    await browser.action.setBadgeText({ text: "\u2717" });
    await browser.action.setBadgeBackgroundColor({ color: "#d93025" });
  }
  setTimeout(() => {
    browser.action.setBadgeText({ text: "" });
  }, 2e3);
}
browser.runtime.onInstalled.addListener(() => {
  browser.contextMenus.create({
    id: "copyAsMarkdown",
    title: "Copy as Markdown",
    contexts: ["selection"]
  });
  browser.contextMenus.create({
    id: "openHelp",
    title: "How to use",
    contexts: ["action"]
  });
});
browser.commands.onCommand.addListener(async (command) => {
  if (command === "convert-clipboard") {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      return;
    }
    try {
      let response;
      try {
        response = await browser.tabs.sendMessage(tab.id, {
          action: "convertSelectionForShortcut"
        });
      } catch (error) {
        await browser.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content-script.js"]
        });
        await new Promise((resolve) => setTimeout(resolve, 100));
        response = await browser.tabs.sendMessage(tab.id, {
          action: "convertSelectionForShortcut"
        });
      }
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
        response = await browser.tabs.sendMessage(tab.id, {
          action: "convertSelection"
        });
      } catch (error) {
        await browser.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content-script.js"]
        });
        await new Promise((resolve) => setTimeout(resolve, 100));
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
//# sourceMappingURL=background.js.map
