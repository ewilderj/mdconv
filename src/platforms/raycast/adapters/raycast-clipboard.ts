import { Clipboard } from "@raycast/api";
import { ClipboardAdapter } from "../../../core/adapters/index.js";

/**
 * Raycast clipboard adapter using Raycast's clipboard API.
 */
export class RaycastClipboardAdapter implements ClipboardAdapter {
  async readHtml(): Promise<string | null> {
    try {
      const content = await Clipboard.read({ type: "text/html" });
      return content || null;
    } catch (error) {
      console.warn('Failed to read HTML from clipboard:', error);
      return null;
    }
  }

  async readText(): Promise<string | null> {
    try {
      const content = await Clipboard.readText();
      return content || null;
    } catch (error) {
      console.warn('Failed to read text from clipboard:', error);
      return null;
    }
  }

  async writeText(text: string): Promise<void> {
    try {
      await Clipboard.copy(text);
    } catch (error) {
      console.error('Failed to write text to clipboard:', error);
      throw error;
    }
  }
}