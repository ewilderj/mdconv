import { convertHtmlToMarkdown, convertClipboardPayload, ConversionOptions } from "../../core/converter.js";
import { RaycastClipboardAdapter, RaycastDOMParserAdapter } from "./adapters/index.js";

/**
 * Raycast-specific conversion service that uses Node.js APIs.
 */
export class RaycastConversionService {
  private clipboardAdapter: RaycastClipboardAdapter;
  private domParserAdapter: RaycastDOMParserAdapter;

  constructor() {
    this.clipboardAdapter = new RaycastClipboardAdapter();
    this.domParserAdapter = new RaycastDOMParserAdapter();
  }

  /**
   * Convert HTML to Markdown using Raycast-specific adapters.
   */
  convertHtmlToMarkdown(html: string, options: Omit<ConversionOptions, 'domParserAdapter'> = {}): string {
    return convertHtmlToMarkdown(html, {
      ...options,
      domParserAdapter: this.domParserAdapter
    });
  }

  /**
   * Convert clipboard payload to Markdown using Raycast-specific adapters.
   */
  convertClipboardPayload(html?: string, plain?: string, options: Omit<ConversionOptions, 'domParserAdapter'> = {}): string {
    return convertClipboardPayload(html, plain, {
      ...options,
      domParserAdapter: this.domParserAdapter
    });
  }

  /**
   * Read from clipboard and convert to Markdown.
   */
  async convertFromClipboard(options: Omit<ConversionOptions, 'domParserAdapter'> = {}): Promise<string> {
    const html = await this.clipboardAdapter.readHtml();
    const text = await this.clipboardAdapter.readText();
    
    return this.convertClipboardPayload(html || undefined, text || undefined, options);
  }

  /**
   * Convert and write result back to clipboard.
   */
  async convertAndWriteToClipboard(options: Omit<ConversionOptions, 'domParserAdapter'> = {}): Promise<string> {
    const markdown = await this.convertFromClipboard(options);
    await this.clipboardAdapter.writeText(markdown);
    return markdown;
  }
}

// Create a singleton instance for the Raycast extension
export const raycastConverter = new RaycastConversionService();