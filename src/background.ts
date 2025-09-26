/// <reference types="chrome" />

chrome.runtime.onInstalled.addListener(() => {
  console.info("Markdown Clipboard Converter installed");
});
