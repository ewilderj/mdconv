import { ClipboardAdapter } from "../../../core/adapters/index.js";
import { mdlog } from "../../../core/logging.js";

/**
 * Chrome extension clipboard adapter using the browser's clipboard API.
 */
export class ChromeClipboardAdapter implements ClipboardAdapter {
  async readHtml(): Promise<string | null> {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        if (item.types.includes('text/html')) {
          const htmlBlob = await item.getType('text/html');
          return await htmlBlob.text();
        }
      }
      return null;
    } catch (error) {
      mdlog('warn', 'clipboard', 'Failed to read HTML from clipboard', error);
      return null;
    }
  }

  async readText(): Promise<string | null> {
    try {
      return await navigator.clipboard.readText();
    } catch (error) {
      mdlog('warn', 'clipboard', 'Failed to read text from clipboard', error);
      return null;
    }
  }

  async writeText(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      mdlog('error', 'clipboard', 'Failed to write text to clipboard', error);
      throw error;
    }
  }
}