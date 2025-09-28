import { Clipboard } from "@raycast/api";
import { ClipboardAdapter } from "../../../core/adapters/index.js";

/**
 * Raycast clipboard adapter that uses macOS pbpaste to access HTML clipboard content.
 */
export class RaycastClipboardAdapter implements ClipboardAdapter {
  async readHtml(): Promise<string | null> {
    try {
      console.log('Attempting to read HTML from system clipboard (v2)...');
      
      // Use dynamic import to avoid TypeScript issues
      const { execSync } = await import('child_process');
      
      // First, let's see what formats are actually available
      try {
        console.log('Checking available clipboard formats...');
        const availableTypes = execSync('pbpaste -Prefer plist', { 
          encoding: 'utf8', 
          timeout: 2000,
          stdio: ['pipe', 'pipe', 'pipe']
        });
        console.log('Available clipboard types:', availableTypes);
      } catch (error) {
        console.log('Could not get clipboard types:', error);
      }

      // Try the public.html format which we know works for Word/Office content
      try {
        console.log('Reading HTML from public.html format...');
        const content = execSync('pbpaste -Prefer public.html', { 
          encoding: 'utf8', 
          timeout: 2000,
          stdio: ['pipe', 'pipe', 'pipe']
        });
        
        if (content && typeof content === 'string' && content.trim()) {
          // Check if it actually contains HTML tags
          if (content.includes('<') && content.includes('>')) {
            console.log(`Found HTML content (${content.length} chars):`, content.substring(0, 200) + '...');
            
            // Save the full HTML content to a file for analysis
            try {
              const fs = await import('fs');
              const path = await import('path');
              const timestamp = Date.now();
              const filePath = path.join('/tmp', `raycast-clipboard-${timestamp}.html`);
              await fs.promises.writeFile(filePath, content, 'utf8');
              console.log(`Full HTML saved to: ${filePath}`);
            } catch (err) {
              console.log('Could not save HTML file:', err);
            }
            
            return content;
          }
        }
      } catch (error) {
        console.log('public.html format failed:', error);
      }

      // Try RTF format (Rich Text Format)
      try {
        console.log('Trying RTF format...');
        const rtfContent = execSync('pbpaste -Prefer rtf', { 
          encoding: 'utf8', 
          timeout: 2000,
          stdio: ['pipe', 'pipe', 'pipe']
        });
        
        console.log('RTF content:', typeof rtfContent, rtfContent.length, rtfContent.substring(0, 100));
        
        if (rtfContent && typeof rtfContent === 'string' && rtfContent.trim()) {
          if (rtfContent.startsWith('{\\rtf')) {
            console.log('Found RTF content, but conversion not implemented yet');
            // TODO: Implement RTF to HTML conversion
            return null;
          }
        }
      } catch (error) {
        console.log('pbpaste RTF read failed:', error);
      }

      // Try default pbpaste without format specification
      try {
        console.log('Trying default pbpaste...');
        const defaultContent = execSync('pbpaste', { 
          encoding: 'utf8', 
          timeout: 2000,
          stdio: ['pipe', 'pipe', 'pipe']
        });
        
        console.log('Default content:', typeof defaultContent, defaultContent.length, defaultContent.substring(0, 100));
      } catch (error) {
        console.log('Default pbpaste failed:', error);
      }

      console.log('No HTML content found in clipboard');
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