import { convertClipboardPayload as coreConvertClipboardPayload, ConversionOptions } from "../../core/converter.js";
import { ChromeDOMParserAdapter } from "./adapters/index.js";

// Create a single adapter instance for reuse
const chromeDOMParser = new ChromeDOMParserAdapter();

// Create a backward-compatible object with the method signature
export const chromeConverter = {
  convertClipboardPayload: (html?: string, plain?: string, options: ConversionOptions = {}): string => {
    return coreConvertClipboardPayload(html, plain, {
      ...options,
      domParserAdapter: chromeDOMParser
    });
  }
};