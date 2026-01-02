/**
 * Firefox extension converter wrapper.
 * Provides Firefox-specific conversion functionality using shared core logic.
 */
import { convertClipboardPayload as coreConvertClipboardPayload, ConversionOptions } from "../../core/converter.js";
import { ChromeDOMParserAdapter } from "../chrome/adapters/chrome-dom-parser.js";

// Create a single adapter instance for reuse
const firefoxDOMParser = new ChromeDOMParserAdapter();

/**
 * Firefox converter interface for converting clipboard payloads to Markdown.
 * Uses standard web APIs that work identically in Firefox and Chrome.
 */
export const firefoxConverter = {
  convertClipboardPayload: (html?: string, plain?: string, options: ConversionOptions = {}): string => {
    return coreConvertClipboardPayload(html, plain, {
      ...options,
      domParserAdapter: firefoxDOMParser
    });
  }
};
