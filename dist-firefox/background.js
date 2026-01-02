// src/platforms/firefox/background.ts
if (typeof browser === "undefined") {
  globalThis.browser = chrome;
}
browser.runtime.onInstalled.addListener(() => {
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
        await browser.action.setBadgeText({ text: "\u2713" });
        await browser.action.setBadgeBackgroundColor({ color: "#1b8a5a" });
      } else {
        throw new Error(response?.error || "Conversion failed");
      }
      setTimeout(() => {
        browser.action.setBadgeText({ text: "" });
      }, 2e3);
    } catch (error) {
      await browser.action.setBadgeText({ text: "\u2717" });
      await browser.action.setBadgeBackgroundColor({ color: "#d93025" });
      setTimeout(() => {
        browser.action.setBadgeText({ text: "" });
      }, 2e3);
    }
  }
});
//# sourceMappingURL=background.js.map
