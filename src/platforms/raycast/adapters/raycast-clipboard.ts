import { Clipboard } from "@raycast/api";
import { ClipboardAdapter } from "../../../core/adapters/index.js";

const debugProcess = (globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
}).process;

const DEBUG_CLIPBOARD = ["1", "true", "TRUE"].includes(
  debugProcess?.env?.MDCONV_DEBUG_CLIPBOARD ?? ""
);

const debugLog = (...args: unknown[]) => {
  if (DEBUG_CLIPBOARD) {
    console.log(...args);
  }
};

/**
 * Raycast clipboard adapter that uses macOS pbpaste to access HTML clipboard content.
 */
export class RaycastClipboardAdapter implements ClipboardAdapter {
  async readHtml(): Promise<string | null> {
    try {
  debugLog('Attempting to read HTML from system clipboard (v2)...');
      
      // Use dynamic import to avoid TypeScript issues
      const { execSync } = await import('child_process');
      
      // Try the public.html format which we know works for Word/Office content
      try {
  debugLog('Reading HTML from public.html format...');
        const content = execSync('pbpaste -Prefer public.html', { 
          encoding: 'utf8', 
          timeout: 2000,
          stdio: ['pipe', 'pipe', 'pipe']
        });
        
        if (content && typeof content === 'string' && content.trim()) {
          // Check if it actually contains HTML tags
          if (content.includes('<') && content.includes('>')) {
            debugLog(`Found HTML content (${content.length} chars):`, content.substring(0, 200) + '...');
            
            return content;
          }
        }
      } catch (error) {
  debugLog('public.html format failed:', error);
      }

      // Try default pbpaste without format specification
      try {
  debugLog('Trying default pbpaste...');
        const defaultContent = execSync('pbpaste', { 
          encoding: 'utf8', 
          timeout: 2000,
          stdio: ['pipe', 'pipe', 'pipe']
        });
        
  debugLog('Default content:', typeof defaultContent, defaultContent.length, defaultContent.substring(0, 100));
      } catch (error) {
  debugLog('Default pbpaste failed:', error);
      }

  debugLog('No HTML content found in clipboard');
      return null;
    } catch (error) {
      console.warn('Failed to read HTML from clipboard:', error);
      return null;
    }
  }

  async readText(): Promise<string | null> {
    try {
      const content = await Clipboard.readText();
      // Ensure we return a string or null
      if (typeof content === 'string') {
        return content;
      }
      return null;
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