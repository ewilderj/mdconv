import { Clipboard } from "@raycast/api";
import { ClipboardAdapter } from "../../../core/adapters/index.js";
import { mdlog } from "../../../core/logging.js";
import type { ExecSyncOptions } from "child_process";

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
 * 
 * IMPORTANT: We must ensure UTF-8 locale in the environment for execSync calls
 * because Raycast's child process environment doesn't have LANG set by default,
 * causing pbpaste to fall back to C/ASCII locale which mangles UTF-8 multi-byte
 * characters (like emoji). This was discovered through systematic debugging showing
 * that emoji bytes (f0 9f 8e af) were being corrupted to question marks (3f 3f).
 */
export class RaycastClipboardAdapter implements ClipboardAdapter {
  /**
   * Get execSync options with UTF-8 locale to prevent emoji corruption.
   * 
   * The issue: Raycast's environment has LC_ALL set to a complex Unicode locale
   * identifier (e.g., "en_US-u-hc-h12-u-ca-gregory-u-nu-latn") which pbpaste
   * doesn't understand, causing it to fall back to C/ASCII locale.
   * 
   * Solution: Override with a simple UTF-8 locale that pbpaste understands.
   * We try to preserve the user's language preference when possible.
   */
  private getExecOptions(): ExecSyncOptions {
    const env = { ...process.env };
    
    // LC_ALL overrides everything, so we need to handle it specially
    // If it exists but doesn't end with .UTF-8, we need to normalize it
    if (env.LC_ALL) {
      // Extract the base locale (e.g., "en_US" from "en_US-u-hc-h12-...")
      const baseLocale = env.LC_ALL.split('-')[0].split('.')[0];
      // Set a clean UTF-8 variant
      env.LC_ALL = `${baseLocale}.UTF-8`;
    }
    
    // Also ensure LANG is set with UTF-8
    if (!env.LANG || !env.LANG.includes('UTF-8')) {
      // Try to derive from LC_ALL if available, otherwise use en_US
      const baseLocale = env.LC_ALL 
        ? env.LC_ALL.split('.')[0] 
        : 'en_US';
      env.LANG = `${baseLocale}.UTF-8`;
    }
    
    return {
      timeout: 2000,
      env
    };
  }

  async readHtml(): Promise<string | null> {
    try {
  debugLog('Attempting to read HTML from system clipboard...');
      
      // Use dynamic import to avoid TypeScript issues
      const { execSync } = await import('child_process');
      
      const execOptions = this.getExecOptions();
      
      // Try the public.html format which we know works for Word/Office content
      try {
  debugLog('Reading HTML from public.html format...');
        const content = execSync('pbpaste -Prefer public.html', { 
          ...execOptions,
          encoding: 'utf8'
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
          ...execOptions,
          encoding: 'utf8'
        });
        
  debugLog('Default content:', typeof defaultContent, defaultContent.length, defaultContent.substring(0, 100));
      } catch (error) {
  debugLog('Default pbpaste failed:', error);
      }

  debugLog('No HTML content found in clipboard');
      return null;
    } catch (error) {
      mdlog('warn', 'clipboard', 'Failed to read HTML from clipboard', error);
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
      mdlog('warn', 'clipboard', 'Failed to read text from clipboard', error);
      return null;
    }
  }

  async writeText(text: string): Promise<void> {
    try {
      await Clipboard.copy(text);
    } catch (error) {
      mdlog('error', 'clipboard', 'Failed to write text to clipboard', error);
      throw error;
    }
  }
}